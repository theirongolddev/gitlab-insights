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

  // NEW: Cross-references (parsed from descriptions/comments for #123 and !456 patterns)
  mentionedInIds  Int[]     // GitLab IIDs mentioned in this item

  // NEW: System note flag
  isSystemNote    Boolean   @default(false)  // True for GitLab system notes (status changes, etc.)

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

// NEW: Track which events each user has read (for NEW badges)
model ReadEvent {
  id        String   @id @default(cuid())
  userId    String
  eventId   String
  readAt    DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([userId, eventId])
  @@index([userId, readAt])
}

// UPDATE: Add to existing User model
model User {
  // ... existing fields ...
  dashboardView   String   @default("grouped")  // "grouped" | "flat" - user preference
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
- **Position**: Far right of header row (aligned with chevron)
- **Style**: Small rounded pill with olive background, white text
- **Animation**: Brief pulse/glow when badge first appears (after refresh reveals new activity)

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
- Latest activity preview: "Bob commented: 'I think the issue is...'" (~50 chars)
- Related items: MRs that close (for issues), Issues closed (for MRs)
- Visual indicators: NEW badge if has unread activity, status color

**Expanded (click ▼):**
Cards show an **activity log** (what happened), NOT full content. Full content is in the detail pane.

- Chronological list of activity items (all items shown, card scrolls with max-height ~1000px)
- Each activity item: one-liner + short preview
  - User comment: "Bob commented: 'I think the root cause is...'"
  - System note: "Alice changed status: Open → Closed"
- When query is active: preview centers on matching/highlighted text instead of first 50 chars
- Click on activity item → opens detail pane scrolled to that specific item
- Expanding card marks work item as read (creates ReadEvent record)

**Multiple cards can be expanded simultaneously** (not accordion style).

**Selected State:**
- Card currently shown in detail pane displays a **ring/outline** around it
- Provides clear visual connection between card list and detail pane

**Card Interaction Specifications:**

| Region Clicked | Action |
|----------------|--------|
| Header row (title, status, metadata) | Toggle expand/collapse |
| Chevron icon | Toggle expand/collapse |
| Activity item (in expanded card) | Open detail pane scrolled to that item |
| Related item link (e.g., "MR !456") | Scroll to that card, expand it, select it, show in detail |
| Participant avatars | Show tooltip with full participant list |

**Expand/Collapse Behavior:**
- **Click target**: Entire header row toggles expand (not just chevron) - larger touch target
- **Animation**: Subtle height transition (~150ms ease-out)
- **Overflow**: Internal scroll when activity exceeds ~1000px max-height
- **Overflow indicator**: Subtle fade gradient at bottom indicates more content below
- **Expanded styling**: Card height increases; existing border/shadow treatment is sufficient (no additional visual change needed)

**Participant Avatars:**
- **Size**: 24px diameter
- **Arrangement**: Overlapping stack with -8px overlap
- **Hover behavior**: Animate to spread out and show each avatar individually (framer-motion)
- **Overflow**: Show 3 avatars max, then `+N more` indicator
- **Click/hover**: Tooltip displays full participant list with names

**Labels Display:**
- **Count**: Show up to 3 label chips, then `+N more` overflow
- **Colors**: Use GitLab label colors if included in API response
- **Style**: Small rounded chips matching existing design system

**Section Headers (Issues / Merge Requests):**
- **Display format**: `Issues (12) • 3 new` - name + total count + unread count
- **Collapsible**: Click section header to collapse/expand all cards in that section
- **Sticky**: Headers stick to top when scrolling within that section
- **Sort control**: Dropdown in header for sort options (Latest Activity, Most Comments, etc.)

**Noise Reduction Strategies:**
1. **Collapsed by default** - only summary visible
2. **Smart grouping** - comments grouped under parent
3. **Activity threshold** - hide items with no new activity (toggle)
4. **Participant collapse** - show 3 avatars + "+2 more"
5. **Comment preview** - only first line of latest comment
6. **System activity compression** - "Status: open → closed" as single line in gray

**Empty States:**

| Scenario | Display |
|----------|---------|
| No open issues | Subtle centered text: "No open issues" |
| No open merge requests | Subtle centered text: "No open merge requests" |
| Search returns no results | "No items match your search. Try adjusting your query or clearing filters." |
| Section collapsed with 0 items | Section header shows count as `(0)`, collapsed by default |

**Loading States:**

| Component | Loading Pattern |
|-----------|-----------------|
| Card list | Skeleton cards mimicking card layout (title bar, metadata row, activity summary) |
| Detail pane | Skeleton content (title, metadata grid, description block, activity items) |
| Individual card expansion | Skeleton activity items within the card |
| Related items | Skeleton chips/links |

Skeleton patterns provide structure hints while loading, making the UI feel faster than spinners.

### Tier 4: Enhanced Detail View (Full Content)

The detail pane shows **full content** of the selected work item (while cards show just the activity log).

**When work item card is clicked (or activity item within card clicked), detail pane shows:**

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
1. **Full content display** - Complete description text, full comment bodies (markdown rendered)
2. **Unified activity timeline** - comments + system changes merged chronologically
3. **Visual distinction** (from Design Decisions):
   - **User comments**: 💬 icon, full contrast text, complete body
   - **System activity**: ⚙️ icon, reduced opacity (gray-500/gray-300), single line
   - System activities from GitLab system notes (store raw body, parse for display)
4. **NEW badges** - olive accent color highlights unread activity (items without ReadEvent record)
5. **Related work section** - shows relationships prominently
6. **People context** - author, assignees visible at top
7. **Scroll to item** - when clicking activity item in card, detail pane scrolls to that item
8. **Viewing marks as read** - selecting item in detail pane creates ReadEvent record

**Navigation History (Breadcrumb Trail):**
When clicking related item links, users can navigate between connected work items. The detail pane header shows a breadcrumb trail for navigation history:

```
┌───────────────────────────────────────────────┐
│  Issue #123 → MR !456                    [×]  │
│  ═════════════════════════════════════════════│
```

- **Format**: `Issue #123 → MR !456 → Issue #789` (clickable breadcrumbs)
- **History depth**: Full session history (can navigate back through all visited items)
- **Click behavior**: Click any breadcrumb item to return to it
- **Clear**: Session history clears on page refresh or when manually selecting a new card from the list

**Reading = Reviewed**: Expanding a card or viewing in detail pane marks the item as "read". No separate "mark as reviewed" button needed.

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

**Main Dashboard (default view):**
- **Shows OPEN items only** - closed/merged items are excluded from the main triage view
- Closed items are only accessible via search (they become archived content)

1. **Default sort:** Unread items first, then by lastActivityAt
   - Items with unread activity float to top
   - Within each group, sorted by most recent activity

2. **Additional sort options:**
   - Most comments
   - Your assignments
   - Your mentions

3. **Quick scan indicators:**
   - 🔴 Red dot: mentions you
   - 🟡 Yellow highlight: assigned to you
   - NEW badge: has unread activity (items without ReadEvent)
   - Gray text: no new activity

**Search (for finding closed/archived items):**
- Search shows **all items by default** (open + closed)
- "Hide closed" filter available to focus on open items
- This is where users find historical/closed work items

**Re-unread behavior:** When new activity happens on a previously-read item, it becomes "unread" again (NEW badge reappears, floats to top).

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
  - This is a separate endpoint, adds one API call per MR
  - **Decision**: Call for every MR (most accurate - catches issues linked via GitLab UI, not just keyword patterns)
- **Comment Count**: Already included in issue/MR response, no extra call needed
- **Updated At**: Already included, no extra call needed
- **Assignees**: Already included, no extra call needed
- **System Notes**: GitLab's `note.system` boolean distinguishes system notes from user comments - map to `isSystemNote` field

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
   - `WorkItemCard` - Collapsed/expanded card showing activity log
   - `WorkItemList` - List of cards with grouping (Issues section, MRs section)
   - `ActivityTimeline` - Full content timeline in detail pane
   - `RelatedItems` - Show relationships (closes, mentioned in)
2. Update `DashboardClient` to use new components
3. Add expand/collapse interactions (multiple cards can expand simultaneously)
4. **Keyboard navigation (j/k) deferred** to future phase - simplifies implementation

**Files to modify:**
- Create new: `src/app/(authenticated)/dashboard/_components/WorkItemCard.tsx`
- Create new: `src/app/(authenticated)/dashboard/_components/WorkItemList.tsx`
- Create new: `src/app/(authenticated)/dashboard/_components/ActivityTimeline.tsx`
- Update: `src/app/(authenticated)/dashboard/_components/DashboardClient.tsx`
- Update: `src/app/(authenticated)/dashboard/_components/EventDetail.tsx`

**Design decisions (resolved):**
- Cards show activity log (what happened), detail pane shows full content
- All activity items shown in card, scrollable with max-height ~1000px
- System notes parsed from raw body at display time
- NEW badge based on ReadEvent table - disappears when card expanded or item viewed in detail

---

### Phase 4: Read Tracking & Filtering
**Goal**: Implement read tracking and smart defaults

1. Create `events.markAsRead` endpoint - creates ReadEvent records
2. Update `getWorkItemsGrouped` to include unread status (join with ReadEvent)
3. Implement default sort: unread first, then by lastActivityAt
4. Dashboard shows open items only by default
5. Add "Hide closed" filter to search results

**Read tracking behavior:**
- Expanding card marks work item as read
- Viewing in detail pane marks item as read
- New activity on previously-read item makes it "unread" again
- No separate "mark as reviewed" button - viewing = reviewed

**Files to modify:**
- Update: `src/server/api/routers/events.ts` - Add markAsRead endpoint, unread status in queries
- Update: `WorkItemList.tsx` - Sort controls
- Update: Search components - Add "Hide closed" filter

---

### Phase 5: Migration Path
**Goal**: Smooth transition from old to new UI

**Approach: User preference in database**
- Add `dashboardView` field to User model (default: "grouped")
- Toggle in UI to switch between "grouped" (new) and "flat" (old) views
- Each user's preference persists across sessions/devices
- After validation period, consider removing flat view option

**Implementation:**
1. Add `dashboardView` to User model in Prisma schema
2. Create settings toggle in dashboard header
3. Conditionally render WorkItemList (grouped) vs EventTable (flat)
4. After confidence built, remove flat view and toggle

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
- **Match highlight**: Subtle olive left border accent on matching cards (uses design system olive color)
  - Light mode: `#5e6b24`
  - Dark mode: `#9DAA5F`
- "X matches" badge on card
- Matching text highlighted within expanded content
- **"Show only matches" toggle**: Positioned near the search/query bar, allows hiding non-matching cards

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
- Handle variable card heights (expanded cards are taller)
- Paginate activity timeline within cards if needed (load more for 50+ items)

**Rationale**: Most users have < 100 active work items. 500 threshold provides cushion before performance degrades.

### 7. UI/UX Interaction Specifications ✓
**Decision**: Comprehensive interaction patterns for work item cards.

**Card Interactions:**
| Element | Behavior |
|---------|----------|
| Header row click | Toggle expand/collapse (entire row is click target) |
| Activity item click | Open detail pane scrolled to that item |
| Related item link click | Scroll to related card, expand it, select it, show in detail |
| Participant avatars hover | Animate to spread out; tooltip shows full list |

**Visual States:**
| State | Visual Treatment |
|-------|------------------|
| Default card | Border + shadow (elevated surface) |
| Expanded card | Height increases, internal scroll at ~1000px with fade gradient |
| Selected card (in detail) | Ring/outline around card |
| Query match | Olive left border accent |
| NEW activity | Olive pill badge, far right of header, pulse/glow on appear |

**Navigation:**
- Breadcrumb trail in detail pane header for navigation history
- Full session history (can navigate back through all visited items)
- Click any breadcrumb to return to that item

**Section Headers:**
- Sticky when scrolling within section
- Collapsible (click to collapse/expand all cards)
- Display: `Issues (12) • 3 new`

**Loading/Empty:**
- Skeleton patterns for cards and detail pane
- Subtle text messages for empty states
- Helpful suggestion text for no search results

## Success Criteria

After implementation, users should be able to:
1. ✅ See all comments grouped under their parent issue/MR
2. ✅ Identify which MRs close which issues (and cross-references via mentionedInIds)
3. ✅ Scan for work items with new activity (unread items float to top)
4. ✅ Drill into specific items for full context (detail pane)
5. ✅ Reduce noise by collapsing/filtering (main dashboard = open only)
6. ✅ Triage efficiently with visual indicators (NEW badges, status colors)
7. ✅ Find closed/archived items via search
8. ✅ Track progress via read state (viewing = reviewed, auto-tracks)

## Non-Goals (Future Enhancements)

- Real-time updates (webhooks)
- In-app commenting (read-only for now)
- Advanced visualizations (graphs, charts)
- Multi-user collaboration features
- Mobile responsive design (desktop-first, target 1440p)
- Custom grouping rules (project, assignee, label)
- Keyboard navigation (j/k) - deferred to simplify initial implementation

## Estimated Complexity

- **Phase 1 (Data Model)**: Medium - Schema changes are straightforward but backfilling is tricky
- **Phase 2 (Data Layer)**: Medium - New queries but well-defined requirements
- **Phase 3 (UI Components)**: High - Significant UI rework, interactions, state management
- **Phase 4 (Noise Reduction)**: Low - Building on Phase 3 components
- **Phase 5 (Migration)**: Low - Feature flag is simple implementation

**Total**: High complexity project, recommend implementing phases sequentially with validation between each.
