# Story 3.2: Catch-Up Mode View with Toggle

Status: ready-for-dev

## Story

As a **user with saved queries**,
I want **to toggle between Dashboard and Catch-Up Mode**,
so that **I can switch between "all events" and "new events only" to focus on what's changed since my last visit**.

## Acceptance Criteria

| AC ID | Criterion |
|-------|-----------|
| 3.2.1 | Pressing `c` key on the dashboard toggles between normal Dashboard view and Catch-Up Mode view |
| 3.2.2 | Catch-Up Mode header displays: "Catch-Up: X new items since [last visit time]" with total count and relative timestamp |
| 3.2.3 | Events in Catch-Up Mode are grouped by saved queries, with each section showing "[Query Name] (X new items)" |
| 3.2.4 | Pressing `c` key again returns user to normal Dashboard view |
| 3.2.5 | If user has no saved queries, Catch-Up Mode displays empty state: "Create saved queries to use Catch-Up Mode" |
| 3.2.6 | If all queries have 0 new items, Catch-Up Mode displays: "All caught up! No new items since last visit." |
| 3.2.7 | A toggle button is visible in the dashboard header area indicating current mode with keyboard hint "Press c to toggle" |
| 3.2.8 | Catch-Up Mode view loads in <500ms (performance DoD from Epic 3) |
| 3.2.9 | `c` key shortcut is disabled when user is typing in an input field (search bar, modal, etc.) |
| 3.2.10 | Each query section in Catch-Up Mode displays events using the existing EventTable component with ItemRow format |
| 3.2.11 | Catch-Up Mode state is preserved via URL query param (`/dashboard?mode=catchup`); page refresh and browser back button maintain mode |
| 3.2.12 | User can Tab/Shift+Tab between query sections; focused section displays subtle olive background (`bg-olive/5`) and border (`border-olive/30`); j/k navigation operates within the focused section only |

## Tasks / Subtasks

- [ ] Task 1: Add `c` Key Shortcut to Keyboard System (AC: 3.2.1, 3.2.4, 3.2.9)
  - [ ] 1.1 Open `src/components/keyboard/ShortcutContext.tsx`
  - [ ] 1.2 Add `setToggleCatchUpMode` setter and `toggleCatchUpMode` invoker to context interface
  - [ ] 1.3 Add `toggleCatchUpModeRef` ref and implement setter/invoker pattern (following existing patterns like `setOpenSaveModal`)
  - [ ] 1.4 Open `src/components/keyboard/ShortcutHandler.tsx`
  - [ ] 1.5 Add case for `c` key that calls `toggleCatchUpMode()` (ensure `!isTyping` check exists)
  - [ ] 1.6 Verify shortcut is blocked when typing in input fields (AC 3.2.9)

- [ ] Task 2: Create CatchUpView Component (AC: 3.2.2, 3.2.3, 3.2.5, 3.2.6, 3.2.10, 3.2.12)
  - [ ] 2.1 Create new file `src/components/catchup/CatchUpView.tsx`
  - [ ] 2.2 Import required dependencies: `api` from tRPC, `EventTable`, `Spinner` from HeroUI
  - [ ] 2.3 Fetch user's queries via `api.queries.list.useQuery()`
  - [ ] 2.4 For each query, fetch new items via `api.queries.getNewItems.useQuery({ queryId })`
  - [ ] 2.5 Calculate `totalNew` by summing `newCount` from all query results
  - [ ] 2.6 Implement empty state for no queries (AC 3.2.5): "Create saved queries to use Catch-Up Mode"
  - [ ] 2.7 Implement empty state for zero new items (AC 3.2.6): "All caught up! No new items since last visit."
  - [ ] 2.8 Render header with total count and relative time: "Catch-Up: X new items since [time]" (AC 3.2.2)
  - [ ] 2.9 Render query sections with "[Query Name] (X new items)" headers (AC 3.2.3)
  - [ ] 2.10 Wrap each query section in focusable container with `tabIndex={0}` (AC 3.2.12)
  - [ ] 2.11 Add focus styles to section wrapper: `focus:bg-olive/5 focus:border focus:border-olive/30 dark:focus:bg-olive/10 dark:focus:border-olive/40`
  - [ ] 2.12 Use `EventTable` component to display events within each query section (AC 3.2.10)
  - [ ] 2.13 Use `date-fns` `formatDistanceToNow` for relative timestamp display
  - [ ] 2.14 Show skeleton loading state per query section while fetching (progressive loading)

