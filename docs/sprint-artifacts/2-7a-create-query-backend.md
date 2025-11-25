# Story 2.7a: Create Query Backend

Status: ready-for-dev

## Story

As a **user exploring events**,
I want **to save my current search/filters as a named query**,
so that **I can persist useful patterns and revisit them from the sidebar**.

## Acceptance Criteria

| AC ID | Criterion |
|-------|-----------|
| 2.7a.1 | `queries.create` mutation saves query to database |
| 2.7a.2 | Input validated with Zod schema (name: 1-100 chars, filters: QueryFiltersSchema) |
| 2.7a.3 | Query associated with current user's ID (userId from session) |
| 2.7a.4 | Returns created query with ID |

## Tasks / Subtasks

- [ ] Task 1: Create Queries Router File (AC: 2.7a.1)
  - [ ] 1.1 Create `src/server/api/routers/queries.ts` router file
  - [ ] 1.2 Import createTRPCRouter, protectedProcedure from trpc.ts
  - [ ] 1.3 Import z from 'zod' for input validation
  - [ ] 1.4 Import TRPCError for error handling

- [ ] Task 2: Define Query Filters Schema (AC: 2.7a.2)
  - [ ] 2.1 Create or update `src/lib/filters/types.ts` with QueryFiltersSchema
  - [ ] 2.2 Schema structure: `{ keywords: z.array(z.string().min(1).max(100)).min(1) }` (multi-keyword to match SearchContext)
  - [ ] 2.3 Export QueryFilters type for use across the application

- [ ] Task 3: Implement queries.create Mutation (AC: 2.7a.1, 2.7a.3, 2.7a.4)
  - [ ] 3.1 Define input schema: `{ name: z.string().min(1).max(100), filters: QueryFiltersSchema }`
  - [ ] 3.2 Use protectedProcedure to ensure user is authenticated
  - [ ] 3.3 Create UserQuery record with userId from ctx.session.user.id
  - [ ] 3.4 Store filters as JSON in the filters column
  - [ ] 3.5 Return created query object including id, name, filters, createdAt

- [ ] Task 4: Register Queries Router (AC: 2.7a.1)
  - [ ] 4.1 Import queriesRouter in `src/server/api/root.ts`
  - [ ] 4.2 Add queries router to appRouter

- [ ] Task 5: Implement queries.list Query (AC: 2.7a.1)
  - [ ] 5.1 Create `queries.list` procedure to fetch user's saved queries
  - [ ] 5.2 Filter by userId from session
  - [ ] 5.3 Order by createdAt DESC
  - [ ] 5.4 Return array of UserQuery objects

- [ ] Task 6: Testing and Validation (AC: All)
  - [ ] 6.1 Run build, lint, typecheck to ensure no errors
  - [ ] 6.2 Manually test mutation via tRPC playground or client call
  - [ ] 6.3 Verify query is saved to database with correct userId
  - [ ] 6.4 Verify returned object contains id, name, filters

## Dev Notes

### Learnings from Previous Story

**From Story 2-6-filter-ui-logic (Status: done)**

- **SearchContext Pattern**: Dashboard uses multi-keyword search with AND logic. Keywords array stored in `SearchContext`, not single keyword.
- **Tag-Pill Pattern**: Story 2.6 redesigned to tag-pill-in-input pattern (like Gmail, Jira). Keywords appear as olive pills inside SearchBar.
- **React Aria Best Practices**: Use data attributes for state styling (`data-[focus-visible]`, `data-[hovered]`, `data-[pressed]`, `data-[disabled]`).
- **Filter Storage**: Filters stored as JSON. Current implementation uses `{ keyword: string }` schema in tech spec, but actual implementation uses `keywords: string[]` array.
- **Review Outcome**: APPROVED - No HIGH/MEDIUM issues found.

**Files Modified in Story 2.6:**
- `src/lib/search/postgres-fts.ts` - Multi-keyword AND search
- `src/server/api/routers/events.ts` - Keywords array input schema
- `src/components/search/SearchContext.tsx` - Keywords array state
- `src/components/search/SearchBar.tsx` - Tag pills with React Aria TagGroup

**Important**: The `SearchContext` now uses `keywords: string[]` array. The `queries.create` mutation should accept this format to match the frontend state.

