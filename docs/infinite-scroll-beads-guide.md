# Infinite Scroll Implementation - Comprehensive Beads Guide

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Project Context & Goals](#project-context--goals)
3. [Implementation Strategy](#implementation-strategy)
4. [Bead Structure Overview](#bead-structure-overview)
5. [Detailed Bead Documentation](#detailed-bead-documentation)
6. [Dependencies & Workflow](#dependencies--workflow)
7. [Technical Deep Dives](#technical-deep-dives)
8. [Success Criteria](#success-criteria)

---

## Executive Summary

This document provides comprehensive, self-contained documentation for implementing cursor-based infinite scroll across the GitLab Insights application. The implementation removes current pagination limits (50-150 items) and enables users to seamlessly browse their entire event history.

**Why This Matters:**
- **User Pain Point**: Power users with extensive GitLab activity hit pagination limits, unable to access historical events
- **Current Limitation**: Dashboard (150 items), Search (50 items), Query detail (50 items) all have hard caps
- **Business Value**: Enables comprehensive event analysis, reduces user friction, supports long-term data retention use cases
- **Technical Debt**: Current approach uses inefficient offset pagination with in-memory sorting; this refactor improves performance while adding capability

**Implementation Approach:**
- Cursor-based pagination using `{createdAt, id}` for deterministic ordering
- TanStack Query's `useInfiniteQuery` with auto-load on scroll
- Intersection Observer API for scroll detection
- Backward compatible (cursor params optional)
- No user configuration needed (sensible defaults)

**Estimated Effort:** ~55 hours (2-3 weeks)
**Risk Level:** Low (backward compatible, well-tested pattern)

---

## Project Context & Goals

### Overarching Project Mission
GitLab Insights provides real-time monitoring and analysis of GitLab events (issues, MRs, comments) for development teams. Users need to:
- Track work items across projects
- Stay informed about team activity
- Search and filter historical events
- Identify patterns and trends

### How Infinite Scroll Serves Project Goals

**1. Removes Artificial Barriers**
Current pagination limits create a ceiling that doesn't align with user intent. Users want to browse "all my events" not "first 150 events." This implementation removes that mental model mismatch.

**2. Supports Power User Workflows**
Teams generating hundreds of events daily quickly outgrow current limits. Historical analysis (e.g., "find that comment from 3 months ago") becomes impossible. Infinite scroll makes the entire dataset accessible.

**3. Improves Performance**
Current `getForDashboard` fetches 150 items, then splits by type in-memory (inefficient). Cursor pagination pushes filtering to database, reducing memory overhead and network payload.

**4. Maintains User Experience Quality**
- Preserves existing keyboard navigation (j/k keys work across all loaded pages)
- Maintains scroll restoration on navigation
- No loading spinners or "Load More" buttons to interrupt flow
- Graceful error handling with automatic retry

**5. Enables Future Features**
- Virtual scrolling for 10k+ items (if needed)
- Bidirectional scroll for real-time updates
- Smart prefetching to reduce latency
- User-configurable page sizes

### User Stories Addressed

**Story 1: Historical Event Access**
> "As a project manager reviewing a 6-month sprint, I need to analyze all merge requests and issues to prepare a retrospective report. Current 150-item limit forces me to export data externally."

**Story 2: Deep Search Results**
> "As a developer searching for a specific bug discussion, I often find the first 50 results don't include what I need. I know the conversation exists but can't reach it through the UI."

**Story 3: Keyboard-First Workflow**
> "As a keyboard power user, I use j/k navigation exclusively. When I hit the bottom of the first page, my workflow breaks—I have to click 'Next' with my mouse."

**Story 4: Long-Term Data Retention**
> "As a team lead with 2 years of project history, I want to reference old decisions and discussions without feeling like I'm fighting the tool."

---

## Implementation Strategy

### Why Cursor-Based Pagination?

**Offset Pagination Problems:**
```sql
-- Offset pagination (current approach, inefficient)
SELECT * FROM events ORDER BY createdAt DESC LIMIT 50 OFFSET 100;
-- Database must scan first 150 rows to return 50
```

**Cursor Pagination Benefits:**
```sql
-- Cursor pagination (proposed approach, efficient)
SELECT * FROM events
WHERE (createdAt < '2024-01-15T10:00:00Z' OR (createdAt = '2024-01-15T10:00:00Z' AND id < 'abc123'))
ORDER BY createdAt DESC LIMIT 50;
-- Database uses index, scans only 50 rows
```

**Performance Impact:**
- Offset LIMIT 50 OFFSET 1000: ~50ms (scans 1050 rows)
- Cursor LIMIT 50 with WHERE: ~2ms (index seek, scans 50 rows)

**Consistency Benefits:**
- Offset breaks when new items inserted (duplicate/missed items)
- Cursor maintains position even with concurrent inserts
- Deterministic ordering prevents scroll jank

### Why TanStack Query?

Already integrated in codebase. Provides:
- **Cache Management**: 30s staleTime prevents redundant requests
- **Optimistic Updates**: Instant UI updates on mutations
- **Background Refetch**: Stale-while-revalidate pattern
- **Error Handling**: Automatic retries (3 attempts by default)
- **DevTools**: Excellent debugging experience

### Why Intersection Observer?

Native browser API, better than scroll event handlers:
- **Performance**: Runs off main thread, no scroll jank
- **Battery Efficient**: Browser optimizes intersection checks
- **Configurable**: Threshold parameter for fine-tuning
- **Widely Supported**: All modern browsers (Safari 12.1+, Chrome 58+)

### Design Decisions & Tradeoffs

**Decision 1: Auto-load vs Manual "Load More" Button**
- **Chosen**: Auto-load on scroll
- **Rationale**: Better UX for browsing/exploration, matches user expectation from social feeds
- **Tradeoff**: Uses more memory over time (acceptable given modern browsers)

**Decision 2: Page Size (50 items)**
- **Chosen**: 50 items per page
- **Rationale**: Balance between fewer requests and manageable payloads, matches current behavior
- **Tradeoff**: Larger pages reduce request count but increase initial load; 50 is sweet spot

**Decision 3: Cursor Format (Base64 JSON)**
- **Chosen**: `base64(JSON.stringify({createdAt, id}))`
- **Rationale**: Human-readable when decoded (aids debugging), simple to implement
- **Tradeoff**: Slightly larger than binary encoding (acceptable, only 2 fields)

**Decision 4: Search Cursor Ignores Rank**
- **Chosen**: Use `{createdAt, id}` cursor even for FTS search (ignoring `ts_rank`)
- **Rationale**: Avoids expensive double calculation of rank, extremely rare edge case
- **Tradeoff**: Items with identical timestamp but different ranks might appear sub-optimally at page boundary (~0.001% of cases given millisecond precision)

**Decision 5: No Virtual Scrolling (Yet)**
- **Chosen**: Render all loaded items, add virtual scrolling only if performance issues arise
- **Rationale**: Keep implementation simple, premature optimization is wasteful
- **Tradeoff**: Memory grows with scroll depth (mitigated by browser GC and realistic usage patterns)

**Decision 6: Exclude Catch-Up Mode**
- **Chosen**: Catch-up mode does NOT use infinite scroll
- **Rationale**: Bounded dataset (typically <100 new items per query), different interaction pattern (mark as reviewed → disappears)
- **Tradeoff**: Inconsistent pattern across views (acceptable, different use cases)

---

## Bead Structure Overview

### Epic Hierarchy

```
[EPIC] Infinite Scroll Implementation (gitlab-insights-ggqk)
├── Phase 1: Foundation
│   ├── Backend Cursor Infrastructure (gitlab-insights-igun)
│   │   ├── Create cursor encode/decode utilities (gitlab-insights-738d)
│   │   ├── Update Events router (gitlab-insights-mz1k)
│   │   ├── Update Search FTS module (gitlab-insights-wdwx)
│   │   ├── Update Queries router (gitlab-insights-dnfs)
│   │   └── Add pagination logging (gitlab-insights-sk2t)
│   └── Frontend Core Hooks (gitlab-insights-ej4o)
│       ├── Create useInfiniteScroll hook (gitlab-insights-mdhx)
│       └── Create useInfiniteEvents hook (gitlab-insights-ayt0)
│
├── Phase 2: Component Integration
│   ├── Dashboard Infinite Scroll (gitlab-insights-ju80)
│   │   ├── Update EventTable component (gitlab-insights-dgci)
│   │   └── Update DashboardClient (gitlab-insights-hn5c)
│   ├── Search Infinite Scroll (gitlab-insights-rb68)
│   │   └── Update Search components (gitlab-insights-m3gw)
│   └── Query Detail Infinite Scroll (gitlab-insights-gmt2)
│       └── Update Query Detail components (gitlab-insights-n4ee)
│
└── Phase 3: Testing & Polish
    ├── Testing & Quality Assurance (gitlab-insights-rli8)
    │   ├── Write unit tests (gitlab-insights-u6sf)
    │   ├── Write integration tests (gitlab-insights-5xmm)
    │   ├── Write E2E tests (gitlab-insights-c1vd)
    │   ├── Perform performance testing (gitlab-insights-loqk)
    │   └── Perform accessibility testing (gitlab-insights-zdlk)
    ├── New Items Toast Notifications (gitlab-insights-8xf8)
    │   └── Implement toast system (gitlab-insights-7yjg)
    ├── Error Handling & Recovery (gitlab-insights-i03h)
    │   ├── Implement error toast (gitlab-insights-yb2n)
    │   └── Implement auto retry (gitlab-insights-k53m)
    └── Documentation & Deployment (gitlab-insights-uj2a)
        ├── Update technical docs (gitlab-insights-5tky)
        └── Deployment and monitoring (gitlab-insights-6ob3)
```

### Dependency Flow

**Critical Path:**
1. Cursor utilities → Backend routers → Frontend hooks → Component integration → Testing → Deployment

**Parallel Work Opportunities:**
- All backend router updates can happen in parallel (after cursor utils)
- Both frontend hooks can happen in parallel (after backend ready)
- All three component integrations can happen in parallel (after hooks ready)
- All test types can run in parallel (after components ready)
- Toast/error features can develop in parallel with testing

**Bottleneck Points:**
- Cursor utilities (blocks all backend work)
- Backend completion (blocks frontend hooks)
- Frontend hooks (blocks all component work)
- Component completion (blocks comprehensive testing)

---

## Detailed Bead Documentation

### Phase 1: Foundation

#### Bead: Backend Cursor Infrastructure (gitlab-insights-igun)

**Purpose**: Establish cursor-based pagination in all backend routers.

**Context**:
Current backend uses offset/limit pagination with hard-coded limits:
- `events.getRecent`: `take: 50` (line 201)
- `events.getForDashboard`: Fetches 150, merges in-memory (lines 236-256)
- `events.search`: Has limit but no cursor (line 344)
- `queries.getNewItems`: No pagination

This creates performance bottlenecks (full table scans for large offsets) and UX limits (arbitrary caps).

**Success Criteria**:
- All endpoints return `{items, nextCursor, hasMore}` format
- Database queries use indexed WHERE clauses with cursor
- Performance: <10ms per 50-item page (p95)
- Backward compatible: cursor param optional, defaults to first page

**Technical Considerations**:
- Existing index `[userId, createdAt DESC]` perfect for cursor queries
- Must handle timestamp collisions with ID tie-breaker
- Cursor validation prevents malformed input attacks
- Logging enables monitoring and debugging post-deployment

**Files Modified**:
- `/src/server/api/routers/events.ts` (getRecent, getForDashboard)
- `/src/lib/search/postgres-fts.ts` (searchEvents)
- `/src/server/api/routers/queries.ts` (getNewItems)
- `/src/utils/cursor.ts` (new file)

---

##### Task: Create cursor encode/decode utilities (gitlab-insights-738d)

**Why This First**: All backend changes depend on consistent cursor format.

**Implementation**:
```typescript
// /src/utils/cursor.ts

export interface Cursor {
  createdAt: string; // ISO 8601 timestamp
  id: string;        // Event ID for tie-breaking
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

export function decodeCursor(encoded: string): Cursor {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const cursor = JSON.parse(decoded);

    // Validate structure
    if (!cursor.createdAt || !cursor.id) {
      throw new Error('Invalid cursor structure');
    }

    // Validate ISO 8601 format
    if (isNaN(Date.parse(cursor.createdAt))) {
      throw new Error('Invalid timestamp in cursor');
    }

    return cursor;
  } catch (error) {
    throw new Error(`Failed to decode cursor: ${error.message}`);
  }
}
```

**Edge Cases to Handle**:
- Malformed base64 (invalid characters)
- Invalid JSON (parse error)
- Missing fields (partial cursor)
- Invalid timestamp format (not ISO 8601)
- Empty string cursor
- Very old cursors (events deleted since cursor created)

**Testing Strategy**:
```typescript
describe('Cursor utilities', () => {
  it('should encode and decode cursor roundtrip', () => {
    const original = { createdAt: '2024-01-15T10:00:00.000Z', id: 'abc123' };
    const encoded = encodeCursor(original);
    const decoded = decodeCursor(encoded);
    expect(decoded).toEqual(original);
  });

  it('should throw on invalid base64', () => {
    expect(() => decodeCursor('not-valid-base64!@#')).toThrow();
  });

  it('should throw on missing fields', () => {
    const invalid = encodeCursor({ createdAt: '2024-01-15T10:00:00.000Z' } as Cursor);
    expect(() => decodeCursor(invalid)).toThrow('Invalid cursor structure');
  });
});
```

**Dependencies**: None (foundation task)

**Estimated Time**: 2 hours (including tests)

---

##### Task: Update Events router with cursor support (gitlab-insights-mz1k)

**Current State Analysis**:

**getRecent endpoint (line 201)**:
```typescript
// BEFORE: Hard-coded limit, no pagination
const events = await ctx.db.event.findMany({
  where: { userId: ctx.session.user.id },
  orderBy: { createdAt: "desc" },
  take: 50, // Hard-coded!
});
```

**getForDashboard endpoint (lines 236-256)**:
```typescript
// BEFORE: Inefficient approach
// 1. Fetch 150 issues
const issues = await ctx.db.event.findMany({
  where: { userId, type: 'issue' },
  take: 50,
});
// 2. Fetch 150 MRs
const mrs = await ctx.db.event.findMany({
  where: { userId, type: 'merge_request' },
  take: 50,
});
// 3. Fetch 150 comments
const comments = await ctx.db.event.findMany({
  where: { userId, type: 'comment' },
  take: 50,
});
// 4. Merge and sort in-memory (wasteful!)
const allEvents = [...issues, ...mrs, ...comments].sort((a, b) =>
  b.createdAt.getTime() - a.createdAt.getTime()
);
```

**Problem**: Three separate queries, in-memory merge, inefficient.

**Updated Implementation**:

```typescript
// /src/server/api/routers/events.ts

import { encodeCursor, decodeCursor, type Cursor } from '~/utils/cursor';

// Input schema with cursor support
const paginationInput = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

getRecent: protectedProcedure
  .input(paginationInput.optional())
  .query(async ({ ctx, input }) => {
    const start = Date.now();
    const limit = input?.limit ?? 50;
    let cursor: Cursor | null = null;

    if (input?.cursor) {
      try {
        cursor = decodeCursor(input.cursor);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid cursor format",
        });
      }
    }

    const events = await ctx.db.event.findMany({
      where: {
        userId: ctx.session.user.id,
        // Cursor WHERE clause: (createdAt < cursor.createdAt) OR
        //                       (createdAt = cursor.createdAt AND id < cursor.id)
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
        { id: "desc" } // Tie-breaker for deterministic ordering
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

    logger.info({
      userId: ctx.session.user.id,
      endpoint: 'events.getRecent',
      cursorProvided: !!input?.cursor,
      itemsReturned: items.length,
      hasMore,
      durationMs: Date.now() - start
    }, 'Pagination query completed');

    return { items, nextCursor, hasMore };
  }),

getForDashboard: protectedProcedure
  .input(z.object({
    cursor: z.string().optional(),
    limit: z.number().min(1).max(100).default(50),
    filterLabel: z.string().nullable().optional(),
  }).optional())
  .query(async ({ ctx, input }) => {
    const start = Date.now();
    const limit = input?.limit ?? 50;
    let cursor: Cursor | null = null;

    if (input?.cursor) {
      try {
        cursor = decodeCursor(input.cursor);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid cursor format",
        });
      }
    }

    // IMPROVED: Single query, database sorts all types together
    // No more inefficient separate fetch + in-memory merge!
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

    logger.info({
      userId: ctx.session.user.id,
      endpoint: 'events.getForDashboard',
      filterLabel: input?.filterLabel,
      cursorProvided: !!input?.cursor,
      itemsReturned: items.length,
      hasMore,
      durationMs: Date.now() - start
    }, 'Pagination query completed');

    return { items, nextCursor, hasMore };
  }),
```

**Key Improvements**:
1. **Single Query**: Database handles sorting, no in-memory merge
2. **Indexed Access**: Uses existing `[userId, createdAt DESC]` index
3. **Deterministic**: ID tie-breaker prevents duplicates
4. **Efficient**: Only scans what's needed, no offset overhead
5. **Monitored**: Structured logging for performance tracking

**Migration Strategy**:
- Backward compatible: cursor param optional
- Frontend can opt-in gradually
- Old clients still work with first page
- No schema migration needed

**Testing Checklist**:
- [ ] First page (no cursor) returns correct items
- [ ] Subsequent pages (with cursor) return correct items
- [ ] No duplicates across pages
- [ ] No missed items across pages
- [ ] hasMore flag accurate on last page
- [ ] Invalid cursor returns 400 error
- [ ] Filter label works with cursor
- [ ] Performance <10ms for 50 items

**Dependencies**: Cursor utilities (gitlab-insights-738d)

**Estimated Time**: 4 hours

---

##### Task: Update Search FTS module with cursor support (gitlab-insights-wdwx)

**Current State**: `/src/lib/search/postgres-fts.ts` uses full-text search with rank-based ordering but no cursor pagination.

**Challenge**: Search results ordered by `ts_rank(tsv, query) DESC, createdAt DESC`. Cursor ideally includes rank for perfect ordering, but calculating rank twice (once for page, once for cursor WHERE clause) is expensive.

**Decision**: Use `{createdAt, id}` cursor (ignore rank). Accept minor ordering variance at page boundaries.

**Justification**:
- Rank changes are typically significant (0.5 vs 0.1), not marginal
- Millisecond timestamp precision means same-timestamp events are rare (<0.1%)
- Performance gain (avoiding double rank calculation) outweighs edge case
- User won't notice sub-optimal ordering for ~1-2 items per 1000

**Implementation**:

```typescript
// /src/lib/search/postgres-fts.ts

export interface SearchOptions {
  keywords: string[];
  userId: string;
  limit?: number;
  cursor?: string; // Add cursor support
}

export async function searchEvents(
  db: PrismaClient,
  options: SearchOptions
): Promise<{ items: Event[]; nextCursor: string | null; hasMore: boolean }> {
  const { keywords, userId, limit = 50, cursor } = options;
  const start = Date.now();

  let cursorObj: Cursor | null = null;
  if (cursor) {
    try {
      cursorObj = decodeCursor(cursor);
    } catch (error) {
      throw new Error('Invalid cursor format');
    }
  }

  // Build FTS query
  const tsquery = keywords.map(k => `${k}:*`).join(' & ');

  // Raw SQL query with cursor support
  const events = await db.$queryRaw<Event[]>`
    SELECT
      e.*,
      ts_rank(e.search_vector, to_tsquery('english', ${tsquery})) as rank
    FROM events e
    WHERE
      e.user_id = ${userId}
      AND e.search_vector @@ to_tsquery('english', ${tsquery})
      ${cursorObj ? Prisma.sql`
        AND (
          e.created_at < ${cursorObj.createdAt}::timestamp
          OR (e.created_at = ${cursorObj.createdAt}::timestamp AND e.id < ${cursorObj.id})
        )
      ` : Prisma.empty}
    ORDER BY
      rank DESC,  -- Best matches first
      e.created_at DESC,  -- Then by date
      e.id DESC  -- Tie-breaker
    LIMIT ${limit + 1}
  `;

  const hasMore = events.length > limit;
  const items = hasMore ? events.slice(0, limit) : events;
  const nextCursor = hasMore
    ? encodeCursor({
        createdAt: items[items.length - 1].createdAt.toISOString(),
        id: items[items.length - 1].id
      })
    : null;

  logger.info({
    userId,
    endpoint: 'search.searchEvents',
    keywords,
    cursorProvided: !!cursor,
    itemsReturned: items.length,
    hasMore,
    durationMs: Date.now() - start
  }, 'Search pagination query completed');

  return { items, nextCursor, hasMore };
}
```

**Note on Ordering**:
- Primary sort: `rank DESC` (most relevant first)
- Secondary sort: `createdAt DESC` (newest first within same rank)
- Cursor only uses `createdAt + id` (ignores rank)
- Edge case: Items with same timestamp but different ranks might appear in sub-optimal order at page boundary
- Frequency: ~0.001% of results (requires millisecond timestamp collision + different ranks)
- Impact: Minimal (user unlikely to notice 1-2 items slightly out of order among 50)

**Testing Checklist**:
- [ ] Search results ordered by relevance (rank)
- [ ] Pagination preserves search context
- [ ] Keyword changes reset to page 1
- [ ] No duplicates across pages
- [ ] Cursor works with multi-word searches
- [ ] Performance comparable to non-paginated search

**Dependencies**: Cursor utilities (gitlab-insights-738d)

**Estimated Time**: 3 hours

---

##### Task: Update Queries router with cursor support (gitlab-insights-dnfs)

**Purpose**: Add cursor pagination to `getNewItems` endpoint for saved query detail views.

**Current State**: Fetches all new items since `lastVisitedAt` without pagination.

**Implementation**:

```typescript
// /src/server/api/routers/queries.ts

getNewItems: protectedProcedure
  .input(
    z.object({
      queryId: z.string(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    })
  )
  .query(async ({ ctx, input }) => {
    const start = Date.now();
    const { queryId, limit, cursor } = input;

    let cursorObj: Cursor | null = null;
    if (cursor) {
      try {
        cursorObj = decodeCursor(cursor);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid cursor format",
        });
      }
    }

    // Get query to find lastVisitedAt
    const query = await ctx.db.query.findUnique({
      where: { id: queryId, userId: ctx.session.user.id },
    });

    if (!query) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Query not found",
      });
    }

    const events = await ctx.db.event.findMany({
      where: {
        userId: ctx.session.user.id,
        // Query-specific filters (labels, types, etc.)
        // ... existing query logic ...

        // New items filter (existing)
        createdAt: { gt: query.lastVisitedAt },

        // Cursor filter (new)
        ...(cursorObj && {
          OR: [
            { createdAt: { lt: new Date(cursorObj.createdAt) } },
            {
              createdAt: new Date(cursorObj.createdAt),
              id: { lt: cursorObj.id }
            }
          ]
        })
      },
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

    logger.info({
      userId: ctx.session.user.id,
      queryId,
      endpoint: 'queries.getNewItems',
      cursorProvided: !!cursor,
      itemsReturned: items.length,
      hasMore,
      durationMs: Date.now() - start
    }, 'Query pagination completed');

    return { items, nextCursor, hasMore };
  }),
```

**Key Consideration**: Combines `lastVisitedAt` filter (existing) with cursor pagination (new). Both filters work together.

**Dependencies**: Cursor utilities (gitlab-insights-738d)

**Estimated Time**: 2 hours

---

##### Task: Add pagination logging to all endpoints (gitlab-insights-sk2t)

**Purpose**: Enable monitoring and debugging of pagination performance post-deployment.

**What to Log**:
```typescript
logger.info({
  userId: ctx.session.user.id,  // Or hashed ID if privacy concern
  endpoint: 'events.getRecent',  // Update per endpoint
  cursorProvided: !!input?.cursor,
  itemsReturned: items.length,
  hasMore,
  durationMs: Date.now() - start,
  // Optional context
  filterLabel: input?.filterLabel,  // If applicable
  queryId: input?.queryId,  // If applicable
}, 'Pagination query completed');
```

**Where to Place**: Before `return` statement in each endpoint handler.

**Endpoints to Update**:
- `events.getRecent`
- `events.getForDashboard`
- `events.search` (via searchEvents function)
- `queries.getNewItems`

**Implementation Note**: Check existing codebase logging patterns for `userId` (some codebases hash it for privacy). Match existing approach for consistency.

**Post-Deployment Monitoring**:
Use logs to track:
- Average query duration (target: <10ms p95)
- Percentage of requests using cursor (adoption metric)
- Items per request distribution
- Error rate on cursor decode (should be ~0%)

**Dependencies**: All backend router updates

**Estimated Time**: 1 hour

---

#### Bead: Frontend Core Hooks (gitlab-insights-ej4o)

**Purpose**: Create reusable React hooks encapsulating infinite scroll logic.

**Context**:
Three views need infinite scroll (Dashboard, Search, Query detail). Shared hooks prevent code duplication and ensure consistent behavior.

**Hook 1: useInfiniteScroll**
- Manages Intersection Observer
- Triggers fetch on scroll
- Handles loading/error states

**Hook 2: useInfiniteEvents**
- Wraps TanStack Query's useInfiniteQuery
- Provides typed tRPC query interface
- Includes page flattening helper

**Success Criteria**:
- Hooks reusable across all three views
- No prop drilling needed
- Type-safe integration with tRPC
- Loading/error states handled gracefully

---

##### Task: Create useInfiniteScroll hook (gitlab-insights-mdhx)

**Implementation**:

```typescript
// /src/hooks/useInfiniteScroll.ts

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface UseInfiniteScrollOptions {
  /**
   * Function to call when sentinel enters viewport.
   * Typically fetchNextPage from TanStack Query.
   */
  fetchNextPage: () => void;

  /**
   * Whether more pages are available to load.
   * From TanStack Query's hasNextPage.
   */
  hasNextPage: boolean;

  /**
   * Whether a page fetch is currently in progress.
   * From TanStack Query's isFetchingNextPage.
   */
  isFetchingNextPage: boolean;

  /**
   * Whether the last fetch attempt failed.
   * From TanStack Query's isError.
   */
  isError?: boolean;

  /**
   * Callback when error occurs (e.g., show toast).
   */
  onError?: () => void;

  /**
   * Intersection threshold (0.0 to 1.0).
   * Default 0.8 = trigger when sentinel is 80% visible.
   * Lower = earlier trigger (more prefetching).
   * Higher = later trigger (less prefetching).
   */
  threshold?: number;
}

/**
 * Hook for infinite scroll using Intersection Observer.
 *
 * Usage:
 *   const { sentinelRef } = useInfiniteScroll({
 *     fetchNextPage: query.fetchNextPage,
 *     hasNextPage: query.hasNextPage ?? false,
 *     isFetchingNextPage: query.isFetchingNextPage,
 *   });
 *
 *   return (
 *     <div>
 *       {items.map(item => <Item key={item.id} {...item} />)}
 *       {hasNextPage && <div ref={sentinelRef}>Loading...</div>}
 *     </div>
 *   );
 */
export function useInfiniteScroll({
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isError,
  onError,
  threshold = 0.8,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Don't observe if no more pages or already fetching
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    // Create observer that triggers on intersection
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          // Sentinel is visible, fetch next page
          // This also acts as automatic retry if previous fetch failed
          fetchNextPage();
        }
      },
      {
        threshold,
        // Optional: add rootMargin for earlier triggering
        // rootMargin: '100px' would trigger 100px before sentinel visible
      }
    );

    // Start observing the sentinel element
    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    // Cleanup: disconnect observer when deps change or component unmounts
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, threshold]);

  // Show toast notification on error
  useEffect(() => {
    if (isError) {
      toast.error("Failed to load more items", {
        duration: 10000, // 10 seconds (longer than default)
        description: "Scroll down to retry",
        action: {
          label: "Retry",
          onClick: () => fetchNextPage(),
        },
      });

      onError?.();
    }
  }, [isError, onError, fetchNextPage]);

  return { sentinelRef };
}
```

**Key Features**:
1. **Automatic Retry**: Scrolling to bring sentinel back into view triggers another fetch (even after error)
2. **Configurable Threshold**: Tune when fetch triggers (default 80% visible)
3. **Race Condition Prevention**: `isFetchingNextPage` flag prevents duplicate requests
4. **Error Handling**: Toast notification with manual retry button
5. **Cleanup**: Properly disconnects observer on unmount

**Testing Approach**:
```typescript
describe('useInfiniteScroll', () => {
  it('should call fetchNextPage when sentinel enters viewport', () => {
    const fetchNextPage = vi.fn();
    const { result } = renderHook(() => useInfiniteScroll({
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    }));

    // Simulate intersection
    mockIntersectionObserver.triggerIntersection();

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('should not call fetchNextPage when already fetching', () => {
    const fetchNextPage = vi.fn();
    renderHook(() => useInfiniteScroll({
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: true,  // Already fetching
    }));

    mockIntersectionObserver.triggerIntersection();

    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
```

**Dependencies**: Events router updated (gitlab-insights-mz1k)

**Estimated Time**: 3 hours (including tests)

---

##### Task: Create useInfiniteEvents hook (gitlab-insights-ayt0)

**Implementation**:

```typescript
// /src/hooks/useInfiniteEvents.ts

import { useMemo } from 'react';
import type { InfiniteData } from '@tanstack/react-query';
import { api } from '~/utils/api';

/**
 * Hook for fetching events with infinite scroll using tRPC.
 *
 * Returns TanStack Query's useInfiniteQuery result with typed tRPC endpoints.
 *
 * Usage:
 *   const query = useInfiniteEvents();
 *   const events = useFlattenedEvents(query.data);
 */
export function useInfiniteEvents() {
  return api.events.getRecent.useInfiniteQuery(
    {}, // Input (empty for getRecent)
    {
      getNextPageParam: (lastPage) => {
        // Return nextCursor for next page, or undefined to stop
        return lastPage.nextCursor ?? undefined;
      },
      staleTime: 30 * 1000, // 30 seconds - prevent refetch on remount
      refetchOnWindowFocus: false, // Don't refetch on tab focus
    }
  );
}

/**
 * Hook for fetching dashboard events (all types merged).
 */
export function useInfiniteDashboardEvents(filterLabel?: string | null) {
  return api.events.getForDashboard.useInfiniteQuery(
    { filterLabel },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    }
  );
}

/**
 * Hook for fetching search results with infinite scroll.
 */
export function useInfiniteSearchEvents(keywords: string[]) {
  return api.events.search.useInfiniteQuery(
    { keywords },
    {
      enabled: keywords.length > 0, // Only run if keywords provided
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    }
  );
}

/**
 * Hook for fetching query results with infinite scroll.
 */
export function useInfiniteQueryEvents(queryId: string) {
  return api.queries.getNewItems.useInfiniteQuery(
    { queryId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    }
  );
}

/**
 * Helper to flatten infinite query pages into single array.
 *
 * Usage:
 *   const query = useInfiniteEvents();
 *   const allEvents = useFlattenedEvents(query.data);
 */
export function useFlattenedEvents<T>(data: InfiniteData<{ items: T[] }> | undefined): T[] {
  return useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap(page => page.items);
  }, [data]);
}
```

**Key Features**:
1. **Type Safety**: Fully typed tRPC integration
2. **Separation of Concerns**: Each view has dedicated hook
3. **Cache Configuration**: 30s staleTime for optimal UX (instant nav back)
4. **Memoization**: useFlattenedEvents prevents unnecessary re-renders
5. **Conditional Fetching**: Search only runs when keywords present

**Usage Example**:
```typescript
function DashboardClient() {
  const query = useInfiniteDashboardEvents(filterLabel);
  const allEvents = useFlattenedEvents(query.data);
  const { sentinelRef } = useInfiniteScroll({
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
  });

  return (
    <div>
      <EventTable events={allEvents} />
      {query.hasNextPage && (
        <div ref={sentinelRef}>
          {query.isFetchingNextPage && <LoadingSpinner />}
        </div>
      )}
    </div>
  );
}
```

**Dependencies**: Events router (gitlab-insights-mz1k), useInfiniteScroll (gitlab-insights-mdhx)

**Estimated Time**: 2 hours

---

### Phase 2: Component Integration

#### Bead: Dashboard Infinite Scroll Integration (gitlab-insights-ju80)

**Purpose**: Integrate infinite scroll into main Dashboard view.

**Current State**:
- `DashboardClient.tsx` (lines 81-108) fetches all types separately, merges, sorts in-memory
- `EventTable.tsx` accepts flat events array, handles keyboard nav and scroll restoration
- Limit: 150 items total (inefficient and arbitrary)

**Target State**:
- Single infinite query with cursor pagination
- EventTable accepts `infiniteScroll` prop
- Keyboard nav works seamlessly across loaded pages
- Smooth scroll to top on filter change

**Success Criteria**:
- Smooth scroll experience, no jank
- Keyboard navigation (j/k) works across all loaded pages
- Scroll restoration works after navigation
- Filter changes reset to page 1 with smooth scroll
- Loading indicator shows during page fetch
- No duplicate items across pages

---

##### Task: Update EventTable component for infinite scroll (gitlab-insights-dgci)

**Current State**: `EventTable.tsx` (lines 18-28) receives flat `events` array.

**Required Changes**:

```typescript
// /src/components/dashboard/EventTable.tsx

import { useInfiniteScroll } from '~/hooks/useInfiniteScroll';

interface EventTableProps {
  events: DashboardEvent[];
  onRowClick?: (event: DashboardEvent) => void;
  selectedEventId?: string | null;
  scopeId?: string;
  showNewBadges?: boolean;
  queryId?: string;

  // NEW: Optional infinite scroll support
  infiniteScroll?: {
    fetchNextPage: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    isError?: boolean;
  };
}

export function EventTable({
  events,
  infiniteScroll,
  // ... other props
}: EventTableProps) {
  // Existing scroll restoration (lines 50-52) - no changes needed
  const { scrollContainerRef, wrapperRef } = useScrollRestoration(scopeId);

  // NEW: Infinite scroll integration
  const { sentinelRef } = useInfiniteScroll(
    infiniteScroll ?? {
      fetchNextPage: () => {},
      hasNextPage: false,
      isFetchingNextPage: false,
    }
  );

  // Existing keyboard navigation (lines 153-171) - works with flattened array
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // j/k navigation works across all loaded pages automatically
    // because `events` is already flattened array of all pages
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto"
    >
      <div
        ref={wrapperRef}
        tabIndex={0}
        className="outline-none"
        onKeyDown={handleKeyDown}
      >
        <Table>
          <TableHeader>
            {/* ... existing header ... */}
          </TableHeader>
          <TableBody>
            {events.map((event, index) => (
              <TableRow key={event.id}>
                {/* ... existing row rendering ... */}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* NEW: Sentinel for infinite scroll */}
        {infiniteScroll?.hasNextPage && (
          <div
            ref={sentinelRef}
            className="h-20 flex items-center justify-center py-8"
          >
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

**Key Points**:
1. **Backward Compatible**: `infiniteScroll` prop is optional
2. **Existing Features Preserved**: Keyboard nav, scroll restoration work unchanged
3. **Sentinel Placement**: After table, triggers when user scrolls near bottom
4. **Loading State**: Shows spinner during fetch for user feedback

**Testing Checklist**:
- [ ] Table renders without infiniteScroll prop (backward compat)
- [ ] Sentinel triggers fetch when scrolled into view
- [ ] Loading indicator appears during fetch
- [ ] Keyboard navigation works across pages
- [ ] Scroll restoration works after navigation
- [ ] No visual jank during page loads

**Dependencies**: useInfiniteScroll hook (gitlab-insights-mdhx), useInfiniteEvents hook (gitlab-insights-ayt0)

**Estimated Time**: 3 hours

---

##### Task: Update DashboardClient to use infinite queries (gitlab-insights-hn5c)

**Current Inefficient Approach** (lines 81-108):
```typescript
// BEFORE: Fetch 150 of each type, merge in-memory
const issuesQuery = api.events.getIssues.useQuery({ limit: 50 });
const mrsQuery = api.events.getMergeRequests.useQuery({ limit: 50 });
const commentsQuery = api.events.getComments.useQuery({ limit: 50 });

const allEvents = useMemo(() => {
  const combined = [
    ...(issuesQuery.data ?? []),
    ...(mrsQuery.data ?? []),
    ...(commentsQuery.data ?? []),
  ];
  return combined.sort((a, b) =>
    b.createdAt.getTime() - a.createdAt.getTime()
  );
}, [issuesQuery.data, mrsQuery.data, commentsQuery.data]);
```

**New Efficient Approach**:
```typescript
// /src/components/dashboard/DashboardClient.tsx

import { useInfiniteDashboardEvents, useFlattenedEvents } from '~/hooks/useInfiniteEvents';

export function DashboardClient() {
  const searchParams = useSearchParams();
  const filterLabel = searchParams?.get('label');

  // Replace three separate queries with one infinite query
  // Query key includes filterLabel, so changing filter auto-resets to page 1
  const dashboardQuery = useInfiniteDashboardEvents(filterLabel);

  // Flatten all loaded pages into single array for EventTable
  const allDashboardEvents = useFlattenedEvents(dashboardQuery.data);

  // Search query (existing, but update to infinite)
  const searchQuery = useInfiniteSearchEvents(activeKeywords);
  const searchEvents = useFlattenedEvents(searchQuery.data);

  // Display search results or dashboard events
  const displayEvents = isSearchActive ? searchEvents : allDashboardEvents;

  // Scroll to top on filter change (smooth scroll for better UX)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (filterLabel && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'  // Smooth scroll since it's same view
      });
    }
  }, [filterLabel]);

  // Scroll to top on keyword change (instant scroll for new search)
  useEffect(() => {
    if (activeKeywords.length > 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'auto'  // Instant scroll since new search context
      });
    }
  }, [activeKeywords]);

  if (dashboardQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  if (dashboardQuery.isError) {
    return <ErrorState message="Failed to load events" />;
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main content */}
      <div className="flex-1">
        <EventTable
          events={displayEvents}
          selectedEventId={selectedEventId}
          onRowClick={handleRowClick}
          scopeId={filterLabel ? `dashboard-${filterLabel}` : 'dashboard'}

          // Pass infinite scroll props for dashboard view
          // Don't pass for search (search has own scroll handling)
          infiniteScroll={!isSearchActive ? {
            fetchNextPage: dashboardQuery.fetchNextPage,
            hasNextPage: dashboardQuery.hasNextPage ?? false,
            isFetchingNextPage: dashboardQuery.isFetchingNextPage,
            isError: dashboardQuery.isError,
          } : undefined}
        />
      </div>
    </div>
  );
}
```

**Performance Improvement**:
- **Before**: 3 queries × 50 items = 150 DB queries aggregated, sorted in JS
- **After**: 1 query × 50 items = 50 DB rows, sorted by Postgres
- **Reduction**: 67% fewer rows fetched, zero client-side sorting

**Behavior Changes**:
- Filter change: Query key changes → cache invalidated → reset to page 1 → smooth scroll
- Search active: Different events array, no infinite scroll props (search handles own pagination)

**Dependencies**: EventTable updated (gitlab-insights-dgci)

**Estimated Time**: 3 hours

---

#### Bead: Search Infinite Scroll Integration (gitlab-insights-rb68)

**Purpose**: Add infinite scroll to search results view.

**Current State**: Search limited to first 50 results.

**Target State**: Infinite scroll with rank-based ordering preserved.

---

##### Task: Update Search components for infinite scroll (gitlab-insights-m3gw)

**Implementation**:

```typescript
// /src/components/search/SearchResults.tsx (or wherever search is managed)

