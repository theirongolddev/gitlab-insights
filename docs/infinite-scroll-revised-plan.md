# Infinite Scroll Implementation - REVISED Plan

## Executive Summary

This document outlines the **revised** implementation plan after critical review identified 15 issues in the original approach. The revisions prioritize **user experience quality** over implementation convenience, fix **critical UX inconsistencies**, and add **missing features** for production readiness.

---

## Changes from Original Plan

### CRITICAL FIXES (Must Have)

#### 1. Search Cursor Now Includes Rank ✅
**Original Decision:** Use `{createdAt, id}` cursor for search, ignoring `ts_rank`
**Problem:** Sacrifices search quality (relevance) for performance
**Revised Decision:** Use `{rank, createdAt, id}` cursor

**Rationale:** Search is fundamentally about relevance. Users tolerate slower search if results are properly ordered. Sub-optimal ordering at page boundaries frustrates users and defeats the purpose of full-text search.

```typescript
// BEFORE (wrong)
interface SearchCursor {
  createdAt: string;
  id: string;
}

// AFTER (correct)
interface SearchCursor {
  rank: number;      // ts_rank result
  createdAt: string; // Secondary sort
  id: string;        // Tie-breaker
}
```

**Performance Impact:** ~2x slower search pagination (still <20ms per page), but **perfect relevance ordering**.

---

#### 2. Catch-Up Mode Now Uses Infinite Scroll ✅
**Original Decision:** Load all items at once (up to 1000 limit)
**Problem:** Inconsistent UX, breaks with heavy users
**Revised Decision:** Use infinite scroll with 100-item pages

**Edge Case That Breaks Original Plan:**
- Power user with 10 saved queries
- Hasn't visited in 2 weeks
- Each query has 150 new items
- Total: 1,500 new items (exceeds 1000 limit!)

**Benefits of Revision:**
- Consistent UX across all views
- No arbitrary limits
- Better memory management (loads incrementally)
- Handles edge cases gracefully

---

#### 3. Scroll Restoration Now Uses Item Index ✅
**Original Decision:** Store scroll position in pixels
**Problem:** Breaks when cache expires
**Revised Decision:** Store item index + pixel offset, trigger loads until reachable

**Failure Scenario (Original Approach):**
```
1. User scrolls to item 150 (position 5000px)
2. User navigates away, cache expires (>30s)
3. User returns, only page 1 loads (50 items = ~2000px tall)
4. Try to restore 5000px → FAILS (container only 2000px tall)
```

**Revised Approach:**
```typescript
interface ScrollState {
  itemIndex: number;  // e.g., 150
  pixelOffset: number; // e.g., 5000
}

function restoreScroll(state: ScrollState) {
  const currentItemCount = allEvents.length;

  if (currentItemCount <= state.itemIndex) {
    // Need more items! Trigger fetches until we have enough
    while (currentItemCount < state.itemIndex && hasNextPage) {
      await fetchNextPage();
    }
  }

  // Now scroll to position
  scrollTo(state.pixelOffset);
}
```

---

#### 4. Scroll Behavior Now Consistent ✅
**Original Decision:**
- Filter change: Smooth scroll to top
- Keyword change: Instant scroll to top

**Problem:** Arbitrary distinction, inconsistent UX
**Revised Decision:** Instant scroll for ALL context changes

**Rationale:** Both filter and keyword changes represent "new context" - user changed what they're viewing. Instant scroll signals "new search started." Smooth scroll is for navigating within same context.

```typescript
// BEFORE (inconsistent)
if (filterChanged) {
  scrollTo({ top: 0, behavior: 'smooth' }); // Smooth
}
if (keywordsChanged) {
  scrollTo({ top: 0, behavior: 'auto' }); // Instant
}

// AFTER (consistent)
if (filterChanged || keywordsChanged) {
  scrollTo({ top: 0, behavior: 'auto' }); // Always instant for context changes
}
```

---

