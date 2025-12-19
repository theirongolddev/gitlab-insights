# Comment Reactions Implementation Plan

## Problem
Comments on issues/MRs often receive emoji reactions (thumbs up, heart, etc.) instead of text replies. Currently these reactions are not displayed.

## Solution Overview
Fetch reactions **on-demand** via GitLab Award Emoji API when viewing work item detail, cache with react-query. No database storage needed.

## User Requirements
- **Display**: Grouped with count, hover for usernames
- **Fetch timing**: On-demand when viewing detail (cached with react-query)
- **Scope**: Comments only

---

## Architecture

```
User views detail → React component mounts → react-query fetches reactions
                                                    ↓
                              tRPC endpoint → GitLab Award Emoji API
                                                    ↓
                              Cache response (staleTime: 5 min)
```

Benefits:
- **Zero sync overhead** - no additional API calls during periodic sync
- **Instant subsequent views** - react-query caches results
- **No schema changes** - reactions not stored in database
- **Lazy loading** - only fetch for comments user actually views

---

## Beads Breakdown

### Bead 1: GitLab Client - fetchNoteAwards Method
**Type:** task
**File:** `src/server/services/gitlab-client.ts`
**Depends on:** None

**Description:**
Add a new method `fetchNoteAwards()` to the GitLabClient class that fetches award emojis (reactions) for a specific note/comment from the GitLab API.

**Implementation Details:**
1. Add Zod schema for GitLab Award Emoji response:
   ```typescript
   const GitLabAwardEmojiSchema = z.object({
     id: z.number(),
     name: z.string(), // "thumbsup", "heart", "smile", etc.
     user: GitLabAuthorSchema,
     created_at: z.string(),
   });
   ```

2. Add method to GitLabClient class:
   ```typescript
   async fetchNoteAwards(
     projectPath: string,  // e.g., "group/project" - will be URL-encoded
     noteableType: "issue" | "merge_request",
     noteableIid: number,
     noteId: number
   ): Promise<Array<{ id: number; name: string; user: { username: string; avatar_url: string } }>>
   ```

3. API endpoint format:
   - Issues: `GET /projects/:id/issues/:issue_iid/notes/:note_id/award_emoji`
   - MRs: `GET /projects/:id/merge_requests/:mr_iid/notes/:note_id/award_emoji`
   - **Note**: `:id` accepts URL-encoded project path (e.g., `group%2Fproject`)

4. Handle pagination (though unlikely to need it for awards)
5. **Error handling**: Return empty array on 404 or network errors (graceful degradation)
6. URL-encode the projectPath parameter using `encodeURIComponent`

**Testing:**
- Unit test: Mock fetch to return sample award emoji response, verify parsing
- Unit test: Verify correct URL construction for issues vs MRs
- Unit test: Verify projectPath is URL-encoded (`group/project` → `group%2Fproject`)
- Unit test: Handle empty response (no awards) → return `[]`
- Unit test: Handle 404 response gracefully → return `[]`
- Unit test: Handle network errors → return `[]`
- Unit test: Verify Zod schema validation catches malformed responses

---

### Bead 2: Types - Reaction Interface and ActivityItem Update
**Type:** task
**File:** `src/types/work-items.ts`
**Depends on:** None

**Description:**
Add the `Reaction` type for representing grouped emoji reactions, and add `gitlabNoteId` field to `ActivityItem` interface to enable fetching reactions.

**Implementation Details:**
1. Add new `Reaction` interface:
   ```typescript
   /**
    * Grouped emoji reaction on a comment
    * Multiple users can have the same reaction, grouped by emoji name
    */
   export interface Reaction {
     emoji: string;      // GitLab emoji name: "thumbsup", "heart", "smile", etc.
     users: Array<{
       username: string;
       avatar: string | null;
     }>;
   }
   ```

2. Add `gitlabNoteId` to `ActivityItem`:
   ```typescript
   export interface ActivityItem {
     // ... existing fields ...

     /** GitLab's numeric note ID, used for fetching reactions on-demand */
     gitlabNoteId?: number;
   }
   ```

**Testing:**
- Type-only changes, no runtime tests needed
- TypeScript compiler will validate usage

---

