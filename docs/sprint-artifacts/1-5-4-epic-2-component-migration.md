# Story 1.5.4: Epic 2 Component Migration

Status: drafted

## Story

As a **developer implementing the HeroUI migration**,
I want **all Epic 2 UI components migrated from React Aria (unstyled) to HeroUI (styled)**,
so that **Epic 2 components have coherent design, reduced maintenance burden, and utilize the unified HSL color system established in Story 1.5.2**.

## Acceptance Criteria

1. Story 2.2 (React Aria Table with vim-style navigation) migrated to HeroUI
2. Story 2.4 (Search bar UI) migrated to HeroUI
3. Story 2.6 (Filter UI logic) migrated to HeroUI
4. Story 2.8 (Sidebar navigation) migrated to HeroUI
5. Story 2.9 (Create query modal) migrated to HeroUI
6. Story 2.10 (Edit/delete query actions) migrated to HeroUI
7. All hardcoded hex values in Epic 2 components replaced with HeroUI color props or HSL design tokens
8. All buttons use HeroUI `Button` component (not raw `<button>` or unstyled React Aria `Button`)
9. All form inputs use HeroUI form components (Input, TextField, Checkbox, Select)
10. Vim-style keyboard shortcuts preserved (j/k navigation, / for search, etc.)
11. Table keyboard navigation works with HeroUI Table (arrow keys, Enter, Tab)
12. Search bar functionality works end-to-end (type → search → results)
13. Filter UI works end-to-end (create filter → apply → results)
14. Sidebar navigation works (click query → load results, keyboard shortcuts 1-9)
15. Create query modal works (open modal → fill form → save → persist)
16. Edit/delete query actions work (edit query → save changes, delete query → confirm → remove)
17. Keyboard navigation preserved (Tab, Enter, Space for all interactive elements)
18. Accessibility maintained (WCAG 2.1 Level AA - screen reader labels, focus indicators)
19. No visual regressions from Epic 2 original implementation
20. No functional regressions (all Epic 2 user flows work identically)
21. `npm run build` succeeds with no errors
22. `npm run typecheck` passes with no TypeScript errors
23. Migration notes added to Epic 2 story files (2.2, 2.4, 2.6, 2.8, 2.9, 2.10)
24. `docs/ui-component-architecture.md` updated with Epic 2 component migration patterns

## Tasks / Subtasks

- [ ] Task 1: Migrate Story 2.2 React Aria Table with Vim-Style Navigation (AC: 1, 10, 11)
  - [ ] 1.1 Locate EventTable component and vim keyboard handler
  - [ ] 1.2 Evaluate HeroUI Table component for vim-style customization
  - [ ] 1.3 Migrate table structure to HeroUI Table, TableHeader, TableBody, TableRow, TableCell
  - [ ] 1.4 Integrate vim-style shortcuts (j/k) with HeroUI Table keyboard events
  - [ ] 1.5 Update table styling to use HeroUI classes and design tokens
  - [ ] 1.6 Replace hardcoded olive hex values with HeroUI color="primary" or HSL tokens
  - [ ] 1.7 Test table rendering: items display correctly, selection works, olive accents visible
  - [ ] 1.8 Test vim shortcuts: j/k moves selection, Enter opens item, / focuses search
  - [ ] 1.9 Verify focus management and accessibility (keyboard-only navigation)

- [ ] Task 2: Migrate Story 2.4 Search Bar UI (AC: 2, 12)
  - [ ] 2.1 Locate SearchBar component and search input handler
  - [ ] 2.2 Replace search input with HeroUI Input component
  - [ ] 2.3 Update search button to HeroUI Button component (if present)
  - [ ] 2.4 Remove hardcoded hex colors from search UI
  - [ ] 2.5 Verify / keyboard shortcut focuses search input
  - [ ] 2.6 Test search flow: type query → submit → results display
  - [ ] 2.7 Verify search highlighting (keyword highlighting in results)

