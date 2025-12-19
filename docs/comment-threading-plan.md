# Comment Threading Implementation Plan

**Status:** Complete
**Created:** 2025-12-19
**Completed:** 2025-12-19

---

## Problem

Comments on issues/MRs display in pure chronological order, ignoring thread context. When person 1 makes 3 comments and person 2 replies to each, they appear as:
- person 1, person 1, person 1, person 2, person 2, person 2

Should display as threaded discussions:
- person 1, person 2's reply, person 1, person 2's reply, etc.

## Solution Overview

Switch from GitLab Notes API to **Discussions API** to get `discussion_id`, then group/nest comments by thread with indented UI.

## Architecture Clarification

**This change preserves the existing sync-based architecture:**

```
GitLab Discussions API  →  Sync/Fetch  →  Local Database  →  Server Queries  →  UI
                           (periodic)      (Event + discussionId)  (from DB)
```

- **Still sync-based** - Fetch during periodic sync, not on-demand
- **Still stores individual events** - Each note remains its own Event record
- **Still queries local DB** - Router queries Prisma, never GitLab at read time
- **Search unaffected** - All text remains in the database
- **Intelligence features unaffected** - Adding a field, not restructuring

The `discussionId` is metadata (like `parentEventId` or `isSystemNote`), not a structural change. The Discussions API returns the same notes as the Notes API, just with additional thread grouping information.

---

## Phase 1: Data Layer Changes

### 1.1 Update Prisma Schema
**File:** `prisma/schema.prisma`
**Status:** [ ] Not Started

```prisma
model Event {
  // ... existing fields ...
  discussionId String?  // GitLab discussion ID for threading

  // Add new index for thread queries
  @@index([parentEventId, discussionId, createdAt])
}
```

### 1.2 Update GitLab Client
**File:** `src/server/services/gitlab-client.ts`
**Status:** [ ] Not Started

Add new types:
```typescript
interface GitLabDiscussion {
  id: string;  // Discussion ID (e.g., "6a9c1750b37d...")
  individual_note: boolean;
  notes: GitLabNote[];
}

// Extend GitLabNote with discussion_id
interface GitLabNoteWithDiscussion extends GitLabNote {
  discussion_id: string;
}
```

Replace `fetchAllNotesForItem()` with `fetchDiscussionsForItem()`:
- Endpoint: `GET /projects/:id/issues/:iid/discussions`
- Flatten nested notes array while preserving `discussion_id`
- Update `WorkItemWithActivity.notes` type to include `discussion_id`

### 1.3 Update Event Transformer
**File:** `src/server/services/event-transformer.ts`
**Status:** [ ] Not Started

In `storeWorkItemBundle()` (~line 881-921), add `discussionId` field:
```typescript
await tx.event.upsert({
  create: {
    // ... existing fields ...
    discussionId: note.discussion_id,  // NEW
  },
  update: {
    // ... existing fields ...
    discussionId: note.discussion_id,  // NEW
  },
});
```

---

## Phase 2: Backend Changes

### 2.1 Update Work Items Router
**File:** `src/server/api/routers/work-items.ts`
**Status:** [ ] Not Started

Update `getWithActivity` query (~line 315-326):
```typescript
children: {
  select: {
    // ... existing fields ...
    discussionId: true,  // NEW
  },
  orderBy: { createdAt: "asc" },  // Fetch chronologically, group in code
},
```

**Thread Ordering Rules (decided 2025-12-19):**
1. Threads ordered by **first comment time** (thread start)
2. System notes treated as single-item "threads", ordered by their timestamp
3. Within a thread, comments ordered chronologically
4. This keeps system notes inline while grouping user comment threads

