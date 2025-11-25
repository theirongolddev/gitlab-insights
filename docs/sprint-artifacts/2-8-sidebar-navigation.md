# Story 2.8: Sidebar Navigation

Status: ready-for-dev

## Story

As a **user with saved queries**,
I want **to see my saved queries in a persistent sidebar**,
so that **I can quickly navigate to them from anywhere in the application**.

## Acceptance Criteria

| AC ID | Criterion |
|-------|-----------|
| 2.8.1 | Sidebar visible on all authenticated pages (dashboard, queries, settings) |
| 2.8.2 | Lists user's saved queries with counts (e.g., "Auth Discussions (12)") |
| 2.8.3 | Clicking query navigates to `/queries/[id]` |
| 2.8.4 | Number keys `1-9` jump to queries by position (when not typing) |
| 2.8.5 | Empty state shown when no queries: "Create your first query with / search" |

## Tasks / Subtasks

- [ ] Task 1: Create QuerySidebar Component (AC: 2.8.1, 2.8.2, 2.8.5)
  - [ ] 1.1 Create `src/components/queries/QuerySidebar.tsx` component
  - [ ] 1.2 Use `trpc.queries.list.useQuery()` to fetch user's queries
  - [ ] 1.3 Display query name and count for each query (e.g., "Auth Discussions (12)")
  - [ ] 1.4 Implement empty state with message: "Create your first query with / search"
  - [ ] 1.5 Style sidebar: 240px width, dark gray background (#1a1a1a), olive accent on active/hover

- [ ] Task 2: Add Query Count to queries.list (AC: 2.8.2)
  - [ ] 2.1 Modify `src/server/api/routers/queries.ts` to return count with each query
  - [ ] 2.2 Use PostgreSQL FTS count query for each saved query's keywords
  - [ ] 2.3 Return type: `{ ...query, count: number }[]`

- [ ] Task 3: Integrate Sidebar into App Layout (AC: 2.8.1)
  - [ ] 3.1 Add QuerySidebar to `src/components/layout/AppLayout.tsx` (or equivalent layout component)
  - [ ] 3.2 Sidebar should be persistent on left side for all authenticated routes
  - [ ] 3.3 Main content area should adjust to accommodate sidebar width

- [ ] Task 4: Implement Query Navigation (AC: 2.8.3)
  - [ ] 4.1 Wrap each query item in Next.js `<Link href="/queries/[id]">`
  - [ ] 4.2 Create `/queries/[id]/page.tsx` route if not exists
  - [ ] 4.3 Query page loads query by ID and displays results using same EventTable component
  - [ ] 4.4 Add active state styling (olive accent) for currently viewed query
  - [ ] 4.5 Create `queries.getById` tRPC procedure for fetching single query with authorization

- [ ] Task 5: Add Number Key Shortcuts (AC: 2.8.4)
  - [ ] 5.1 Extend `ShortcutContext.tsx` with `setNavigateToQuery` setter and `navigateToQuery(index)` invoker
  - [ ] 5.2 Add `1-9` key handlers to `ShortcutHandler.tsx` that call `navigateToQuery(n-1)`
  - [ ] 5.3 Handler should navigate to query at position N-1 (key 1 = first query)
  - [ ] 5.4 Ensure shortcuts only fire when not typing (check `isTypingTarget`)
  - [ ] 5.5 If query at position doesn't exist, do nothing (no error)

- [ ] Task 6: Testing and Validation (AC: All)
  - [ ] 6.1 Run `npm run build` to verify no compilation errors
  - [ ] 6.2 Run `npm run lint` to verify no linting errors
  - [ ] 6.3 Run `npm run typecheck` to verify no type errors
  - [ ] 6.4 Manual test: Create query via Save button, verify it appears in sidebar
  - [ ] 6.5 Manual test: Click query in sidebar, verify navigation to /queries/[id]
  - [ ] 6.6 Manual test: Press 1-9 keys, verify navigation to correct query
  - [ ] 6.7 Manual test: Delete all queries, verify empty state appears
  - [ ] 6.8 Manual test: Verify sidebar visible on dashboard, settings, and query pages

## Dev Notes

### Learnings from Previous Story

**From Story 2-7b-update-delete-query-backend (Status: done)**

- **Modified Files:**
  - `src/server/api/routers/queries.ts` - Added update and delete mutations with TRPCError import

- **Existing queries.ts Structure:**
  - `queries.create` mutation - saves new query with userId association
  - `queries.list` query - fetches user's queries ordered by createdAt DESC
  - `queries.update` mutation - modifies existing query (name and/or filters)
  - `queries.delete` mutation - removes query from database
  - All procedures use `protectedProcedure` for user authentication
  - User isolation enforced via `ctx.session.user.id` filter

- **Tech Spec Deviation:**
  - Uses `keywords: string[]` (matches SearchContext) instead of original `keyword: string`
  - This story should use the same `keywords` array pattern for count queries

- **Test Page:**
  - `/test-queries` page exists for manual validation - flagged for deletion in Story 2.10

- **Pending Items:**
  - Consider optimistic UI invalidation for queries.list after mutations (relevant for this story)

[Source: docs/sprint-artifacts/2-7b-update-delete-query-backend.md#Dev-Agent-Record]

### Architecture Alignment

**Component Location:**
- `src/components/queries/QuerySidebar.tsx` - Per tech spec component architecture

**Sidebar Specifications (from Tech Spec):**
- Width: 240px fixed
- Background: dark gray (#1a1a1a)
- Query items: Hover state, active state (olive accent #9DAA5F)
- Empty state with illustration/message

[Source: docs/sprint-artifacts/tech-spec-epic-2.md#services-and-modules]

**Query Count Implementation:**

Per tech spec, queries.list should return counts:

```typescript
// Get counts for each query
const queriesWithCounts = await Promise.all(
  queries.map(async (query) => {
    const filters = query.filters as QueryFilters;
    const count = await ctx.db.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Event"
      WHERE "userId" = ${ctx.session.user.id}
        AND to_tsvector('english', title || ' ' || COALESCE(body, ''))
            @@ plainto_tsquery('english', ${filters.keywords.join(' ')})
    `;
    return { ...query, count: Number(count[0].count) };
  })
);
```

[Source: docs/sprint-artifacts/tech-spec-epic-2.md#apis-and-interfaces]

**Keyboard Shortcut Integration:**

The keyboard shortcut system (Story 2.1) already handles:
- `/` → focus search
- `j/k` → navigate items
- `Esc` → clear focus/modals

This story adds:
- `1-9` → navigate to query by position

Pattern from existing ShortcutHandler:
```typescript
if (['1','2','3','4','5','6','7','8','9'].includes(e.key)) {
  const index = parseInt(e.key) - 1;
  if (queries?.[index]) {
    router.push(`/queries/${queries[index].id}`);
  }
}
```

[Source: docs/epics/epic-2-user-controlled-queries-with-keyboard-foundation-story-breakdown.md#story-28-sidebar-navigation]

### Project Structure Notes

**Files to Create:**
- `src/components/queries/QuerySidebar.tsx` - Main sidebar component
- `src/app/queries/[id]/page.tsx` - Query detail page (may already exist)

**Files to Modify:**
- `src/server/api/routers/queries.ts` - Add count to list query
- `src/components/layout/AppLayout.tsx` (or equivalent) - Add sidebar
- `src/components/keyboard/KeyboardShortcuts.tsx` - Add 1-9 handlers

**Existing Components to Reuse:**
- `EventTable` component from Story 2.2 for query page results
- `SearchContext` for search state management
- Existing dark theme styles and olive accent colors

### Performance Considerations

**Query Count Optimization:**

For MVP, fetching counts per query is acceptable. If performance degrades with many queries:
- Consider caching counts with short TTL (30-60s)
- Consider batch count query instead of N+1 queries
- Target: Sidebar load <500ms (per tech spec NFR)

[Source: docs/sprint-artifacts/tech-spec-epic-2.md#performance]

### Security Considerations

- Sidebar only fetches current user's queries (enforced by protectedProcedure)
- Query counts are scoped to current user's events
- No cross-user data exposure possible

[Source: docs/architecture.md#cross-cutting-concerns]

### UX Clarifications (Party Mode Review)

**Loading State:** Show skeleton placeholder while `queries.list` is fetching.

**Count Display:** Always show count in parentheses, including "(0)" when no matches.

**Keyboard Limitation:** Keys `1-9` support first 9 queries only. Queries beyond position 9 require click navigation. This is intentional for MVP - documented as known limitation.

**Technical Debt:** N+1 count queries (one FTS query per saved query) acceptable for MVP. Flag for batch optimization if >10 queries becomes common usage pattern.

### Story Dependencies

**Required Before This Story:**
- Story 2.7a (Create query backend) - queries router exists
- Story 2.7b (Update/Delete query backend) - full CRUD available
- Story 2.1 (Keyboard shortcut system) - framework for 1-9 shortcuts

**Stories That Depend on This:**
- Story 2.8.5 (Save as Query Entry Points) - uses sidebar for visual feedback
- Story 2.10 (Edit/Delete Query Actions) - adds edit/delete icons to sidebar items

### References

- [Epic 2 Tech Spec - Story 2.8](docs/sprint-artifacts/tech-spec-epic-2.md#story-28-sidebar-navigation)
- [Epic 2 Story Breakdown - Story 2.8](docs/epics/epic-2-user-controlled-queries-with-keyboard-foundation-story-breakdown.md#story-28-sidebar-navigation)
- [Previous Story - 2.7b Update/Delete Query Backend](docs/sprint-artifacts/2-7b-update-delete-query-backend.md)
- [Architecture - UI Component Patterns](docs/architecture.md#ui-component-patterns-react-aria-components)
- [Architecture - Keyboard Shortcut System](docs/architecture.md#keyboard-shortcut-system)
- [Existing Queries Router](src/server/api/routers/queries.ts)
- [Existing Keyboard Shortcuts](src/components/keyboard/KeyboardShortcuts.tsx)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/2-8-sidebar-navigation.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

**2025-11-25** - Story created by create-story workflow. Status: drafted. Story 2.8 implements the sidebar navigation component, displaying user's saved queries with counts and enabling quick navigation via clicks or 1-9 keyboard shortcuts. Builds on Stories 2.7a/2.7b query backend. Next step: Run story-context to generate technical context and mark story ready for development.

**2025-11-25** - Party Mode review completed. Amendments applied:
- Added Task 4.5: Create `queries.getById` tRPC procedure
- Updated Task 5.1-5.2: ShortcutContext extension + ShortcutHandler handlers
- Added UX Clarifications section: loading state, count display, keyboard limitation, tech debt note