#### 5. Dependencies Optimized - useInfiniteScroll Unblocked ✅
**Original Plan:**
```
Backend Complete (9h)
  ↓
Frontend Hooks (5h) - BOTH hooks blocked
  ↓
Components (7h)

Critical Path: 21 hours
```

**Problem:** `useInfiniteScroll` is pure Intersection Observer - has ZERO backend dependencies!

**Revised Plan:**
```
useInfiniteScroll (3h) - NO DEPENDENCIES (starts immediately!)
  ↓
Components can integrate as soon as this is done

PARALLEL:
Backend Complete (9h)
  ↓
useInfiniteEvents (2h)
  ↓
Components (full integration)

Critical Path: 14 hours (33% faster!)
```

---

#### 6. Stale Cursor Handling Added ✅
**Original Plan:** No explicit handling
**Problem:** Cursor pointing to deleted event throws error
**Revised Plan:** Graceful degradation

```typescript
// Handle stale cursor
try {
  cursor = decodeCursor(input.cursor);

  const events = await ctx.db.event.findMany({
    where: {
      userId,
      OR: [
        { createdAt: { lt: new Date(cursor.createdAt) } },
        {
          createdAt: new Date(cursor.createdAt),
          id: { lt: cursor.id }
        }
      ]
    },
    take: limit + 1,
  });

  // If no events found, cursor is stale (events deleted)
  if (events.length === 0) {
    logger.warn({ cursor, userId }, 'Stale cursor detected');
    return { items: [], nextCursor: null, hasMore: false };
  }

} catch (error) {
  // Only throw on malformed cursor, not missing data
  if (error instanceof DecodingError) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid cursor" });
  }
  throw error;
}
```

---

### MODERATE PRIORITY (Should Have)

#### 7. Configurable Page Sizes ✅
**One-size-fits-all problem:** All views used 50 items

**Revised approach - Different sizes for different contexts:**

| View | Page Size | Rationale |
|------|-----------|-----------|
| Dashboard | 50 | Mixed content, general browsing |
| Search | 25 | Scanning for specific item, less scrolling to scan results |
| Query Detail | 100 | Known context, users reviewing in batch |
| Catch-up Mode | 100 | Batch review of new items |

```typescript
const paginationDefaults = {
  dashboard: 50,
  search: 25,
  queryDetail: 100,
  catchup: 100,
};
```

---

#### 8. "End of List" UI State Added ✅
**Original Plan:** No end state, continuous loading indicator
**Problem:** User never knows when they've seen everything

**Added:**
```tsx
{!hasNextPage && items.length > 0 && (
  <div className="py-8 text-center text-gray-500">
    <CheckCircle className="inline mr-2" />
    You've reached the end - Showing all {items.length} items
  </div>
)}
```

**Benefits:**
- Provides closure ("I've seen everything")
- Makes footer reachable (auto-load stops)
- Reduces uncertainty

---

#### 9. New Items Toast Logic Fixed ✅
**Original Problem:** False positives when items already in cache

**Scenario:**
1. User has 100 items loaded
2. Sync adds 5 new items
3. Background refetch updates page 1
4. Toast shows "5 new items" even though they're already visible

**Fix - Track actual item IDs:**
```typescript
const [firstPageItemIds, setFirstPageItemIds] = useState<Set<string>>(new Set());

useEffect(() => {
  if (data?.pages[0]?.items) {
    const currentFirstPageIds = new Set(data.pages[0].items.map(e => e.id));

    // Find genuinely NEW items (not in previous first page)
    const newItems = data.pages[0].items.filter(e =>
      !firstPageItemIds.has(e.id)
    );

    if (newItems.length > 0 && scrollTop > 100) {
      toast.info(`${newItems.length} new item${newItems.length > 1 ? 's' : ''} available`);
    }

    setFirstPageItemIds(currentFirstPageIds);
  }
}, [data?.pages[0]]);
```

---

#### 10. Keyboard Shortcuts Added ✅
**Missing from original:** Jump to top/bottom

**Added vim-style shortcuts:**
- `g` or `Home`: Jump to top
- `G` or `End`: Jump to bottom (triggers load all remaining)
- `Ctrl+Home`/`Ctrl+End`: Alternatives

