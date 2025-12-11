# Evolution Plan: Issue/MR-Centric View with Relationships

## Executive Summary

**Goal**: Transform flat event feed into hierarchical, work-item-centric view that groups comments/activity under parent issues/MRs.

**Approach**: Clean slate migration - wipe Event data, update schema, refetch from GitLab with relationships.

**Key Changes**:
1. **Data Model**: Add relationship fields (parent links, closes patterns, participants)
2. **UI Pattern**: Replace flat list with collapsible work item cards
3. **Visual Design**: Follow existing design system from `/docs/ux-design-specification.md`
4. **Query Integration**: Highlight matching cards instead of filtering

**Design Reference**: `/docs/ux-design-specification.md` contains complete color system, typography, spacing, and component specifications.

---

## Current State Analysis

The MVP has a **flat event model** where all items (issues, MRs, comments) are stored as independent `Event` records with no relationships. The UI displays them chronologically, grouped only by type.

**Current Schema (simplified):**
```prisma
model Event {
  id              String
  type            String  // "issue" | "merge_request" | "comment"
  title           String
  body            String?
  author          String
  project         String
  labels          String[]
  gitlabEventId   Int
  gitlabUrl       String
  createdAt       DateTime
  // NO relationship fields
}
```

**Current UI:**
- Split view: event list (left) + detail pane (right)
- Events grouped by type, sorted by date
- Each event displayed independently

**Core Problem:** Cannot answer queries like:
- "Show me all comments on Issue #123"
- "Which MR closed this issue?"
- "What's the full activity on this MR?"
- "Who's involved in this discussion?"

## User Requirements

Based on conversation:
1. **Mental model**: Issue/MR-centric (group by work item, not timeline)
2. **Pain point**: Noise vs signal (too much activity clutter)
3. **Relationships needed**:
   - Comments → Parent Issue/MR
   - MRs → Issues they close
   - Cross-references between items
   - People involvement (authors, assignees, commenters)
4. **Workflow**: Triage new activity → drill into specific items for full context

## Proposed Solution: Three-Tier Architecture

### Tier 1: Data Model (Clean Slate)

**Simplified approach:** Wipe database and refetch from GitLab with new schema.

**Updated Event model with relationships:**

```prisma
model Event {
  // Core fields
  id              String    @id @default(cuid())
  userId          String
  type            String    // "issue" | "merge_request" | "comment"
  title           String
  body            String?
  author          String
  authorAvatar    String?
  project         String
  projectId       Int
  labels          String[]
  gitlabEventId   Int
  gitlabUrl       String
  createdAt       DateTime
  updatedAt       DateTime

  // NEW: Relationship fields
  parentType      String?   // "issue" | "merge_request"
  parentEventId   String?   // FK to parent Event
  gitlabParentId  Int?      // GitLab issue/MR IID

  // NEW: MR → Issue relationships
  closesIssueIds  Int[]     // Array of GitLab issue IIDs this MR closes

  // NEW: Cross-references
  mentionedInIds  Int[]     // GitLab IIDs mentioned in this item

  // NEW: People involvement
  assignees       String[]  // Array of assignee usernames
  participants    String[]  // Everyone who commented/interacted

  // NEW: Activity metadata
  commentCount    Int       @default(0)  // For issues/MRs: how many comments
  lastActivityAt  DateTime  // Most recent activity timestamp
  status          String    // "open" | "closed" | "merged"

  // Relations
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent          Event?    @relation("EventHierarchy", fields: [parentEventId], references: [id])
  children        Event[]   @relation("EventHierarchy")

  // Indexes
  @@unique([userId, gitlabEventId])
  @@index([userId, createdAt(sort: Desc)])
  @@index([parentEventId, createdAt])
  @@index([gitlabParentId])
  @@index([status, lastActivityAt])
  @@index([userId, type, status])
}
```

**Migration approach:**
- Drop existing Event table data (preserve User, UserQuery, MonitoredProject)
- Apply new schema migration
- Re-fetch all data from GitLab using updated transformer
- No backward compatibility needed - fresh start

