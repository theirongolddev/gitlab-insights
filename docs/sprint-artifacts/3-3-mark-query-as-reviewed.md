# Story 3.3: Mark Query as Reviewed

Status: ready-for-dev

## Story

As a **user viewing new items in Catch-Up Mode**,
I want **to mark a query as reviewed**,
so that **items I've seen are no longer shown as "new" and I can track my progress through the catch-up workflow**.

## Acceptance Criteria

| AC ID | Criterion |
|-------|-----------|
| 3.3.1 | A "Mark as Reviewed" button appears in each query section header in Catch-Up Mode |
| 3.3.2 | Clicking "Mark as Reviewed" updates `lastVisitedAt` to current timestamp via `queries.markAsReviewed` mutation |
| 3.3.3 | After marking as reviewed, the query's new item count updates to 0 immediately (optimistic UI update) |
| 3.3.4 | Items for the reviewed query disappear from the Catch-Up view (section collapses or shows "No new items") |
| 3.3.5 | On mutation failure, an error toast displays using Sonner; success feedback is provided by visible UI state changes (items disappearing, count updating to 0) |
| 3.3.6 | The sidebar badge for that query updates to 0 (via query invalidation) |
| 3.3.7 | The action completes in <200ms (optimistic update provides instant feedback) |
| 3.3.8 | Button is disabled when the query has 0 new items (no-op prevention) |
| 3.3.9 | A "Mark All as Reviewed" button appears in the Catch-Up Mode header when totalNewCount > 0 |
| 3.3.10 | "Mark All as Reviewed" updates `lastVisitedAt` for ALL user queries with a single batch operation |
| 3.3.11 | Authorization check ensures users can only mark their own queries as reviewed (FORBIDDEN for wrong user) |

## Tasks / Subtasks

- [ ] Task 0: Install Sonner Toast Infrastructure (AC: 3.3.5)
  - [ ] 0.1 Run `npm install sonner`
  - [ ] 0.2 Open `src/app/providers.tsx`
  - [ ] 0.3 Import `Toaster` from `sonner`
  - [ ] 0.4 Add `<Toaster position="bottom-right" theme="system" />` inside providers
  - [ ] 0.5 Verify toast renders correctly in dev server

- [ ] Task 1: Create Backend `markAsReviewed` Mutation (AC: 3.3.2, 3.3.7, 3.3.11)
  - [ ] 1.1 Open `src/server/api/routers/queries.ts`
  - [ ] 1.2 Add `markAsReviewed` protectedProcedure with input `z.object({ queryId: z.string() })`
  - [ ] 1.3 Fetch query by ID, verify NOT_FOUND if missing
  - [ ] 1.4 Add authorization check: `query.userId !== ctx.session.user.id` → throw FORBIDDEN
  - [ ] 1.5 Update query: `ctx.db.userQuery.update({ where: { id }, data: { lastVisitedAt: new Date() } })`
  - [ ] 1.6 Return updated query object

- [ ] Task 2: Create Backend `markAllAsReviewed` Mutation (AC: 3.3.9, 3.3.10)
  - [ ] 2.1 Add `markAllAsReviewed` protectedProcedure (no input required - uses session userId)
  - [ ] 2.2 Use `ctx.db.userQuery.updateMany({ where: { userId: ctx.session.user.id }, data: { lastVisitedAt: new Date() } })`
  - [ ] 2.3 Return `{ success: true, updatedCount: result.count }`

- [ ] Task 3: Create MarkAsReviewedButton Component (AC: 3.3.1, 3.3.3, 3.3.5, 3.3.8)
  - [ ] 3.1 Create `src/components/catchup/MarkAsReviewedButton.tsx`
  - [ ] 3.2 Import HeroUI `Button`, `api` from tRPC, `toast` from `sonner`
  - [ ] 3.3 Accept props: `queryId: string`, `queryName: string`, `newCount: number`, `onSuccess?: () => void`
  - [ ] 3.4 Create mutation: `api.queries.markAsReviewed.useMutation()`
  - [ ] 3.5 Implement optimistic update in `onMutate`: cancel outgoing fetches, set `getNewItems` data to empty
  - [ ] 3.6 In `onSuccess`: call `onSuccess` callback (no success toast - UI change is feedback)
  - [ ] 3.7 In `onError`: rollback optimistic update, show error toast via `toast.error("Couldn't mark ${queryName} as reviewed")`
  - [ ] 3.8 Render secondary-style button with checkmark icon, disabled when `newCount === 0`
  - [ ] 3.9 Add `isLoading` state to button during mutation