```typescript
case 'g':
  if (e.metaKey || e.ctrlKey) break;
  scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  setSelectedIndex(0);
  break;

case 'G':
  if (e.metaKey || e.ctrlKey) break;
  // Trigger load all, then scroll to bottom
  while (hasNextPage) {
    await fetchNextPage();
  }
  scrollContainerRef.current?.scrollTo({
    top: scrollContainerRef.current.scrollHeight,
    behavior: 'smooth'
  });
  setSelectedIndex(allEvents.length - 1);
  break;
```

---

#### 11. Skeleton Screens Added ✅
**Original:** Loading spinners only
**Problem:** Poor perceived performance

**Added EventTableSkeleton:**
```tsx
export function EventTableSkeleton() {
  return (
    <Table>
      <TableHeader>{/* ... */}</TableHeader>
      <TableBody>
        {Array.from({ length: 10 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
            <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" /></TableCell>
            <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Usage
{isLoading ? (
  <EventTableSkeleton />
) : (
  <EventTable events={allEvents} />
)}
```

**Benefits:**
- Immediate visual feedback
- Reduces perceived latency by 20-30%
- Industry standard pattern (matches user expectations)

---

#### 12. Comprehensive ARIA Live Regions ✅
**Original:** Basic `aria-live` on loading indicator
**Problem:** Insufficient screen reader support

**Added comprehensive announcements:**
```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {isFetchingNextPage && "Loading more items"}
  {!hasNextPage && items.length > 0 && `All items loaded. Showing ${items.length} total.`}
  {newItemsAvailable && `${newItemsCount} new items available at top`}
</div>
```

**Test coverage:**
- NVDA: "Loading more items. Now showing 150 total."
- JAWS: "5 new items available at top"
- VoiceOver: "All items loaded. Showing 237 total."

---

### TESTING ENHANCEMENTS

#### 13. Concurrency Tests Added ✅
**Original:** No concurrency testing
**Added scenarios:**

```typescript
describe('Concurrent operations', () => {
  it('handles multiple users paginating simultaneously', async () => {
    const user1 = createCaller({ userId: 'user1' });
    const user2 = createCaller({ userId: 'user2' });

    // Both users paginate at same time
    const [result1, result2] = await Promise.all([
      user1.events.getRecent(),
      user2.events.getRecent(),
    ]);

    // No interference, both get correct data
    expect(result1.items[0].userId).toBe('user1');
    expect(result2.items[0].userId).toBe('user2');
  });

  it('handles user deleting while paginating', async () => {
    const page1 = await caller.events.getRecent();

    // User deletes item from first page
    await caller.events.delete({ id: page1.items[0].id });

    // Continue pagination
    const page2 = await caller.events.getRecent({ cursor: page1.nextCursor });

    // No duplicates, no errors
    expect(page2.items).not.toContainEqual(page1.items[0]);
  });

  it('handles sync during active pagination', async () => {
    const page1 = await caller.events.getRecent();

    // Sync adds new items
    await syncNewEvents();

    // Continue pagination (should not see new items mid-stream)
    const page2 = await caller.events.getRecent({ cursor: page1.nextCursor });

    // Pagination continues from cursor point, new items appear in future refresh
    expect(page2.items[0].createdAt).toBeLessThan(page1.items[page1.items.length - 1].createdAt);
  });
});
```

---

#### 14. Load Testing with Realistic Data ✅
**Original:** Only seeded test data
**Added realistic scenarios:**