### Tier 2: Enhanced Data Fetching

**New tRPC endpoints:**

```typescript
// Get issue/MR with all related activity
events.getWorkItemWithActivity(eventId: string) => {
  workItem: Event,           // The issue or MR
  comments: Event[],         // All comments on this item
  relatedMRs: Event[],       // MRs that close this issue
  relatedIssues: Event[],    // Issues closed by this MR
  crossReferences: Event[],  // Items that mention this
  participants: string[],    // Everyone involved
  activityTimeline: ActivityItem[]  // Unified timeline
}

// Get grouped work items for dashboard (replaces flat list)
events.getWorkItemsGrouped(filters) => {
  issues: WorkItemSummary[],
  mergeRequests: WorkItemSummary[]
}

// WorkItemSummary structure
type WorkItemSummary = {
  event: Event,              // The issue/MR
  unreadComments: number,    // New comments since last visit
  lastActivity: DateTime,    // Most recent activity
  participants: string[],    // Avatars to show
  status: string,            // Visual status indicator
  hasNewActivity: boolean    // Highlight if new
}

// Update event transformer to capture relationships
transformer.transformNotes() => {
  // Extract parent issue/MR IID from GitLab note.noteable_id
  // Set parentType based on note.noteable_type
}

transformer.transformMergeRequests() => {
  // Parse description/title for "Closes #123" patterns
  // Extract to closesIssueIds array
  // Extract assignees, participants
}
```

### Tier 3: New UI Pattern - Work Item Cards

**Design Reference**: See `/docs/ux-design-specification.md` for complete design system.

**Replace flat event list with grouped work item cards:**

