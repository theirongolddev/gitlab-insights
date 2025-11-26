# Story 3.1: Catch-Up Mode Backend - "New Since Last Visit" Logic

Status: ready-for-dev

## Story

As a **user with saved queries**,
I want **the system to track when I last viewed each query**,
so that **I can see only new items since my last visit**.

## Acceptance Criteria

| AC ID | Criterion |
|-------|-----------|
| 3.1.1 | UserQuery Prisma model includes `last_visited_at` field (TIMESTAMP, nullable, defaults to NOW) |
| 3.1.2 | Prisma migration successfully adds `last_visited_at` column to database |
| 3.1.3 | tRPC query `queries.getNewItems({ queryId })` returns events created after `last_visited_at` |
| 3.1.4 | When user has never visited a query, `getNewItems` returns all matching events |
| 3.1.5 | When user visited query 1 second ago, `getNewItems` returns empty array |
| 3.1.6 | Timestamps stored in UTC in database, displayed in user's local timezone |
| 3.1.7 | `getNewItems` response includes: queryId, queryName, newCount, events array |
| 3.1.8 | Query filters combined with "new since" filter using AND logic |

## Tasks / Subtasks

- [ ] Task 1: Remove Unused Field and Add Correct Field to Prisma Schema (AC: 3.1.1)
  - [ ] 1.1 Open `prisma/schema.prisma`
  - [ ] 1.2 Locate `UserQuery` model definition (line 94-107)
  - [ ] 1.3 Remove existing unused field: `lastViewedAt DateTime?` (line 99)
  - [ ] 1.4 Add new field: `lastVisitedAt DateTime? @default(now()) @map("last_visited_at")`
  - [ ] 1.5 Note: @map directive ensures snake_case in PostgreSQL DB, camelCase in Prisma Client
  - [ ] 1.6 Field is nullable (?) to support NULL for "never visited" test scenarios
  - [ ] 1.7 Default to current timestamp for new queries
  - [ ] 1.8 Review schema changes with team patterns

- [ ] Task 2: Create and Run Database Migration (AC: 3.1.2)
  - [ ] 2.1 Run: `npx prisma migrate dev --name replace_lastViewedAt_with_last_visited_at`
  - [ ] 2.2 Verify migration file created in `prisma/migrations/`
  - [ ] 2.3 Review generated SQL includes both operations:
    - `ALTER TABLE "UserQuery" DROP COLUMN "lastViewedAt"`
    - `ALTER TABLE "UserQuery" ADD COLUMN "last_visited_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP`
  - [ ] 2.4 Verify migration applies successfully to local database
  - [ ] 2.5 Run: `npx prisma generate` to update Prisma Client types
  - [ ] 2.6 Verify TypeScript recognizes new field as `lastVisitedAt` (camelCase in code)
  - [ ] 2.7 Note: No data loss - existing field was unused

- [ ] Task 3: Implement `queries.getNewItems` tRPC Query (AC: 3.1.3-3.1.5, 3.1.7-3.1.8)
  - [ ] 3.1 Open `src/server/api/routers/queries.ts`
  - [ ] 3.2 Add new query procedure: `getNewItems`
  - [ ] 3.3 Import Zod for input validation: `import { z } from "zod"`
  - [ ] 3.4 Define input schema: `z.object({ queryId: z.string() })`
  - [ ] 3.5 Use `protectedProcedure` to ensure authentication
  - [ ] 3.6 Fetch query from database: `ctx.db.userQuery.findUnique({ where: { id: input.queryId } })`
  - [ ] 3.7 Authorization check: Verify `query.userId === ctx.session.user.id`, throw FORBIDDEN if not
  - [ ] 3.8 Handle query not found: Throw NOT_FOUND TRPCError if query doesn't exist
  - [ ] 3.9 Determine lastVisited: `const lastVisited = query.lastVisitedAt || new Date(0)` (epoch = never visited, note camelCase)
  - [ ] 3.10 Build filter WHERE clause inline using FTS pattern from `queries.list` (lines 94-99)
  - [ ] 3.11 Extract keywords from filters: `const filters = query.filters as QueryFilters; const searchTerms = filters.keywords.join(" ");`
  - [ ] 3.12 Build FTS WHERE condition: `to_tsvector('english', title || ' ' || COALESCE(body, '')) @@ plainto_tsquery('english', ${searchTerms})`
  - [ ] 3.13 Combine with date filter: `AND "createdAt" > ${lastVisited}`
  - [ ] 3.14 Query events using raw SQL (like queries.list pattern): `ctx.db.$queryRaw<Event[]>`
  - [ ] 3.15 Return response object: `{ queryId: query.id, queryName: query.name, newCount: events.length, events }`
  - [ ] 3.16 Verify TypeScript types align with expected response shape

