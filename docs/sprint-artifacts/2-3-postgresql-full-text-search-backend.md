# Story 2.3: PostgreSQL Full-Text Search Backend

Status: done

## Story

As a **developer**,
I want **PostgreSQL full-text search with GIN indexes**,
so that **search queries return results in <1 second across 10,000+ events**.

## Acceptance Criteria

| AC ID | Criterion |
|-------|-----------|
| 2.3.1 | GIN index created on events table via Prisma migration |
| 2.3.2 | Search returns results in <1s on 10k events |
| 2.3.3 | Results ranked by relevance using `ts_rank` |
| 2.3.4 | Search returns events across all types (Issues, MRs, Comments) |
| 2.3.5 | Seed script creates 10k realistic test events |

## Tasks / Subtasks

- [x] Task 1: Create GIN Index Migration (AC: 2.3.1)
  - [x] 1.1 Create Prisma migration file for FTS index
  - [x] 1.2 Add GIN index on `to_tsvector('english', title || ' ' || COALESCE(body, ''))`
  - [x] 1.3 Run `npx prisma migrate dev` to apply migration
  - [x] 1.4 Verify index exists via `\d events` in psql or Prisma Studio

- [x] Task 2: Implement FTS Query Builder (AC: 2.3.2, 2.3.3, 2.3.4)
  - [x] 2.1 Create `src/lib/search/postgres-fts.ts` module
  - [x] 2.2 Implement `searchEvents()` function using Prisma `$queryRaw`
  - [x] 2.3 Use `plainto_tsquery('english', keyword)` for query parsing
  - [x] 2.4 Use `ts_rank()` for relevance scoring
  - [x] 2.5 Order results by rank DESC, then created_at DESC
  - [x] 2.6 Limit results to 50 by default (configurable)
  - [x] 2.7 Filter by `userId` for user isolation

- [x] Task 3: Create tRPC Search Endpoint (AC: 2.3.2, 2.3.3, 2.3.4)
  - [x] 3.1 Add `events.search` query to `src/server/api/routers/events.ts`
  - [x] 3.2 Define input schema with Zod: `{ keyword: string, limit?: number }`
  - [x] 3.3 Call FTS query builder from router
  - [x] 3.4 Return `{ events: SearchResult[], total: number }`
  - [x] 3.5 Add `highlightedTitle` and `highlightedSnippet` using `ts_headline()`

- [x] Task 4: Create Seed Script for Performance Testing (AC: 2.3.5)
  - [x] 4.1 Create `scripts/seed-events.ts` with realistic event data
  - [x] 4.2 Generate 10,000 events with varied titles and bodies
  - [x] 4.3 Include mix of event types: issue, merge_request, comment
  - [x] 4.4 Add varied keywords for search testing (auth, webhook, api, etc.)
  - [x] 4.5 Associate events with test user

- [x] Task 5: Performance Validation (AC: 2.3.2)
  - [x] 5.1 Run seed script to populate database
  - [x] 5.2 Execute search queries with `console.time/timeEnd`
  - [x] 5.3 Test various keywords and verify <1s response
  - [x] 5.4 Test with empty results (edge case)
  - [x] 5.5 Document performance results in completion notes

- [x] Task 6: Testing (AC: 2.3.1-2.3.5)
  - [x] 6.1 Verify GIN index exists after migration
  - [x] 6.2 Test search returns ranked results
  - [x] 6.3 Test search filters by userId (user isolation)
  - [x] 6.4 Test search across all event types
  - [x] 6.5 Test empty keyword returns error or empty array

## Dev Notes

### Learnings from Previous Story

**From Story 2-2-react-aria-table-with-vim-style-navigation (Status: done)**

- **EventTable Component Created**: `src/components/dashboard/EventTable.tsx` - React Aria Table with j/k navigation available for displaying search results
- **ShortcutContext Enhanced**: Added `setJumpHalfPageDown` and `setJumpHalfPageUp` for Ctrl+d/Ctrl+u navigation
- **Dashboard Unified List**: Dashboard now shows all events in single sorted list (no sections) - ideal for search results display
- **Focus Router Pattern**: Table auto-focuses and selects rows on j/k keypress - will work with search results
- **Auto-scroll Implemented**: Selected row stays in view during navigation
- **Performance Note**: Dev mode has ~150ms lag on keypress - production build should meet <50ms requirement