- [ ] Task 3: Migrate Story 2.6 Filter UI Logic (AC: 3, 13)
  - [ ] 3.1 Locate FilterBar and filter-related components
  - [ ] 3.2 Migrate filter dropdowns to HeroUI Select components
  - [ ] 3.3 Migrate filter inputs to HeroUI Input/TextField components
  - [ ] 3.4 Migrate filter action buttons to HeroUI Button components
  - [ ] 3.5 Remove hardcoded hex colors from filter UI
  - [ ] 3.6 Test filter creation: add filter → apply → results update
  - [ ] 3.7 Test filter clearing: remove filter → results reset
  - [ ] 3.8 Verify keyboard navigation through filter controls

- [ ] Task 4: Migrate Story 2.8 Sidebar Navigation (AC: 4, 14)
  - [ ] 4.1 Locate QuerySidebar component and query list
  - [ ] 4.2 Evaluate migration approach: HeroUI Listbox or custom styled list
  - [ ] 4.3 Migrate sidebar links/buttons to HeroUI Button or Link components
  - [ ] 4.4 Update sidebar styling to use HeroUI spacing and color utilities
  - [ ] 4.5 Remove hardcoded hex colors from sidebar
  - [ ] 4.6 Test sidebar navigation: click query → load results
  - [ ] 4.7 Test keyboard shortcuts: 1-9 jump to queries
  - [ ] 4.8 Verify active query highlighting (olive accent from theme)

- [ ] Task 5: Migrate Story 2.9 Create Query Modal (AC: 5, 15)
  - [ ] 5.1 Locate CreateQueryModal component
  - [ ] 5.2 Migrate modal structure to HeroUI Modal/ModalContent/ModalHeader/ModalBody/ModalFooter
  - [ ] 5.3 Migrate form inputs to HeroUI Input/TextField components
  - [ ] 5.4 Migrate action buttons (Save, Cancel) to HeroUI Button components
  - [ ] 5.5 Remove hardcoded hex colors from modal
  - [ ] 5.6 Test modal flow: open → fill form → save → query created
  - [ ] 5.7 Test keyboard navigation: Tab through form, Enter to submit, Esc to close
  - [ ] 5.8 Verify focus trap and accessibility (modal captures focus)

- [ ] Task 6: Migrate Story 2.10 Edit/Delete Query Actions (AC: 6, 16)
  - [ ] 6.1 Locate EditQueryModal and delete confirmation components
  - [ ] 6.2 Migrate edit modal to HeroUI Modal components (similar to Task 5)
  - [ ] 6.3 Migrate delete confirmation to HeroUI Modal or use HeroUI Alert pattern
  - [ ] 6.4 Migrate action buttons to HeroUI Button components
  - [ ] 6.5 Remove hardcoded hex colors from edit/delete UI
  - [ ] 6.6 Test edit flow: open modal → change fields → save → query updated
  - [ ] 6.7 Test delete flow: click delete → confirm → query removed
  - [ ] 6.8 Verify keyboard navigation and accessibility

- [ ] Task 7: Global Component Audit (AC: 7, 8, 9)
  - [ ] 7.1 Search codebase for hardcoded hex values in Epic 2 component files
  - [ ] 7.2 Replace all hex values with HeroUI color props or HSL design tokens
  - [ ] 7.3 Audit all buttons: ensure all use HeroUI Button component
  - [ ] 7.4 Audit all form inputs: ensure all use HeroUI form components
  - [ ] 7.5 Verify no raw <button> or <input> elements remain in Epic 2 components

- [ ] Task 8: Functional Regression Testing (AC: 12-16, 20)
  - [ ] 8.1 Test table navigation: j/k moves selection, Enter opens item
  - [ ] 8.2 Test search flow: type query → results display with highlighting
  - [ ] 8.3 Test filter flow: create filter → apply → results update
  - [ ] 8.4 Test sidebar navigation: click query → load results, shortcuts 1-9 work
  - [ ] 8.5 Test create query: open modal → save → query appears in sidebar
  - [ ] 8.6 Test edit query: edit → save → changes persist
  - [ ] 8.7 Test delete query: delete → confirm → query removed
  - [ ] 8.8 Document any functional issues found (should be none)

