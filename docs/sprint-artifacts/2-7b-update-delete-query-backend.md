# Story 2.7b: Update/Delete Query Backend

Status: ready-for-dev

## Story

As a **user with saved queries**,
I want **to edit or remove my saved queries**,
so that **I can maintain an organized and relevant query list**.

## Acceptance Criteria

| AC ID | Criterion |
|-------|-----------|
| 2.7b.1 | `queries.update` mutation updates query name and/or filters in database |
| 2.7b.2 | `queries.delete` mutation removes query from database |
| 2.7b.3 | Authorization check prevents modifying/deleting queries not owned by current user |
| 2.7b.4 | Returns appropriate TRPCError (FORBIDDEN) for unauthorized access attempts |
| 2.7b.5 | Input validated with Zod schema (id: string required, name/filters optional for update) |
| 2.7b.6 | Delete returns success confirmation (`{ success: true }`) |
| 2.7b.7 | Returns TRPCError (NOT_FOUND) when query id doesn't exist |

## Tasks / Subtasks

- [ ] Task 1: Add TRPCError Import (AC: 2.7b.4)
  - [ ] 1.1 Import TRPCError from `@trpc/server` in `src/server/api/routers/queries.ts`

- [ ] Task 2: Implement queries.update Mutation (AC: 2.7b.1, 2.7b.3, 2.7b.4, 2.7b.5, 2.7b.7)
  - [ ] 2.1 Define input schema: `{ id: z.string(), name: z.string().min(1).max(100).optional(), filters: QueryFiltersSchema.optional() }`
  - [ ] 2.2 Use protectedProcedure to ensure user is authenticated
  - [ ] 2.3 Fetch existing query by id using `ctx.db.userQuery.findUnique()`
  - [ ] 2.4 Check if query exists - if not, throw TRPCError with code 'NOT_FOUND'
  - [ ] 2.5 Authorization check: Compare `existing.userId !== ctx.session.user.id` - if true, throw TRPCError with code 'FORBIDDEN'
  - [ ] 2.6 Update query using `ctx.db.userQuery.update()` with provided name/filters
  - [ ] 2.7 Return updated query object

- [ ] Task 3: Implement queries.delete Mutation (AC: 2.7b.2, 2.7b.3, 2.7b.4, 2.7b.6, 2.7b.7)
  - [ ] 3.1 Define input schema: `{ id: z.string() }`
  - [ ] 3.2 Use protectedProcedure to ensure user is authenticated
  - [ ] 3.3 Fetch existing query by id using `ctx.db.userQuery.findUnique()`
  - [ ] 3.4 Check if query exists - if not, throw TRPCError with code 'NOT_FOUND'
  - [ ] 3.5 Authorization check: Compare `existing.userId !== ctx.session.user.id` - if true, throw TRPCError with code 'FORBIDDEN'
  - [ ] 3.6 Delete query using `ctx.db.userQuery.delete()`
  - [ ] 3.7 Return `{ success: true }`

- [ ] Task 4: Testing and Validation (AC: All)
  - [ ] 4.1 Run `npm run build` to verify no compilation errors
  - [ ] 4.2 Run `npm run lint` to verify no linting errors
  - [ ] 4.3 Run `npm run typecheck` to verify no type errors
  - [ ] 4.4 Manual test: Create query, update name, verify change persists
  - [ ] 4.5 Manual test: Create query, delete it, verify removed from list
  - [ ] 4.6 Authorization test: Use Prisma Studio or direct DB to create a query with different userId, then attempt update/delete via tRPC - verify FORBIDDEN error returned
  - [ ] 4.7 NOT_FOUND test: Attempt to update/delete with non-existent query id (e.g., 'invalid-id-123') - verify NOT_FOUND error returned

## Dev Notes

### Learnings from Previous Story

**From Story 2-7a-create-query-backend (Status: done)**

- **New Files Created:**
  - `src/lib/filters/types.ts` - QueryFiltersSchema (`keywords: string[]`) and QueryFilters type
  - `src/server/api/routers/queries.ts` - queries.create mutation, queries.list query (68 lines)

- **Modified Files:**
  - `src/server/api/root.ts` - Added queriesRouter import and registration
  - `src/components/layout/Header.tsx` - Save button wired to queries.create

- **Completion Notes:**
  - Both procedures use `protectedProcedure` for user authentication
  - User isolation enforced via `ctx.session.user.id` filter
  - Tech spec deviation: Uses `keywords: string[]` (matches SearchContext) instead of original `keyword: string`

- **Review Notes (Advisory):**
  - Task 1.4 mentioned TRPCError import but was not actually imported (not needed for create/list)
  - **This story WILL need TRPCError** for authorization checks on update/delete
  - Consider adding optimistic UI invalidation for queries.list after mutations (for Story 2.8 Sidebar)