[Source: docs/sprint-artifacts/2-6-filter-ui-logic.md#Dev-Agent-Record]

### Architecture Alignment

**Tech Spec Reference (Story 2.7a):**
```typescript
// src/server/api/routers/queries.ts
export const queriesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      filters: QueryFiltersSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userQuery.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          filters: input.filters,
        },
      });
    }),
});
```

[Source: docs/sprint-artifacts/tech-spec-epic-2.md#apis-and-interfaces]

**UserQuery Model (from Prisma schema):**
```prisma
model UserQuery {
  id           String    @id @default(cuid())
  userId       String
  name         String    // Query display name
  filters      Json      // { keyword: string } or { keywords: string[] }
  lastViewedAt DateTime? // For Epic 3 Catch-Up Mode
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}
```

[Source: docs/sprint-artifacts/tech-spec-epic-2.md#data-models-and-contracts]

### QueryFiltersSchema Decision

**Tech Spec (Original):** Single keyword per query
```typescript
export const QueryFiltersSchema = z.object({
  keyword: z.string().min(1).max(100),
});
```

**Story 2.6 Implementation:** Multi-keyword support
```typescript
// SearchContext uses keywords: string[]
```

**Recommendation:** Align schema with frontend - use `keywords: string[]` to match SearchContext. This provides forward compatibility and matches user expectations from the tag-pill UI.

```typescript
export const QueryFiltersSchema = z.object({
  keywords: z.array(z.string().min(1).max(100)).min(1),
});
```

### Security Considerations

- **User Isolation**: All queries MUST filter by `ctx.session.user.id`
- **Input Validation**: Zod schema validates all inputs before database operations
- **Authorization**: `protectedProcedure` ensures user is authenticated
- **SQL Injection**: Prisma handles parameterization automatically

[Source: docs/sprint-artifacts/tech-spec-epic-2.md#security]

### Story Dependencies

**Required Before This Story:**
- Story 1.2 (Database schema) - UserQuery model exists
- Story 1.3 (Authentication) - protectedProcedure available

**Stories That Depend on This:**
- Story 2.7b (Update/Delete Query Backend) - builds on this router
- Story 2.8 (Sidebar Navigation) - uses queries.list
- Story 2.8.5 (Save Button) - calls queries.create
- Story 2.9 (Create Query Modal) - calls queries.create

### Gap Analysis (Party Mode 2025-11-25)

Reviewed by: Bob (SM), Winston (Architect), Amelia (Dev), John (PM), Murat (TEA)

| Gap | Resolution |
|-----|------------|
| Schema mismatch (keyword vs keywords) | **RESOLVED**: Updated Task 2.2 to use `keywords: string[]` to match SearchContext from Story 2.6 |
| queries.list not in ACs but in tasks | Acceptable as enabler task for Story 2.8 (Sidebar) |
| Tech spec deviation | Documented in Dev Notes - frontend reality (multi-keyword) takes precedence over original spec |

**Tech Spec Deviation Note:** The tech spec defined `QueryFiltersSchema` with single `keyword: string`. However, Story 2.6 implemented multi-keyword search with `keywords: string[]` in SearchContext. To avoid adapter complexity and match user expectations (tag-pill UI supports multiple keywords), this story uses `keywords: string[]`. This is a forward-compatible decision that aligns backend with frontend reality.

### References

- [Epic 2 Tech Spec - Story 2.7a](docs/sprint-artifacts/tech-spec-epic-2.md#story-27a-create-query-backend)
- [Epic 2 Story Breakdown - Story 2.7a](docs/epics/epic-2-user-controlled-queries-with-keyboard-foundation-story-breakdown.md#story-27a-create-query-backend)
- [Previous Story - 2.6 Filter UI](docs/sprint-artifacts/2-6-filter-ui-logic.md)
- [Architecture - tRPC Patterns](docs/architecture.md#api-response-formats)
- [Architecture - Error Handling](docs/architecture.md#error-handling-patterns)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/2-7a-create-query-backend.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

**2025-11-25** - PARTY MODE REVIEW: Schema alignment applied. Updated Task 2.2 from `keyword: string` to `keywords: string[]` to match Story 2.6's SearchContext implementation. Added Gap Analysis section documenting tech spec deviation rationale. Reviewed by: Bob (SM), Winston (Architect), Amelia (Dev), John (PM), Murat (TEA). Status: drafted.

**2025-11-25** - Story created by create-story workflow. Status: drafted. Story 2.7a implements the backend tRPC mutation for creating saved queries. This enables users to persist search/filter combinations as named queries accessible from the sidebar. Next step: Run story-context to generate technical context and mark story ready for development.