Add threading transformation after fetching (~line 345):
```typescript
// Group activities by discussionId
const threadMap = new Map<string, ActivityItem[]>();
for (const activity of activities) {
  // null discussionId = system note or standalone comment = its own "thread"
  const key = activity.discussionId ?? activity.id;
  const thread = threadMap.get(key) ?? [];
  thread.push(activity);
  threadMap.set(key, thread);
}

// Convert to threaded structure, sorted by thread start time
const threadedActivities: ThreadedActivityItem[] = [];
for (const [, thread] of threadMap) {
  const [first, ...replies] = thread;
  threadedActivities.push({
    ...first,
    replies,
    isThreadStart: true,
    threadStartTime: first.timestamp,  // For sorting
  });
}

// Sort by when each thread started
threadedActivities.sort((a, b) =>
  a.threadStartTime.getTime() - b.threadStartTime.getTime()
);
```

### 2.2 Update Types
**File:** `src/types/work-items.ts`
**Status:** [ ] Not Started

```typescript
export interface ActivityItem {
  // ... existing fields ...
  discussionId?: string;  // NEW: GitLab discussion thread ID
}

// NEW: Threaded activity with nested replies
export interface ThreadedActivityItem extends ActivityItem {
  replies: ActivityItem[];
  isThreadStart: boolean;
}
```

---

## Phase 3: Frontend Changes

### 3.1 Update ActivityTimeline Component
**File:** `src/components/work-items/ActivityTimeline.tsx`
**Status:** [ ] Not Started

Update props to accept threaded activities:
```typescript
interface ActivityTimelineProps {
  activities: ThreadedActivityItem[];  // Changed from ActivityItem[]
  // ...
}
```

Render nested replies with indentation:
```tsx
{activities.map((activity) => (
  <div key={activity.id}>
    {/* Main comment */}
    <ActivityRow activity={activity} indentLevel={0} />

    {/* Indented replies */}
    {activity.replies.map((reply) => (
      <ActivityRow key={reply.id} activity={reply} indentLevel={1} />
    ))}
  </div>
))}
```

Visual design:
- Main comment: Full timeline dot (14px), normal positioning
- Reply: Smaller dot (10px), indented 24px with connecting line
- Thread separator: 8px gap between different discussions

```
[DOT] Person 1 - 2h ago
      Comment text...
      │
      └─[·] Person 2 - 1h ago (reply)
            Reply text...

[DOT] Person 1 - 30m ago (different thread)
      Another comment...
```

### 3.2 Add Thread Connection Lines
- Use `border-l-2 border-default-300 ml-[7px]` for reply indent container
- Connect from parent dot to last reply

---

## Files to Modify

| File | Description | Status |
|------|-------------|--------|
| `prisma/schema.prisma` | Add discussionId field | [x] |
| `src/server/services/gitlab-client.ts` | Switch to Discussions API | [x] |
| `src/server/services/event-transformer.ts` | Store discussionId | [x] |
| `src/server/api/routers/work-items.ts` | Thread-aware sorting/nesting | [x] |
| `src/types/work-items.ts` | Add threading types | [x] |
| `src/components/work-items/ActivityTimeline.tsx` | Indented thread UI | [x] |

---

## Migration Notes

- Existing comments won't have discussionId until next sync
- UI should gracefully handle null discussionId (show flat, ungrouped)
- No data migration needed - discussionId will populate on next GitLab sync

---

## Testing Considerations

- [ ] Test with MRs that have multiple discussion threads
- [ ] Verify indentation renders correctly at various nesting levels
- [ ] Ensure chronological order within each thread
- [ ] Handle edge case: standalone comments (not part of a discussion)

---

## Progress Log

### 2025-12-19
- Created implementation plan
- Identified 6 files to modify across 3 phases
- Refined plan after architectural review (preserves sync-based architecture)
- Clarified thread ordering (by first-comment-time) and system notes (inline)
- Implemented all 6 tasks:
  1. Added `discussionId` field to Event model + index
  2. Switched to GitLab Discussions API (`fetchDiscussionsForItem`)
  3. Store `discussionId` in event-transformer
  4. Added `ThreadedActivityItem` type
  5. Implemented thread grouping logic in router
  6. Updated ActivityTimeline with indented reply UI
