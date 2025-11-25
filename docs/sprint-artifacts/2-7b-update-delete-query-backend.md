# Story 2.7b: Update/Delete Query Backend

Status: done

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

- [x] Task 1: Add TRPCError Import (AC: 2.7b.4)
  - [x] 1.1 Import TRPCError from `@trpc/server` in `src/server/api/routers/queries.ts`

- [x] Task 2: Implement queries.update Mutation (AC: 2.7b.1, 2.7b.3, 2.7b.4, 2.7b.5, 2.7b.7)
  - [x] 2.1 Define input schema: `{ id: z.string(), name: z.string().min(1).max(100).optional(), filters: QueryFiltersSchema.optional() }`
  - [x] 2.2 Use protectedProcedure to ensure user is authenticated
  - [x] 2.3 Fetch existing query by id using `ctx.db.userQuery.findUnique()`
  - [x] 2.4 Check if query exists - if not, throw TRPCError with code 'NOT_FOUND'
  - [x] 2.5 Authorization check: Compare `existing.userId !== ctx.session.user.id` - if true, throw TRPCError with code 'FORBIDDEN'
  - [x] 2.6 Update query using `ctx.db.userQuery.update()` with provided name/filters
  - [x] 2.7 Return updated query object

- [x] Task 3: Implement queries.delete Mutation (AC: 2.7b.2, 2.7b.3, 2.7b.4, 2.7b.6, 2.7b.7)
  - [x] 3.1 Define input schema: `{ id: z.string() }`
  - [x] 3.2 Use protectedProcedure to ensure user is authenticated
  - [x] 3.3 Fetch existing query by id using `ctx.db.userQuery.findUnique()`
  - [x] 3.4 Check if query exists - if not, throw TRPCError with code 'NOT_FOUND'
  - [x] 3.5 Authorization check: Compare `existing.userId !== ctx.session.user.id` - if true, throw TRPCError with code 'FORBIDDEN'
  - [x] 3.6 Delete query using `ctx.db.userQuery.delete()`
  - [x] 3.7 Return `{ success: true }`

- [x] Task 4: Testing and Validation (AC: All)
  - [x] 4.1 Run `npm run build` to verify no compilation errors
  - [x] 4.2 Run `npm run lint` to verify no linting errors
  - [x] 4.3 Run `npm run typecheck` to verify no type errors
  - [x] 4.4 Manual test: Create query, update name, verify change persists
  - [x] 4.5 Manual test: Create query, delete it, verify removed from list
  - [x] 4.6 Authorization test: Use Prisma Studio or direct DB to create a query with different userId, then attempt update/delete via tRPC - verify FORBIDDEN error returned
  - [x] 4.7 NOT_FOUND test: Attempt to update/delete with non-existent query id (e.g., 'invalid-id-123') - verify NOT_FOUND error returned

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

claude-opus-4-5-20251101

### Debug Log References

- 2025-11-25: Tasks 1-3 implemented in single pass. TRPCError import added, update/delete mutations implemented with authorization checks.
- 2025-11-25: Build/lint/typecheck all passed on first attempt.

### Completion Notes List

- Added TRPCError import from `@trpc/server` (Task 1)
- Implemented `queries.update` mutation with Zod validation, NOT_FOUND check, FORBIDDEN authorization, partial update semantics (Task 2)
- Implemented `queries.delete` mutation with Zod validation, NOT_FOUND check, FORBIDDEN authorization, returns `{ success: true }` (Task 3)
- All automated validations passed: build, lint, typecheck (Task 4.1-4.3)
- Manual testing tasks (4.4-4.7) left for user validation during review

### File List

| File | Status | Description |
|------|--------|-------------|
| src/server/api/routers/queries.ts | MODIFIED | Add update and delete mutations |
| src/app/test-queries/page.tsx | NEW | **TODO: DELETE IN STORY 2.10** - Temporary test page for manual validation |

## Change Log

**2025-11-25** - SENIOR DEVELOPER REVIEW: APPROVED. All 7 ACs implemented with evidence. All 22 tasks verified complete. No blocking issues. Status: review -> done.

**2025-11-25** - USER VALIDATED: All manual tests passed via /test-queries page. All ACs verified.

**2025-11-25** - IMPLEMENTATION COMPLETE: All code tasks completed. TRPCError import added, queries.update and queries.delete mutations implemented with authorization checks. Build/lint/typecheck pass. Manual testing tasks (4.4-4.7) pending user validation. Status: in-progress -> review.

**2025-11-25** - STORY CONTEXT GENERATED: Context XML created at docs/sprint-artifacts/2-7b-update-delete-query-backend.context.xml. Status: drafted -> ready-for-dev.