- [ ] Task 9: Vim Keyboard Shortcuts Testing (AC: 10, 11, 17)
  - [ ] 9.1 Test j/k navigation in table (moves selection)
  - [ ] 9.2 Test / shortcut (focuses search input)
  - [ ] 9.3 Test Enter on selected row (opens detail or navigates)
  - [ ] 9.4 Test Esc (closes modal, clears focus)
  - [ ] 9.5 Test 1-9 shortcuts (jump to sidebar queries)
  - [ ] 9.6 Test Tab navigation through all Epic 2 components
  - [ ] 9.7 Verify no keyboard shortcut regressions

- [ ] Task 10: Visual Regression Testing (AC: 19)
  - [ ] 10.1 Take screenshots of Epic 2 pages before migration (if available)
  - [ ] 10.2 Take screenshots of Epic 2 pages after HeroUI migration
  - [ ] 10.3 Compare visual appearance: table, search bar, filters, sidebar, modals
  - [ ] 10.4 Verify olive accent colors render correctly (focus rings, active states)
  - [ ] 10.5 Verify gray backgrounds and borders (table rows, inputs, modals)
  - [ ] 10.6 Document any visual differences (minor improvements expected, no regressions)

- [ ] Task 11: Accessibility Testing (AC: 18)
  - [ ] 11.1 Test keyboard navigation on table (Tab, j/k, Enter)
  - [ ] 11.2 Test keyboard navigation on search bar (Tab, Enter, /)
  - [ ] 11.3 Test keyboard navigation on filters (Tab, Space for dropdowns, Enter)
  - [ ] 11.4 Test keyboard navigation on sidebar (Tab, 1-9 shortcuts)
  - [ ] 11.5 Test keyboard navigation in modals (Tab, Enter, Esc)
  - [ ] 11.6 Verify focus indicators visible (olive focus ring from HeroUI theme)
  - [ ] 11.7 Test screen reader labels (Button, Input, Select have accessible names)
  - [ ] 11.8 Verify WCAG 2.1 Level AA compliance maintained

- [ ] Task 12: Build and TypeScript Validation (AC: 21, 22)
  - [ ] 12.1 Run: `npm run typecheck` to verify no TypeScript errors
  - [ ] 12.2 Run: `npm run build` to verify production build succeeds
  - [ ] 12.3 Check build output for warnings or errors
  - [ ] 12.4 Verify all Epic 2 pages included in build output
  - [ ] 12.5 Production build validation complete

- [ ] Task 13: Documentation Updates (AC: 23, 24)
  - [ ] 13.1 Add migration notes to Story 2.2 file (docs/sprint-artifacts/2-2-*.md)
  - [ ] 13.2 Add migration notes to Story 2.4 file (docs/sprint-artifacts/2-4-*.md)
  - [ ] 13.3 Add migration notes to Story 2.6 file (docs/sprint-artifacts/2-6-*.md)
  - [ ] 13.4 Add migration notes to Story 2.8 file (docs/sprint-artifacts/2-8-*.md)
  - [ ] 13.5 Add migration notes to Story 2.9 file (docs/sprint-artifacts/2-9-*.md)
  - [ ] 13.6 Add migration notes to Story 2.10 file (docs/sprint-artifacts/2-10-*.md)
  - [ ] 13.7 Update `docs/ui-component-architecture.md` with Epic 2 migration patterns
  - [ ] 13.8 Document vim-style keyboard integration with HeroUI Table
  - [ ] 13.9 Add "Epic 2 Migration Complete" note with date

## Dev Notes

### Learnings from Previous Story

**From Story 1.5.3 (Epic 1 Component Migration - Status: done):**

- **HeroUI Component Migration Pattern Established**: Epic 1 successfully migrated with Button, Checkbox, Input, Spinner from HeroUI
- **Custom Button Wrapper Deprecated**: Epic 1 no longer uses `~/components/ui/Button.tsx`, all use HeroUI Button directly
- **HSL Design Token System Working**: All Epic 1 components use design tokens (`bg-olive`, `text-olive-light`) instead of hardcoded hex
- **HeroUIProvider Configuration**: Properly configured in `src/app/providers.tsx` with custom olive theme
- **Tailwind Config Uses HSL**: Theme configuration in `tailwind.config.ts` uses HSL format for all colors
- **Build Validation Pattern**: Both `npm run build` and `npm run typecheck` must pass before marking story complete
- **Comprehensive Testing Required**: Functional, visual, keyboard, and accessibility testing all documented