### Bead 3: tRPC Endpoint - getReactions Procedure
**Type:** task
**File:** `src/server/api/routers/work-items.ts`
**Depends on:** Bead 1 (GitLab client method)

**Description:**
Add a new tRPC query procedure `getReactions` that fetches reactions for multiple notes in a single request, with concurrency limiting to avoid rate limits.

**Implementation Details:**
1. Add input schema:
   ```typescript
   getReactions: protectedProcedure
     .input(z.object({
       repositoryPath: z.string(),  // Project path like "group/project"
       noteableType: z.enum(["issue", "merge_request"]),
       noteableIid: z.number(),
       noteIds: z.array(z.number()).max(100), // Limit batch size
     }))
   ```

2. Implementation:
   ```typescript
   .query(async ({ ctx, input }) => {
     const client = new GitLabClient(ctx.session.accessToken);

     // Fetch awards for each note with concurrency limit (5 parallel)
     // Errors for individual notes are caught and skipped (partial results OK)
     const results = await pMap(
       input.noteIds,
       async (noteId) => {
         try {
           const awards = await client.fetchNoteAwards(
             input.repositoryPath,
             input.noteableType,
             input.noteableIid,
             noteId
           );
           return { noteId, awards };
         } catch {
           // Skip notes that fail - partial results are fine
           return { noteId, awards: [] };
         }
       },
       { concurrency: 5 }
     );

     // Group awards by emoji for each note
     const grouped: Record<number, Reaction[]> = {};
     for (const { noteId, awards } of results) {
       if (awards.length > 0) {
         grouped[noteId] = groupAwardsByEmoji(awards);
       }
     }

     return grouped;
   })
   ```

3. Add helper function `groupAwardsByEmoji`:
   ```typescript
   function groupAwardsByEmoji(
     awards: Array<{ name: string; user: { username: string; avatar_url: string } }>
   ): Reaction[] {
     const byEmoji = new Map<string, Reaction>();
     for (const award of awards) {
       const existing = byEmoji.get(award.name);
       if (existing) {
         existing.users.push({ username: award.user.username, avatar: award.user.avatar_url });
       } else {
         byEmoji.set(award.name, {
           emoji: award.name,
           users: [{ username: award.user.username, avatar: award.user.avatar_url }],
         });
       }
     }
     return Array.from(byEmoji.values());
   }
   ```

**Testing:**
- Unit test: `groupAwardsByEmoji` correctly groups multiple awards for same emoji
- Unit test: `groupAwardsByEmoji` handles empty array
- Unit test: `groupAwardsByEmoji` preserves all user data
- Integration test: Verify concurrency limit is respected (mock timing)
- Integration test: Verify correct response shape `Record<number, Reaction[]>`

---

### Bead 4: Router Update - Pass gitlabNoteId to ActivityItem
**Type:** task
**File:** `src/server/api/routers/work-items.ts`
**Depends on:** Bead 2 (types)

**Description:**
Update the `getWithActivity` procedure to include `gitlabNoteId` in the ActivityItem response, extracted from the existing `gitlabEventId` field.

**Implementation Details:**
1. **Add gitlabEventId to children select** (~line 337):
   ```typescript
   children: {
     select: {
       // ... existing fields ...
       gitlabEventId: true,  // ADD THIS
     },
   }
   ```

2. The `gitlabEventId` for notes is stored as `note-12345` format (HYPHEN not underscore)
3. Extract numeric ID when building ActivityItem:
   ```typescript
   // In the activity transformation section (~line 345)
   gitlabNoteId: child.gitlabEventId.startsWith('note-')
     ? parseInt(child.gitlabEventId.slice(5), 10) || undefined
     : undefined,
   ```

**Testing:**
- Unit test: Verify `note-12345` extracts to `12345`
- Unit test: Verify non-note events (issues, MRs) get `undefined`
- Unit test: Verify malformed `note-abc` returns `undefined` (NaN check)
- Unit test: Verify gitlabEventId is included in children select

---

### Bead 5: Emoji Map Utility
**Type:** task
**File:** `src/lib/emoji-map.ts` (new file)
**Depends on:** None

**Description:**
Create a utility module that maps GitLab emoji names to Unicode emoji characters for display.