- [ ] Task 4: Create MarkAllAsReviewedButton Component (AC: 3.3.9, 3.3.10)
  - [ ] 4.1 Create `src/components/catchup/MarkAllAsReviewedButton.tsx`
  - [ ] 4.2 Import HeroUI `Button`, `api` from tRPC, `toast` from `sonner`
  - [ ] 4.3 Accept props: `totalNewCount: number`, `onSuccess?: () => void`
  - [ ] 4.4 Create mutation: `api.queries.markAllAsReviewed.useMutation()`
  - [ ] 4.5 Implement optimistic update: invalidate all `getNewItems` queries
  - [ ] 4.6 In `onSuccess`: call `onSuccess` callback (no success toast - UI change is feedback)
  - [ ] 4.7 In `onError`: rollback optimistic update, show error toast via `toast.error("Couldn't mark queries as reviewed")`
  - [ ] 4.8 Render secondary button with "Mark All as Reviewed" text, disabled when `totalNewCount === 0`

- [ ] Task 5: Integrate Buttons into CatchUpView (AC: 3.3.1, 3.3.4, 3.3.6, 3.3.9)
  - [ ] 5.1 Open `src/components/catchup/CatchUpView.tsx`
  - [ ] 5.2 Import `MarkAsReviewedButton` and `MarkAllAsReviewedButton`
  - [ ] 5.3 Add `MarkAsReviewedButton` in each query section header (next to query name and count)
  - [ ] 5.4 Pass `queryId`, `queryName`, `newCount` from query data
  - [ ] 5.5 Add `onSuccess` callback that invalidates `queries.getNewItems` for that query
  - [ ] 5.6 Add `MarkAllAsReviewedButton` to Catch-Up Mode header (next to "Catch-Up: X new items")
  - [ ] 5.7 Pass `totalNewCount` calculated from all queries
  - [ ] 5.8 Ensure header button only renders when `totalNewCount > 0`

- [ ] Task 6: Update Index Exports
  - [ ] 6.1 Open `src/components/catchup/index.ts`
  - [ ] 6.2 Add exports for `MarkAsReviewedButton` and `MarkAllAsReviewedButton`

- [ ] Task 7: Testing and Validation (AC: All)
  - [ ] 7.1 Run `npm run typecheck` to verify no TypeScript errors
  - [ ] 7.2 Run `npm run build` to verify build succeeds
  - [ ] 7.3 Manual test: Click "Mark as Reviewed" in query section header → verify `lastVisitedAt` updates (check DB)
  - [ ] 7.4 Manual test: Verify new count updates to 0 immediately (optimistic)
  - [ ] 7.5 Manual test: Verify items disappear from Catch-Up view
  - [ ] 7.6 Manual test: Simulate error (disconnect network) → verify error toast appears
  - [ ] 7.7 Manual test: Verify sidebar badge updates
  - [ ] 7.8 Manual test: Verify button disabled when count is 0
  - [ ] 7.9 Manual test: Click "Mark All as Reviewed" in header → verify all queries updated
  - [ ] 7.10 Manual test: Verify header button only shows when totalNewCount > 0
  - [ ] 7.11 Manual test: Verify action completes <200ms (network tab)

## Dev Notes

### Architecture Patterns and Constraints

**tRPC Mutation Pattern (from Story 2.7a/2.7b)**
- Follow existing `create`, `update`, `delete` mutation patterns in `queries.ts`
- Use `protectedProcedure` for authenticated endpoints
- Authorization: Check `query.userId !== ctx.session.user.id` before mutation
- Return updated entity or `{ success: true }` for batch operations
- [Source: src/server/api/routers/queries.ts:32-67, 164-225, 238-273]

**Optimistic Update Pattern (from Architecture)**
- Use tRPC's `useMutation` with `onMutate`, `onError`, `onSuccess` callbacks
- Cancel outgoing queries with `utils.queries.getNewItems.cancel()`
- Set optimistic data with `utils.queries.getNewItems.setData()`
- Rollback on error by storing previous data in `onMutate` context
- [Source: docs/epics/epic-3-catch-up-mode-background-sync-story-breakdown.md:220-237]