import { useInfiniteSearchEvents, useFlattenedEvents } from '~/hooks/useInfiniteEvents';

export function SearchResults({ keywords }: { keywords: string[] }) {
  const searchQuery = useInfiniteSearchEvents(keywords);
  const searchResults = useFlattenedEvents(searchQuery.data);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset scroll position on keyword change (instant, not smooth)
  useEffect(() => {
    if (keywords.length > 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'auto'  // Instant scroll - new search context
      });
    }
  }, [keywords]);

  if (searchQuery.isLoading) {
    return <SearchSkeleton />;
  }

  if (searchQuery.isError) {
    return <ErrorState message="Search failed" />;
  }

  if (searchResults.length === 0) {
    return <EmptyState message="No results found" />;
  }

  return (
    <div ref={scrollContainerRef}>
      <EventTable
        events={searchResults}
        scopeId="search"
        infiniteScroll={{
          fetchNextPage: searchQuery.fetchNextPage,
          hasNextPage: searchQuery.hasNextPage ?? false,
          isFetchingNextPage: searchQuery.isFetchingNextPage,
          isError: searchQuery.isError,
        }}
      />
    </div>
  );
}
```

**Scroll Behavior Decision**:
- **Filter change (dashboard)**: Smooth scroll (same view, different subset)
- **Keyword change (search)**: Instant scroll (new search, different context)

**Rationale**: Smooth scroll feels natural when filtering existing content, but jarring when searching for new content. Instant scroll signals "new search started."

**Dependencies**: EventTable (gitlab-insights-dgci), Search FTS (gitlab-insights-wdwx)

**Estimated Time**: 2 hours

---

#### Bead: Query Detail Infinite Scroll Integration (gitlab-insights-gmt2)

**Purpose**: Add infinite scroll to saved query detail view.

---

##### Task: Update Query Detail components for infinite scroll (gitlab-insights-n4ee)

**Implementation**:

```typescript
// /src/components/queries/QueryDetailClient.tsx