**Key Files from Story 1.5.3:**
- `src/app/providers.tsx` - HeroUIProvider wrapper (outermost position)
- `tailwind.config.ts` - HeroUI theme with HSL colors (lines 20-75)
- `src/styles/globals.css` - All design tokens in HSL format
- `docs/ui-component-architecture.md` - HeroUI component usage patterns
- Epic 1 story files - Migration notes added as reference

**Patterns to Reuse:**
- **Button Migration**: Replace all React Aria `Button` with HeroUI `Button` (use `color="primary"` for main actions)
- **Form Component Migration**: Use HeroUI Input, TextField, Select instead of React Aria primitives
- **Modal Migration**: Use HeroUI Modal structure (Modal, ModalContent, ModalHeader, ModalBody, ModalFooter)
- **Color Token Usage**: Replace `bg-[#5e6b24]` with `bg-olive` or HeroUI `color="primary"`
- **Systematic Verification**: Test each component migration individually before moving to next
- **Comprehensive Documentation**: Update story files with migration notes, include file:line references

**Critical Context from Story 1.5.3:**
- HeroUI theme uses HSL: `hsl(68, 49%, 28%)` (light) and `hsl(68, 36%, 52%)` (dark) for olive colors
- Design tokens available via Tailwind classes: `bg-olive`, `text-olive-light`, `border-olive-hover`
- HeroUIProvider must wrap entire app (already configured in providers.tsx)
- Keyboard navigation preserved automatically (HeroUI built on React Aria)
- All Epic 1 components passed functional, visual, keyboard, and accessibility testing

### Architecture Decisions

**Epic 2 Component Complexity:**

Epic 2 components are more complex than Epic 1:
- **Vim-Style Navigation**: Table with j/k shortcuts requires custom keyboard handler integration with HeroUI Table
- **Search with Highlighting**: Search bar needs keyword highlighting in results (may need custom implementation)
- **Dynamic Filters**: Filter UI has dynamic dropdown/input combinations
- **Sidebar with Shortcuts**: Query sidebar has 1-9 keyboard shortcuts for quick navigation
- **Complex Modals**: Create/Edit query modals have multi-field forms with validation

**Migration Strategy - Component-by-Component:**

Similar to Epic 1, migrate Story-by-Story:
1. Story 2.2 (Table + vim nav) → Test → Commit
2. Story 2.4 (Search bar) → Test → Commit
3. Story 2.6 (Filters) → Test → Commit
4. Story 2.8 (Sidebar) → Test → Commit
5. Story 2.9 (Modal) → Test → Commit
6. Story 2.10 (Edit/Delete) → Test → Commit

This incremental approach allows:
- Early detection of issues (test after each story migration)
- Easier rollback if needed (git commit per story)
- Progress visibility (track completion per story component)

**HeroUI Table + Vim Shortcuts Integration:**

Key challenge: HeroUI Table has its own keyboard handling. Need to:
1. Use HeroUI Table for structure and accessibility
2. Override/extend keyboard handling for j/k shortcuts
3. Preserve Tab navigation for accessibility
4. Maintain focus management (HeroUI Table handles focus)

Approach:
- Use HeroUI Table with `onKeyDown` prop to intercept j/k keys
- Call HeroUI's selection API to move focus programmatically
- Preserve other keyboard events (Tab, Enter, Esc) for accessibility
- Test that screen readers still work (HeroUI Table ARIA attributes preserved)

**Search Bar + Keyword Highlighting:**

HeroUI Input for search field is straightforward, but keyword highlighting in results may need custom implementation:
- Use HeroUI Input for search field (`color="primary"` for focus ring)
- Keyword highlighting likely uses custom `<mark>` tags or background color
- Ensure highlighted keywords use olive color from theme (`bg-olive-light` or `text-olive`)

**Filter UI Components:**

Filters may use combinations of:
- HeroUI Select for dropdowns (label filter, project filter, author filter)
- HeroUI Input for text inputs (date range, keyword search)
- HeroUI Button for "Apply Filter", "Clear Filters" actions

**Modal Form Patterns:**

