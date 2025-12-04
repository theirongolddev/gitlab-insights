# Story 1.5.5: Testing, Validation & Polish

Status: ready-for-dev

## Story

As a **developer completing the HeroUI migration**,
I want **comprehensive testing and validation of all Epic 1.5 migration work**,
so that **Epic 1.5 is fully validated with no regressions, ready for Epic 3 to resume with the HeroUI foundation complete**.

## Acceptance Criteria

1. Visual regression testing passes for all Epic 1-2 components in both light and dark modes
2. Functional testing passes for all Epic 1-2 user flows (table nav, search, filters, sidebar, modals, auth)
3. Keyboard navigation testing passes (j/k, /, 1-9, Enter, Esc, Tab, Ctrl+d/Ctrl+u)
4. Accessibility testing confirms WCAG 2.1 Level AA compliance (focus indicators, screen reader labels)
5. Dark mode toggle works correctly (system detection, manual toggle, persistence, FOUC prevention)
6. All HeroUI components render correctly with olive theme in both modes
7. `npm run typecheck` passes with no TypeScript errors
8. `npm run build` succeeds with no build errors
9. No console errors or warnings during normal usage
10. No hydration warnings in browser console
11. Performance acceptable (<500ms page load, <1s search results)
12. All documentation is complete and accurate (architecture.md, ui-component-architecture.md, ux-design-specification.md)
13. All Epic 1.5 story files have completion notes and accurate status
14. Sprint status file updated with Epic 1.5 completion status
15. Epic 3 Story 3.2 can resume without blockers from Epic 1.5

## Tasks / Subtasks

- [ ] Task 1: Visual Regression Testing (AC: 1, 6)
  - [ ] 1.1 Test light mode: dashboard, onboarding, settings, queries pages
  - [ ] 1.2 Test dark mode: all same pages
  - [ ] 1.3 Verify olive theme colors render correctly in both modes
  - [ ] 1.4 Verify HeroUI Button, Input, Table, Modal components styled correctly
  - [ ] 1.5 Verify design tokens used (no hardcoded hex values visible)
  - [ ] 1.6 Document any visual inconsistencies found and fix

- [ ] Task 2: Functional Regression Testing (AC: 2, 5)
  - [ ] 2.1 Test auth flow: login with GitLab OAuth, logout, session persistence
  - [ ] 2.2 Test onboarding: project selection, skip/continue flows
  - [ ] 2.3 Test dashboard: event table loads, items display correctly
  - [ ] 2.4 Test search: type query → results display → highlighting works
  - [ ] 2.5 Test filters: create filter → apply → results update → clear
  - [ ] 2.6 Test sidebar: click query → results load, active highlighting
  - [ ] 2.7 Test create query modal: open → fill form → save → appears in sidebar
  - [ ] 2.8 Test edit query: edit → save → changes persist
  - [ ] 2.9 Test delete query: delete → confirm → query removed
  - [ ] 2.10 Test dark mode toggle: system detection, manual toggle, persistence
  - [ ] 2.11 Test FOUC prevention: hard reload in dark mode, no flash

- [ ] Task 3: Keyboard Navigation Testing (AC: 3)
  - [ ] 3.1 Test j/k navigation in event table (moves selection up/down)
  - [ ] 3.2 Test / shortcut focuses search input
  - [ ] 3.3 Test 1-9 shortcuts jump to sidebar queries
  - [ ] 3.4 Test Enter on selected row (opens detail or navigates)
  - [ ] 3.5 Test Esc closes modals and clears focus
  - [ ] 3.6 Test Tab navigation through all interactive elements
  - [ ] 3.7 Test Ctrl+d/Ctrl+u page navigation in table
  - [ ] 3.8 Test Space/Enter on buttons activates them
  - [ ] 3.9 Verify no keyboard shortcut conflicts

- [ ] Task 4: Accessibility Testing (AC: 4)
  - [ ] 4.1 Run automated accessibility audit (axe DevTools or Lighthouse)
  - [ ] 4.2 Verify focus indicators visible on all interactive elements (olive ring)
  - [ ] 4.3 Verify buttons have accessible names (aria-label or visible text)
  - [ ] 4.4 Verify form inputs have proper labels
  - [ ] 4.5 Verify modals have focus trap and proper dialog role
  - [ ] 4.6 Verify table has proper ARIA structure
  - [ ] 4.7 Test screen reader (optional): elements announce correctly
  - [ ] 4.8 Verify color contrast meets WCAG AA (4.5:1 for text)
  - [ ] 4.9 Document any accessibility issues and fix