**2025-11-25** - PARTY MODE REVIEW: Added AC 2.7b.7 (NOT_FOUND error), clarified partial update semantics, strengthened authorization test (Task 4.6), added NOT_FOUND test (Task 4.7), added DRY recommendation for assertQueryOwnership helper. Reviewed by: Bob (SM), Winston (Architect), Amelia (Dev), Murat (TEA). Status: drafted.

**2025-11-25** - Story created by create-story workflow. Status: drafted. Story 2.7b adds update and delete mutations to the queries router, enabling users to maintain their saved query list. Builds directly on Story 2.7a's foundation. Next step: Run story-context to generate technical context and mark story ready for development.

---

## Senior Developer Review (AI)

### Review Metadata
- **Reviewer:** BMad (AI)
- **Date:** 2025-11-25
- **Outcome:** ✅ **APPROVE**

### Summary

Story 2.7b successfully implements update and delete mutations for saved queries with proper authorization, input validation, and error handling. All 7 acceptance criteria are fully implemented with evidence. All 22 tasks/subtasks verified complete. Code quality is high, follows established patterns from Story 2.7a, and aligns with architectural constraints.

### Key Findings

**No blocking issues found.**

| Severity | Finding | Status |
|----------|---------|--------|
| Low | DRY opportunity: Duplicate authorization logic in update/delete could be extracted to helper function | Advisory - noted in Dev Notes, acceptable for MVP |
| Low | Test page (`/test-queries`) created for manual testing - flagged for deletion in Story 2.10 | Tracked in File List |

### Acceptance Criteria Coverage

| AC ID | Description | Status | Evidence |
|-------|-------------|--------|----------|
| 2.7b.1 | queries.update mutation updates query name and/or filters | ✅ IMPLEMENTED | `queries.ts:86-130` |
| 2.7b.2 | queries.delete mutation removes query from database | ✅ IMPLEMENTED | `queries.ts:143-178` |
| 2.7b.3 | Authorization check prevents unauthorized access | ✅ IMPLEMENTED | `queries.ts:113-118, 164-168` |
| 2.7b.4 | Returns TRPCError (FORBIDDEN) for unauthorized | ✅ IMPLEMENTED | `queries.ts:114-118, 165-168` |
| 2.7b.5 | Input validated with Zod schema | ✅ IMPLEMENTED | `queries.ts:88-96` |
| 2.7b.6 | Delete returns `{ success: true }` | ✅ IMPLEMENTED | `queries.ts:177` |
| 2.7b.7 | Returns TRPCError (NOT_FOUND) when missing | ✅ IMPLEMENTED | `queries.ts:105-110, 156-160` |

**Summary: 7 of 7 ACs implemented**

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| 1.1 Import TRPCError | [x] | ✅ | `queries.ts:14` |
| 2.1-2.7 Update mutation | [x] | ✅ | `queries.ts:86-130` |
| 3.1-3.7 Delete mutation | [x] | ✅ | `queries.ts:143-178` |
| 4.1-4.3 Build/lint/typecheck | [x] | ✅ | Passed in session |
| 4.4-4.7 Manual tests | [x] | ✅ | User validated via /test-queries |

**Summary: 22 of 22 tasks verified, 0 false completions**

### Test Coverage and Gaps

- Per ADR-006 (MVP testing approach), unit tests not required for tRPC mutations
- Manual testing completed via `/test-queries` page
- Build/lint/typecheck all pass
- All error paths (NOT_FOUND, FORBIDDEN) manually validated

### Architectural Alignment

- ✅ Follows two-step authorization pattern from tech spec
- ✅ Uses protectedProcedure for authentication
- ✅ TRPCError codes match architecture.md guidelines (FORBIDDEN, NOT_FOUND)
- ✅ Partial update semantics match Prisma/tRPC conventions
- ✅ User isolation via `ctx.session.user.id`

### Security Notes

- ✅ Authorization check before every mutation (fetch-then-verify pattern)
- ✅ NOT_FOUND returned for missing queries (no existence leakage)
- ✅ Input validation via Zod prevents injection
- ✅ No secrets or sensitive data exposed

### Best-Practices and References

- [tRPC Error Handling](https://trpc.io/docs/server/error-handling) - Correct usage of TRPCError
- [Prisma Update](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#update) - Proper partial update pattern

### Action Items

**Code Changes Required:**
- None

**Advisory Notes:**
- Note: Consider extracting `assertQueryOwnership` helper if authorization pattern repeats in future stories (DRY)
- Note: Delete `/test-queries` page in Story 2.10 as flagged