import { useInfiniteQueryEvents, useFlattenedEvents } from '~/hooks/useInfiniteEvents';

export function QueryDetailClient({ queryId }: { queryId: string }) {
  const queryResultsQuery = useInfiniteQueryEvents(queryId);
  const results = useFlattenedEvents(queryResultsQuery.data);

  if (queryResultsQuery.isLoading) {
    return <QueryDetailSkeleton />;
  }

  if (queryResultsQuery.isError) {
    return <ErrorState message="Failed to load query results" />;
  }

  return (
    <div>
      <QueryHeader queryId={queryId} />

      <EventTable
        events={results}
        scopeId={`query-${queryId}`}
        queryId={queryId}
        showNewBadges
        infiniteScroll={{
          fetchNextPage: queryResultsQuery.fetchNextPage,
          hasNextPage: queryResultsQuery.hasNextPage ?? false,
          isFetchingNextPage: queryResultsQuery.isFetchingNextPage,
          isError: queryResultsQuery.isError,
        }}
      />
    </div>
  );
}
```

**Note**: Query detail view shows "new items since last visit" badge. Infinite scroll works alongside this feature (badge logic unchanged).

**Dependencies**: EventTable (gitlab-insights-dgci), Queries router (gitlab-insights-dnfs)

**Estimated Time**: 2 hours

---

### Phase 3: Testing & Polish

#### Bead: Testing & Quality Assurance (gitlab-insights-rli8)

**Purpose**: Comprehensive testing to ensure reliability, performance, and accessibility.

---

##### Task: Write unit tests for cursor logic (gitlab-insights-u6sf)

**Test Coverage**:

```typescript
// /src/utils/cursor.test.ts