- [ ] Task 4: Handle Timezone Correctly (AC: 3.1.6)
  - [ ] 4.1 Verify Prisma stores `DateTime` fields as UTC (default behavior)
  - [ ] 4.2 Ensure `last_visited_at` column type is `TIMESTAMP(3)` with timezone
  - [ ] 4.3 Backend always works in UTC (no timezone conversion in queries)
  - [ ] 4.4 Frontend receives ISO 8601 UTC strings from tRPC
  - [ ] 4.5 Note: Frontend will handle timezone conversion for display (defer to Story 3.2)
  - [ ] 4.6 Validate: Compare timestamps in database (UTC) vs API response (UTC ISO string)

- [ ] Task 5: Testing and Validation (AC: All)
  - [ ] 5.1 Run `npm run typecheck` to verify no TypeScript errors
  - [ ] 5.2 Run `npm run build` to verify build succeeds
  - [ ] 5.3 Test: Create new query → verify `last_visited_at` defaults to current time
  - [ ] 5.4 Test: Call `getNewItems` on never-visited query → returns all matching events (AC 3.1.4)
  - [ ] 5.5 Test: Call `getNewItems` immediately after visiting → returns empty array (AC 3.1.5)
  - [ ] 5.6 Test: Create event matching query → call `getNewItems` → verify event in response
  - [ ] 5.7 Test: Verify response shape matches AC 3.1.7 (queryId, queryName, newCount, events)
  - [ ] 5.8 Test: Authorization - attempt to access another user's query → verify FORBIDDEN error
  - [ ] 5.9 Test: Invalid queryId → verify NOT_FOUND error
  - [ ] 5.10 Manual: Verify timestamps in database are UTC
  - [ ] 5.11 Test: Verify existing queries (pre-migration) get default timestamp after migration

- [ ] Task 6: Create Test Setup Route for Manual Validation (Testing Support)
  - [ ] 6.1 Open `src/server/api/routers/queries.ts`
  - [ ] 6.2 Add `testSetup` tRPC mutation (protectedProcedure)
  - [ ] 6.3 Input schema: `z.object({ action: z.enum(["nullLastVisited"]), queryId: z.string() })`
  - [ ] 6.4 Implement action "nullLastVisited": Sets `lastVisitedAt` to NULL for testing AC 3.1.4
  - [ ] 6.5 Include authorization check (userId matching)
  - [ ] 6.6 Document in code comment: "TEST ONLY - Remove before production deployment"
  - [ ] 6.7 Add to manual test workflow: Use testSetup to NULL timestamp, then verify getNewItems returns all events

## Dev Notes

### Learnings from Previous Story

**From Story 2.10 (Edit/Delete Query Actions):**
- **tRPC Mutation Patterns**: Use `protectedProcedure` with authorization checks (userId matching)
- **Error Handling**: Throw TRPCError with specific codes (FORBIDDEN, NOT_FOUND)
- **Cache Invalidation**: Invalidate queries after mutations to refresh UI data
- **Toast Notifications Deferred**: Console logging acceptable for MVP, toast system planned for future
- **React Aria Components**: Dialog pattern works well for confirmations
- **Context-Aware Components**: Header component can detect current route via pathname matching
- **Testing Standards**: Build + typecheck required, manual testing for UI flows

**Key Files from Story 2.10:**
- `src/server/api/routers/queries.ts` - tRPC router with mutations (will add getNewItems query here)
- `src/app/queries/[id]/page.tsx` - Query page (will consume getNewItems in Story 3.2)
- Prisma schema already has UserQuery model (will extend with last_visited_at)

**Patterns to Reuse:**
- Authorization pattern: `if (query.userId !== ctx.session.user.id) throw new TRPCError({ code: 'FORBIDDEN' })`
- Query existence check: `if (!query) throw new TRPCError({ code: 'NOT_FOUND' })`
- Zod input validation: `z.object({ queryId: z.string() })`

**Review Findings Applied:**
- Proper AC validation is critical (all 8 ACs must be fully met)
- TypeScript safety enforced (typecheck + build must pass)
- User-facing error messages deferred (console.error acceptable for backend-only story)

### Architecture Decisions

**Database Schema:**
```prisma
model UserQuery {
  // ... existing fields ...
  last_visited_at DateTime? @default(now())
}
```