- [ ] Task 5: Build and TypeScript Validation (AC: 7, 8, 9, 10)
  - [ ] 5.1 Run `npm run typecheck` - verify 0 errors
  - [ ] 5.2 Run `npm run build` - verify production build succeeds
  - [ ] 5.3 Check browser console for errors/warnings during testing
  - [ ] 5.4 Verify no React hydration warnings
  - [ ] 5.5 Check for any deprecation warnings from HeroUI

- [ ] Task 6: Performance Validation (AC: 11)
  - [ ] 6.1 Measure dashboard page load time (<500ms target)
  - [ ] 6.2 Measure search results time (<1s target)
  - [ ] 6.3 Verify theme toggle doesn't cause visible delay
  - [ ] 6.4 Check for any performance regressions from HeroUI migration

- [ ] Task 7: Documentation Validation (AC: 12)
  - [ ] 7.1 Verify architecture.md ADR-008 HeroUI section is complete
  - [ ] 7.2 Verify ui-component-architecture.md has Epic 1-2 migration patterns
  - [ ] 7.3 Verify ux-design-specification.md Section 3.5 dark mode is complete
  - [ ] 7.4 Cross-reference docs for consistency (same patterns, same terminology)
  - [ ] 7.5 Fix any documentation gaps or inconsistencies

- [ ] Task 8: Story File Validation (AC: 13)
  - [ ] 8.1 Review Story 1.5.1 completion notes and status
  - [ ] 8.2 Review Story 1.5.2 completion notes and status
  - [ ] 8.3 Review Story 1.5.3 completion notes and status
  - [ ] 8.4 Review Story 1.5.4 completion notes and status
  - [ ] 8.5 Review Story 1.5.6 completion notes and status
  - [ ] 8.6 Ensure all stories have accurate "done" status if complete
  - [ ] 8.7 Update any incomplete story files with missing information

- [ ] Task 9: Sprint Status Update (AC: 14)
  - [ ] 9.1 Update sprint-status.yaml: epic-1-5 → contexted or done
  - [ ] 9.2 Update sprint-status.yaml: 1-5-5-testing-validation-polish → done
  - [ ] 9.3 Verify all Epic 1.5 stories are marked appropriately
  - [ ] 9.4 Verify Epic 3 stories still show correct status

- [ ] Task 10: Epic 3 Readiness Validation (AC: 15)
  - [ ] 10.1 Verify HeroUI foundation is complete (no missing components)
  - [ ] 10.2 Verify theme system works (dark mode toggle functional)
  - [ ] 10.3 Review Story 3.2 draft to ensure no Epic 1.5 blockers
  - [ ] 10.4 Document any known issues or technical debt for Epic 3
  - [ ] 10.5 Confirm Epic 3 can resume development

## Dev Notes

### Context from Previous Stories

**Story 1.5.1 (HeroUI Setup - done):**
- HeroUI v2.8.5 installed with React 19 compatibility
- Custom olive theme configured in tailwind.config.ts using HSL format
- HeroUIProvider configured in providers.tsx
- Light/dark theme definitions complete

**Story 1.5.2 (Hex → HSL - done):**
- All design tokens converted from hex to HSL in globals.css
- Color system: olive hsl(68, 49%, 28%), olive-light hsl(68, 36%, 52%)
- Semantic colors: success (green), warning (amber), error (red), info (blue)
- 163 `dark:` Tailwind classes throughout codebase

**Story 1.5.3 (Epic 1 Migration - done):**
- All Epic 1 components migrated: Auth screens, Project selection, Table view, App layout
- HeroUI Button, Checkbox, Input, Spinner components used
- Button wrapper deprecated - all use HeroUI Button directly
- Pattern established: HeroUI for presentation, React Aria for complex interactions

**Story 1.5.4 (Epic 2 Migration - done):**
- All Epic 2 components migrated: EventTable, SearchBar, QuerySidebar, CreateQueryModal, Edit/Delete
- Hybrid pattern: HeroUI Table + React Aria TagGroup/ListBox for keyboard nav
- Vim shortcuts preserved: j/k, /, 1-9, Ctrl+d/Ctrl+u
- ui-component-architecture.md Section 9 added with Epic 2 patterns

**Story 1.5.6 (Dark Mode Toggle - review):**
- Three-layer architecture: theme.ts (utilities), ThemeContext (state), ThemeToggle (UI)
- System preference detection via matchMedia API
- localStorage persistence (key: gitlab-insights-theme)
- FOUC prevention via inline blocking script in layout.tsx
- Three-state toggle: system (computer icon) → light (sun) → dark (moon)

### Architecture Compliance

**Critical Standards (from architecture.md):**
- Design tokens only - no hardcoded hex values
- HeroUI components for all interactive UI
- React Aria preserved for complex keyboard interactions
- WCAG 2.1 Level AA accessibility
- <500ms page loads, <1s search