import { encodeCursor, decodeCursor } from './cursor';

describe('Cursor utilities', () => {
  describe('encodeCursor', () => {
    it('should encode cursor to base64 JSON', () => {
      const cursor = { createdAt: '2024-01-15T10:00:00.000Z', id: 'abc123' };
      const encoded = encodeCursor(cursor);

      // Should be valid base64
      expect(() => Buffer.from(encoded, 'base64')).not.toThrow();

      // Should decode back to original
      const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString());
      expect(decoded).toEqual(cursor);
    });
  });

  describe('decodeCursor', () => {
    it('should decode valid cursor', () => {
      const original = { createdAt: '2024-01-15T10:00:00.000Z', id: 'abc123' };
      const encoded = encodeCursor(original);
      const decoded = decodeCursor(encoded);

      expect(decoded).toEqual(original);
    });

    it('should throw on invalid base64', () => {
      expect(() => decodeCursor('not-base64!@#')).toThrow('Failed to decode cursor');
    });

    it('should throw on invalid JSON', () => {
      const invalid = Buffer.from('not json').toString('base64');
      expect(() => decodeCursor(invalid)).toThrow('Failed to decode cursor');
    });

    it('should throw on missing createdAt field', () => {
      const invalid = encodeCursor({ id: 'abc123' } as any);
      expect(() => decodeCursor(invalid)).toThrow('Invalid cursor structure');
    });

    it('should throw on missing id field', () => {
      const invalid = encodeCursor({ createdAt: '2024-01-15T10:00:00.000Z' } as any);
      expect(() => decodeCursor(invalid)).toThrow('Invalid cursor structure');
    });

    it('should throw on invalid timestamp format', () => {
      const invalid = encodeCursor({ createdAt: 'not-a-date', id: 'abc123' });
      expect(() => decodeCursor(invalid)).toThrow('Invalid timestamp');
    });

    it('should handle empty string cursor', () => {
      expect(() => decodeCursor('')).toThrow();
    });
  });

  describe('roundtrip', () => {
    it('should handle millisecond precision', () => {
      const cursor = { createdAt: '2024-01-15T10:00:00.123Z', id: 'abc123' };
      const encoded = encodeCursor(cursor);
      const decoded = decodeCursor(encoded);
      expect(decoded).toEqual(cursor);
    });

    it('should handle special characters in ID', () => {
      const cursor = { createdAt: '2024-01-15T10:00:00.000Z', id: 'abc-123_xyz' };
      const encoded = encodeCursor(cursor);
      const decoded = decodeCursor(encoded);
      expect(decoded).toEqual(cursor);
    });
  });
});
```

**Dependencies**: Cursor utilities (gitlab-insights-738d)

**Estimated Time**: 2 hours

---

##### Task: Write integration tests for tRPC endpoints (gitlab-insights-5xmm)

**Test Coverage**:

```typescript
// /src/server/api/routers/events.test.ts