**Implementation Details:**
1. Create comprehensive emoji map:
   ```typescript
   /**
    * Maps GitLab emoji names to Unicode characters
    * GitLab uses names like "thumbsup", "heart", "smile"
    * Full list: https://docs.gitlab.com/ee/user/markdown.html#emoji
    */
   export const emojiMap: Record<string, string> = {
     // Common reactions
     thumbsup: "👍",
     thumbsdown: "👎",
     heart: "❤️",
     smile: "😄",
     laughing: "😆",
     blush: "😊",
     grinning: "😀",
     relaxed: "☺️",
     wink: "😉",

     // Celebration
     tada: "🎉",
     confetti_ball: "🎊",
     balloon: "🎈",

     // Thinking/Working
     thinking: "🤔",
     eyes: "👀",
     rocket: "🚀",
     fire: "🔥",

     // Negative
     disappointed: "😞",
     worried: "😟",
     confused: "😕",
     cry: "😢",

     // Other common
     clap: "👏",
     raised_hands: "🙌",
     ok_hand: "👌",
     muscle: "💪",
     star: "⭐",
     sparkles: "✨",
     100: "💯",
     checkmark: "✅",
     x: "❌",
   };

   /**
    * Get Unicode emoji for GitLab emoji name
    * Returns `:name:` format if not found (graceful fallback)
    */
   export function getEmoji(name: string): string {
     return emojiMap[name] ?? `:${name}:`;
   }
   ```

**Testing:**
- Unit test: Known emoji names return correct Unicode
- Unit test: Unknown emoji name returns `:name:` fallback
- Unit test: Empty string returns `::`

---

### Bead 6: useReactions Hook
**Type:** task
**File:** `src/hooks/useReactions.ts` (new file)
**Depends on:** Bead 3 (tRPC endpoint)

**Description:**
Create a react-query hook that encapsulates fetching reactions for a set of note IDs with appropriate caching configuration.

**Implementation Details:**
1. Create the hook:
   ```typescript
   import { api } from "~/trpc/react";
   import type { Reaction } from "~/types/work-items";

   interface UseReactionsOptions {
     repositoryPath: string;  // From workItem.repositoryPath
     noteableType: "issue" | "merge_request";
     noteableIid: number;     // From workItem.number
     noteIds: number[];
   }

   /**
    * Fetches and caches emoji reactions for comments
    *
    * Caching strategy:
    * - staleTime: 5 min (reactions change infrequently)
    * - gcTime: 30 min (keep in memory for back navigation)
    * - No refetch on window focus (avoid unnecessary API calls)
    */
   export function useReactions({
     repositoryPath,
     noteableType,
     noteableIid,
     noteIds,
   }: UseReactionsOptions) {
     return api.workItems.getReactions.useQuery(
       { repositoryPath, noteableType, noteableIid, noteIds },
       {
         enabled: noteIds.length > 0,
         staleTime: 5 * 60 * 1000,      // 5 minutes
         gcTime: 30 * 60 * 1000,        // 30 minutes
         refetchOnWindowFocus: false,
         refetchOnMount: false,
         retry: 1, // Only retry once on failure
       }
     );
   }
   ```

**Testing:**
- Unit test: Hook returns correct query state (loading, data, error)
- Unit test: Hook is disabled when noteIds is empty array
- Unit test: Verify caching options are passed correctly (mock trpc)

---

### Bead 7: WorkItemDetailView - Fetch and Pass Reactions
**Type:** task
**File:** `src/components/work-items/WorkItemDetailView.tsx`
**Depends on:** Bead 4, Bead 6

**Description:**
Update WorkItemDetailView to extract note IDs from activities, fetch reactions using the hook, and pass them to ActivityTimeline.

**Implementation Details:**
1. Import the hook:
   ```typescript
   import { useReactions } from "~/hooks/useReactions";
   ```

2. Extract note IDs from threaded activities:
   ```typescript
   // Get all note IDs including replies
   const noteIds = useMemo(() => {
     return activities
       .flatMap((thread) => [thread, ...thread.replies])
       .map((a) => a.gitlabNoteId)
       .filter((id): id is number => id !== undefined);
   }, [activities]);
   ```

3. Fetch reactions (using correct WorkItem field names):
   ```typescript
   const { data: reactions, isLoading: reactionsLoading } = useReactions({
     repositoryPath: workItem.repositoryPath,  // NOT projectId
     noteableType: workItem.type,
     noteableIid: workItem.number,
     noteIds,
   });
   ```