**Rationale:**
- Nullable (`?`) to handle existing queries without breaking changes
- Default `now()` for new queries (user hasn't visited yet, but timestamp exists)
- `DateTime` type maps to PostgreSQL `TIMESTAMP(3)` with millisecond precision

**Backend Query Logic:**
```typescript
export const queriesRouter = createTRPCRouter({
  getNewItems: protectedProcedure
    .input(z.object({ queryId: z.string() }))
    .query(async ({ ctx, input }) => {
      // 1. Fetch query and authorize
      const query = await ctx.db.userQuery.findUnique({
        where: { id: input.queryId },
      });

      if (!query || query.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // 2. Determine last visited (epoch if never visited)
      const lastVisited = query.last_visited_at || new Date(0);

      // 3. Build filter WHERE clause (reuse existing helper)
      const filterWhere = buildFilterWhereClause(query.filters);

      // 4. Query events: filters AND new since last visit
      const newEvents = await ctx.db.event.findMany({
        where: {
          AND: [
            filterWhere,
            { createdAt: { gt: lastVisited } }
          ]
        },
        orderBy: { createdAt: 'desc' },
      });

      // 5. Return response
      return {
        queryId: query.id,
        queryName: query.name,
        newCount: newEvents.length,
        events: newEvents,
      };
    }),
});
```

**Timezone Handling:**
- **Database**: PostgreSQL stores TIMESTAMP(3) in UTC (Prisma default)
- **Backend**: All DateTime operations in UTC, no conversion
- **API Response**: ISO 8601 UTC strings (e.g., "2025-11-26T10:30:00.000Z")
- **Frontend**: Converts to local timezone for display (Story 3.2)

**Filter Combination Logic:**
- Use AND logic to combine user's saved filters with "new since" filter
- Example: `label:security AND createdAt > 2025-11-25T08:00:00Z`
- Reuse `buildFilterWhereClause()` helper from Story 2.6 (Filter UI Logic)

### Project Structure Alignment

**Files Modified:**
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add `last_visited_at` field to UserQuery model |
| `src/server/api/routers/queries.ts` | Add `getNewItems` query procedure |

**Files Created:**
| File | Description |
|------|-------------|
| `prisma/migrations/{timestamp}_add_last_visited_at/migration.sql` | Database migration adding column |

**No Frontend Changes:**
This story is backend-only. Frontend consumption happens in Story 3.2 (Catch-Up Mode View).

### Prerequisites

**Required Before This Story:**
- ✅ Story 2.7a (Create Query Backend) - UserQuery model exists
- ✅ Story 2.6 (Filter UI Logic) - `buildFilterWhereClause()` helper exists
- ✅ Story 1.2 (Database Schema) - Prisma setup complete

**This Story Enables:**
- Story 3.2 (Catch-Up Mode View) - will call `getNewItems` to display new items
- Story 3.3 (Mark Query as Reviewed) - will update `last_visited_at` timestamp
- Story 3.4 (Sidebar New Item Badges) - will use `newCount` for badge display

### References

- [Epic 3 Technical Specification](../sprint-artifacts/tech-spec-epic-3.md) (will be created)
- [Epic 3 Story Breakdown](../epics/epic-3-catch-up-mode-background-sync-story-breakdown.md#story-31-catch-up-mode-backend-new-since-last-visit-logic)
- [Story 2.6 - Filter UI Logic](./2-6-filter-ui-logic.md) - `buildFilterWhereClause()` helper
- [Story 2.7a - Create Query Backend](./2-7a-create-query-backend.md) - UserQuery model
- [Prisma Schema Reference](https://www.prisma.io/docs/concepts/components/prisma-schema)
- [Prisma Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [tRPC Error Handling](https://trpc.io/docs/server/error-handling)

### Testing Standards

Per ADR-006 (Minimal Testing for MVP):
- **Required**: TypeScript compilation (typecheck) + build validation
- **Required**: Manual testing of core functionality
- **Not Required**: Unit tests, integration tests for MVP

**Test Scenarios:**
1. New query creation → verify `last_visited_at` defaults to now
2. First `getNewItems` call → returns all matching events (never visited = epoch)
3. Immediate second call → returns empty (visited 1 second ago)
4. Authorization failure → FORBIDDEN error
5. Invalid query ID → NOT_FOUND error
6. Database timestamps → verify stored as UTC

### Edge Cases Handled

**Edge Case 1: Never Visited Query**
- `last_visited_at` is NULL (existing queries) or defaults to NOW (new queries)
- Fallback: `new Date(0)` (epoch) means "return all matching events"
- Result: All events matching query filters will be "new"

**Edge Case 2: Clock Skew**
- Database and application server clocks may differ slightly
- Mitigation: Use database-generated timestamps (Prisma `@default(now())`)
- PostgreSQL CURRENT_TIMESTAMP is authoritative

**Edge Case 3: Existing Queries Without Field**
- Migration adds column to existing UserQuery records
- Nullable field allows NULL for existing queries
- NULL treated as "never visited" (epoch fallback)

**Edge Case 4: Timezone Confusion**
- All timestamps stored as UTC (PostgreSQL default with Prisma)
- API returns ISO 8601 UTC strings
- Frontend responsible for timezone conversion (Story 3.2)

### Change Log

**2025-11-26** - Story created by create-story workflow. Status: drafted. Story 3.1 implements backend logic for Catch-Up Mode by adding `last_visited_at` tracking to UserQuery model and creating `getNewItems` tRPC query. This is the foundation for Stories 3.2-3.4 (Catch-Up Mode UI, mark as reviewed, sidebar badges). Backend-only story with no frontend changes.

---

## Dev Agent Record

### Context Reference

- [Story Context File](./3-1-catch-up-mode-backend-new-since-last-visit-logic.context.xml)

### Agent Model Used

<!-- Will be filled in during implementation -->

### Debug Log References

<!-- Will be filled in during implementation -->

### Completion Notes List

<!-- Will be filled in during implementation -->

### File List

<!-- Will be filled in during implementation -->

## Senior Developer Review (AI)

<!-- Will be filled in after implementation -->