Create/Edit query modals should use:
- HeroUI Modal structure (Modal, ModalContent, ModalHeader, ModalBody, ModalFooter)
- HeroUI Input/TextField for form fields (query name, description)
- HeroUI Button for actions (Save → `color="primary"`, Cancel → `color="default"`)
- Form validation with HeroUI's `isInvalid` prop on inputs

**Color Token Usage in Epic 2:**

Epic 2 components currently have many hardcoded hex values (identified in Story 1.5.3 review):
- `text-[#9DAA5F]` (olive-light) → `text-olive-light` or HeroUI `color="primary"`
- `bg-[#5e6b24]` (olive) → `bg-olive`
- `border-[#4B5563]` (gray) → `border-gray-600`

All hex values must be replaced with:
1. HeroUI color props (`color="primary"` for buttons/inputs)
2. Tailwind design token classes (`bg-olive`, `text-gray-300`)
3. Direct HSL values only if HeroUI doesn't support the use case (rare)

**Accessibility Compliance:**

HeroUI provides WCAG 2.1 Level AA compliance out of the box, but Epic 2 has custom vim shortcuts that need testing:
- Vim shortcuts (j/k, /, 1-9) must not break Tab navigation
- Screen readers should still announce table rows, buttons, inputs correctly
- Focus indicators must be visible (olive ring from HeroUI theme)
- All interactive elements must have accessible names (aria-label or visible text)

### Project Structure Alignment

**Epic 2 Component File Locations:**

Based on Epic 2 story breakdown:

| Story | Component Files | Migration Scope |
|-------|----------------|----------------|
| 2.2 (Table + vim nav) | `src/components/dashboard/EventTable.tsx`, vim keyboard handler | Table structure, j/k shortcuts |
| 2.4 (Search bar) | `src/components/search/SearchBar.tsx` | Search input, / shortcut, highlighting |
| 2.6 (Filters) | `src/components/filters/FilterBar.tsx`, filter controls | Dropdowns, inputs, buttons |
| 2.8 (Sidebar) | `src/components/queries/QuerySidebar.tsx` | Sidebar links/buttons, 1-9 shortcuts |
| 2.9 (Create modal) | `src/components/queries/CreateQueryModal.tsx` | Modal structure, form inputs |
| 2.10 (Edit/Delete) | `src/components/queries/EditQueryModal.tsx`, delete confirmation | Edit modal, delete confirmation |

**Files to Modify:**

| File | Expected Changes | Rationale |
|------|------------------|-----------|
| `src/components/dashboard/EventTable.tsx` | Migrate to HeroUI Table, integrate vim shortcuts | Table visual coherence + keyboard nav |
| `src/components/search/SearchBar.tsx` | Migrate to HeroUI Input | Search UI consistency |
| `src/components/filters/FilterBar.tsx` | Migrate to HeroUI Select/Input/Button | Filter UI consistency |
| `src/components/queries/QuerySidebar.tsx` | Migrate to HeroUI Button/Link | Sidebar consistency |
| `src/components/queries/CreateQueryModal.tsx` | Migrate to HeroUI Modal structure | Modal consistency |
| `src/components/queries/EditQueryModal.tsx` | Migrate to HeroUI Modal structure | Modal consistency |
| `docs/ui-component-architecture.md` | Add Epic 2 migration patterns | Developer reference |
| Story files (2.2, 2.4, 2.6, 2.8, 2.9, 2.10) | Add migration notes | Historical record |

**No New Files Created:** This story is a migration/refactor, all changes to existing files.

**No Database Changes:** This story is UI-only, no schema changes.

**No API Changes:** This story is frontend-only, no backend changes.

### Prerequisites

**Required Before This Story:**
- ✅ Story 1.5.1 (done) - HeroUI installed with HSL theme configuration
- ✅ Story 1.5.2 (done) - All design tokens converted to HSL format
- ✅ Story 1.5.3 (done) - Epic 1 components migrated to HeroUI (migration pattern established)
- ✅ Epic 2 (complete) - All components implemented with React Aria

**This Story Enables:**
- Story 1.5.5: Testing & Validation (both Epic 1 and Epic 2 components migrated)
- Epic 3: Can resume with HeroUI foundation in place

**This Story Blocks:**
- Story 1.5.5 depends on Epic 2 migration completion
- Epic 3 (paused) depends on Epic 1.5 completion

### References

