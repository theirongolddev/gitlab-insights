# Story 2.3: PostgreSQL Full-Text Search Backend

Status: ready-for-dev

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

- [ ] Task 1: Create GIN Index Migration (AC: 2.3.1)
  - [ ] 1.1 Create Prisma migration file for FTS index
  - [ ] 1.2 Add GIN index on `to_tsvector('english', title || ' ' || COALESCE(body, ''))`
  - [ ] 1.3 Run `npx prisma migrate dev` to apply migration
  - [ ] 1.4 Verify index exists via `\d events` in psql or Prisma Studio

- [ ] Task 2: Implement FTS Query Builder (AC: 2.3.2, 2.3.3, 2.3.4)
  - [ ] 2.1 Create `src/lib/search/postgres-fts.ts` module
  - [ ] 2.2 Implement `searchEvents()` function using Prisma `$queryRaw`
  - [ ] 2.3 Use `plainto_tsquery('english', keyword)` for query parsing
  - [ ] 2.4 Use `ts_rank()` for relevance scoring
  - [ ] 2.5 Order results by rank DESC, then created_at DESC
  - [ ] 2.6 Limit results to 50 by default (configurable)
  - [ ] 2.7 Filter by `userId` for user isolation

- [ ] Task 3: Create tRPC Search Endpoint (AC: 2.3.2, 2.3.3, 2.3.4)
  - [ ] 3.1 Add `events.search` query to `src/server/api/routers/events.ts`
  - [ ] 3.2 Define input schema with Zod: `{ keyword: string, limit?: number }`
  - [ ] 3.3 Call FTS query builder from router
  - [ ] 3.4 Return `{ events: SearchResult[], total: number }`
  - [ ] 3.5 Add `highlightedTitle` and `highlightedSnippet` using `ts_headline()`

- [ ] Task 4: Create Seed Script for Performance Testing (AC: 2.3.5)
  - [ ] 4.1 Create `scripts/seed-events.ts` with realistic event data
  - [ ] 4.2 Generate 10,000 events with varied titles and bodies
  - [ ] 4.3 Include mix of event types: issue, merge_request, comment
  - [ ] 4.4 Add varied keywords for search testing (auth, webhook, api, etc.)
  - [ ] 4.5 Associate events with test user

- [ ] Task 5: Performance Validation (AC: 2.3.2)
  - [ ] 5.1 Run seed script to populate database
  - [ ] 5.2 Execute search queries with `console.time/timeEnd`
  - [ ] 5.3 Test various keywords and verify <1s response
  - [ ] 5.4 Test with empty results (edge case)
  - [ ] 5.5 Document performance results in completion notes

- [ ] Task 6: Testing (AC: 2.3.1-2.3.5)
  - [ ] 6.1 Verify GIN index exists after migration
  - [ ] 6.2 Test search returns ranked results
  - [ ] 6.3 Test search filters by userId (user isolation)
  - [ ] 6.4 Test search across all event types
  - [ ] 6.5 Test empty keyword returns error or empty array

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

**2025-11-25** - Story created by create-story workflow. Status: drafted. Story 2.3 implements PostgreSQL full-text search backend with GIN indexes, building on the React Aria Table foundation from Story 2.2. The search endpoint will power the Search Bar UI in Story 2.4. Next step: Run story-context to generate technical context and mark story ready for development.
