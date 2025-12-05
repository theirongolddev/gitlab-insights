# Story 3.4: Sidebar New Item Badges

Status: ready-for-dev

## Story

As a **user viewing any page with the sidebar visible**,
I want **to see badge counts on sidebar queries showing new item counts**,
so that **I know which queries have new items without entering Catch-Up Mode**.

## Acceptance Criteria

| AC ID | Criterion |
|-------|-----------|
| 3.4.1 | Each sidebar query item displays a badge showing the count of new items (events created after `lastVisitedAt`) |
| 3.4.2 | Badge has olive background (`bg-olive` / `dark:bg-olive-light`) with appropriate text color for WCAG AA contrast (4.5:1 minimum), pill shape (full rounded), 11px font size |
| 3.4.3 | Queries with 0 new items show no badge (badge is hidden, not "0") |
| 3.4.4 | Badge updates automatically when user marks a query as reviewed (via query invalidation from Story 3.3) |
| 3.4.5 | Badge count is accurate and derived from a single data source shared with CatchUpModeToggle |
| 3.4.6 | Badge is accessible to screen readers with proper aria-label (singular "1 new item" vs plural "3 new items") |
| 3.4.7 | Badge replaces the total count display; total count moves to tooltip on hover (e.g., "47 matching events") |
| 3.4.8 | New items data is fetched once at AppLayout level and shared via context - no duplicate fetching across components |
| 3.4.9 | React Query configured with appropriate `staleTime` (30s) and `refetchOnWindowFocus: false` to prevent excessive refetching |
| 3.4.10 | Badge gracefully handles loading and error states (returns null, no layout shift) |

## Tasks / Subtasks

- [ ] Task 1: Create NewItemsContext Provider (AC: 3.4.5, 3.4.8, 3.4.9, 3.4.10)
  - [ ] 1.1 Create `src/contexts/NewItemsContext.tsx`
  - [ ] 1.2 Define context interface:
    ```typescript
    interface NewItemsContextValue {
      queriesWithNewCounts: { queryId: string; queryName: string; newCount: number }[];
      totalNewCount: number;
      isLoading: boolean;
    }
    ```
  - [ ] 1.3 Create `NewItemsProvider` component that fetches `api.queries.list.useQuery()`
  - [ ] 1.4 Use `api.useQueries()` to fetch `getNewItems` for each query (following DashboardClient pattern)
  - [ ] 1.5 Configure React Query options: `{ staleTime: 30000, refetchOnWindowFocus: false }`
  - [ ] 1.6 Derive `totalNewCount` by summing all `newCount` values
  - [ ] 1.7 Derive `queriesWithNewCounts` array from query results
  - [ ] 1.8 Export `useNewItems()` hook for consuming context
  - [ ] 1.9 Handle error states gracefully (return empty arrays, log errors)

- [ ] Task 2: Integrate NewItemsProvider into AppLayout (AC: 3.4.8)
  - [ ] 2.1 Open `src/components/layout/AppLayout.tsx`
  - [ ] 2.2 Import `NewItemsProvider` from contexts
  - [ ] 2.3 Wrap children with `NewItemsProvider` (inside existing providers)
  - [ ] 2.4 Verify provider only renders for authenticated users

- [ ] Task 3: Create NewItemsBadge Component (AC: 3.4.1, 3.4.2, 3.4.3, 3.4.6, 3.4.10)
  - [ ] 3.1 Create `src/components/sidebar/NewItemsBadge.tsx`
  - [ ] 3.2 Accept props: `newCount: number` (data comes from context, not fetched here)
  - [ ] 3.3 Return `null` if `newCount === 0` (AC 3.4.3)
  - [ ] 3.4 Render badge with olive styling: `bg-olive text-white dark:bg-olive-light dark:text-gray-900`
  - [ ] 3.5 Add pill shape: `rounded-full px-1.5 py-0.5`
  - [ ] 3.6 Set font size: `text-[11px] font-medium tabular-nums`
  - [ ] 3.7 Add dynamic aria-label: `${newCount} new item${newCount === 1 ? '' : 's'}` (AC 3.4.6)
  - [ ] 3.8 Add `role="status"` for screen reader announcement

- [ ] Task 4: Update QuerySidebar to Use Context (AC: 3.4.1, 3.4.5, 3.4.7)
  - [ ] 4.1 Open `src/components/queries/QuerySidebar.tsx`
  - [ ] 4.2 Import `useNewItems` hook and `NewItemsBadge` component
  - [ ] 4.3 Import HeroUI `Tooltip` component
  - [ ] 4.4 Consume `queriesWithNewCounts` from context
  - [ ] 4.5 Remove `NavItemCount` from trailing content
  - [ ] 4.6 Add `NewItemsBadge` with `newCount` from context data
  - [ ] 4.7 Wrap `NavItem` with `Tooltip` showing total count: "X matching events"
  - [ ] 4.8 Update trailing order: `NewItemsBadge → NavItemShortcut` (no more NavItemCount)
  - [ ] 4.9 Look up `newCount` for each query by matching `queryId`

