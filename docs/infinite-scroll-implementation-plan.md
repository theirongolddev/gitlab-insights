# Infinite Scroll Implementation Plan

## Overview

Add cursor-based infinite scrolling to all list views (Dashboard, Saved Queries, Catch-up Mode, Search) to allow users to load beyond the current 50-150 item limits. Implementation will use TanStack Query's `useInfiniteQuery` with auto-load on scroll via Intersection Observer API.

**User Preferences:**
- Pagination Strategy: Cursor-based (createdAt + ID)
- Load Trigger: Auto-load on scroll
- Page Size: 50 items per page
- Scope: All pages (Dashboard sections, Query results, Catch-up mode, Search)

## Cursor Strategy

### Cursor Format
```typescript
interface Cursor {
  createdAt: string; // ISO 8601 timestamp
  id: string;        // Event ID for tie-breaking
}
```

**Encoding:** Base64-encoded JSON
```typescript
const encodeCursor = (cursor: Cursor) =>
  Buffer.from(JSON.stringify(cursor)).toString('base64');

const decodeCursor = (encoded: string) =>
  JSON.parse(Buffer.from(encoded, 'base64').toString());
```

**Why this approach:**
- Leverages existing `[userId, createdAt DESC]` index
- Handles timestamp collisions with ID tie-breaker
- Deterministic ordering prevents duplicates
- Simple to debug (human-readable when decoded)

## Backend Changes

### 1. Events Router (`src/server/api/routers/events.ts`)

**Current Issues:**
- Line 201: `take: 50` hard-coded
- Lines 236-256: `getForDashboard` fetches 150, slices by type in-memory (inefficient)
- Line 344: `search` has limit but no cursor

**Changes Required:**

#### A. Update `getRecent` with cursor support
```typescript
getRecent: protectedProcedure
  .input(
    z.object({
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }).optional()
  )
  .query(async ({ ctx, input }) => {
    const limit = input?.limit ?? 50;
    let cursor: Cursor | null = null;

    if (input?.cursor) {
      cursor = decodeCursor(input.cursor);
    }

    const events = await ctx.db.event.findMany({
      where: {
        userId: ctx.session.user.id,
        ...(cursor && {
          OR: [
            { createdAt: { lt: new Date(cursor.createdAt) } },
            {
              createdAt: new Date(cursor.createdAt),
              id: { lt: cursor.id }
            }
          ]
        })
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" }
      ],
      take: limit + 1, // Fetch one extra to determine hasMore
    });

    const hasMore = events.length > limit;
    const items = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore
      ? encodeCursor({
          createdAt: items[items.length - 1].createdAt.toISOString(),
          id: items[items.length - 1].id
        })
      : null;

    return { items, nextCursor, hasMore };
  });
```

#### B. Update `getForDashboard` with cursor support
Current approach fetches 150 items then merges/sorts in memory. Update to use cursor pagination:

```typescript
getForDashboard: protectedProcedure
  .input(z.object({
    cursor: z.string().optional(),
    limit: z.number().min(1).max(100).default(50),
    filterLabel: z.string().nullable().optional(),
  }).optional())
  .query(async ({ ctx, input }) => {
    const limit = input?.limit ?? 50;
    let cursor: Cursor | null = null;

    if (input?.cursor) {
      cursor = decodeCursor(input.cursor);
    }

    // Fetch all types in single query, already sorted by date
    // No need to fetch separately and merge - let DB handle it
    const whereClause = {
      userId: ctx.session.user.id,
      ...(input?.filterLabel && { labels: { has: input.filterLabel } }),
      ...(cursor && {
        OR: [
          { createdAt: { lt: new Date(cursor.createdAt) } },
          {
            createdAt: new Date(cursor.createdAt),
            id: { lt: cursor.id }
          }
        ]
      })
    };

    const events = await ctx.db.event.findMany({
      where: whereClause,
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" }
      ],
      take: limit + 1,
    });

    const hasMore = events.length > limit;
    const items = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore
      ? encodeCursor({
          createdAt: items[items.length - 1].createdAt.toISOString(),
          id: items[items.length - 1].id
        })
      : null;

    return { items, nextCursor, hasMore };
  });
```

**Note:** Eliminates the inefficient separate fetch + merge approach. Database sorts all types together.

