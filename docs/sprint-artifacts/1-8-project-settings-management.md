# Story 1.8: Project Settings Management

Status: done

## Story

As a **returning user**,
I want **to modify which GitLab projects I'm monitoring from a settings page**,
So that **I can adjust my feed without going through full onboarding again**.

## Acceptance Criteria

1. Settings page accessible from Header dropdown menu (gear icon or "Settings" link)
2. Settings page displays "Monitored Projects" section showing current project selections
3. User can modify project selections (check/uncheck) using same UI pattern as onboarding
4. "Save Changes" button persists updated selections to MonitoredProject table
5. Success feedback shown after saving ("Projects updated successfully")
6. Settings link always accessible from authenticated app layout
7. Sticky footer pattern applied (selection count + Save button always visible)

## Tasks / Subtasks

- [x] Create Settings Page Route (AC: 1, 2, 6)
  - [x] Create `src/app/settings/page.tsx` with authentication guard
  - [x] Add page title "Settings" with section heading "Monitored Projects"
  - [x] Fetch current MonitoredProject records for user
  - [x] Fetch available GitLab projects via existing `gitlab.listUserProjects` tRPC query
  - [x] Initialize selection state with currently monitored projects (pre-checked)

- [x] Implement Project Selection UI (AC: 2, 3, 7)
  - [x] Reuse project checklist pattern from onboarding page
  - [x] Display projects grouped by namespace (same as onboarding)
  - [x] Add search/filter input for projects
  - [x] Add "Select All" and "Deselect All" bulk action buttons
  - [x] Apply sticky footer with selection count and Save button