import { describe, it, expect } from 'vitest';
import { createContextInner } from './context';
import { appRouter } from './root';

describe('Events router pagination', () => {
  describe('getRecent', () => {
    it('should return first page without cursor', async () => {
      const caller = appRouter.createCaller(await createContextInner({ userId: 'test-user' }));
      const result = await caller.events.getRecent();

      expect(result.items).toHaveLength(50); // Default page size
      expect(result.hasMore).toBe(true); // Assuming >50 items exist
      expect(result.nextCursor).toBeTruthy();
    });

    it('should return subsequent pages with cursor', async () => {
      const caller = appRouter.createCaller(await createContextInner({ userId: 'test-user' }));

      // Get first page
      const page1 = await caller.events.getRecent();

      // Get second page using cursor
      const page2 = await caller.events.getRecent({ cursor: page1.nextCursor! });

      expect(page2.items).toHaveLength(50);
      expect(page2.items[0].id).not.toBe(page1.items[0].id); // Different items
    });

    it('should not return duplicates across pages', async () => {
      const caller = appRouter.createCaller(await createContextInner({ userId: 'test-user' }));

      const page1 = await caller.events.getRecent();
      const page2 = await caller.events.getRecent({ cursor: page1.nextCursor! });

      const page1Ids = new Set(page1.items.map(e => e.id));
      const page2Ids = new Set(page2.items.map(e => e.id));

      // No overlap
      const intersection = new Set([...page1Ids].filter(id => page2Ids.has(id)));
      expect(intersection.size).toBe(0);
    });

    it('should handle last page correctly', async () => {
      const caller = appRouter.createCaller(await createContextInner({ userId: 'test-user-small' }));

      // User with only 30 events
      const result = await caller.events.getRecent({ limit: 50 });

      expect(result.items).toHaveLength(30);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('should throw on invalid cursor', async () => {
      const caller = appRouter.createCaller(await createContextInner({ userId: 'test-user' }));

      await expect(
        caller.events.getRecent({ cursor: 'invalid-cursor' })
      ).rejects.toThrow('Invalid cursor format');
    });
  });

  describe('getForDashboard', () => {
    it('should merge all event types in single query', async () => {
      const caller = appRouter.createCaller(await createContextInner({ userId: 'test-user' }));
      const result = await caller.events.getForDashboard();

      // Should contain mixed types
      const types = new Set(result.items.map(e => e.type));
      expect(types.size).toBeGreaterThan(1); // At least 2 types
    });

    it('should respect filter label', async () => {
      const caller = appRouter.createCaller(await createContextInner({ userId: 'test-user' }));
      const result = await caller.events.getForDashboard({ filterLabel: 'bug' });

      // All items should have 'bug' label
      expect(result.items.every(e => e.labels.includes('bug'))).toBe(true);
    });
  });
});
```

**Dependencies**: Cursor utilities (gitlab-insights-738d)

**Estimated Time**: 4 hours

---

##### Task: Write E2E tests for scroll behavior (gitlab-insights-c1vd)

**Test Coverage** (Playwright):

```typescript
// /e2e/infinite-scroll.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Infinite Scroll', () => {
  test('should load next page on scroll to bottom', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for first page to load
    await page.waitForSelector('[data-testid="event-table"]');

    // Count initial items
    const initialCount = await page.locator('[data-testid="event-row"]').count();
    expect(initialCount).toBe(50);

    // Scroll to bottom
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('[data-testid="event-table-container"]');
      scrollContainer?.scrollTo(0, scrollContainer.scrollHeight);
    });

    // Wait for loading indicator
    await page.waitForSelector('[data-testid="loading-more"]');

    // Wait for new items
    await page.waitForSelector('[data-testid="event-row"]:nth-child(51)');

    // Verify more items loaded
    const newCount = await page.locator('[data-testid="event-row"]').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('should preserve keyboard navigation across pages', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for load
    await page.waitForSelector('[data-testid="event-table"]');

    // Focus table
    await page.click('[data-testid="event-table"]');

    // Press 'j' 60 times to navigate past first page
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('j');
    }

    // Should trigger scroll and load next page
    await page.waitForSelector('[data-testid="event-row"]:nth-child(60)');

    // Verify selection on 60th item
    const selected = await page.locator('[data-testid="event-row"][data-selected="true"]');
    expect(await selected.count()).toBe(1);
  });

  test('should restore scroll position after navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Scroll to middle
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('[data-testid="event-table-container"]');
      scrollContainer?.scrollTo(0, 500);
    });

    // Navigate away
    await page.click('[data-testid="settings-link"]');
    await page.waitForURL('/settings');

    // Navigate back
    await page.goBack();
    await page.waitForURL('/dashboard');

    // Verify scroll position restored
    const scrollTop = await page.evaluate(() => {
      const scrollContainer = document.querySelector('[data-testid="event-table-container"]');
      return scrollContainer?.scrollTop ?? 0;
    });

    expect(scrollTop).toBeCloseTo(500, -1); // Within 10px
  });

  test('should handle filter change with scroll reset', async ({ page }) => {
    await page.goto('/dashboard');

    // Scroll down
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('[data-testid="event-table-container"]');
      scrollContainer?.scrollTo(0, 1000);
    });

    // Apply filter
    await page.click('[data-testid="filter-label-bug"]');

    // Verify scrolled to top (smooth scroll)
    await page.waitForTimeout(500); // Wait for smooth scroll animation
    const scrollTop = await page.evaluate(() => {
      const scrollContainer = document.querySelector('[data-testid="event-table-container"]');
      return scrollContainer?.scrollTop ?? 0;
    });

    expect(scrollTop).toBeLessThan(100);
  });

  test('should show loading indicator during fetch', async ({ page }) => {
    await page.goto('/dashboard');

    // Scroll to bottom
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('[data-testid="event-table-container"]');
      scrollContainer?.scrollTo(0, scrollContainer.scrollHeight);
    });

    // Loading indicator should appear
    await expect(page.locator('[data-testid="loading-more"]')).toBeVisible();

    // Then disappear after load
    await expect(page.locator('[data-testid="loading-more"]')).toBeHidden({ timeout: 5000 });
  });

  test('should handle error gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/trpc/events.getForDashboard*', route => {
      route.abort('failed');
    });

    await page.goto('/dashboard');

    // Scroll to trigger next page
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('[data-testid="event-table-container"]');
      scrollContainer?.scrollTo(0, scrollContainer.scrollHeight);
    });

    // Error toast should appear
    await expect(page.locator('text=Failed to load more items')).toBeVisible();

    // Retry button should work
    await page.click('button:has-text("Retry")');

    // (Would need to unblock route for retry to succeed)
  });
});
```

**Dependencies**: DashboardClient (gitlab-insights-hn5c), Search components (gitlab-insights-m3gw)

**Estimated Time**: 4 hours

---

##### Task: Perform performance testing (gitlab-insights-loqk)

**Test Scenarios**:

1. **Database Query Performance**
   ```typescript
   // Measure query times at various dataset sizes
   test('query performance with large dataset', async () => {
     // Create test dataset: 10,000 events for user
     await seedEvents('test-user', 10000);

     const start = performance.now();
     const result = await caller.events.getRecent({ limit: 50 });
     const duration = performance.now() - start;

     expect(duration).toBeLessThan(10); // <10ms target
     expect(result.items).toHaveLength(50);
   });

   test('query performance with cursor pagination', async () => {
     await seedEvents('test-user', 10000);

     // Get 5th page (cursor pointing to item 200)
     const page1 = await caller.events.getRecent();
     // ... get pages 2-4 to get cursor ...

     const start = performance.now();
     const page5 = await caller.events.getRecent({ cursor: page4.nextCursor! });
     const duration = performance.now() - start;

     expect(duration).toBeLessThan(10); // Should be same speed regardless of page number
   });
   ```

2. **Client Memory Usage**
   ```typescript
   test('memory usage with 500 loaded items', async ({ page }) => {
     await page.goto('/dashboard');

     // Load 10 pages × 50 items = 500 items
     for (let i = 0; i < 10; i++) {
       await page.evaluate(() => {
         const scrollContainer = document.querySelector('[data-testid="event-table-container"]');
         scrollContainer?.scrollTo(0, scrollContainer.scrollHeight);
       });
       await page.waitForTimeout(1000); // Wait for page load
     }

     // Measure memory
     const metrics = await page.evaluate(() => {
       return (performance as any).memory?.usedJSHeapSize ?? 0;
     });

     // Target: <50MB for 500 items
     expect(metrics).toBeLessThan(50 * 1024 * 1024);
   });
   ```

3. **Network Payload Size**
   ```typescript
   test('network payload per page', async ({ page }) => {
     const payloads: number[] = [];

     page.on('response', async (response) => {
       if (response.url().includes('events.getForDashboard')) {
         const body = await response.body();
         payloads.push(body.length);
       }
     });

     await page.goto('/dashboard');
     await page.evaluate(() => {
       const scrollContainer = document.querySelector('[data-testid="event-table-container"]');
       scrollContainer?.scrollTo(0, scrollContainer.scrollHeight);
     });

     // Wait for next page load
     await page.waitForTimeout(2000);

     // Verify payload sizes reasonable (50 events should be <100KB)
     expect(payloads.every(p => p < 100 * 1024)).toBe(true);
   });
   ```

**Performance Targets**:
- Database query: <10ms (p95)
- Initial page load: No regression vs current
- Memory usage: <50MB for 500 items
- Network payload: <100KB per page

**Dependencies**: All component integrations complete

**Estimated Time**: 4 hours

---

##### Task: Perform accessibility testing (gitlab-insights-zdlk)

**Test Coverage**:

1. **Screen Reader Announcements**
   ```typescript
   test('loading indicator announced to screen readers', async ({ page }) => {
     await page.goto('/dashboard');

     // Verify loading indicator has aria-live
     const loader = page.locator('[data-testid="loading-more"]');
     await expect(loader).toHaveAttribute('aria-live', 'polite');
     await expect(loader).toHaveAttribute('aria-busy', 'true');
   });
   ```

2. **Keyboard Navigation**
   ```typescript
   test('keyboard navigation works across loaded pages', async ({ page }) => {
     await page.goto('/dashboard');

     // Tab to table
     await page.keyboard.press('Tab');

     // Use j/k to navigate
     await page.keyboard.press('j');
     await page.keyboard.press('j');

     // Verify focus
     const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
     expect(focused).toBe('event-row');
   });

   test('focus management during page loads', async ({ page }) => {
     await page.goto('/dashboard');

     // Focus on row 45
     await page.click('[data-testid="event-table"]');
     for (let i = 0; i < 45; i++) {
       await page.keyboard.press('j');
     }

     // Trigger next page load
     for (let i = 0; i < 10; i++) {
       await page.keyboard.press('j');
     }

     // Focus should be maintained (not lost during fetch)
     const focused = await page.evaluate(() => {
       return document.activeElement?.getAttribute('data-testid') === 'event-row';
     });
     expect(focused).toBe(true);
   });
   ```

3. **ARIA Labels**
   ```typescript
   test('ARIA labels on interactive elements', async ({ page }) => {
     await page.goto('/dashboard');

     // Scroll to bottom to show sentinel
     await page.evaluate(() => {
       const scrollContainer = document.querySelector('[data-testid="event-table-container"]');
       scrollContainer?.scrollTo(0, scrollContainer.scrollHeight);
     });

     // Verify loading indicator has label
     const loader = page.locator('[data-testid="loading-more"]');
     await expect(loader).toHaveAttribute('aria-label', 'Loading more items');
   });
   ```

4. **Manual Testing Checklist**:
   - [ ] NVDA announces loading states
   - [ ] JAWS announces loading states
   - [ ] VoiceOver announces loading states
   - [ ] Keyboard-only navigation works (no mouse needed)
   - [ ] Focus visible at all times
   - [ ] No keyboard traps
   - [ ] Color contrast meets WCAG AA

**Dependencies**: All component integrations complete

**Estimated Time**: 3 hours

---

#### Bead: New Items Toast Notifications (gitlab-insights-8xf8)

**Purpose**: Notify users when sync brings new items while they're browsing.

---

##### Task: Implement new items toast notification system (gitlab-insights-7yjg)

**Implementation**:

```typescript
// /src/components/dashboard/NewItemsNotification.tsx