**Files Created in Story 2.2:**
- `src/components/dashboard/EventTable.tsx` (NEW)

**Files Modified in Story 2.2:**
- `src/app/dashboard/page.tsx` (MODIFIED - uses EventTable)
- `src/components/keyboard/ShortcutContext.tsx` (MODIFIED - Ctrl+d/u handlers)
- `src/components/keyboard/ShortcutHandler.tsx` (MODIFIED - Ctrl+d/u routing)

**Review Outcome**: APPROVED - All 6 ACs verified, no HIGH/MEDIUM issues

[Source: docs/sprint-artifacts/2-2-react-aria-table-with-vim-style-navigation.md#Dev-Agent-Record]

### Architecture Alignment

**PostgreSQL FTS Strategy (ADR-004):**
Per architecture decision ADR-004, this project uses PostgreSQL Full-Text Search instead of Elasticsearch to minimize infrastructure complexity. GIN indexes on tsvector columns enable efficient full-text queries. Migration path to Elasticsearch documented if scale demands it post-MVP.

**FTS Implementation from Tech Spec:**
```sql
CREATE INDEX events_fts_idx ON "event"
USING gin(to_tsvector('english', title || ' ' || COALESCE(body, '')));
```

**Query Pattern from Tech Spec:**
```typescript
const results = await ctx.db.$queryRaw<SearchResult[]>`
  SELECT
    *,
    ts_rank(
      to_tsvector('english', title || ' ' || COALESCE(body, '')),
      plainto_tsquery('english', ${input.keyword})
    ) as rank,
    ts_headline(
      'english', title,
      plainto_tsquery('english', ${input.keyword}),
      'StartSel=<mark>, StopSel=</mark>, MaxWords=50'
    ) as "highlightedTitle",
    ts_headline(
      'english', COALESCE(body, ''),
      plainto_tsquery('english', ${input.keyword}),
      'StartSel=<mark>, StopSel=</mark>, MaxWords=100'
    ) as "highlightedSnippet"
  FROM "event"
  WHERE user_id = ${ctx.session.user.id}
    AND to_tsvector('english', title || ' ' || COALESCE(body, ''))
        @@ plainto_tsquery('english', ${input.keyword})
  ORDER BY rank DESC, created_at DESC
  LIMIT ${input.limit}
`;
```

**Performance Requirements:**
- Search response: <1s on 10k events
- GIN index enables O(log n) FTS queries
- Limit results to 50 items by default

[Source: docs/architecture.md#postgresql-full-text-search-implementation-details]
[Source: docs/sprint-artifacts/tech-spec-epic-2.md#story-23-postgresql-full-text-search-backend]

### Project Structure Notes

**Files to Create:**
```
src/
├── lib/
│   └── search/
│       └── postgres-fts.ts    # FTS query builder
scripts/
└── seed-events.ts             # Performance test data seeder
prisma/
└── migrations/
    └── XXXXXX_add_fts_index/
        └── migration.sql      # GIN index migration
```

**Files to Modify:**
```
src/server/api/routers/events.ts    # Add search query endpoint
```

**Database Schema Context:**
The Event model exists in `prisma/schema.prisma` with fields:
- `id`, `userId`, `type`, `title`, `body`, `author`, `project`, `projectId`
- `labels`, `gitlabEventId`, `gitlabUrl`, `createdAt`, `updatedAt`

[Source: docs/architecture.md#project-structure]

### Testing Requirements

Per ADR-006 (Minimal Testing for Fast Iteration):
- Focus on unit tests for critical business logic only
- Performance testing via seed script with `console.time/timeEnd`
- Manual validation of search results
- No integration or E2E tests required for MVP

**Critical Test Scenarios:**
1. Search returns matching events ranked by relevance
2. Search returns <1s on 10k events (performance assertion)
3. Empty keyword returns empty array
4. User isolation: search only returns current user's events

[Source: docs/architecture.md#testing-strategy]

### Security Considerations

- **SQL Injection Prevention**: Use Prisma's `$queryRaw` with tagged template literals for parameterized queries
- **User Isolation**: All queries must filter by `ctx.session.user.id`
- **XSS in Highlights**: `ts_headline` output will be sanitized in Story 2.5 (highlighting story)

[Source: docs/sprint-artifacts/tech-spec-epic-2.md#security]

### References

- [Epic 2 Tech Spec - Story 2.3](docs/sprint-artifacts/tech-spec-epic-2.md#story-23-postgresql-full-text-search-backend)
- [Epic 2 Story Breakdown - Story 2.3](docs/epics/epic-2-user-controlled-queries-with-keyboard-foundation-story-breakdown.md#story-23-postgresql-full-text-search-backend)
- [Architecture - ADR-004 PostgreSQL FTS](docs/architecture.md#adr-004-postgresql-full-text-search-for-mvp)
- [Architecture - PostgreSQL FTS Implementation](docs/architecture.md#postgresql-full-text-search-implementation-details)
- [Architecture - Testing Strategy (ADR-006)](docs/architecture.md#testing-strategy)
- [Previous Story - 2.2 React Aria Table](docs/sprint-artifacts/2-2-react-aria-table-with-vim-style-navigation.md)
- [PostgreSQL Full-Text Search Documentation](https://www.postgresql.org/docs/current/textsearch.html)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/2-3-postgresql-full-text-search-backend.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- GIN index migration created: `prisma/migrations/20251125143604_add_fts_index/migration.sql`
- Verified index exists via psql: `events_fts_idx` on Event table using GIN

### Completion Notes List

**Performance Results (AC: 2.3.2):**
- Tested with 23,938 total events in database (10,000+ seeded)
- All search queries completed in <100ms (well under 1s requirement)
- Sample results:
  - "authentication": 79ms, 50 results
  - "webhook": 49ms, 50 results
  - "database": 76ms, 50 results
  - "api": 98ms, 50 results
  - Empty results ("xyznonexistent"): 5ms

**Ranking Verification (AC: 2.3.3):**
- Results correctly ordered by ts_rank DESC
- First result rank >= second result rank verified

**Event Type Diversity (AC: 2.3.4):**
- Search results include all event types: issue, merge_request, comment
- Verified with "api" search: 40 comments, 37 issues, 23 MRs in 100 results

**Highlighting:**
- ts_headline working correctly with `<mark>` tags
- Both title and body snippets highlighted

**Technical Decisions:**
- Used Prisma `$queryRaw` with tagged template literals for SQL injection prevention
- Added `countSearchResults()` helper for future sidebar query counts
- Limit capped at MAX_LIMIT=100 for performance safety

### File List

**Created:**
- `prisma/migrations/20251125143604_add_fts_index/migration.sql` - GIN index migration
- `src/lib/search/postgres-fts.ts` - FTS query builder module with searchEvents() and countSearchResults()
- `scripts/seed-events.ts` - Performance test data seeder (10k events)
- `scripts/test-fts-performance.ts` - Comprehensive FTS performance validation script

**Modified:**
- `src/server/api/routers/events.ts` - Added events.search query endpoint
- `package.json` - Added tsx devDependency and db:seed-events script

## Change Log

**2025-11-25** - Story created by create-story workflow. Status: drafted. Story 2.3 implements PostgreSQL full-text search backend with GIN indexes, building on the React Aria Table foundation from Story 2.2. The search endpoint will power the Search Bar UI in Story 2.4. Next step: Run story-context to generate technical context and mark story ready for development.

**2025-11-25** - Story implementation completed by dev-story workflow. All 6 tasks completed. GIN index migration applied, FTS query builder created, tRPC search endpoint added, 10k events seeded for testing, performance validated (<100ms search times). Status: ready-for-dev → review.

**2025-11-25** - Senior Developer Review (AI) completed. Outcome: APPROVED. All 5 ACs verified, all 27 tasks verified complete. No HIGH/MEDIUM severity issues. Status: review → done.

---

## Senior Developer Review (AI)

### Reviewer
BMad

### Date
2025-11-25

### Outcome
✅ **APPROVE**

**Justification:** All 5 acceptance criteria fully implemented and verified with evidence. All 27 tasks/subtasks verified complete with file:line references. No HIGH or MEDIUM severity issues found. Code quality is excellent with proper architecture, type safety, and security. Performance validated: <100ms searches on 23,938 events (well under 1s requirement). Full compliance with tech spec and architecture decisions.

### Summary
PostgreSQL Full-Text Search implementation is complete and production-ready. The implementation follows architectural patterns defined in ADR-004, uses proper Prisma parameterized queries for SQL injection prevention, implements user isolation correctly, and includes comprehensive performance validation. The code demonstrates good practices including clean module separation, TypeScript type safety, structured logging, and bonus helper functions for future use.

### Key Findings

**No HIGH Severity Issues**

**No MEDIUM Severity Issues**

**LOW Severity Issues:**
- `postgres-fts.ts:14-16`: Uses relative path `"../../../generated/prisma"` instead of `~` alias. Works correctly but inconsistent with project patterns. Non-blocking.
- `SearchResult.total` returns results.length (capped) rather than true total count. Intentional for performance; `countSearchResults()` helper addresses future needs.
- `test-fts-performance.ts` not in npm scripts. Consider adding for convenience.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| 2.3.1 | GIN index created on events table via Prisma migration | ✅ IMPLEMENTED | `prisma/migrations/20251125143604_add_fts_index/migration.sql:7-8` |
| 2.3.2 | Search returns results in <1s on 10k events | ✅ IMPLEMENTED | Completion notes: <100ms on 23,938 events; `scripts/test-fts-performance.ts` validates |
| 2.3.3 | Results ranked by relevance using ts_rank | ✅ IMPLEMENTED | `src/lib/search/postgres-fts.ts:88-91, 108` |
| 2.3.4 | Search returns events across all types | ✅ IMPLEMENTED | No type filter in query; completion notes verify mixed types |
| 2.3.5 | Seed script creates 10k realistic test events | ✅ IMPLEMENTED | `scripts/seed-events.ts:257` - TOTAL_EVENTS = 10000 |

**Summary: 5 of 5 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Create GIN Index Migration | ✅ Complete | ✅ VERIFIED | `prisma/migrations/20251125143604_add_fts_index/migration.sql` |
| Task 2: Implement FTS Query Builder | ✅ Complete | ✅ VERIFIED | `src/lib/search/postgres-fts.ts:62-128` |
| Task 3: Create tRPC Search Endpoint | ✅ Complete | ✅ VERIFIED | `src/server/api/routers/events.ts:289-338` |
| Task 4: Create Seed Script | ✅ Complete | ✅ VERIFIED | `scripts/seed-events.ts` |
| Task 5: Performance Validation | ✅ Complete | ✅ VERIFIED | Completion notes document <100ms results |
| Task 6: Testing | ✅ Complete | ✅ VERIFIED | `scripts/test-fts-performance.ts` validates all scenarios |

**Summary: 27 of 27 completed tasks verified, 0 questionable, 0 falsely marked complete**

### Test Coverage and Gaps

Per ADR-006 (Minimal Testing for Fast Iteration):
- ✅ Performance testing via seed script with timing assertions
- ✅ Manual validation script (`test-fts-performance.ts`) for ranking, diversity, highlighting
- ✅ Input validation via Zod schemas
- No formal unit tests required per architecture decision - appropriate for MVP phase

### Architectural Alignment

| Requirement | Status |
|-------------|--------|
| GIN index on tsvector | ✅ Match |
| plainto_tsquery for parsing | ✅ Match |
| ts_rank for relevance | ✅ Match |
| ts_headline for highlighting | ✅ Match |
| ORDER BY rank DESC, created_at DESC | ✅ Match |
| LIMIT configurable with default 50 | ✅ Match |
| User isolation via userId | ✅ Match |
| SQL injection prevention | ✅ Match (Prisma tagged template) |

**Full compliance with tech spec and ADR-004**

### Security Notes

| Concern | Assessment |
|---------|------------|
| SQL Injection | ✅ SECURE - Prisma `$queryRaw` with tagged template literals |
| User Isolation | ✅ SECURE - All queries filter by ctx.session.user.id |
| Input Validation | ✅ SECURE - Zod validates keyword (1-100 chars) and limit (1-100) |
| XSS in Highlights | ⚠️ Deferred to Story 2.5 as planned |

### Best-Practices and References

- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Prisma Raw Queries](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries)
- [tRPC Error Handling](https://trpc.io/docs/server/error-handling)

### Action Items

**Advisory Notes:**
- Note: Consider adding npm script `"test:fts": "tsx scripts/test-fts-performance.ts"` for convenience (no action required)
- Note: `postgres-fts.ts` uses relative imports instead of `~` alias - works correctly, stylistic only
- Note: XSS sanitization for highlights planned for Story 2.5 - track to ensure it's completed