- [ ] Task 3: Create CatchUpModeToggle Button Component (AC: 3.2.7)
  - [ ] 3.1 Create new file `src/components/catchup/CatchUpModeToggle.tsx`
  - [ ] 3.2 Import HeroUI `Button` and icon components
  - [ ] 3.3 Accept props: `isCatchUpMode: boolean`, `onToggle: () => void`, `newItemsCount: number`
  - [ ] 3.4 Render button with bell icon and badge showing `newItemsCount` (if > 0)
  - [ ] 3.5 Show keyboard hint: "Press c to toggle" on hover or as subtitle text
  - [ ] 3.6 Apply olive accent color when `isCatchUpMode` is true (active state)
  - [ ] 3.7 Use HeroUI `Tooltip` for keyboard hint display

- [ ] Task 4: Integrate Catch-Up Mode into DashboardClient (AC: 3.2.1, 3.2.4, 3.2.8, 3.2.11)
  - [ ] 4.1 Open `src/components/dashboard/DashboardClient.tsx`
  - [ ] 4.2 Use URL query param for state: `const searchParams = useSearchParams(); const isCatchUpMode = searchParams.get('mode') === 'catchup';`
  - [ ] 4.3 Import `CatchUpView` and `CatchUpModeToggle` components
  - [ ] 4.4 Create toggle function that uses `router.push()` to change URL param
  - [ ] 4.5 Import `useShortcuts` and register toggle handler via `setToggleCatchUpMode`
  - [ ] 4.6 Add `CatchUpModeToggle` button to dashboard sub-header (next to RefreshButton)
  - [ ] 4.7 Conditionally render `CatchUpView` or normal `EventTable` based on `isCatchUpMode` state
  - [ ] 4.8 Pass toggle function to both keyboard handler and button component
  - [ ] 4.9 Pre-fetch new items count for badge display in toggle button
  - [ ] 4.10 Add effect: if `isSearchActive` becomes true, exit Catch-Up Mode (router.push to `/dashboard`)

- [ ] Task 5: Create Index Export for Catch-Up Components
  - [ ] 5.1 Create `src/components/catchup/index.ts` with exports for `CatchUpView` and `CatchUpModeToggle`

- [ ] Task 6: Testing and Validation (AC: All)
  - [ ] 6.1 Run `npm run typecheck` to verify no TypeScript errors
  - [ ] 6.2 Run `npm run build` to verify build succeeds
  - [ ] 6.3 Manual test: Press `c` on dashboard → verify Catch-Up Mode activates (AC 3.2.1)
  - [ ] 6.4 Manual test: Press `c` again → verify returns to Dashboard (AC 3.2.4)
  - [ ] 6.5 Manual test: Verify header shows correct count and relative time (AC 3.2.2)
  - [ ] 6.6 Manual test: Verify events grouped by query with counts (AC 3.2.3)
  - [ ] 6.7 Manual test: Delete all queries → verify empty state message (AC 3.2.5)
  - [ ] 6.8 Manual test: Mark all queries as reviewed → verify "All caught up" state (AC 3.2.6)
  - [ ] 6.9 Manual test: Verify toggle button visible with keyboard hint (AC 3.2.7)
  - [ ] 6.10 Manual test: Measure load time, verify <500ms (AC 3.2.8)
  - [ ] 6.11 Manual test: Focus search bar, press `c` → verify shortcut blocked (AC 3.2.9)
  - [ ] 6.12 Manual test: Verify events display in EventTable format (AC 3.2.10)
  - [ ] 6.13 Manual test: Navigate to `/dashboard?mode=catchup` directly → verify Catch-Up Mode active (AC 3.2.11)
  - [ ] 6.14 Manual test: In Catch-Up Mode, refresh page → verify mode persists (AC 3.2.11)
  - [ ] 6.15 Manual test: In Catch-Up Mode, navigate away then press Back → verify returns to Catch-Up (AC 3.2.11)
  - [ ] 6.16 Manual test: Tab between query sections → verify olive focus styling appears (AC 3.2.12)
  - [ ] 6.17 Manual test: Within focused section, press j/k → verify navigation stays within section (AC 3.2.12)
  - [ ] 6.18 Manual test: In Catch-Up Mode, type in search bar → verify exits to Dashboard (search interaction)