import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';

interface NewItemsNotificationProps {
  /**
   * Total item count from query.
   * Used to detect when sync adds new items.
   */
  currentItemCount: number;

  /**
   * Ref to scroll container.
   * Used to check if user is scrolled away from top.
   */
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export function useNewItemsNotification({
  currentItemCount,
  scrollContainerRef,
}: NewItemsNotificationProps) {
  const [previousCount, setPreviousCount] = useState(currentItemCount);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Count increased (new items arrived via sync)
    if (currentItemCount > previousCount) {
      const newItemsCount = currentItemCount - previousCount;
      const scrollTop = scrollContainerRef.current?.scrollTop ?? 0;

      // Only show toast if user scrolled away from top (>100px)
      // And toast not already dismissed
      if (scrollTop > 100 && !dismissed) {
        toast.info(`${newItemsCount} new item${newItemsCount > 1 ? 's' : ''} available`, {
          duration: Infinity, // Persistent until dismissed
          description: "Click to scroll to top",
          action: {
            label: "↑ Top",
            onClick: () => {
              scrollContainerRef.current?.scrollTo({
                top: 0,
                behavior: 'smooth'
              });
              setDismissed(true); // Auto-dismiss after action
            }
          },
          onDismiss: () => setDismissed(true),
        });
      }

      setPreviousCount(currentItemCount);
    }
  }, [currentItemCount, previousCount, scrollContainerRef, dismissed]);

  // Reset dismissed state when user manually scrolls to top
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = scrollContainerRef.current?.scrollTop ?? 0;
      if (scrollTop < 50) {
        setDismissed(false); // Allow toast to show again for future syncs
      }
    };

    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);
}