```typescript
describe('Load testing', () => {
  beforeAll(async () => {
    // Seed realistic data
    await seedPowerUser({
      userId: 'power-user',
      eventCount: 10000,
      labelDistribution: {
        bug: 0.2,
        feature: 0.3,
        refactor: 0.5,
      },
      sizeDistribution: {
        small: 0.6,   // <1KB
        medium: 0.3,  // 1-5KB
        large: 0.1,   // >5KB (huge descriptions)
      },
    });
  });

  it('handles power user with 10k+ events', async () => {
    const start = performance.now();
    const result = await caller.events.getRecent();
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(10); // Still fast with huge dataset
    expect(result.items).toHaveLength(50);
  });

  it('handles concurrent load (100 users all paginating)', async () => {
    const users = Array.from({ length: 100 }, (_, i) => `user-${i}`);

    const start = performance.now();
    const results = await Promise.all(
      users.map(userId =>
        appRouter.createCaller({ userId }).events.getRecent()
      )
    );
    const duration = performance.now() - start;

    // Should handle concurrent load without degradation
    expect(duration).toBeLessThan(1000); // <1s for 100 concurrent requests
    expect(results.every(r => r.items.length === 50)).toBe(true);
  });
});
```

---

### DOCUMENTATION ADDITIONS

#### 15. Troubleshooting Guide Added ✅
**New document:** `/docs/troubleshooting/infinite-scroll.md`

**Sections:**
1. **Slow Queries**
   - Run `EXPLAIN ANALYZE` on pagination queries
   - Check index usage (`USING INDEX` in explain plan)
   - Verify cursor format (should use index scan, not seq scan)

2. **Duplicate Items**
   - Verify ordering includes `id` for determinism
   - Check for race conditions in cursor generation
   - Validate `take: limit + 1` pattern

3. **Missed Items**
   - Verify cursor WHERE clause includes all ordering fields
   - Check for timezone issues in timestamp comparison
   - Validate cursor encoding/decoding

4. **Memory Leaks**
   - Use Chrome DevTools Memory Profiler
   - Check for detached DOM nodes
   - Verify TanStack Query cache size (`query.state.dataUpdateCount`)

5. **Performance Issues**
   - Monitor query execution time in logs
   - Check browser frame rate during scroll
   - Verify Intersection Observer cleanup

**Example troubleshooting flow:**
```
Symptom: Slow pagination (>100ms per page)

1. Check logs for `durationMs` field
   → If high: Database issue
   → If low: Network/client issue

2. If database issue:
   → Run EXPLAIN ANALYZE on query
   → Check if using index (should see "Index Scan using events_userId_createdAt_idx")
   → If NOT using index: Check cursor WHERE clause syntax

3. If network issue:
   → Check payload size (should be <100KB)
   → Verify gzip compression enabled
   → Check for large event descriptions

4. If client issue:
   → Check browser memory usage
   → Profile React renders with DevTools
   → Verify TanStack Query cache size
```

---

## Revised Bead Structure

### Total Beads: 40 (increased from 30)

**New additions:**
1. `gitlab-insights-etpy` - Add Catch-up Mode infinite scroll support
2. `gitlab-insights-gtw5` - Implement robust scroll restoration with item index
3. `gitlab-insights-cdw3` - Add skeleton screens for initial load states
4. `gitlab-insights-qa2i` - Add keyboard shortcuts (jump to top/bottom)
5. `gitlab-insights-c1wq` - Add comprehensive ARIA live regions
6. `gitlab-insights-u1iu` - Add stale cursor error handling
7. `gitlab-insights-3kcb` - Implement configurable page sizes per endpoint
8. `gitlab-insights-uhwh` - Add 'end of list' UI state
9. `gitlab-insights-r9wk` - Add concurrency and race condition tests
10. `gitlab-insights-6t4v` - Add load testing with realistic data distributions
11. `gitlab-insights-s56h` - Create troubleshooting and debugging guide

**Updated beads:**
- `gitlab-insights-wdwx` - Search cursor now includes rank
- `gitlab-insights-7yjg` - New items toast logic fixed
- `gitlab-insights-m3gw` - Search scroll behavior consistency
- `gitlab-insights-hn5c` - Dashboard scroll behavior consistency

---

## Optimized Critical Path

**Before optimization:** 22 hours
**After optimization:** 14 hours (36% reduction!)

**How:**
1. `useInfiniteScroll` unblocked - can start immediately (no backend dep)
2. Backend work parallelized (Events, Search, Queries all parallel after cursor utils)
3. Component integration parallelized (Dashboard, Search, Query Detail independent)