## Dev Notes

### Architecture Patterns and Constraints

**Keyboard Shortcut System (Story 2.1 Pattern)**
- All keyboard shortcuts use the `ShortcutContext.tsx` provider pattern
- Components register handlers via setters (e.g., `setToggleCatchUpMode`)
- `ShortcutHandler.tsx` listens for keydown events and invokes registered handlers
- Shortcuts are blocked when `isTyping` is true (input/textarea focus detection)
- [Source: src/components/keyboard/ShortcutContext.tsx]

**tRPC Data Fetching Pattern**
- Use `api.queries.list.useQuery()` for fetching user's saved queries
- Use `api.queries.getNewItems.useQuery({ queryId })` for fetching new items per query
- Follow existing patterns in `DashboardClient.tsx` for query invalidation and loading states
- [Source: src/components/dashboard/DashboardClient.tsx, src/server/api/routers/queries.ts]

**HeroUI Component Library (Epic 1.5)**
- Use HeroUI `Button`, `Spinner`, `Tooltip`, `Badge` components
- Apply olive theme colors via `color="primary"` prop
- Dark mode support via Tailwind `dark:` variants
- [Source: src/components/dashboard/RefreshButton.tsx, tailwind.config.ts]

**Component Directory Structure**
- New components go in `src/components/catchup/` directory
- Export via `index.ts` for clean imports
- Follow existing naming conventions: `CatchUpView.tsx`, `CatchUpModeToggle.tsx`

### Party Mode Review Decisions (2025-12-04)

**Gap 1: "Mark All as Reviewed" - DEFERRED**
- PRD FR48 requires "Mark All as Reviewed" functionality
- Decision: Defer to Story 3.3 which handles all "mark as reviewed" actions
- Story 3.3 will include both per-query and "mark all" buttons

**Gap 2: Search Interaction**
- When user activates search while in Catch-Up Mode, silently exit to Dashboard
- Implementation: Add effect that watches `isSearchActive` and calls `router.push('/dashboard')` if true
- Rationale: Search should search "everything", not just new items

**Gap 4: N+1 Query Performance - ACCEPTED**
- Fetching new items for each query creates N parallel requests
- Decision: Accept this pattern with progressive loading (skeleton per section)
- Each section shows independently as data arrives - better perceived performance
- Can optimize with batch endpoint later if needed

**Gap 5: Loading State UX**
- Two-phase loading approach:
  1. Phase 1: Fetch `queries.list` → show spinner until query count known
  2. Phase 2: Fetch `getNewItems` per query → show skeleton per section, replace as resolved
- Progressive loading feels faster even if total time is same

**Gap 7: Refresh Interaction Principle**
- **Critical:** Refresh adds new events to Catch-Up view WITHOUT resetting baseline
- Only "Mark as Reviewed" (Story 3.3) updates `lastVisitedAt`
- This ensures users don't lose context of items they were reviewing
- Supports future webhook-driven architecture where events stream in continuously
- `lastVisitedAt` acts as user's "read cursor" - only user action moves it forward

### Source Tree Components to Touch

| File | Action | Purpose |
|------|--------|---------|
| `src/components/keyboard/ShortcutContext.tsx` | Modify | Add `toggleCatchUpMode` handler |
| `src/components/keyboard/ShortcutHandler.tsx` | Modify | Add `c` key case |
| `src/components/catchup/CatchUpView.tsx` | Create | Main Catch-Up Mode view |
| `src/components/catchup/CatchUpModeToggle.tsx` | Create | Toggle button component |
| `src/components/catchup/index.ts` | Create | Module exports |
| `src/components/dashboard/DashboardClient.tsx` | Modify | Integrate toggle and conditional rendering |