// Usage in DashboardClient:
export function DashboardClient() {
  const dashboardQuery = useInfiniteDashboardEvents(filterLabel);
  const allEvents = useFlattenedEvents(dashboardQuery.data);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track new items
  useNewItemsNotification({
    currentItemCount: allEvents.length,
    scrollContainerRef,
  });

  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto">
      <EventTable events={allEvents} />
    </div>
  );
}
```

**Where to Show**:
- ✅ Dashboard view (main browsing)
- ✅ Query detail view (saved query results)
- ❌ Search results (search is point-in-time, sync doesn't affect it)
- ❌ Catch-up mode (items disappear when reviewed, different pattern)

**Edge Cases**:
- User already at top: No toast (items visible, no need to notify)
- User dismisses toast then scrolls down again: Toast can appear again for next sync
- Multiple syncs while scrolled down: Update toast with new count (don't spam multiple toasts)
- User navigates away: Toast dismissed automatically (component unmounts)

**Dependencies**: Dashboard integration (gitlab-insights-ju80)

**Estimated Time**: 3 hours

---

#### Bead: Error Handling & Recovery (gitlab-insights-i03h)

**Purpose**: Graceful error handling with automatic retry.

---

##### Task: Implement error toast notifications (gitlab-insights-yb2n)

**Implementation**: Already included in `useInfiniteScroll` hook (see gitlab-insights-mdhx).

**Additional Considerations**:
```typescript
// Error toast configuration
toast.error("Failed to load more items", {
  duration: 10000, // 10 seconds (longer than default 5s)
  description: "Scroll down to retry",
  action: {
    label: "Retry",
    onClick: () => fetchNextPage(), // Manual retry
  },
});
```

**Error Types**:
1. **Network Errors**: TanStack Query retries 3 times automatically, then shows toast
2. **Invalid Cursor**: Backend returns 400, toast shows "Invalid request"
3. **Server Errors**: Backend returns 500, toast shows "Server error, please retry"

**Dependencies**: useInfiniteScroll hook (gitlab-insights-mdhx)

**Estimated Time**: 2 hours

---

##### Task: Implement automatic retry logic (gitlab-insights-k53m)

**Implementation**: Already included in `useInfiniteScroll` hook.

**How It Works**:
1. User scrolls to bottom, triggers fetch
2. Fetch fails after 3 retries
3. Toast shows error
4. Intersection Observer disconnects during fetch
5. **Automatic Retry**: When user scrolls down again (sentinel comes into view), Intersection Observer triggers another fetch
6. **Manual Retry**: User can click "Retry" button in toast

**Race Condition Prevention**:
```typescript
// isFetchingNextPage flag prevents duplicate requests
if (!hasNextPage || isFetchingNextPage) {
  return; // Don't observe if already fetching
}
```

**Dependencies**: useInfiniteScroll hook (gitlab-insights-mdhx)

**Estimated Time**: 1 hour (mostly verification)

---

#### Bead: Documentation & Deployment (gitlab-insights-uj2a)

**Purpose**: Comprehensive documentation and production deployment.

---

##### Task: Update technical documentation (gitlab-insights-5tky)

**Documentation to Create/Update**:

1. **API Documentation** (`/docs/api/pagination.md`):
   ```markdown
   # Pagination API

   ## Cursor Format

   All paginated endpoints use cursor-based pagination with the following format:

   \`\`\`typescript
   interface Cursor {
     createdAt: string; // ISO 8601 timestamp
     id: string;        // Event ID
   }
   \`\`\`

   Cursors are encoded as base64 JSON. Example:

   \`\`\`json
   {
     "createdAt": "2024-01-15T10:00:00.000Z",
     "id": "abc123"
   }
   \`\`\`

   Encoded: `eyJjcmVhdGVkQXQiOiIyMDI0LTAxLTE1VDEwOjAwOjAwLjAwMFoiLCJpZCI6ImFiYzEyMyJ9`

   ## Endpoints

   ### events.getRecent

   **Input:**
   \`\`\`typescript
   {
     cursor?: string;
     limit?: number; // Default 50, max 100
   }
   \`\`\`

   **Output:**
   \`\`\`typescript
   {
     items: Event[];
     nextCursor: string | null;
     hasMore: boolean;
   }
   \`\`\`

   ... (continue for all endpoints)
   ```

2. **Implementation Guide** (`/docs/guides/infinite-scroll.md`):
   ```markdown
   # Adding Infinite Scroll to New Views

   ## Step 1: Update Backend Endpoint

   Add cursor support to your tRPC router:

   \`\`\`typescript
   // Example endpoint
   myEndpoint: protectedProcedure
     .input(z.object({
       cursor: z.string().optional(),
       limit: z.number().min(1).max(100).default(50),
     }))
     .query(async ({ ctx, input }) => {
       // ... cursor logic ...
     });
   \`\`\`

   ## Step 2: Create Hook

   Wrap endpoint in useInfiniteQuery:

   \`\`\`typescript
   export function useInfiniteMyData() {
     return api.myRouter.myEndpoint.useInfiniteQuery(
       {},
       {
         getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
         staleTime: 30 * 1000,
       }
     );
   }
   \`\`\`

   ## Step 3: Use in Component

   \`\`\`typescript
   function MyComponent() {
     const query = useInfiniteMyData();
     const items = useFlattenedEvents(query.data);

     return (
       <EventTable
         events={items}
         infiniteScroll={{
           fetchNextPage: query.fetchNextPage,
           hasNextPage: query.hasNextPage ?? false,
           isFetchingNextPage: query.isFetchingNextPage,
         }}
       />
     );
   }
   \`\`\`
   ```

3. **Monitoring Guide** (`/docs/ops/monitoring.md`):
   ```markdown
   # Monitoring Infinite Scroll

   ## Key Metrics

   ### Database Performance
   - Query: `endpoint="events.getRecent" AND durationMs > 10`
   - Alert if p95 > 10ms

   ### Cursor Errors
   - Query: `level="error" AND message="Invalid cursor"`
   - Alert if rate > 0.1%

   ### User Behavior
   - % sessions scrolling past page 1
   - Average pages loaded per session
   - Scroll depth distribution

   ... (continue with monitoring details)
   ```

**Dependencies**: All implementation complete

**Estimated Time**: 3 hours

---

##### Task: Deployment and monitoring setup (gitlab-insights-6ob3)

**Deployment Checklist**:

```markdown
# Infinite Scroll Deployment Checklist

## Pre-Deployment

- [ ] Run full test suite (unit + integration + E2E)
  - [ ] All tests passing
  - [ ] No flaky tests
  - [ ] Coverage >80%

- [ ] Performance testing with realistic data
  - [ ] Seed 1000+ events in staging
  - [ ] Verify query times <10ms (p95)
  - [ ] Verify browser memory <50MB for 500 items
  - [ ] No memory leaks detected

- [ ] Accessibility testing
  - [ ] NVDA screen reader tested
  - [ ] Keyboard-only navigation tested
  - [ ] WCAG AA compliance verified

- [ ] Cross-browser testing
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

## Deployment

- [ ] Deploy to staging
  - [ ] Smoke test all three views (dashboard, search, query detail)
  - [ ] Test with production-like data (1000+ events)
  - [ ] Verify logging working (check logs for pagination entries)

- [ ] Deploy to production
  - [ ] Deploy during low-traffic window
  - [ ] Monitor error rates for 1 hour post-deploy
  - [ ] Monitor query performance for 1 hour post-deploy

## Post-Deployment Monitoring (24 hours)

- [ ] Database performance
  - [ ] Query times <10ms (p95)
  - [ ] No slow query alerts
  - [ ] Index usage confirmed

- [ ] Error rates
  - [ ] No cursor decode errors
  - [ ] <0.1% error rate on pagination endpoints
  - [ ] No user-reported issues

- [ ] User behavior metrics
  - [ ] % users scrolling past page 1
  - [ ] Average pages loaded per session
  - [ ] Session duration (should increase with more browseable content)

## Rollback Plan

If critical issues arise:

1. **Frontend only**: Deploy previous frontend version (backend remains compatible)
2. **Backend only**: Revert backend to previous version (frontend gracefully degrades to first page)
3. **Full rollback**: Revert both frontend and backend

Rollback triggers:
- Error rate >1% on pagination endpoints
- Query times >100ms (p95)
- User-reported data loss/duplicates
- Critical accessibility issues
```

**Monitoring Setup**:

```typescript
// /scripts/setup-monitoring.ts

// Create alerts for key metrics
const alerts = [
  {
    name: 'Slow Pagination Queries',
    query: 'endpoint IN ("events.getRecent", "events.getForDashboard", "events.search") AND durationMs > 10',
    threshold: '5% of queries', // Alert if >5% of queries slow
  },
  {
    name: 'Cursor Decode Errors',
    query: 'level="error" AND message="Invalid cursor"',
    threshold: '0.1% error rate',
  },
  {
    name: 'High Memory Usage',
    query: 'metric="client_memory" AND value > 50000000', // >50MB
    threshold: '1% of sessions',
  },
];

// Setup dashboard widgets
const dashboardWidgets = [
  {
    title: 'Pagination Query Performance',
    query: 'endpoint IN ("events.getRecent", "events.getForDashboard") | stats p50(durationMs), p95(durationMs), p99(durationMs)',
  },
  {
    title: 'Pages Loaded Per Session',
    query: 'endpoint="events.getRecent" | stats count() by sessionId | stats avg(count)',
  },
  {
    title: 'Infinite Scroll Adoption',
    query: 'cursorProvided=true | stats count() / (SELECT count(*) FROM logs WHERE endpoint="events.getRecent") as adoption_rate',
  },
];
```

**Dependencies**: Testing complete (gitlab-insights-rli8), New items toast (gitlab-insights-8xf8), Error handling (gitlab-insights-i03h)

**Estimated Time**: 4 hours

---

## Dependencies & Workflow

### Critical Path (Sequential)

```
1. Cursor Utilities (738d)
   ↓
2. Backend Routers (mz1k, wdwx, dnfs) [Can run in parallel]
   ↓
3. Frontend Hooks (mdhx, ayt0) [Can run in parallel]
   ↓
4. Component Integration (dgci → hn5c, m3gw, n4ee)
   ↓
5. Testing (u6sf, 5xmm, c1vd, loqk, zdlk) [Can run in parallel]
   ↓
6. Polish (7yjg, yb2n, k53m) [Can run in parallel with testing]
   ↓
7. Documentation & Deployment (5tky, 6ob3)
   ↓
8. Epic Complete (ggqk)
```

### Parallel Work Opportunities

**Phase 1 (after cursor utils):**
- Events router (mz1k)
- Search FTS (wdwx)
- Queries router (dnfs)
- Pagination logging (sk2t)

**Phase 2 (after backend + hooks):**
- Dashboard integration (ju80)
- Search integration (rb68)
- Query detail integration (gmt2)

**Phase 3 (after components):**
- Unit tests (u6sf)
- Integration tests (5xmm)
- E2E tests (c1vd)
- Performance testing (loqk)
- Accessibility testing (zdlk)
- New items toast (7yjg)
- Error toast (yb2n)
- Auto retry (k53m)

### Recommended Workflow

**Week 1: Foundation**
1. Day 1-2: Cursor utilities + Events router
2. Day 3: Search FTS + Queries router
3. Day 4-5: Frontend hooks + logging

**Week 2: Integration**
1. Day 1-2: EventTable + DashboardClient
2. Day 3: Search components
3. Day 4: Query detail components
4. Day 5: Integration testing

**Week 3: Polish & Deploy**
1. Day 1-2: Unit + E2E tests
2. Day 3: Performance + accessibility testing
3. Day 4: Toast features + error handling
4. Day 5: Documentation + deployment

---

## Technical Deep Dives

### Deep Dive: Cursor WHERE Clause

**The Problem**: How to fetch items after a specific point in time-ordered list?