**Toast Notification System (Sonner)**
- Use Sonner for lightweight toast notifications
- Error toasts only - success feedback provided by visible UI state changes
- Pattern: `import { toast } from "sonner"` then `toast.error("Message")`
- Toaster configured in `providers.tsx` with `position="bottom-right"` and `theme="system"`
- [Source: https://sonner.emilkowal.ski/]

**HeroUI Component Library (Epic 1.5)**
- Use HeroUI `Button` via `~/components/ui/Button` wrapper
- Secondary button: `variant="flat"` or `variant="bordered"` style
- Disabled state: `isDisabled={newCount === 0}`
- Loading state: `isLoading={mutation.isPending}`
- [Source: src/components/ui/Button.tsx, docs/ui-component-architecture.md]

### Previous Story Learnings (Story 3.2)

**Gap 1: "Mark All as Reviewed" - DEFERRED TO THIS STORY**
- PRD FR48 requires "Mark All as Reviewed" functionality
- This story (3.3) now handles both per-query AND "mark all" actions
- [Source: docs/sprint-artifacts/3-2-catch-up-mode-view-with-toggle.md:126-130]

**Gap 7: Refresh Interaction Principle - CRITICAL**
- Refresh adds new events to Catch-Up view WITHOUT resetting baseline
- ONLY "Mark as Reviewed" updates `lastVisitedAt`
- This ensures users don't lose context of items they were reviewing
- `lastVisitedAt` acts as user's "read cursor" - only explicit user action moves it forward
- [Source: docs/sprint-artifacts/3-2-catch-up-mode-view-with-toggle.md:152-156]

### Source Tree Components to Touch

| File | Action | Purpose |
|------|--------|---------|
| `src/server/api/routers/queries.ts` | Modify | Add `markAsReviewed` and `markAllAsReviewed` mutations |
| `src/components/catchup/MarkAsReviewedButton.tsx` | Create | Per-query mark as reviewed button |
| `src/components/catchup/MarkAllAsReviewedButton.tsx` | Create | Mark all queries as reviewed button |
| `src/components/catchup/CatchUpView.tsx` | Modify | Integrate buttons into view |
| `src/components/catchup/index.ts` | Modify | Export new components |

### Testing Standards

- Run `npm run typecheck` before committing
- Run `npm run build` to verify production build
- Manual validation via dev server (`npm run dev`)
- No automated test suite configured - verify via dev server per AGENTS.md

### Performance Considerations

- AC 3.3.7: Action must complete in <200ms
- Optimistic updates provide instant UI feedback (no network wait)
- Use `Promise.all` for `markAllAsReviewed` if needed to parallelize
- Single database query for batch update (`updateMany`)

### Project Structure Notes

**Alignment with Unified Project Structure**
- Components: `src/components/catchup/` follows existing pattern
- Backend: `src/server/api/routers/queries.ts` extends existing router
- Keyboard: Extends existing `ShortcutContext`/`ShortcutHandler` pattern

**No Detected Conflicts**
- Story 3.1 and 3.2 infrastructure is complete
- `lastVisitedAt` field exists in Prisma schema (confirmed)
- `getNewItems` endpoint provides data needed for button state

### References

- [Source: docs/epics/epic-3-catch-up-mode-background-sync-story-breakdown.md#Story 3.3] - Story definition
- [Source: docs/epics/epic-3-catch-up-mode-background-sync.md] - Epic overview and DoD
- [Source: docs/prd.md#FR47-FR48] - Mark as reviewed functional requirements
- [Source: docs/sprint-artifacts/3-2-catch-up-mode-view-with-toggle.md] - Previous story patterns
- [Source: docs/architecture.md#Implementation Patterns] - Optimistic update pattern

### Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 3.1 (Backend) | Complete | `getNewItems` endpoint, `lastVisitedAt` field |
| Story 3.2 (CatchUp View) | Complete | CatchUpView component |
| Epic 1.5 (HeroUI) | Complete | Button components |
| Sonner | To Install | Toast library - Task 0 installs this |

### API Contract

**markAsReviewed Mutation**
```typescript
// Input
interface MarkAsReviewedInput {
  queryId: string;
}

// Output - returns updated query
interface UserQuery {
  id: string;
  userId: string;
  name: string;
  filters: QueryFilters;
  lastVisitedAt: Date; // Updated to NOW
  createdAt: Date;
  updatedAt: Date;
}

// Error codes
// - NOT_FOUND: Query doesn't exist
// - FORBIDDEN: Query belongs to different user
```

**markAllAsReviewed Mutation**
```typescript
// Input: none (uses session userId)

// Output
interface MarkAllAsReviewedResponse {
  success: true;
  updatedCount: number;
}
```

### Button Styling Reference

**Per-Query Button (Secondary)**
```typescript
<Button
  variant="flat"
  size="sm"
  isDisabled={newCount === 0}
  isLoading={mutation.isPending}
  startContent={<CheckIcon className="w-4 h-4" />}
  onPress={() => mutation.mutate({ queryId })}
>
  Mark as Reviewed
</Button>
```

**Mark All Button (Header)**
```typescript
<Button
  variant="bordered"
  size="sm"
  isDisabled={totalNewCount === 0}
  isLoading={mutation.isPending}
  onPress={() => mutation.mutate()}
>
  Mark All as Reviewed
</Button>
```

## Dev Agent Record

### Context Reference

<!-- Path to story context XML will be added by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-04 | Story created from Epic 3 breakdown | Create-Story Workflow |
| 2025-12-04 | Party Mode refinements: Added Task 0 for Sonner setup, revised AC 3.3.1 (button in section header), revised AC 3.3.5 (error toasts only), revised AC 3.3.9 (show when totalNewCount > 0) | Party Mode Session |

### File List

**Files to Create:**
- `src/components/catchup/MarkAsReviewedButton.tsx`
- `src/components/catchup/MarkAllAsReviewedButton.tsx`

**Files to Modify:**
- `src/app/providers.tsx` - Add Sonner `<Toaster />` component
- `src/server/api/routers/queries.ts` - Add `markAsReviewed` and `markAllAsReviewed` mutations
- `src/components/catchup/CatchUpView.tsx` - Integrate buttons in headers
- `src/components/catchup/index.ts` - Export new components