4. Pass to ActivityTimeline:
   ```typescript
   <ActivityTimeline
     activities={activities}
     parentType={workItem.type}
     reactions={reactions}
     onActivityClick={handleActivityClick}
   />
   ```

**Testing:**
- Unit test: noteIds extraction handles empty activities
- Unit test: noteIds extraction includes both thread starters and replies
- Unit test: noteIds extraction filters out undefined
- Component test: Verify reactions prop is passed to ActivityTimeline

---

### Bead 8: ActivityTimeline - Render Reactions UI
**Type:** task
**File:** `src/components/work-items/ActivityTimeline.tsx`
**Depends on:** Bead 5 (emoji map), Bead 7

**Description:**
Update ActivityTimeline and ActivityRow to accept and render emoji reactions below comment bodies.

**Implementation Details:**
1. Update props interfaces:
   ```typescript
   interface ActivityTimelineProps {
     activities: ThreadedActivityItem[];
     parentType: "issue" | "merge_request";
     reactions?: Record<number, Reaction[]>; // NEW
     onActivityClick?: (activity: ActivityItem) => void;
   }

   // ActivityRow also needs reactions
   function ActivityRow({
     activity,
     parentType,
     isReply,
     getDotColor,
     reactions,
     onActivityClick,
   }: {
     activity: ActivityItem;
     // ...
     reactions?: Record<number, Reaction[]>;
   })
   ```

2. Add reactions display in ActivityRow after body content:
   ```typescript
   import { getEmoji } from "~/lib/emoji-map";

   // After the body content div, before activity type indicator
   {activity.gitlabNoteId && reactions?.[activity.gitlabNoteId]?.length > 0 && (
     <div className="mt-2 flex gap-1.5 flex-wrap">
       {reactions[activity.gitlabNoteId].map((reaction) => (
         <div
           key={reaction.emoji}
           className="flex items-center gap-1 bg-default-100 hover:bg-default-200 px-2 py-0.5 rounded-full text-xs cursor-default transition-colors"
           title={reaction.users.map((u) => u.username).join(", ")}
         >
           <span>{getEmoji(reaction.emoji)}</span>
           <span className="text-default-600 font-medium">
             {reaction.users.length}
           </span>
         </div>
       ))}
     </div>
   )}
   ```

3. Pass reactions through to ActivityRow:
   ```typescript
   <ActivityRow
     activity={thread}
     parentType={parentType}
     isReply={false}
     getDotColor={getDotColor}
     reactions={reactions}
     onActivityClick={onActivityClick}
   />
   ```

**Testing:**
- Unit test: No reactions div rendered when reactions is undefined
- Unit test: No reactions div rendered when note has no reactions
- Unit test: Correct number of reaction chips rendered
- Unit test: Emoji name correctly converted via getEmoji
- Unit test: User count displayed correctly
- Unit test: Title attribute contains comma-separated usernames
- Snapshot test: Reactions render with expected styles

---

## Files Summary

| File | Change | Bead |
|------|--------|------|
| `src/server/services/gitlab-client.ts` | Add `fetchNoteAwards()` | 1 |
| `src/types/work-items.ts` | Add `Reaction` type, `gitlabNoteId` | 2 |
| `src/server/api/routers/work-items.ts` | Add `getReactions`, pass `gitlabNoteId` | 3, 4 |
| `src/lib/emoji-map.ts` | New: emoji name → Unicode | 5 |
| `src/hooks/useReactions.ts` | New: react-query hook | 6 |
| `src/components/work-items/WorkItemDetailView.tsx` | Fetch reactions | 7 |
| `src/components/work-items/ActivityTimeline.tsx` | Render reactions UI | 8 |

---

## Caching Strategy

| Setting | Value | Rationale |
|---------|-------|-----------|
| `staleTime` | 5 min | Reactions change infrequently |
| `gcTime` | 30 min | Keep in memory for navigation back |
| `refetchOnWindowFocus` | false | Don't spam API on tab switch |
| `refetchOnMount` | false | Use cached data when returning |

---

## Migration Notes

- No database changes needed
- No existing data affected
- Reactions appear immediately on detail view
- Graceful degradation: if API fails, reactions section hidden