#### C. Update `search` endpoint with cursor support
```typescript
search: protectedProcedure
  .input(
    z.object({
      keywords: z.array(z.string().max(100)).min(1).max(10),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    // Delegate to updated searchEvents function
    const result = await searchEvents(ctx.db, {
      keywords: input.keywords,
      userId: ctx.session.user.id,
      limit: input.limit,
      cursor: input.cursor,
    });
    return result;
  });
```

### 2. Search Module (`src/lib/search/postgres-fts.ts`)

**Current Issue:** Lines 55-56, 102, 156 - Hard-coded limits, no cursor support

**Changes Required:**

Update `SearchOptions` interface:
```typescript
export interface SearchOptions {
  keywords: string[];
  userId: string;
  limit?: number;
  cursor?: string; // Add cursor support
}
```

Update `searchEvents` query to include cursor logic:
```typescript
// Add cursor WHERE clause before ORDER BY rank DESC
// Since search uses rank-based ordering, cursor must include rank + createdAt + id
```

**Important:** Search ordering is `rank DESC, createdAt DESC` - cursor must track rank value to maintain consistency.

### 3. Queries Router (`src/server/api/routers/queries.ts`)

**Update `getNewItems` endpoint:**
```typescript
getNewItems: protectedProcedure
  .input(
    z.object({
      queryId: z.string(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    })
  )
  .query(async ({ ctx, input }) => {
    // Add cursor logic to existing query
    // Keep lastVisitedAt filter, add cursor pagination
  });
```

## Frontend Changes

### 1. Create Shared Hooks

#### A. `useInfiniteScroll` Hook (`src/hooks/useInfiniteScroll.ts`)
```typescript
interface UseInfiniteScrollOptions {
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isError?: boolean;
  onError?: () => void;
  threshold?: number; // Default 0.8 (80% scroll)
}

export function useInfiniteScroll({
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isError,
  onError,
  threshold = 0.8
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          // On intersection, try to fetch next page
          // If previous fetch errored, this acts as automatic retry
          fetchNextPage();
        }
      },
      { threshold }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, threshold]);

  // Show toast on error
  useEffect(() => {
    if (isError && onError) {
      onError();
    }
  }, [isError, onError]);

  return { sentinelRef };
}
```

#### B. `useInfiniteEvents` Hook (`src/hooks/useInfiniteEvents.ts`)
```typescript
export function useInfiniteEvents(type?: 'issue' | 'merge_request' | 'comment') {
  return api.events[type ? `get${capitalize(type)}s` : 'getRecent'].useInfiniteQuery(
    {},
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: 30 * 1000,
    }
  );
}

// Flatten pages into single array
export function useFlattenedEvents(data: InfiniteData<...>) {
  return useMemo(
    () => data?.pages.flatMap(page => page.items) ?? [],
    [data]
  );
}
```

### 2. Update Components

#### A. EventTable (`src/components/dashboard/EventTable.tsx`)

**Current:** Lines 18-28 - Accepts `events` array prop