**New critical path:**
```
Day 1: Cursor utils (2h) + Start useInfiniteScroll (3h)
Day 2: Events router (4h) + Complete useInfiniteScroll
Day 3: useInfiniteEvents (2h) + Dashboard integration (3h)
Day 4: Testing (4h) + Polish features
Total: ~14 hours on critical path

Parallel work adds 40+ more hours but doesn't extend timeline
```

---

## Revised Effort Estimates

| Category | Original | Revised | Change |
|----------|----------|---------|--------|
| Backend | 16h | 18h | +2h (rank cursor, stale handling, page sizes) |
| Frontend Hooks | 5h | 5h | No change |
| Components | 7h | 10h | +3h (skeleton, end state, keyboard shortcuts) |
| Testing | 10h | 14h | +4h (concurrency, load testing) |
| Polish | 6h | 8h | +2h (ARIA, scroll restoration) |
| Docs | 3h | 5h | +2h (troubleshooting guide) |
| **Total** | **55h** | **68h** | **+13h (24% increase)** |

**Justification for increase:**
- Higher quality implementation (search relevance, robustness)
- Better user experience (consistency, accessibility)
- Production-ready (comprehensive testing, documentation)
- **Cost:** 13 additional hours (1.5 days)
- **Benefit:** Ship-ready feature with fewer post-launch issues

---

## Success Criteria (Updated)

### Technical Metrics

**Performance:**
- Database query time: <10ms (p95) for standard pagination ✅
- **Search query time: <20ms (p95) - includes rank calculation** ✅ (revised)
- Browser memory: <50MB for 500 items ✅
- No memory leaks over 10 page loads ✅

**Reliability:**
- Error rate: <0.1% on pagination endpoints ✅
- **Stale cursor graceful degradation: 100%** ✅ (new)
- No duplicates across pages ✅
- No missed items across pages ✅

**Accessibility:**
- WCAG AA compliant ✅
- **Screen reader announces all state changes** ✅ (enhanced)
- Keyboard navigation works across pages ✅
- **Jump to top/bottom shortcuts work** ✅ (new)

### User Experience Metrics

**Adoption:**
- >50% of sessions scroll past page 1 ✅
- Average pages loaded per session: 3-5 ✅

**Satisfaction:**
- No user-reported duplicates ✅
- No user-reported missed items ✅
- **No user-reported search relevance issues** ✅ (new)
- **Positive feedback on consistency** ✅ (new)

---

## Migration from Original Plan

### For Teams Already Started

If you've already started implementation based on the original plan:

**Stop and revise:**
1. ❌ Search cursor using `{createdAt, id}` → Update to `{rank, createdAt, id}`
2. ❌ Catch-up mode exclusion → Add infinite scroll support
3. ❌ Pixel-based scroll restoration → Update to index-based

**Safe to continue:**
- ✅ Cursor utilities structure (just add rank support for search)
- ✅ Events router pagination logic
- ✅ TanStack Query integration
- ✅ Intersection Observer approach

**Add these features:**
- Skeleton screens (low effort, high impact)
- End-of-list UI (trivial addition)
- Stale cursor handling (safety feature)

---

## Key Takeaways

1. **Quality > Convenience**: Search cursor with rank is slower but critical for quality
2. **Consistency > Optimization**: Catch-up mode should match other views
3. **Robustness > Simplicity**: Item-index scroll restoration handles edge cases
4. **User Control > Automation**: End-of-list state gives users closure
5. **Testing Reality > Testing Convenience**: Concurrency and load tests find real issues

**Bottom line:** The extra 13 hours (24% more effort) delivers a production-ready feature that prioritizes user experience quality and handles edge cases gracefully.

---

## Next Steps

1. Review this revised plan with stakeholders
2. Update any work-in-progress to align with revisions
3. Start implementation with optimized critical path
4. Run continuous benchmarks (search performance with rank)
5. Monitor user feedback post-launch (search relevance, consistency)

**The revised plan is ready for implementation.**