- [x] Implement Save Functionality (AC: 4, 5)
  - [x] Reuse existing `projects.saveMonitored` tRPC mutation
  - [x] Show loading state during save ("Saving...")
  - [x] Display success toast/message after save completes
  - [x] Handle error state with clear error message
  - [x] Stay on settings page after save (don't redirect)

- [x] Add Header Navigation (AC: 1, 6)
  - [x] Modify `src/components/layout/Header.tsx` to add dropdown menu
  - [x] Add "Settings" link in dropdown that navigates to `/settings`
  - [x] Style dropdown with dark mode theming and olive accent
  - [x] Ensure dropdown is keyboard accessible (React Aria Menu)

- [x] Manual Testing (AC: 1-7)
  - [x] Navigate to settings via header dropdown
  - [x] Verify current monitored projects are pre-selected
  - [x] Test adding/removing projects from selection
  - [x] Test bulk select/deselect buttons
  - [x] Save changes and verify database updated (Prisma Studio)
  - [x] Test error handling (simulate API failure)
  - [x] Verify keyboard navigation works throughout

## Dev Notes

### Technical Stack & Patterns

**Reusable Components from Onboarding:**
- Project checklist UI pattern from `src/app/onboarding/page.tsx`
- Sticky footer pattern (just implemented in Change 1)
- `gitlab.listUserProjects` tRPC query (existing)
- `projects.saveMonitored` tRPC mutation (existing)

**New Backend Query Needed:**
- Need to fetch user's current MonitoredProject records to pre-populate selection
- Can use existing Prisma query: `db.monitoredProject.findMany({ where: { userId } })`
- Consider adding `projects.getMonitored` tRPC query or inline in settings page

**React Aria Components:**
- Use React Aria Menu for header dropdown (keyboard accessible)
- Existing Button component for save action
- Native checkboxes with proper focus styling (same as onboarding)

### Architecture Alignment

**PRD Reference:**
- FR83: "Users can add/remove monitored projects from settings after onboarding"
- This story implements the deferred FR83 requirement

**Epic 1 Tech Spec:**
- Extends AC-4 (Project Selection) with persistent settings access
- Follows established patterns from Story 1.4

**Sprint Change Proposal 2025-11-25:**
- Documents the requirement and approval for this story
- Links to sticky footer implementation (Change 1)

### Learnings from Previous Story (1.7)

**From Story 1-7-basic-app-layout-with-react-aria (Status: done)**

**Header Component Location:**
- Header is at `src/components/layout/Header.tsx`
- Uses BetterAuth `useSession` and `signOut`
- Already has user avatar, name, email display
- Uses Button wrapper component from `src/components/ui/Button.tsx`

**Styling Patterns:**
- Dark mode: bg-[#2d2e2e], text-[#FDFFFC]
- Olive accent: #9DAA5F (dark), #5e6b24 (light)
- Focus ring: ring-2 ring-[#9DAA5F]
- Button variants: primary (olive), secondary (gray), ghost

**Accessibility Patterns:**
- React Aria components for keyboard accessibility
- Tab navigation through interactive elements
- Focus indicators on all clickable elements

**Logging:**
- Use pino logger from `src/lib/logger.ts` (no console.log)

[Source: docs/sprint-artifacts/1-7-basic-app-layout-with-react-aria.md#Dev-Agent-Record]

### Project Structure

**Expected File Changes:**
```
gitlab-insights/
├── src/
│   ├── app/
│   │   └── settings/
│   │       └── page.tsx           # NEW: Settings page with project management
│   ├── components/
│   │   └── layout/
│   │       └── Header.tsx         # MODIFY: Add dropdown menu with Settings link
│   └── server/
│       └── api/
│           └── routers/
│               └── projects.ts    # MODIFY: Add getMonitored query (optional)
```

### References

- [Sprint Change Proposal 2025-11-25 - Change 2](docs/sprint-change-proposal-2025-11-25.md#change-2-project-settings-management-new-story)
- [PRD - FR83 Project Management](docs/prd.md#FR83)
- [Story 1.4 - Project Selection Onboarding](docs/sprint-artifacts/1-4-project-selection-onboarding.md)
- [Story 1.7 - Basic App Layout](docs/sprint-artifacts/1-7-basic-app-layout-with-react-aria.md)
- [Epic 1 Tech Spec - AC-4](docs/sprint-artifacts/tech-spec-epic-1.md#AC-4)

## Change Log

**2025-11-25** - Story created via create-story workflow (triggered by correct-course workflow). Status: drafted. This story implements FR83 (project settings management) which was deferred during Epic 1 MVP. Added to sprint-status.yaml as story 1-8. Prerequisite: Change 1 (sticky footer) already implemented on onboarding page.

**2025-11-25** - Implementation completed via dev-story workflow. All code tasks (1-4) complete. Created settings page, extracted shared ProjectSelector component, added header navigation with gear icon and dropdown menu, made logo link to dashboard. Status: in-progress → awaiting manual testing.

**2025-11-25** - Senior Developer Review (AI) completed via code-review workflow. Outcome: APPROVE. All 7 ACs verified implemented. All 22 tasks verified complete. No HIGH/MEDIUM severity issues. Status: review → done.

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/1-8-project-settings-management.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Task 1-3: Created settings page `src/app/settings/page.tsx` with data fetching (projects.getMonitored + gitlab.listUserProjects), selection state management using useMemo (avoiding setState in useEffect per lint rules), save functionality with success/error feedback, sticky footer pattern
- Task 4: Added React Aria Menu dropdown to Header with Settings and Sign out options. Added direct gear icon link to settings for quick access. Both navigation methods work with keyboard.
- **Refactored:** Extracted shared `ProjectSelector` component to eliminate code duplication between onboarding and settings pages. Both pages now use the same component for project selection UI (search, bulk actions, grouped display).

### Completion Notes List

- Settings page implements FR83 (project settings management)
- **Created reusable `ProjectSelector` component** - eliminates ~120 lines of duplicated code
- Both onboarding and settings pages now share the same selection UI component
- Header now has two ways to access settings: gear icon (direct link) and user dropdown menu (React Aria Menu)
- TypeScript and ESLint pass with zero errors (note: pre-existing errors in seed script unrelated to this story)

### File List

**New Files:**
- src/app/settings/page.tsx - Settings page with monitored projects management
- src/components/projects/ProjectSelector.tsx - Reusable project selection component

**Modified Files:**
- src/components/layout/Header.tsx - Added Settings gear icon link, React Aria Menu dropdown, logo links to dashboard
- src/app/onboarding/page.tsx - Refactored to use shared ProjectSelector component

## Senior Developer Review (AI)

### Reviewer
BMad

### Date
2025-11-25

### Outcome
**APPROVE** ✓

All 7 acceptance criteria fully implemented with evidence. All tasks verified complete. No blocking issues found.

### Summary

Story 1.8 implements FR83 (project settings management) allowing returning users to modify monitored projects without re-onboarding. The implementation demonstrates excellent code quality through component reuse and proper state management patterns.

**Key Strengths:**
- Extracted reusable `ProjectSelector` component eliminating ~120 lines of duplicated code
- Proper use of React Aria Menu for accessible dropdown navigation
- TypeScript and ESLint pass with zero errors
- Follows established architecture patterns from previous stories

### Key Findings

**No HIGH or MEDIUM severity issues found.**

**LOW severity (advisory):**
- Note: The onboarding page sticky footer uses a native `<button>` while settings uses the `Button` component - minor inconsistency but not blocking

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| 1 | Settings page accessible from Header dropdown menu | IMPLEMENTED | `Header.tsx:62-86` (gear icon), `Header.tsx:139-159` (menu item) |
| 2 | Settings page displays "Monitored Projects" section | IMPLEMENTED | `settings/page.tsx:113-119` (heading), `settings/page.tsx:19-22` (query) |
| 3 | User can modify project selections | IMPLEMENTED | `ProjectSelector.tsx:63-68`, `ProjectSelector.tsx:160-164` |
| 4 | Save Changes persists to MonitoredProject table | IMPLEMENTED | `settings/page.tsx:61-78`, `projects.ts:24-72` |
| 5 | Success feedback shown after saving | IMPLEMENTED | `settings/page.tsx:171-175` |
| 6 | Settings link always accessible | IMPLEMENTED | `Header.tsx:32-34` (session check), `Header.tsx:62-86` |
| 7 | Sticky footer pattern applied | IMPLEMENTED | `settings/page.tsx:164-191` |

**Summary: 7 of 7 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Create Settings Page Route | Complete | **VERIFIED** | `settings/page.tsx` exists with auth guard `:89-93` |
| Task 1.1: Create page with auth guard | Complete | **VERIFIED** | `settings/page.tsx:89-93` |
| Task 1.2: Add page title and section heading | Complete | **VERIFIED** | `settings/page.tsx:104-109, 114-115` |
| Task 1.3: Fetch MonitoredProject records | Complete | **VERIFIED** | `settings/page.tsx:19-22` |
| Task 1.4: Fetch GitLab projects | Complete | **VERIFIED** | `settings/page.tsx:25-28` |
| Task 1.5: Initialize selection state | Complete | **VERIFIED** | `settings/page.tsx:31-33` |
| Task 2: Implement Project Selection UI | Complete | **VERIFIED** | `ProjectSelector.tsx` component |
| Task 2.1: Reuse checklist pattern | Complete | **VERIFIED** | Shared `ProjectSelector` component |
| Task 2.2: Group by namespace | Complete | **VERIFIED** | `ProjectSelector.tsx:104-111` |
| Task 2.3: Search/filter input | Complete | **VERIFIED** | `ProjectSelector.tsx:116-124, 93-101` |
| Task 2.4: Bulk action buttons | Complete | **VERIFIED** | `ProjectSelector.tsx:127-139, 71-90` |
| Task 2.5: Sticky footer | Complete | **VERIFIED** | `settings/page.tsx:164-191` |
| Task 3: Implement Save Functionality | Complete | **VERIFIED** | `settings/page.tsx:39-78` |
| Task 3.1: Use saveMonitored mutation | Complete | **VERIFIED** | `settings/page.tsx:39` |
| Task 3.2: Loading state | Complete | **VERIFIED** | `settings/page.tsx:187` |
| Task 3.3: Success message | Complete | **VERIFIED** | `settings/page.tsx:171-175` |
| Task 3.4: Error handling | Complete | **VERIFIED** | `settings/page.tsx:46-49, 176-179` |
| Task 3.5: Stay on settings page | Complete | **VERIFIED** | `settings/page.tsx:41-44` (no redirect) |
| Task 4: Add Header Navigation | Complete | **VERIFIED** | `Header.tsx:89-182` |
| Task 4.1: Add dropdown menu | Complete | **VERIFIED** | `Header.tsx:10, 89-182` |
| Task 4.2: Settings link in dropdown | Complete | **VERIFIED** | `Header.tsx:131-137, 139-159` |
| Task 4.3: Dark mode styling | Complete | **VERIFIED** | `Header.tsx:127, 141, 162` |
| Task 4.4: Keyboard accessible | Complete | **VERIFIED** | React Aria Menu components |
| Task 5: Manual Testing | Complete | **VERIFIED** | User confirmed |

**Summary: 22 of 22 completed tasks verified, 0 questionable, 0 falsely marked complete**

### Test Coverage and Gaps

- **Manual testing**: All ACs verified manually per user confirmation
- **Automated tests**: None required per Epic 1 strategy (deferred to Epic 6)
- **Type checking**: TypeScript passes with zero errors
- **Linting**: ESLint passes with zero errors

### Architectural Alignment

- **React Aria Components (ADR-008)**: Menu, MenuTrigger, MenuItem used for dropdown ✓
- **Dark mode styling**: Correct colors (#2d2e2e, #FDFFFC, #9DAA5F) ✓
- **User data scoping**: All queries use protectedProcedure with userId ✓
- **tRPC patterns**: Reuses existing queries/mutations ✓
- **Component reuse**: Excellent - extracted ProjectSelector eliminates duplication ✓

### Security Notes

- All routes protected with session authentication ✓
- User data properly scoped by userId in database queries ✓
- No injection vulnerabilities identified ✓
- No secrets exposed in client code ✓

### Best-Practices and References

- [React Aria Components - Menu](https://react-spectrum.adobe.com/react-aria/Menu.html)
- [Next.js App Router](https://nextjs.org/docs/app)
- [tRPC React Query](https://trpc.io/docs/client/react)

### Action Items

**Code Changes Required:**
- None - all acceptance criteria met

**Advisory Notes:**
- Note: Consider unifying sticky footer button components (onboarding uses native button, settings uses Button component) in future refactoring
- Note: ProjectSelector component could be enhanced with virtualization for users with many projects (not blocking for MVP)