### Testing Standards

- Run `npm run typecheck` before committing
- Run `npm run build` to verify production build
- Manual validation via dev server (`npm run dev`)
- No automated test suite configured - verify via dev server per AGENTS.md

### Performance Considerations

- Catch-Up view must load in <500ms (Epic 3 DoD)
- Use parallel queries for fetching new items per query (`Promise.all` or React Query's automatic parallelization)
- Consider `useQueries` hook for batching multiple `getNewItems` calls
- Loading states should show immediately (skeleton/spinner)

### Project Structure Notes

**Alignment with Unified Project Structure**
- Components: `src/components/catchup/` follows existing pattern (`src/components/dashboard/`, `src/components/queries/`)
- Keyboard integration: Extends existing `ShortcutContext`/`ShortcutHandler` pattern
- tRPC: Uses existing `queries` router from Story 3.1

**No Detected Conflicts**
- Story 3.1 backend is complete and provides `queries.getNewItems` endpoint
- Keyboard system already has infrastructure for new shortcuts
- Dashboard already has conditional rendering pattern (search results vs events)

### References

- [Source: docs/epics/epic-3-catch-up-mode-background-sync-story-breakdown.md] - Story 3.2 definition
- [Source: docs/epics/epic-3-catch-up-mode-background-sync.md] - Epic 3 overview and DoD
- [Source: docs/prd.md#FR44-FR51] - Catch-Up Mode functional requirements
- [Source: docs/sprint-artifacts/3-1-catch-up-mode-backend-new-since-last-visit-logic.md] - Backend API reference
- [Source: docs/sprint-artifacts/2-1-keyboard-shortcut-system-foundation.md] - Keyboard shortcut patterns
- [Source: docs/sprint-artifacts/1-5-4-epic-2-component-migration.md] - HeroUI component patterns

### Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 3.1 (Backend) | Complete | `queries.getNewItems` endpoint available |
| Story 2.1 (Keyboard System) | Complete | ShortcutContext infrastructure ready |
| Story 2.8 (Sidebar) | Complete | QuerySidebar provides query list pattern |
| Epic 1.5 (HeroUI) | Complete | Component library available |

### API Contract (from Story 3.1)

```typescript
// queries.getNewItems response
interface GetNewItemsResponse {
  queryId: string;
  queryName: string;
  newCount: number;
  events: EventRow[];
}

// EventRow interface
interface EventRow {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  author: string;
  authorAvatar: string | null;
  project: string;
  projectId: string;
  labels: string[];
  gitlabEventId: string;
  gitlabUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Dev Agent Record

### Context Reference

docs/sprint-artifacts/3-2-catch-up-mode-view-with-toggle.context.xml

### Agent Model Used

Claude Sonnet 4 (Anthropic)

### Debug Log References

N/A - Story creation phase

### Completion Notes List

- Story 3.2 created from Epic 3 story breakdown
- Builds on Story 3.1 backend (queries.getNewItems endpoint)
- Follows established keyboard shortcut patterns from Story 2.1
- Uses HeroUI components per Epic 1.5 migration
- **Party Mode Review (2025-12-04):** Added 2 new ACs (3.2.11, 3.2.12), expanded tasks with URL state management, Tab navigation, and progressive loading
- 6 tasks, 48 subtasks covering all 12 acceptance criteria
- Key architectural decisions documented: search exits Catch-Up, refresh doesn't reset baseline, Tab between sections

### File List

**Files to Create:**
- `src/components/catchup/CatchUpView.tsx`
- `src/components/catchup/CatchUpModeToggle.tsx`
- `src/components/catchup/index.ts`

**Files to Modify:**
- `src/components/keyboard/ShortcutContext.tsx`
- `src/components/keyboard/ShortcutHandler.tsx`
- `src/components/dashboard/DashboardClient.tsx`