**Quality-First Development Principle:**
- Surface concerns proactively
- Challenge when appropriate
- Quality over speed
- Document gaps

### Testing Strategy

**Per ADR-006 (Minimal Testing for MVP):**
- TypeScript compilation required
- Production build validation required
- Manual functional testing required
- Automated unit tests not required for MVP

**This Story's Purpose:**
Story 1.5.5 is the final validation gate for Epic 1.5. All manual testing deferred from Stories 1.5.3, 1.5.4, 1.5.6 should be completed here. This is NOT a re-implementation story - it's validation and polish.

### Project Structure Notes

**Key Files to Validate:**
- `tailwind.config.ts` - HeroUI theme configuration
- `src/styles/globals.css` - Design tokens (HSL format)
- `src/app/providers.tsx` - Provider chain (ThemeProvider outermost)
- `src/app/layout.tsx` - FOUC prevention script
- `src/components/theme/ThemeToggle.tsx` - Theme toggle UI
- `src/contexts/ThemeContext.tsx` - Theme state management
- `src/components/dashboard/EventTable.tsx` - HeroUI Table + vim nav
- `src/components/search/SearchBar.tsx` - HeroUI Button + React Aria TagGroup

**Documentation Files to Validate:**
- `docs/architecture.md` - ADR-008 HeroUI decision, ADR-009 Dark Mode
- `docs/ui-component-architecture.md` - Sections 1.5, 8, 9
- `docs/ux-design-specification.md` - Sections 1.1, 3.1, 3.5

### References

**Epic Documentation:**
- [Epic 1.5: HeroUI Migration](../epics/epic-1-5-heroui-migration.md)
- [Architecture: ADR-008](../architecture.md#adr-008-heroui-for-professional-design-system)
- [UI Component Architecture](../ui-component-architecture.md)
- [UX Design Specification](../ux-design-specification.md)

**Previous Stories:**
- [Story 1.5.1](./1-5-1-heroui-setup-custom-olive-theme.md) - HeroUI setup
- [Story 1.5.2](./1-5-2-hex-to-hsl-color-migration.md) - HSL migration
- [Story 1.5.3](./1-5-3-epic-1-component-migration.md) - Epic 1 migration
- [Story 1.5.4](./1-5-4-epic-2-component-migration.md) - Epic 2 migration
- [Story 1.5.6](./1-5-6-dark-mode-toggle.md) - Dark mode toggle

**Testing References:**
- [axe DevTools](https://www.deque.com/axe/devtools/) - Accessibility testing
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/) - Performance and accessibility
- [HeroUI Components](https://heroui.com/docs/components) - Component documentation

### Testing Standards

**Visual Testing Checklist:**
1. Dashboard page renders correctly (light + dark)
2. Onboarding page renders correctly (light + dark)
3. Settings page renders correctly (light + dark)
4. Query detail pages render correctly (light + dark)
5. All HeroUI components have olive theme colors
6. No hardcoded hex values visible in UI

**Functional Testing Checklist:**
1. Auth: GitLab OAuth login → logout → session restore
2. Onboarding: Project selection → skip/continue
3. Dashboard: Table displays events → search → filter → navigate
4. Queries: Create → edit → delete → sidebar navigation
5. Theme: Toggle → system detection → persistence → FOUC prevention

**Keyboard Testing Checklist:**
1. j/k moves selection in table
2. / focuses search
3. 1-9 jumps to queries
4. Enter activates selection
5. Esc closes modals
6. Tab navigates all elements
7. Space/Enter on buttons

**Accessibility Testing Checklist:**
1. Focus indicators visible (olive ring)
2. Buttons have accessible names
3. Inputs have labels
4. Modals trap focus
5. Color contrast passes
6. No auto-play/motion issues

### Definition of Done

Story 1.5.5 is complete when:
1. All 10 tasks completed and verified
2. All 15 acceptance criteria met with evidence
3. No visual, functional, keyboard, or accessibility regressions
4. All builds pass (typecheck, production)
5. All documentation validated and consistent
6. All Epic 1.5 story files have accurate completion status
7. Sprint status updated
8. Epic 3 ready to resume

### Change Log

**2025-12-04** - Story drafted via create-story workflow. Status: drafted. Story 1.5.5 is the final validation and polish story for Epic 1.5 HeroUI Migration. Comprehensive testing tasks cover visual regression, functional flows, keyboard navigation, accessibility, build validation, performance, and documentation consistency. This story validates all work from Stories 1.5.1-1.5.4 and 1.5.6, ensuring Epic 3 can resume with a solid HeroUI foundation.

---

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