```
┌─────────────────────────────────────────────────────────┐
│  Issues (12)     [▼ Sort: Latest Activity]              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 📋 #123 Fix login timeout bug              [▼]  │  │
│  │ Open • Alice • 2 days ago                        │  │
│  │ ────────────────────────────────────────────────│  │
│  │ 💬 3 new comments • 👤👤 5 participants          │  │
│  │ Latest: Bob - "I think I found the root cause"  │  │
│  │                                                  │  │
│  │ Related: 🔀 MR !456 (merged) • 🏷️ bug, auth    │  │
│  │ [View full thread →]                            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 📋 #124 Update documentation                [▼]  │  │
│  │ Closed • Charlie • 3 hours ago                   │  │
│  │ ────────────────────────────────────────────────│  │
│  │ No new activity • 👤 1 participant               │  │
│  │ Closed by: 🔀 MR !458                            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Merge Requests (8)  [▼ Sort: Latest Activity]          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🔀 !456 Implement new auth flow            [▼]  │  │
│  │ Merged • Alice • 1 day ago                       │  │
│  │ ────────────────────────────────────────────────│  │
│  │ 💬 2 new comments • 👤👤👤 3 reviewers           │  │
│  │ Closes: #123, #122                               │  │
│  │ Latest: Dave - "LGTM, approved"                  │  │
│  │ [View full thread →]                             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Visual Design (from UX Spec):**

**Card Styling:**
- Background (elevated surface):
  - Light mode: `bg-gray-50` (#F9FAFB)
  - Dark mode: `bg-gray-800` (#1F2937)
- Border:
  - Light mode: `border-gray-200` (#E5E7EB)
  - Dark mode: `border-gray-600` (#4B5563)
- Spacing: 8px grid system
- Border radius: Consistent with existing components
- Padding: 16px (2 × 8px grid)

**Type Badges** (existing pattern from UX spec):
- Issue: Purple badge
- Merge Request: Blue badge
- Comment: Gray badge

**NEW Activity Badges:**
- Background: Olive accent
  - Light mode: `text-olive` (#5e6b24)
  - Dark mode: `text-olive-light` (#9DAA5F)
- Example: "NEW" badge, "3 new comments" indicator

**Status Indicators:**
- Open: Default text color
- Closed: Success green
  - Light mode: `text-success` hsl(142, 71%, 37%)
  - Dark mode: `text-success-light` hsl(142, 71%, 45%)
- Merged: Olive accent (same as NEW badges)

**Card States:**

**Collapsed (default):**
- Shows: type badge, ID, title, status, author, timestamp
- Activity summary: "X new comments", participant avatars
- Latest comment preview (first ~60 chars, gray-500/gray-300)
- Related items: MRs that close (for issues), Issues closed (for MRs)
- Visual indicators: NEW badge, status color

**Expanded (click ▼):**
- Full description with highlighted keywords
- Complete comment thread (chronological)
- All related items with context
- Full participant list
- "Open in GitLab" link
- Option to mark as reviewed

**Noise Reduction Strategies:**
1. **Collapsed by default** - only summary visible
2. **Smart grouping** - comments grouped under parent
3. **Activity threshold** - hide items with no new activity (toggle)
4. **Participant collapse** - show 3 avatars + "+2 more"
5. **Comment preview** - only first line of latest comment
6. **System activity compression** - "Status: open → closed" as single line in gray

### Tier 4: Enhanced Detail View

**When work item card is selected, detail pane shows:**

```
┌───────────────────────────────────────────────┐
│  📋 Issue #123: Fix login timeout bug         │
│  ═════════════════════════════════════════════│
│                                                │
│  Status: Open                                  │
│  Author: Alice • 2 days ago                    │
│  Assigned: Bob, Charlie                        │
│  Labels: bug, auth, high-priority              │
│  Project: gitlab-insights                      │
│                                                │
│  ───────────────────────────────────────────  │
│  Description                                   │
│  ───────────────────────────────────────────  │
│  Users are experiencing timeouts after...      │
│  [full description text]                       │
│                                                │
│  ───────────────────────────────────────────  │
│  Related Work                                  │
│  ───────────────────────────────────────────  │
│  🔀 MR !456 - Implement new auth flow (merged) │
│     → Closes this issue                        │
│                                                │
│  ───────────────────────────────────────────  │
│  Activity (5 items)                           │
│  ───────────────────────────────────────────  │
│                                                │
│  💬 Bob • 4 hours ago • NEW                    │
│  I think I found the root cause. The session  │
│  timeout is set to 5 minutes but...           │
│  [full comment]                                │
│                                                │
│  💬 Alice • 1 day ago                          │
│  Can you check if this happens in staging?    │
│                                                │
│  ⚙️ Alice changed status: Open → In Progress  │
│     1 day ago                                  │
│                                                │
│  💬 Dave • 2 days ago                          │
│  I can reproduce this on my local...          │
│                                                │
│  [Load more activity ▼]                        │
│                                                │
│  ───────────────────────────────────────────  │
│  Actions                                       │
│  ───────────────────────────────────────────  │
│  [Open in GitLab] [Mark as Reviewed]          │
└───────────────────────────────────────────────┘
```

**Key features:**
1. **Unified activity timeline** - comments + system changes merged chronologically
2. **Visual distinction** (from Design Decisions):
   - **User comments**: 💬 icon, full contrast text
   - **System activity**: ⚙️ icon, reduced opacity (gray-500/gray-300)
   - System activities shown: status changes, label changes, assignment changes
3. **NEW badges** - olive accent color highlights unread activity
4. **Related work section** - shows relationships prominently
5. **People context** - author, assignees visible at top
6. **Progressive disclosure** - "Load more" for long threads

**Activity Timeline Visual Design:**

**User Comment:**
```
💬 Bob • 4 hours ago • [NEW badge]
────────────────────────────────────
I think I found the root cause. The session
timeout is set to 5 minutes but...