**Update to support infinite scroll:**
```typescript
interface EventTableProps {
  events: DashboardEvent[];
  onRowClick?: (event: DashboardEvent) => void;
  selectedEventId?: string | null;
  scopeId?: string;
  showNewBadges?: boolean;
  queryId?: string;

  // New props for infinite scroll
  infiniteScroll?: {
    fetchNextPage: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
  };
}

export function EventTable({
  events,
  infiniteScroll,
  // ... other props
}: EventTableProps) {
  const { sentinelRef } = useInfiniteScroll(infiniteScroll ?? {
    fetchNextPage: () => {},
    hasNextPage: false,
    isFetchingNextPage: false,
  });

  // ... existing code

  return (
    <div ref={scrollContainerRef} onScroll={handleScroll} className="h-full overflow-y-auto">
      <div ref={wrapperRef} tabIndex={0} className="outline-none">
        <Table>
          {/* ... existing table */}
        </Table>

        {/* Sentinel for intersection observer */}
        {infiniteScroll?.hasNextPage && (
          <div ref={sentinelRef} className="h-20 flex items-center justify-center">
            {infiniteScroll.isFetchingNextPage && (
              <div className="flex items-center gap-2 text-gray-500">
                <LoadingSpinner size="sm" />
                <span className="text-sm">Loading more items...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Key Integration Points:**
- Line 50-52: `useScrollRestoration` hook already exists - works seamlessly with infinite scroll
- Lines 153-171: Keyboard navigation handlers - work with flattened array of all loaded events
- Line 189-192: Scroll container already set up - just add sentinel element

#### B. DashboardClient (`src/components/dashboard/DashboardClient.tsx`)

**Current:** Lines 81-108 fetch via `getForDashboard`, merge all types, sort by date

**Update to use infinite query:**
```typescript
export function DashboardClient() {
  const searchParams = useSearchParams();
  const filterLabel = searchParams?.get('label');

  // Replace useQuery with useInfiniteQuery
  // Key changes when filterLabel changes, causing reset to page 1
  const dashboardQuery = api.events.getForDashboard.useInfiniteQuery(
    { filterLabel },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: 30 * 1000,
    }
  );

  // Flatten all pages into single array
  const allDashboardEvents = useMemo(
    () => dashboardQuery.data?.pages.flatMap(page => page.items) ?? [],
    [dashboardQuery.data]
  );

  const displayEvents = isSearchActive ? searchEventsAsDashboard : allDashboardEvents;

  // When filter changes, scroll to top smoothly
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (filterLabel && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [filterLabel]);

  return (
    // ... existing JSX
    <EventTable
      events={displayEvents}
      selectedEventId={selectedEventId}
      onRowClick={handleRowClick}
      infiniteScroll={{
        fetchNextPage: dashboardQuery.fetchNextPage,
        hasNextPage: dashboardQuery.hasNextPage ?? false,
        isFetchingNextPage: dashboardQuery.isFetchingNextPage,
      }}
    />
  );
}
```

**Note:** Dashboard already merges all event types into one unified sorted list (line 106-108), so single infinite scroll stream. Filter changes invalidate query and reset to page 1.

#### C. CatchUpView (`src/components/catchup/CatchUpView.tsx`)

**Update each query section to use infinite scroll:**
```typescript
// For each query section, use useInfiniteQuery
const newItemsQuery = api.queries.getNewItems.useInfiniteQuery(
  { queryId: query.id },
  { getNextPageParam: (lastPage) => lastPage.nextCursor }
);

const flattenedItems = useFlattenedEvents(newItemsQuery.data);