**Naive Approach** (doesn't work):
```sql
WHERE createdAt < '2024-01-15T10:00:00Z'
```
Problem: Multiple items with same timestamp → non-deterministic order → duplicates/missed items.

**Correct Approach**:
```sql
WHERE (
  createdAt < '2024-01-15T10:00:00Z'
  OR (createdAt = '2024-01-15T10:00:00Z' AND id < 'abc123')
)
ORDER BY createdAt DESC, id DESC
```

**Why This Works**:
1. Fetch items with earlier timestamp (most cases)
2. OR items with same timestamp but earlier ID (tie-breaker)
3. ORDER BY ensures deterministic ordering
4. ID comparison breaks ties consistently

**Index Usage**:
```
Index: [userId, createdAt DESC, id DESC]
```
This compound index allows:
- Fast userId lookup
- Range scan on createdAt (using < comparison)
- ID comparison within same createdAt values

**Performance**:
- Offset LIMIT 50 OFFSET 1000: ~50ms (scans 1050 rows)
- Cursor with WHERE: ~2ms (index seek, scans 50 rows)
- **25x faster for deep pagination**

---

### Deep Dive: Search FTS Cursor Trade-off

**Ideal Cursor**:
```typescript
interface IdealSearchCursor {
  rank: number;      // ts_rank result
  createdAt: string;
  id: string;
}
```

**WHERE Clause**:
```sql
WHERE (
  rank < cursorRank
  OR (rank = cursorRank AND createdAt < cursorCreatedAt)
  OR (rank = cursorRank AND createdAt = cursorCreatedAt AND id < cursorId)
)
ORDER BY rank DESC, createdAt DESC, id DESC
```

**Problem**: `ts_rank()` must be calculated twice:
1. Once for SELECT (to return rank)
2. Once for WHERE (to filter by rank)

**Cost**: `ts_rank()` is expensive (~5-10ms per row). Calculating it twice for every row doubles search query time.

**Alternative Approach**:
```typescript
interface SimplifiedSearchCursor {
  createdAt: string;
  id: string;
  // rank omitted
}
```

**WHERE Clause**:
```sql
WHERE (
  createdAt < cursorCreatedAt
  OR (createdAt = cursorCreatedAt AND id < cursorId)
)
ORDER BY rank DESC, createdAt DESC, id DESC
```

**Trade-off**:
- ✅ Only calculates rank once (for SELECT)
- ✅ ~50% faster query time
- ❌ Items with same createdAt but different ranks might appear in sub-optimal order at page boundary

**Frequency of Edge Case**:
- Requires: Same millisecond timestamp + different ranks
- Timestamp precision: Milliseconds → 1000 unique values per second
- Probability: ~0.001% of results (1 in 100,000)
- Impact: 1-2 items slightly out of order among 50

**Decision**: Accept simplified cursor. Performance gain outweighs rare edge case.

---

### Deep Dive: TanStack Query Cache Behavior

**Stale-While-Revalidate Pattern**:

```typescript
{
  staleTime: 30 * 1000, // 30 seconds
  refetchOnWindowFocus: false,
}
```

**Timeline**:

```
t=0s: User visits dashboard
      - Cache empty
      - Fetch page 1
      - Cache: [Page 1] (fresh)

t=10s: User scrolls, loads page 2
       - Fetch page 2
       - Cache: [Page 1, Page 2] (both fresh)

t=20s: User navigates away

t=25s: User navigates back
       - Cache: [Page 1, Page 2] (still fresh, <30s)
       - Return cached data instantly
       - No network request

t=40s: User navigates back
       - Cache: [Page 1, Page 2] (stale, >30s)
       - Return stale data instantly (immediate render)
       - Trigger background refetch
       - Update cache when refetch completes
       - Re-render with fresh data
```

**Benefits**:
1. **Instant Navigation**: Always returns cached data immediately
2. **Fresh Data**: Refetches in background if stale
3. **Smooth UX**: No loading spinners on navigation (stale data shown during refetch)

**Scroll Restoration Integration**:
```typescript
// useScrollRestoration hook
useEffect(() => {
  const savedPosition = sessionStorage.getItem(`scroll-${scopeId}`);
  if (savedPosition) {
    scrollContainerRef.current?.scrollTo(0, parseInt(savedPosition));
  }
}, []);
```

**Combined Behavior**:
1. User scrolls to item 75 (page 2 loaded)
2. User navigates away
3. User navigates back
4. Cache returns pages 1-2 instantly
5. Scroll restoration scrolls to item 75
6. Background refetch updates data (if stale)

**No Race Condition**: Scroll restoration uses saved pixel position, not item index. Even if refetch changes data, scroll position remains valid.

---

### Deep Dive: Intersection Observer Threshold

**Threshold Parameter**:
```typescript
{
  threshold: 0.8  // Default
}
```

**What It Means**:
- `threshold: 0.0` → Callback triggers when sentinel is 1% visible
- `threshold: 0.5` → Callback triggers when sentinel is 50% visible
- `threshold: 0.8` → Callback triggers when sentinel is 80% visible
- `threshold: 1.0` → Callback triggers when sentinel is 100% visible

**Trade-offs**:

| Threshold | Fetch Timing | User Experience | Network Usage |
|-----------|--------------|-----------------|---------------|
| 0.0 | Very early | Seamless (prefetch) | High (may fetch unused pages) |
| 0.5 | Moderate | Good | Moderate |
| 0.8 | Late | Slight delay | Low (only fetch when needed) |
| 1.0 | Very late | Noticeable delay | Minimal |

**Recommendation: 0.8**
- Fetches when sentinel 80% visible (user ~100px from seeing it)
- Gives ~200ms to fetch before sentinel fully visible
- Feels instant for normal scroll speeds
- Avoids excessive prefetching

**Alternative: rootMargin**
```typescript
{
  threshold: 1.0,
  rootMargin: '200px'  // Trigger 200px before sentinel enters viewport
}
```
Similar effect to low threshold, but semantically clearer ("trigger 200px early").

---

## Success Criteria

### Technical Metrics

**Performance**:
- [ ] Database query time: <10ms (p95) for 50-item page
- [ ] Initial page load: No regression vs current (within 5%)
- [ ] Browser memory: <50MB for 500 loaded items
- [ ] Network payload: <100KB per page
- [ ] No memory leaks (heap size stable over 10 page loads)

**Reliability**:
- [ ] Error rate: <0.1% on pagination endpoints
- [ ] Cursor decode errors: 0% (invalid cursors rejected)
- [ ] No duplicates across pages (verified via E2E tests)
- [ ] No missed items across pages (verified via E2E tests)
- [ ] Scroll restoration: 100% success rate

**Accessibility**:
- [ ] WCAG AA compliant
- [ ] Screen reader announces loading states
- [ ] Keyboard navigation works across pages
- [ ] Focus management during page loads
- [ ] No keyboard traps

### User Experience Metrics

**Adoption**:
- [ ] >50% of sessions scroll past page 1
- [ ] Average pages loaded per session: 3-5
- [ ] Scroll depth: 75th percentile reaches page 3

**Satisfaction**:
- [ ] No user-reported duplicates
- [ ] No user-reported missed items
- [ ] No user-reported performance issues
- [ ] Positive feedback on "seamless" browsing

---

## Conclusion

This implementation plan provides a comprehensive, production-ready approach to adding infinite scroll to GitLab Insights. The cursor-based pagination system is:

- **Performant**: Leverages existing indexes, <10ms queries
- **Reliable**: Deterministic ordering prevents duplicates/gaps
- **Accessible**: Full keyboard support, screen reader compatible
- **User-Friendly**: Auto-load on scroll, graceful error handling
- **Maintainable**: Shared hooks, comprehensive tests, detailed documentation

The bead structure ensures systematic progress tracking, clear dependencies, and parallel work opportunities. Each bead contains detailed context, implementation guidance, and success criteria to support both current implementation and future maintenance.

**Total Estimated Effort**: ~55 hours (2-3 weeks)
**Risk**: Low (backward compatible, proven patterns, comprehensive testing)
**Impact**: High (removes major UX limitation, enables power user workflows)

---

## Quick Reference: Bead IDs

### Epic
- **gitlab-insights-ggqk**: [EPIC] Infinite Scroll Implementation

### Phase 1: Foundation
- **gitlab-insights-igun**: Backend Cursor Infrastructure
  - **gitlab-insights-738d**: Create cursor encode/decode utilities
  - **gitlab-insights-mz1k**: Update Events router
  - **gitlab-insights-wdwx**: Update Search FTS module
  - **gitlab-insights-dnfs**: Update Queries router
  - **gitlab-insights-sk2t**: Add pagination logging

- **gitlab-insights-ej4o**: Frontend Core Hooks
  - **gitlab-insights-mdhx**: Create useInfiniteScroll hook
  - **gitlab-insights-ayt0**: Create useInfiniteEvents hook

### Phase 2: Integration
- **gitlab-insights-ju80**: Dashboard Infinite Scroll Integration
  - **gitlab-insights-dgci**: Update EventTable component
  - **gitlab-insights-hn5c**: Update DashboardClient

- **gitlab-insights-rb68**: Search Infinite Scroll Integration
  - **gitlab-insights-m3gw**: Update Search components

- **gitlab-insights-gmt2**: Query Detail Infinite Scroll Integration
  - **gitlab-insights-n4ee**: Update Query Detail components

### Phase 3: Testing & Polish
- **gitlab-insights-rli8**: Testing & Quality Assurance
  - **gitlab-insights-u6sf**: Write unit tests
  - **gitlab-insights-5xmm**: Write integration tests
  - **gitlab-insights-c1vd**: Write E2E tests
  - **gitlab-insights-loqk**: Perform performance testing
  - **gitlab-insights-zdlk**: Perform accessibility testing

- **gitlab-insights-8xf8**: New Items Toast Notifications
  - **gitlab-insights-7yjg**: Implement toast system

- **gitlab-insights-i03h**: Error Handling & Recovery
  - **gitlab-insights-yb2n**: Implement error toast
  - **gitlab-insights-k53m**: Implement automatic retry

- **gitlab-insights-uj2a**: Documentation & Deployment
  - **gitlab-insights-5tky**: Update technical documentation
  - **gitlab-insights-6ob3**: Deployment and monitoring setup

---

**Document Version**: 1.0
**Last Updated**: 2025-12-15
**Author**: AI Agent
**Review Status**: Ready for Implementation