[full comment text]
```

**System Activity** (compressed format):
```
⚙️ Alice changed status: Open → In Progress  • 1 day ago
⚙️ Bob added labels: bug, high-priority      • 2 hours ago
⚙️ Alice assigned to Charlie                 • 5 minutes ago
```

**Styling:**
- User comments: Primary text color, full weight
- System activity: Secondary text (gray-500/gray-300), single line
- NEW badges: Olive accent background
- Timestamps: Tertiary text (gray-400)
- Spacing: 8px between items, 16px between comment blocks

### Tier 5: Triage Workflow Support

**Dashboard enhancements for scanning/triaging:**

1. **Sort options:**
   - Latest activity (default)
   - Most comments
   - Oldest unread
   - Your assignments
   - Your mentions

2. **Filter options:**
   - Has new activity
   - Assigned to me
   - I'm participating in
   - Mentioned me
   - Status: open/closed/merged

3. **Bulk actions:**
   - "Mark all as reviewed" per section
   - "Hide items with no activity"
   - "Show only my work items"

4. **Quick scan indicators:**
   - 🔴 Red dot: mentions you
   - 🟡 Yellow highlight: assigned to you
   - 🟢 Green badge: new comments (count)
   - Gray text: no new activity

## Implementation Strategy

### Phase 1: Data Model & Re-fetch
**Goal**: Update schema and refetch all data with relationships

**Approach**: Clean slate - wipe Event data, update schema, refetch from GitLab.

1. **Update Prisma schema** with relationship fields (see Tier 1)
2. **Create migration** that:
   - Preserves User, UserQuery, MonitoredProject tables
   - Drops Event table data
   - Applies new schema with indexes
3. **Update event transformer** (`event-transformer.ts`) to map API fields directly:

   **IMPORTANT**: Leverage GitLab API responses - don't add business logic for data the API already provides.

   **From GitLab Notes API** (`note` object):
   - `note.noteable_id` → `gitlabParentId` (direct mapping)
   - `note.noteable_type` → `parentType` (direct mapping: "Issue" | "MergeRequest")
   - Parent Event lookup: Query existing Event by `gitlabParentId` → set `parentEventId`

   **From GitLab Issues API** (`issue` object):
   - `issue.assignees[].username` → `assignees[]` (direct array mapping)
   - `issue.state` → `status` (direct mapping: "opened" | "closed")
   - `issue.updated_at` → `lastActivityAt` (direct mapping)
   - `issue.user_notes_count` → `commentCount` (API provides this!)

   **From GitLab MRs API** (`merge_request` object):
   - `merge_request.assignees[].username` → `assignees[]` (direct mapping)
   - `merge_request.state` → `status` (direct mapping: "opened" | "closed" | "merged")
   - `merge_request.updated_at` → `lastActivityAt` (direct mapping)
   - `merge_request.user_notes_count` → `commentCount` (API provides this!)
   - `merge_request.closes_issues` → `closesIssueIds[]` (API provides this via dedicated endpoint!)
     - Use GET `/projects/:id/merge_requests/:mr_iid/closes_issues` endpoint
     - Returns array of issues - extract IIDs directly

   **Participants**:
   - **Check if API provides**: `issue.participants` or `merge_request.participants`
   - If API provides: direct mapping
   - If not: Compute from assignees + author (simple, no complex logic)

   **Key Principle**: Map API responses directly. Only add logic if API doesn't provide the data.
4. **Re-fetch all data**:
   - Use existing `events.manualRefresh()` endpoint
   - Or create temporary admin endpoint to trigger full refetch
   - Transformer now captures all relationships on import

**Files to modify:**
- `prisma/schema.prisma` - Update Event model
- `src/server/services/gitlab/event-transformer.ts` - Add direct API field mapping
- `src/server/services/gitlab/types.ts` - Update type definitions with GitLab API response types
- `src/server/services/gitlab/gitlab-api.ts` (if exists) - Add `closes_issues` endpoint call for MRs
- `src/server/api/routers/events.ts` - Ensure manualRefresh works with new schema

**API Optimization Notes:**
- **Closes Issues**: Call `/projects/:id/merge_requests/:mr_iid/closes_issues` during MR fetch
  - This is a separate endpoint, might add one API call per MR
  - Consider: Fetch only for MRs with "closes" keyword in description to optimize
- **Comment Count**: Already included in issue/MR response, no extra call needed
- **Updated At**: Already included, no extra call needed
- **Assignees**: Already included, no extra call needed

**Testing:**
- Run migration in dev environment
- Trigger refetch and verify all API fields mapped correctly
- Check: comments have `parentEventId` and `gitlabParentId` set
- Check: issues/MRs have `assignees`, `status`, `commentCount`, `lastActivityAt`
- Check: MRs have `closesIssueIds` populated from API endpoint
- Verify: No business logic added for data that API provides
- Verify indexes exist and queries are fast

---

### Phase 2: Enhanced Data Layer
**Goal**: Create new queries that leverage relationships

1. Create new tRPC endpoints:
   - `events.getWorkItemWithActivity()`
   - `events.getWorkItemsGrouped()`
   - `events.getRelatedItems()`
2. Update existing endpoints to include relationship data
3. Add query performance optimization:
   - Eager loading of related items
   - Pagination for large threads
   - Caching strategies

**Files to modify:**
- `src/server/api/routers/events.ts` - New endpoints
- `src/server/api/routers/events.ts` - Update existing endpoints
- Create new file: `src/server/services/event-relationships.ts` - Relationship resolution logic

**Testing:**
- Query performance with 1000+ events
- Relationship resolution accuracy
- Pagination edge cases

---

### Phase 3: New UI Components
**Goal**: Build work item card components

1. Create new components:
   - `WorkItemCard` - Collapsed/expanded card
   - `WorkItemList` - List of cards with grouping
   - `ActivityTimeline` - Unified timeline in detail pane
   - `RelatedItems` - Show relationships
2. Update `DashboardClient` to use new components
3. Preserve existing keyboard navigation
4. Add expand/collapse interactions

**Files to modify:**
- Create new: `src/app/(authenticated)/dashboard/_components/WorkItemCard.tsx`
- Create new: `src/app/(authenticated)/dashboard/_components/WorkItemList.tsx`
- Create new: `src/app/(authenticated)/dashboard/_components/ActivityTimeline.tsx`
- Update: `src/app/(authenticated)/dashboard/_components/DashboardClient.tsx`
- Update: `src/app/(authenticated)/dashboard/_components/EventDetail.tsx`

**Design decisions needed:**
- Card expand/collapse animation
- How much detail in collapsed state
- System activity compression rules
- "New" badge persistence logic

---

### Phase 4: Noise Reduction
**Goal**: Implement filtering and smart defaults

1. Add sort/filter controls
2. Implement "new activity" detection
3. Add "hide no activity" toggle
4. Create bulk mark-as-reviewed
5. Persist user preferences

**Files to modify:**
- Update: `WorkItemList.tsx` - Add filter UI
- Create new: `src/app/(authenticated)/dashboard/_components/WorkItemFilters.tsx`
- Update: `src/server/api/routers/events.ts` - Add filter query params
- Consider: User preferences table in Prisma

---

### Phase 5: Migration Path
**Goal**: Smooth transition from old to new UI

**Option A: Feature flag**
- Add toggle to switch between old and new view
- Let users opt-in to new UI
- Collect feedback before full migration
- Remove old UI after validation

**Option B: Parallel pages**
- Keep old dashboard at `/dashboard`
- New dashboard at `/dashboard/v2`
- Migrate users incrementally
- Redirect after confidence built

**Recommendation**: Option A (feature flag) for faster iteration

## Critical Files Reference

**Data Layer:**
- `prisma/schema.prisma` - Database schema
- `src/server/services/gitlab/event-transformer.ts` - Transform GitLab data
- `src/server/services/gitlab/types.ts` - Type definitions
- `src/server/api/routers/events.ts` - Event queries

**UI Layer:**
- `src/app/(authenticated)/dashboard/_components/DashboardClient.tsx` - Main dashboard
- `src/app/(authenticated)/dashboard/_components/EventTable.tsx` - Current list
- `src/app/(authenticated)/dashboard/_components/EventDetail.tsx` - Detail pane
- `src/app/(authenticated)/dashboard/_components/ItemRow.tsx` - List item

**Utilities:**
- `src/lib/utils/event-helpers.ts` - Event formatting
- `src/lib/contexts/SearchContext.tsx` - Search state

## Design Decisions (Confirmed)

### 1. Data Migration: Clean Slate ✓
**Decision**: Wipe Event table data and refetch from GitLab with new schema.

**Implementation approach**:
- Drop Event table data only (preserve User, UserQuery, MonitoredProject)
- Apply schema migration with relationship fields
- Trigger full refetch using existing GitLab API integration
- Updated transformer captures relationships on import
- No backfill script needed - fresh data with relationships from start

**Trade-off**: Loses historical event data, but provides clean foundation with all relationships.

### 2. System Activities: Status, Labels, Assignments ✓
**Decision**: Show status changes, label changes, and assignment changes in activity timeline.

**Not included**: Milestone changes (can add later if needed).

**Display format**:
- `⚙️ Alice changed status: Open → Closed • 2 hours ago`
- `⚙️ Bob added labels: bug, high-priority • 1 day ago`
- `⚙️ Alice assigned to Charlie • 3 hours ago`

These will be visually distinguished from user comments and collapsed by default.

### 3. Saved Query Integration: Highlight Matches ✓
**Decision**: Show all work items but highlight/expand those matching the query.

**Behavior**:
- Work item cards that match query keywords get highlighted border/background
- Matching cards auto-expand to show relevant content
- Non-matching cards stay collapsed but visible
- Preserves context while focusing attention on matches
- Keywords can match against: title, description, comments, labels

**UI indicators**:
- Yellow highlight border on matching cards
- "X matches" badge on card
- Matching text highlighted within expanded content
- Option to "Show only matches" (hide non-matching)

### 4. Comment Threading: Parent-Child Sufficient
**Decision**: Capture comment → issue/MR relationship only.

**Rationale**: GitLab's nested replies are less critical than grouping comments under their parent work item. Can add reply-to relationships in future phase if needed.

### 5. Cross-Project Relationships: Future Enhancement
**Decision**: Defer to future phase.

**Rationale**: Most common case is references within same project. Cross-project would require fetching events from multiple projects, adding complexity. Revisit if users request it.

### 6. Performance Strategy: Virtualization at 500+ Items
**Decision**: Use virtual scrolling when work item list exceeds 500 items.

**Implementation**:
- For < 500 items: Render all cards with collapse/expand
- For 500+ items: Use `@tanstack/react-virtual` for viewport rendering
- Maintain keyboard navigation in both modes
- Paginate activity timeline within cards (load more comments)

**Rationale**: Most users have < 100 active work items. 500 threshold provides cushion before performance degrades.

## Success Criteria

After implementation, users should be able to:
1. ✅ See all comments grouped under their parent issue/MR
2. ✅ Identify which MRs close which issues
3. ✅ Scan for work items with new activity
4. ✅ Drill into specific items for full context
5. ✅ Reduce noise by collapsing/filtering
6. ✅ Triage efficiently with visual indicators
7. ✅ Navigate with keyboard (preserve existing UX)
8. ✅ Mark items as reviewed to track progress

## Non-Goals (Future Enhancements)

- Real-time updates (webhooks)
- In-app commenting (read-only for now)
- Advanced visualizations (graphs, charts)
- Multi-user collaboration features
- Mobile responsive design (desktop-first)
- Custom grouping rules (project, assignee, label)

## Estimated Complexity

- **Phase 1 (Data Model)**: Medium - Schema changes are straightforward but backfilling is tricky
- **Phase 2 (Data Layer)**: Medium - New queries but well-defined requirements
- **Phase 3 (UI Components)**: High - Significant UI rework, interactions, state management
- **Phase 4 (Noise Reduction)**: Low - Building on Phase 3 components
- **Phase 5 (Migration)**: Low - Feature flag is simple implementation

**Total**: High complexity project, recommend implementing phases sequentially with validation between each.