// Pass to EventTable with infiniteScroll prop
```

#### D. Search Results

**Update search context/components to use infinite scroll:**
```typescript
const searchQuery = api.events.search.useInfiniteQuery(
  { keywords: activeKeywords },
  {
    enabled: activeKeywords.length > 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  }
);
```

### 3. Scroll Restoration Integration

**Current Hook:** `src/hooks/useScrollRestoration.ts` (Lines 1-65)
- Already uses `sessionStorage` for persistence
- Debounced scroll handler (100ms)
- Works with EventTable scroll container

**No changes needed** - hook works transparently with infinite scroll:
- Restores scroll position after navigation
- Doesn't interfere with Intersection Observer
- `isRestoring()` check prevents scrollIntoView conflicts (Line 84)

## Critical Files to Modify

### Backend (5 files)
1. `/src/server/api/routers/events.ts` - Add cursor support to endpoints
2. `/src/lib/search/postgres-fts.ts` - Update search with cursor
3. `/src/server/api/routers/queries.ts` - Add cursor to getNewItems
4. `/src/utils/cursor.ts` - New file for encode/decode utilities
5. `/src/server/api/routers/types.ts` - New file for shared types

### Frontend (6 files)
1. `/src/hooks/useInfiniteScroll.ts` - New hook for Intersection Observer
2. `/src/hooks/useInfiniteEvents.ts` - New hook wrapping tRPC infinite queries
3. `/src/components/dashboard/EventTable.tsx` - Add infiniteScroll prop support
4. `/src/components/dashboard/DashboardClient.tsx` - Use infinite queries
5. `/src/components/catchup/CatchUpView.tsx` - Use infinite queries
6. `/src/components/queries/QueryDetailClient.tsx` - Use infinite search query

## New Items During Active Session

When manual sync or automatic background sync brings in new events while user is actively scrolling:

**Behavior:**
1. New items are added to TanStack Query cache (invalidation triggers refetch of page 1)
2. Show banner at top of EventTable: "5 new items available"
3. Banner actions:
   - **[Scroll to top]** button - smoothly scrolls to top and dismisses banner, user sees new items
   - **[Dismiss]** button - hides banner, user continues current position
4. Banner persists until user takes action or navigates away
5. Banner styling: Subtle blue background, positioned at top of scroll container (sticky)

**Implementation:**
- Track previous page 1 item count vs current
- If count increases, show banner with difference
- Store dismissed state in component state (resets on navigation)
- Use existing smooth scroll utilities

## Implementation Order

### Phase 1: Foundation (Week 1)
1. Create cursor utilities (`/src/utils/cursor.ts`)
2. Update Events router with cursor support
3. Update Search FTS with cursor support
4. Create `useInfiniteScroll` hook
5. Create `useInfiniteEvents` hook
6. Write unit tests for cursor logic

### Phase 2: Component Integration (Week 2)
1. Update EventTable to accept infinite scroll props
2. Migrate DashboardClient to use infinite queries
3. Migrate QueryDetailClient for search results
4. Migrate CatchUpView sections
5. Test keyboard navigation with large datasets
6. Test scroll restoration

### Phase 3: Testing & Refinement (Week 3)
1. E2E tests for infinite scroll behavior
2. Performance testing (measure query times, memory usage)
3. Edge case testing (empty results, network errors, rapid scrolling)
4. Accessibility testing (screen reader support, keyboard nav)
5. Add loading states and error handling
6. Documentation updates

## Performance Considerations

### Database Query Performance
- **Current Index:** `[userId, createdAt DESC]` - Perfect for cursor queries
- **Expected Performance:** ~1-5ms per page (50 items)
- **No new indexes needed** - existing composite indexes handle cursor WHERE clauses

### Memory Management
- **No artificial cap:** Users can load unlimited items via infinite scroll
- **Browser native handling:** Modern browsers manage memory efficiently
- **User control:** Users can refresh page if performance degrades
- **Future optimization:** If users report performance issues with 1000+ items, consider implementing virtualization with `@tanstack/react-virtual`

### Network Efficiency
- **Page Size:** 50 items per page (same as current)
- **Prefetch:** TanStack Query's built-in prefetch on scroll approach threshold
- **Caching:** 30s staleTime prevents redundant requests

### Keyboard Navigation
- **Works seamlessly** - EventTable already uses flattened events array
- **Auto-load on boundary** - When j/k navigation reaches last loaded item and more pages exist, automatically trigger `fetchNextPage()`, wait for completion, then continue navigation
- **No changes needed to core nav** - j/k navigation iterates through full loaded dataset
- **Scroll restoration** - Maintains position when navigating away/back
- **Implementation:** Add boundary detection in `moveSelection()` function - if moving to last item and `hasNextPage`, trigger load

## Error Handling

### Invalid Cursor
```typescript
if (input?.cursor) {
  try {
    cursor = decodeCursor(input.cursor);
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid cursor format"
    });
  }
}
```

### Network Failures
- TanStack Query handles retries automatically (3 retries by default)
- Show toast notification: "Failed to load more items" with error styling
- Toast auto-dismisses after 5s or user can dismiss manually
- Retry happens automatically on next scroll to sentinel (Intersection Observer triggers again)
- Use existing toast system from `~/components/ui/Toast/ToastContext`

### Race Conditions
- `isFetchingNextPage` flag prevents duplicate requests
- Intersection Observer disconnects during fetch
- Debounced scroll prevents rapid triggers

## Testing Strategy

### Unit Tests
- Cursor encode/decode utilities
- Edge cases: empty results, single page, timestamp collisions
- Invalid cursor handling

### Integration Tests
- tRPC endpoint pagination logic
- Database queries with various cursor values
- Search FTS with cursor + rank ordering

### E2E Tests
- Scroll to bottom triggers next page load
- Keyboard navigation works across pages
- Scroll restoration after navigation
- Loading states appear correctly
- Error states handled gracefully

## Rollout Strategy

**Direct deployment - no phased rollout needed:**
- No existing users, ship as part of initial feature set
- No feature flags or gradual rollout required
- All pages get infinite scroll simultaneously
- Backward compatible design (cursor params optional) ensures safety

**Deployment checklist:**
1. Run full test suite (unit + integration + E2E)
2. Test in staging environment with realistic data (1000+ events)
3. Monitor database query performance (should be <10ms per page)
4. Deploy to production
5. Monitor error rates and query performance for first 24 hours

## Monitoring & Metrics

### Add Logging
```typescript
logger.info({
  userId,
  endpoint: 'events.getRecent',
  cursorProvided: !!input?.cursor,
  itemsReturned: items.length,
  hasMore,
  durationMs
}, 'Pagination query completed');
```

### Metrics to Track
- Average items per user session
- Percentage of users scrolling past page 1
- Query performance (p50, p95, p99)
- Error rates on cursor decode
- Memory usage on client (via Performance API)

## Future Enhancements

### Virtual Scrolling
If users regularly load 500+ items, implement `@tanstack/react-virtual`:
- Renders only visible rows
- Maintains scroll performance with 10k+ items
- Reduces DOM node count

### Bidirectional Scroll
Support scrolling up to load newer items:
- Useful for real-time updates
- Add `previousCursor` alongside `nextCursor`

### Smart Prefetching
- Prefetch next page when user reaches 50% scroll
- Reduces perceived latency

### Configurable Page Size
- User preference: 25/50/100 items per page
- Store in user settings table

## Estimated Effort

**Total: ~55 hours (2-3 weeks)**

- Backend cursor implementation: 8 hours
- Search FTS cursor logic: 4 hours
- Frontend hooks creation: 6 hours
- Component migration: 12 hours
- Testing (unit + integration): 10 hours
- E2E testing: 6 hours
- Documentation: 3 hours
- Performance testing: 4 hours
- Buffer for edge cases: 2 hours

## User Stories & Acceptance Criteria

### User Story 1: View All Available Items
**As a** power user with many GitLab events
**I want to** scroll through all my events without pagination limits
**So that** I can find older items without manually clicking "next page" buttons

**Acceptance Criteria:**
- ✓ User can scroll continuously to load all available events
- ✓ No "Load More" button required (automatic on scroll)
- ✓ Works on Dashboard, Search results, Saved queries, and Catch-up mode
- ✓ Loading indicator shows when fetching next page
- ✓ No duplicate items appear across pages

### User Story 2: Seamless Keyboard Navigation
**As a** keyboard-focused user
**I want to** navigate with j/k keys across all loaded items
**So that** I can efficiently browse without reaching for my mouse

**Acceptance Criteria:**
- ✓ j/k navigation works across all loaded pages (not just first 50)
- ✓ When navigating past last loaded item, next page auto-loads
- ✓ Navigation continues smoothly after page loads
- ✓ Ctrl+d/u half-page jumps work across page boundaries
- ✓ Selected item remains highlighted during page loads

### User Story 3: Reliable Search Experience
**As a** user searching for specific events
**I want to** see all matching results
**So that** I don't miss important items beyond the first 50 results

**Acceptance Criteria:**
- ✓ Search results support infinite scroll
- ✓ Applying new filter resets to page 1 with smooth scroll
- ✓ Results remain sorted by relevance (rank) across pages
- ✓ Search highlighting preserved across all pages

### User Story 4: Error Recovery
**As a** user on unreliable network
**I want to** recover gracefully from failed page loads
**So that** I can continue browsing without losing my place

**Acceptance Criteria:**
- ✓ Failed page load shows toast notification
- ✓ Automatic retry on next scroll attempt
- ✓ Already-loaded items remain visible during errors
- ✓ No data loss or duplicate items after retry

## Success Metrics

**Technical Metrics:**
- Database query time: <10ms per 50-item page (p95)
- Initial page load time: No regression vs. current
- Error rate: <0.1% for pagination requests
- Browser memory usage: <50MB for 500 loaded items

**User Behavior Metrics:**
- % of sessions scrolling beyond page 1
- Average items loaded per session
- % of users using keyboard nav across pages
- Scroll depth distribution (how far users scroll)

**Performance Monitoring:**
- Query execution time (logged per request)
- Cursor decode errors (should be zero)
- Cache hit rate for TanStack Query
- Network payload size per page