- [ ] Task 5: Refactor DashboardClient to Use Context (AC: 3.4.5, 3.4.8)
  - [ ] 5.1 Open `src/components/dashboard/DashboardClient.tsx`
  - [ ] 5.2 Import `useNewItems` hook
  - [ ] 5.3 Remove local `api.queries.list.useQuery()` call (lines 74-76)
  - [ ] 5.4 Remove local `api.useQueries()` for getNewItems (lines 79-83)
  - [ ] 5.5 Remove local `totalNewItemsCount` calculation (lines 85-90)
  - [ ] 5.6 Consume `totalNewCount` from `useNewItems()` context
  - [ ] 5.7 Pass `totalNewCount` to `CatchUpModeToggle` (unchanged prop name)
  - [ ] 5.8 Verify query invalidation in `manualRefresh` mutation still works

- [ ] Task 6: Create Sidebar Components Index (Organization)
  - [ ] 6.1 Create `src/components/sidebar/index.ts`
  - [ ] 6.2 Export `NewItemsBadge` from index file

- [ ] Task 7: WCAG Contrast Verification (AC: 3.4.2)
  - [ ] 7.1 Verify light mode contrast: `bg-olive` (#5e6b24) with `text-white` ≥ 4.5:1
  - [ ] 7.2 Verify dark mode contrast: `bg-olive-light` (#9DAA5F) with `text-gray-900` ≥ 4.5:1
  - [ ] 7.3 Verify badge contrast on active NavItem background (`bg-olive/10`)
  - [ ] 7.4 Adjust colors if any fail WCAG AA (document final color choices)

- [ ] Task 8: Testing and Validation (AC: All)
  - [ ] 8.1 Run `npm run typecheck` to verify no TypeScript errors
  - [ ] 8.2 Run `npm run build` to verify build succeeds
  - [ ] 8.3 Manual test: View sidebar on any page → verify badges appear for queries with new items (AC 3.4.1)
  - [ ] 8.4 Manual test: Verify badge styling matches spec (olive bg, proper contrast, pill shape) (AC 3.4.2)
  - [ ] 8.5 Manual test: View query with 0 new items → verify no badge shown (AC 3.4.3)
  - [ ] 8.6 Manual test: Mark query as reviewed → verify badge disappears/updates (AC 3.4.4)
  - [ ] 8.7 Manual test: Compare sidebar badge count with CatchUpView count → verify match (AC 3.4.5)
  - [ ] 8.8 Manual test: Use screen reader → verify badge announces "X new item(s)" (AC 3.4.6)
  - [ ] 8.9 Manual test: Hover over query → verify tooltip shows total count (AC 3.4.7)
  - [ ] 8.10 Manual test: Check Network tab → verify getNewItems only fetched once on app load (AC 3.4.8)
  - [ ] 8.11 Manual test: Navigate between pages → verify no refetch (AC 3.4.8, 3.4.9)
  - [ ] 8.12 Manual test: Switch browser tabs → verify no refetch (AC 3.4.9)
  - [ ] 8.13 Manual test: Verify no layout shift when badges load (AC 3.4.10)

## Dev Notes

### Architecture: Consolidated New Items Data

**Problem Solved:**
Previously, DashboardClient fetched `getNewItems` for each query to calculate `totalNewCount` for the Catch-Up toggle badge. Adding sidebar badges would duplicate this fetching on every page. Instead, we consolidate to a single data source.

**Solution: NewItemsContext**
```
AppLayout
  └── NewItemsProvider (fetches ONCE)
        ├── QuerySidebar (consumes queriesWithNewCounts)
        └── DashboardClient (consumes totalNewCount)
```

**Data Flow:**
1. `NewItemsProvider` fetches `queries.list` → gets query IDs
2. `NewItemsProvider` fetches `getNewItems` for each query (N parallel requests, once)
3. Context exposes `{ queriesWithNewCounts, totalNewCount, isLoading }`
4. All consumers read from cache - zero duplicate requests

**Cache Behavior:**
- `staleTime: 30000` (30s) - Data considered fresh for 30 seconds
- `refetchOnWindowFocus: false` - No refetch on tab switch
- Invalidation from `markAsReviewed` triggers refetch for affected queries
- React Query shares cache across all consumers automatically

### Removed: Total Count from Sidebar

**UX Decision:**
- Total count (e.g., "47") removed from sidebar display
- Users care about "what's new", not "how many total"
- Total count moved to tooltip on hover: "47 matching events"
- Cleaner visual, faster scanning, badge has more prominence

### React Query Configuration

```typescript
// In NewItemsProvider
const newItemsQueries = api.useQueries((t) =>
  queryIds.map((queryId) => 
    t.queries.getNewItems(
      { queryId },
      { 
        staleTime: 30 * 1000,        // 30 seconds
        refetchOnWindowFocus: false,  // No refetch on tab switch
      }
    )
  )
);
```

### Singular vs Plural Aria Labels

```typescript
// Correct implementation
aria-label={`${newCount} new item${newCount === 1 ? '' : 's'}`}
// Results: "1 new item", "3 new items"
```

### WCAG Contrast Requirements

Must verify 4.5:1 contrast ratio for normal text (11px):
- Light mode: `bg-olive` (#5e6b24) + `text-white` 
- Dark mode: `bg-olive-light` (#9DAA5F) + `text-gray-900`
- Active state: Badge on `bg-olive/10` background

Use contrast checker tool. If olive-light fails with gray-900, consider `text-black` or darker olive variant.

### Error Handling

```typescript
// In NewItemsProvider - graceful degradation
if (queriesQuery.isError || newItemsQueries.some(q => q.isError)) {
  console.error('Failed to fetch new items data');
  // Return empty data, don't crash the app
}
```

### Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `src/contexts/NewItemsContext.tsx` | Create | Single source of truth for new items data |
| `src/components/layout/AppLayout.tsx` | Modify | Add NewItemsProvider wrapper |
| `src/components/sidebar/NewItemsBadge.tsx` | Create | Badge component (display only) |
| `src/components/sidebar/index.ts` | Create | Module exports |
| `src/components/queries/QuerySidebar.tsx` | Modify | Consume context, add badge and tooltip |
| `src/components/dashboard/DashboardClient.tsx` | Modify | Remove duplicate fetching, consume context |

### Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 3.1 (Backend) | Complete | `queries.getNewItems` endpoint available |
| Story 3.2 (CatchUp View) | Complete | CatchUpModeToggle ready for refactor |
| Story 3.3 (Mark as Reviewed) | Complete | Query invalidation in place |
| Story 2.8 (Sidebar) | Complete | QuerySidebar ready for enhancement |
| Epic 1.5 (HeroUI) | Complete | Tooltip component available |

### API Contract (from Story 3.1)

```typescript
// queries.getNewItems response (already exists)
interface GetNewItemsResponse {
  queryId: string;
  queryName: string;
  newCount: number;  // This is what the badge displays
  events: EventRow[];
}

// NewItemsContext value
interface NewItemsContextValue {
  queriesWithNewCounts: { queryId: string; queryName: string; newCount: number }[];
  totalNewCount: number;
  isLoading: boolean;
}
```

### Badge Styling Reference

```typescript
<span
  role="status"
  aria-label={`${newCount} new item${newCount === 1 ? '' : 's'}`}
  className="
    bg-olive text-white 
    dark:bg-olive-light dark:text-gray-900
    rounded-full px-1.5 py-0.5
    text-[11px] font-medium tabular-nums
  "
>
  {newCount}
</span>
```

### DashboardClient Refactor Reference

**Remove these lines (74-90):**
```typescript
// DELETE: Fetching moves to NewItemsContext
const { data: queriesData } = api.queries.list.useQuery(undefined, {
  enabled: !isCatchUpMode,
});

const queryIds = queriesData?.map(q => q.id) ?? [];
const newItemsQueries = api.useQueries((t) =>
  !isCatchUpMode && queryIds.length > 0
    ? queryIds.map((queryId) => t.queries.getNewItems({ queryId }))
    : []
);

const totalNewItemsCount = newItemsQueries.reduce((sum, query) => {
  if (query.data) {
    return sum + query.data.newCount;
  }
  return sum;
}, 0);
```

**Replace with:**
```typescript
const { totalNewCount } = useNewItems();
```

### References

- [Source: docs/epics/epic-3-catch-up-mode-background-sync-story-breakdown.md] - Story definition
- [Source: docs/prd.md#FR51] - Sidebar badges show new counts requirement
- [Source: docs/sprint-artifacts/3-3-mark-query-as-reviewed.md] - Query invalidation patterns
- [Source: docs/sprint-artifacts/3-2-catch-up-mode-view-with-toggle.md] - CatchUpModeToggle patterns
- [Source: src/components/dashboard/DashboardClient.tsx:74-90] - Current fetching to refactor

## Dev Agent Record

### Context Reference

<!-- Path to story context XML will be added by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-05 | Story created from Epic 3 breakdown | Create-Story Workflow |
| 2025-12-05 | Party Mode review: Consolidated architecture with NewItemsContext, removed total count from sidebar (moved to tooltip), added WCAG verification, React Query optimization, singular/plural aria-labels, error handling | Party Mode (Bob, Amelia, Sally, Winston) |

### File List