**Epic & Architecture Documentation:**
- [Epic 1.5: HeroUI Migration](../epics/epic-1-5-heroui-migration.md) - Complete epic context, Story 1.5.4 breakdown (lines 143-169)
- [Architecture: ADR-008](../architecture.md#adr-008-heroui-for-professional-design-system) - HeroUI decision rationale
- [UI Component Architecture](../ui-component-architecture.md) - Section 1.5 HeroUI setup and configuration
- [UX Design Specification](../ux-design-specification.md) - Section 3.1 Color System (HSL values)

**Related Stories:**
- [Story 1.5.1: HeroUI Setup](./1-5-1-heroui-setup-custom-olive-theme.md) - HeroUI installation and theme config
- [Story 1.5.2: Hex → HSL Migration](./1-5-2-hex-to-hsl-color-migration.md) - Design token conversion
- [Story 1.5.3: Epic 1 Migration](./1-5-3-epic-1-component-migration.md) - Migration pattern reference (CRITICAL)
- Epic 2 Story Files: 2.2, 2.4, 2.6, 2.8, 2.9, 2.10 (to be updated with migration notes)

**Technical References:**
- [HeroUI Component Documentation](https://heroui.com/docs/components) - Button, Input, Select, Table, Modal components
- [HeroUI Theme Customization](https://heroui.com/docs/customization/theme) - Custom olive theme configuration
- [HeroUI Table](https://heroui.com/docs/components/table) - Table keyboard navigation and selection
- [HeroUI Modal](https://heroui.com/docs/components/modal) - Modal structure and focus trap
- [React Aria Components](https://react-spectrum.adobe.com/react-aria/) - Original implementation reference

**HeroUI Components to Use:**
- [Button](https://heroui.com/docs/components/button) - All buttons (primary, secondary, ghost)
- [Input](https://heroui.com/docs/components/input) - Search input, filter text inputs
- [Select](https://heroui.com/docs/components/select) - Filter dropdowns (label, project, author)
- [Table](https://heroui.com/docs/components/table) - Event table structure with vim shortcuts
- [Modal](https://heroui.com/docs/components/modal) - Create/Edit query modals
- [Link](https://heroui.com/docs/components/link) - Sidebar query links (if using Link instead of Button)

### Testing Standards

Per ADR-006 (Minimal Testing for MVP):
- **Required**: TypeScript compilation (`npm run typecheck`)
- **Required**: Production build validation (`npm run build`)
- **Required**: Functional regression testing (manual - all Epic 2 user flows)
- **Required**: Vim keyboard shortcuts testing (j/k, /, 1-9)
- **Required**: Visual regression testing (screenshot comparison)
- **Required**: Accessibility testing (focus indicators, screen reader labels)
- **Not Required**: Unit tests, integration tests for MVP

**Functional Regression Test Scenarios:**

1. **Table Navigation**: j/k moves selection, Enter opens item, / focuses search
2. **Search Flow**: Type query → submit → results display with keyword highlighting
3. **Filter Flow**: Create filter (label/project/author) → apply → results update
4. **Sidebar Navigation**: Click query → load results, 1-9 shortcuts jump to queries
5. **Create Query**: Open modal → fill form → save → query appears in sidebar
6. **Edit Query**: Click edit → change fields → save → changes persist
7. **Delete Query**: Click delete → confirm → query removed from sidebar

**Vim Keyboard Shortcuts Test Scenarios:**

1. **j/k Navigation**: j moves selection down, k moves selection up in table
2. **/ Search Focus**: / key focuses search input, Esc clears focus
3. **Enter Opens Item**: Enter on selected row opens item detail or navigates
4. **1-9 Sidebar Shortcuts**: 1-9 keys jump to corresponding sidebar query
5. **Tab Navigation**: Tab still works for accessibility (cycles through interactive elements)

**Visual Regression Test Scenarios:**

1. **Table Appearance**: 2-line rows, olive selection indicator, focus ring
2. **Search Bar Appearance**: Search input with olive focus ring, search button (if present)
3. **Filter Appearance**: Dropdowns and inputs with olive focus ring, apply/clear buttons
4. **Sidebar Appearance**: Query list with olive active query highlighting
5. **Modal Appearance**: Create/Edit modals with olive primary button, gray cancel button

**Accessibility Test Scenarios:**

1. **Screen Reader - Table**: Table rows announce content, selection state announced
2. **Screen Reader - Search**: Search input has accessible name, results announced
3. **Screen Reader - Filters**: Filter controls have accessible names
4. **Screen Reader - Sidebar**: Sidebar queries have accessible names
5. **Screen Reader - Modals**: Modal title announced, form fields have labels
6. **Focus Indicators**: Olive focus ring visible on all interactive elements
7. **Keyboard Navigation**: All interactive elements reachable via Tab, activatable via Space/Enter
8. **WCAG 2.1 AA**: Color contrast meets requirements (HeroUI provides this)

**Definition of Done:**
- All 24 acceptance criteria met with evidence
- All 13 tasks completed and verified
- All Epic 2 user flows work (table nav, search, filters, sidebar, modals)
- Vim keyboard shortcuts work (j/k, /, 1-9)
- No visual regressions (screenshots confirm)
- Keyboard navigation works (manual testing)
- Accessibility maintained (focus indicators, screen reader labels)
- npm run build passes
- npm run typecheck passes
- Documentation updated (story files, ui-component-architecture.md)
- Story file updated with completion notes

### Edge Cases and Considerations

**Edge Case 1: HeroUI Table with Vim Shortcuts**
- **Issue**: HeroUI Table has built-in keyboard handling, may conflict with j/k shortcuts
- **Mitigation**: Use `onKeyDown` prop to intercept j/k, call selection API programmatically
- **Acceptance**: Custom keyboard handler acceptable if it preserves accessibility (Tab navigation, screen reader support)

**Edge Case 2: Keyword Highlighting in Search Results**
- **Issue**: Keyword highlighting may require custom implementation (not built into HeroUI)
- **Mitigation**: Use custom `<mark>` tag or background color with olive theme color
- **Acceptance**: Custom highlighting acceptable as long as olive color from theme is used

**Edge Case 3: Dynamic Filter Combinations**
- **Issue**: Filters have dynamic combinations of Select and Input components
- **Mitigation**: Use HeroUI Select for dropdowns, Input for text fields, maintain existing logic
- **Acceptance**: Complex filter UI acceptable as long as HeroUI components are used

**Edge Case 4: Sidebar Query List Pattern**
- **Issue**: Sidebar may use HeroUI Listbox or custom styled Button list
- **Mitigation**: Evaluate HeroUI Listbox for selection management, fallback to Button list if needed
- **Acceptance**: Either HeroUI Listbox or custom Button list acceptable as long as components are HeroUI and accessible

**Edge Case 5: Modal Form Validation**
- **Issue**: Create/Edit query modals have form validation
- **Mitigation**: Use HeroUI's `isInvalid` prop on Input components, maintain existing validation logic
- **Acceptance**: Form validation must work identically to Epic 2 original implementation

**Edge Case 6: TypeScript Type Errors with HeroUI Props**
- **Issue**: HeroUI component props may differ from React Aria (e.g., `onPress` vs `onClick`)
- **Mitigation**: Use `onPress` for HeroUI Button (React Aria pattern), run `npm run typecheck` frequently
- **Acceptance**: TypeScript must compile with 0 errors before marking story complete

**Edge Case 7: Partial Migration Visual Inconsistency**
- **Issue**: Mixing migrated Epic 2 components with unmigrated components may look inconsistent
- **Mitigation**: Migrate Story-by-Story (2.2 → 2.4 → 2.6 → 2.8 → 2.9 → 2.10), commit after each
- **Acceptance**: Temporary inconsistency acceptable during migration, resolved by story completion

### Change Log

**2025-12-01** - Story created by create-story workflow. Status: drafted. Story 1.5.4 migrates all Epic 2 components from React Aria (unstyled primitives) to HeroUI (styled components built on React Aria foundation). Builds on migration patterns established in Story 1.5.3 (Epic 1 migration). Comprehensive acceptance criteria cover table with vim navigation, search bar, filters, sidebar, create/edit/delete query modals with functional, visual, keyboard, and accessibility testing requirements. Enables Story 1.5.5 (final testing) and Epic 3 resumption with HeroUI foundation complete.

---

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