[Source: docs/sprint-artifacts/2-7a-create-query-backend.md#Dev-Agent-Record]

### Partial Update Semantics

**Contract for `queries.update` mutation:**
- `undefined` fields = unchanged (keep existing value)
- Provided fields = replace entirely (not merge)

Example: If updating only `name`, pass `{ id: "...", name: "New Name" }` - filters remain unchanged.
If updating `filters`, pass `{ id: "...", filters: { keywords: ["new"] } }` - this REPLACES the entire filters object.

This follows standard Prisma/tRPC conventions where undefined values are ignored in updates.

### DRY Recommendation: Authorization Helper

Both update and delete need identical authorization logic. Consider extracting to a helper:

```typescript
const assertQueryOwnership = async (db: PrismaClient, userId: string, queryId: string) => {
  const query = await db.userQuery.findUnique({ where: { id: queryId } });
  if (!query) throw new TRPCError({ code: 'NOT_FOUND', message: 'Query not found' });
  if (query.userId !== userId) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
  return query;
};
```

This can be defined at the top of queries.ts or extracted to a shared utility if needed elsewhere.

### Architecture Alignment

**Tech Spec Reference (Story 2.7b):**

```typescript
// Authorization pattern for update/delete
const existing = await ctx.db.userQuery.findUnique({
  where: { id: input.id },
});
if (existing?.userId !== ctx.session.user.id) {
  throw new TRPCError({ code: 'FORBIDDEN' });
}
```

[Source: docs/sprint-artifacts/tech-spec-epic-2.md#story-27b-updatedelete-query-backend]

**Existing queries.ts Structure (from Story 2.7a):**

The router already has:
- `create` mutation - saves new query with userId association
- `list` query - fetches user's queries ordered by createdAt DESC

This story adds:
- `update` mutation - modifies existing query (name and/or filters)
- `delete` mutation - removes query from database

[Source: src/server/api/routers/queries.ts]

### Security Considerations

- **Authorization is CRITICAL**: Unlike create/list, update/delete operate on existing records that may not belong to the current user
- **Two-step validation pattern**:
  1. Fetch existing query by id
  2. Verify `existing.userId === ctx.session.user.id` before any mutation
- **Fail-safe**: If query not found, return NOT_FOUND (don't leak info about existence)
- **Input validation**: Zod ensures id is a valid string, prevents injection

[Source: docs/sprint-artifacts/tech-spec-epic-2.md#security]
[Source: docs/architecture.md#error-handling-patterns]

### Error Handling Patterns

**tRPC Error Codes to Use:**
- `FORBIDDEN` (403) - User does not own the query
- `NOT_FOUND` (404) - Query id does not exist

**Error Message Best Practice:**
```typescript
throw new TRPCError({
  code: 'FORBIDDEN',
  message: 'You do not have permission to modify this query',
});
```

[Source: docs/architecture.md#error-handling-patterns]

### Story Dependencies

**Required Before This Story:**
- Story 2.7a (Create query backend) - queries router exists ✓
- Story 1.2 (Database schema) - UserQuery model exists ✓
- Story 1.3 (Authentication) - protectedProcedure available ✓

**Stories That Depend on This:**
- Story 2.10 (Edit/Delete Query Actions) - UI calls these mutations

### References

- [Epic 2 Tech Spec - Story 2.7b](docs/sprint-artifacts/tech-spec-epic-2.md#story-27b-updatedelete-query-backend)
- [Epic 2 Story Breakdown - Story 2.7b](docs/epics/epic-2-user-controlled-queries-with-keyboard-foundation-story-breakdown.md#story-27b-updatedelete-query-backend)
- [Previous Story - 2.7a Create Query Backend](docs/sprint-artifacts/2-7a-create-query-backend.md)
- [Architecture - Error Handling](docs/architecture.md#error-handling-patterns)
- [Existing Queries Router](src/server/api/routers/queries.ts)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/2-7b-update-delete-query-backend.context.xml

### Agent Model Used

(To be filled during implementation)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

| File | Status | Description |
|------|--------|-------------|
| src/server/api/routers/queries.ts | MODIFIED | Add update and delete mutations |

## Change Log

**2025-11-25** - STORY CONTEXT GENERATED: Context XML created at docs/sprint-artifacts/2-7b-update-delete-query-backend.context.xml. Status: drafted -> ready-for-dev.

**2025-11-25** - PARTY MODE REVIEW: Added AC 2.7b.7 (NOT_FOUND error), clarified partial update semantics, strengthened authorization test (Task 4.6), added NOT_FOUND test (Task 4.7), added DRY recommendation for assertQueryOwnership helper. Reviewed by: Bob (SM), Winston (Architect), Amelia (Dev), Murat (TEA). Status: drafted.

**2025-11-25** - Story created by create-story workflow. Status: drafted. Story 2.7b adds update and delete mutations to the queries router, enabling users to maintain their saved query list. Builds directly on Story 2.7a's foundation. Next step: Run story-context to generate technical context and mark story ready for development.

---
