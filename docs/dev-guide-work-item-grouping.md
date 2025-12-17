# Work Item Grouping - Developer Guide

## Architecture Overview

### Data Model

The system uses a hierarchical event model stored in Prisma/SQLite:

```
Event (parent: null)          <- Top-level work item (Issue/MR)
  ├── Event (parent: eventId) <- Comment
  ├── Event (parent: eventId) <- System note
  └── Event (parent: eventId) <- Status change

ReadEvent                     <- Tracks read state per user
  ├── userId
  ├── eventId
  └── readAt (timestamp)
```

**Key fields on Event:**
- `parentEventId`: null for work items, event ID for children
- `lastActivityAt`: Updated when children are added
- `closesIssueIds`: Array of issue IIDs this MR closes
- `mentionedInIds`: Array of related work item IDs

### tRPC Endpoints

Located in `src/server/api/routers/work-items.ts`:

| Endpoint | Purpose |
|----------|---------|
| `getGrouped` | Fetch paginated work items with activity summaries |
| `getWithActivity` | Fetch single work item with full timeline |
| `markAsRead` | Mark single item as read |
| `markMultipleAsRead` | Batch mark items as read |
| `clearReadStatus` | Reset read state (for testing) |

### Component Hierarchy

```
CatchUpWorkItems (or CatchUpClient)
├── WorkItemFilters (tabs, search, mark all)
├── WorkItemList
│   └── WorkItemSection (per type)
│       └── WorkItemCard (memoized)
│           ├── ContextBadges
│           └── ActivityTimeline
└── SidePanelDetail (lazy-loaded)
    ├── ActivityTimeline
    └── RelatedWorkItems
```

## Read Tracking State Machine

### State Determination

```typescript
function computeIsUnread(lastActivityAt: Date | null, lastReadAt: Date | null): boolean {
  if (!lastReadAt) return true;           // Never read = unread
  if (!lastActivityAt) return false;      // No activity = read
  return lastActivityAt > lastReadAt;     // New activity = unread
}
```

### State Transitions

1. **New work item** → `isUnread = true` (no ReadEvent exists)
2. **Mark as read** → Creates/updates ReadEvent, `isUnread = false`
3. **New activity** → `lastActivityAt` updates, `isUnread = true` (if > readAt)

### Optimistic Updates

The `useMarkAsRead` hook implements optimistic updates:

1. Immediately update local cache (all getGrouped queries)
2. Send mutation to server
3. On error: Invalidate cache to refetch correct state
4. On success: Keep optimistic state (no re-fetch to prevent items disappearing)

**Race condition prevention:**
- `pendingIdsRef` tracks in-flight mutations
- Duplicate requests for same ID are skipped

## Relationship Extraction

### MR → Issue Links

Parsed from MR description using GitLab syntax:
- `Closes #123`
- `Fixes #456`
- `Resolves #789`

Stored in `closesIssueIds` as integer array.

### Issue → MR Links

Computed dynamically by querying MRs where `closesIssueIds` contains the issue IID.

## Performance Considerations

### Memoization

- `WorkItemCard`: Wrapped in `React.memo`
- `WorkItemSection`: Wrapped in `React.memo`
- Expensive computations use `useMemo` (keywords, activity summaries)
- Handlers use `useCallback`

### Debouncing

- Search input: 300ms debounce (`useDebounce` hook)
- Scroll position save: 100ms debounce (`useScrollRestoration`)

### Code Splitting

- `SidePanelDetail`: Loaded via `React.lazy` + `Suspense`
- Reduces initial bundle size

### Animation Performance

- Expand/collapse: CSS Grid animation (200ms)
- Side panel: CSS transitions (200ms)
- Hardware-accelerated transforms used where possible

### Query Optimization

- Cursor-based pagination prevents N+1 issues
- `limit + 1` pattern determines `hasMore` without extra query
- ReadEvent join is filtered by userId in query

## Testing Strategy

### Unit Tests

Located in `src/server/api/routers/work-items.test.ts`:

- `isUnread` computation logic
- State transitions (unread → read → unread)
- Activity summary `newCount` calculation
- Batch operations
- Optimistic update scenarios
- Race condition prevention

Run with: `npm run test`

### E2E Tests

Manual testing via dev-browser covering:

1. **Morning triage**: Expand cards, open detail pane
2. **Mark as read**: Click card, hover badge, mark all
3. **Tab switching**: Issues ↔ Merge Requests
4. **Read persistence**: State survives page refresh
5. **Mobile**: Touch targets, full-screen panel, scroll-to-read

## Key Files

| File | Purpose |
|------|---------|
| `src/server/api/routers/work-items.ts` | tRPC router |
| `src/components/work-items/WorkItemCard.tsx` | Card component |
| `src/components/work-items/WorkItemList.tsx` | List container |
| `src/components/work-items/SidePanelDetail.tsx` | Detail panel |
| `src/hooks/useMarkAsRead.ts` | Read state mutations |
| `src/hooks/useScrollIntoViewRead.ts` | Mobile scroll-to-read |
| `src/types/work-items.ts` | TypeScript types |
