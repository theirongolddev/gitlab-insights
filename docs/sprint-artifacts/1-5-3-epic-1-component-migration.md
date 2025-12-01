# Story 1.5.3: Epic 1 Component Migration

Status: drafted

## Story

As a **developer implementing the HeroUI migration**,
I want **all Epic 1 UI components migrated from React Aria (unstyled) to HeroUI (styled)**,
so that **Epic 1 components have coherent design, reduced maintenance burden, and utilize the unified HSL color system established in Story 1.5.2**.

## Context

**Epic:** 1.5 - HeroUI Migration & HSL Color System
**Priority:** HIGH (blocks Stories 1.5.4-1.5.5 and Epic 3+ implementation)
**Estimated Effort:** 3-4 days

**Background:**
Story 1.5.1 established the HeroUI foundation with HSL-based custom olive theme configuration, and Story 1.5.2 completed the color system migration by converting all design tokens to HSL format. Story 1.5.3 now migrates all Epic 1 components from React Aria (unstyled primitives) to HeroUI (styled components built on React Aria).

**Epic 1 Scope:**
Epic 1 (Walking Skeleton) implemented the foundational application structure:
- Story 1.1: T3 Stack initialization (no UI components)
- Story 1.3: GitLab OAuth authentication (sign-in UI)
- Story 1.4: Project selection onboarding (checkbox list, Continue button)
- Story 1.6: 2-line table view with hardcoded query (ItemRow component)
- Story 1.7: Basic app layout with React Aria (dashboard structure, navigation)
- Story 1.8: Project settings management (settings page, checkboxes)

**Why HeroUI Migration:**
Epic 1-2 implementation with unstyled React Aria Components resulted in:
1. Inconsistent styling across components
2. Poor visual coherence (buttons/forms had different appearances)
3. High maintenance burden (custom styling for each component)
4. Hardcoded hex values scattered in component files

HeroUI solves these issues by providing:
1. Professional design system with coherent styling
2. Styled components that "just work" (less custom CSS)
3. Custom olive theme integration (via Story 1.5.1)
4. Unified HSL color system (via Story 1.5.2)

**Relationship to Previous Work:**
- **Story 1.5.1 (done)**: Installed HeroUI with HSL theme configuration
- **Story 1.5.2 (done)**: Converted all design tokens to HSL format
- **Story 1.5.3 (this story)**: Migrate Epic 1 components to HeroUI
- **Story 1.5.4 (next)**: Migrate Epic 2 components to HeroUI
- **Story 1.5.5 (final)**: Testing, validation, and polish

## Acceptance Criteria

| AC ID | Criterion |
|-------|-----------|
| 1.5.3.1 | Story 1.3 authentication components migrated to HeroUI (sign-in page, auth buttons) |
| 1.5.3.2 | Story 1.4 project selection components migrated to HeroUI (checkbox list, Continue button) |
| 1.5.3.3 | Story 1.6 table view components migrated to HeroUI (ItemRow, Table structure) |
| 1.5.3.4 | Story 1.7 app layout components migrated to HeroUI (navigation, dashboard structure) |
| 1.5.3.5 | Story 1.8 settings components migrated to HeroUI (settings page, project checkboxes) |
| 1.5.3.6 | All hardcoded hex values in Epic 1 components replaced with HeroUI color props or HSL design tokens |
| 1.5.3.7 | All buttons use HeroUI `Button` component (not raw `<button>` or unstyled React Aria `Button`) |
| 1.5.3.8 | All form inputs use HeroUI form components (Checkbox, CheckboxGroup) |
| 1.5.3.9 | Authentication flow works end-to-end (GitLab OAuth sign-in → dashboard) |
| 1.5.3.10 | Project selection onboarding works (select projects → Continue → dashboard) |
| 1.5.3.11 | Dashboard table view displays items correctly (2-line rows, olive accent colors) |
| 1.5.3.12 | Settings page project management works (add/remove projects, save) |
| 1.5.3.13 | Keyboard navigation preserved (Tab, Enter, Space for interactive elements) |
| 1.5.3.14 | Accessibility maintained (WCAG 2.1 Level AA - screen reader labels, focus indicators) |
| 1.5.3.15 | No visual regressions from Epic 1 original implementation (compare screenshots) |
| 1.5.3.16 | No functional regressions (all Epic 1 user flows work identically) |
| 1.5.3.17 | `npm run build` succeeds with no errors |
| 1.5.3.18 | `npm run typecheck` passes with no TypeScript errors |
| 1.5.3.19 | Migration notes added to Epic 1 story files (1.3, 1.4, 1.6, 1.7, 1.8) |
| 1.5.3.20 | `docs/ui-component-architecture.md` updated with Epic 1 component migration patterns |

## Tasks / Subtasks

- [ ] Task 1: Migrate Story 1.3 Authentication Components (AC: 1.5.3.1, 1.5.3.9)
  - [ ] 1.1 Locate authentication components (sign-in page, auth buttons)
  - [ ] 1.2 Identify current implementation (React Aria Button, custom styling)
  - [ ] 1.3 Replace with HeroUI Button components
  - [ ] 1.4 Update button variants: "Sign in with GitLab" → `color="primary"`
  - [ ] 1.5 Remove hardcoded hex colors, use HeroUI theme props
  - [ ] 1.6 Test GitLab OAuth flow: click button → redirect → callback → dashboard
  - [ ] 1.7 Verify visual appearance matches Epic 1 design intent

- [ ] Task 2: Migrate Story 1.4 Project Selection Onboarding (AC: 1.5.3.2, 1.5.3.10)
  - [ ] 2.1 Locate onboarding page components (project checkbox list, Continue button)
  - [ ] 2.2 Replace checkbox implementation with HeroUI `CheckboxGroup` and `Checkbox`
  - [ ] 2.3 Replace Continue button with HeroUI `Button` component (`color="primary"`)
  - [ ] 2.4 Remove hardcoded hex colors from checkbox styles
  - [ ] 2.5 Test onboarding flow: select projects → click Continue → dashboard
  - [ ] 2.6 Verify project selection persists correctly
  - [ ] 2.7 Test keyboard navigation: Tab through checkboxes, Space to toggle, Enter on Continue button

- [ ] Task 3: Migrate Story 1.6 Table View Components (AC: 1.5.3.3, 1.5.3.11)
  - [ ] 3.1 Locate ItemRow component and table structure
  - [ ] 3.2 Evaluate HeroUI `Table` component for 2-line row pattern
  - [ ] 3.3 Migrate table structure to HeroUI `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
  - [ ] 3.4 Update ItemRow styling to use HeroUI classes and design tokens
  - [ ] 3.5 Replace hardcoded olive hex values with HeroUI `color="primary"` or HSL tokens
  - [ ] 3.6 Verify 2-line row layout (52px height, badge + title + snippet)
  - [ ] 3.7 Test table rendering: items display correctly, olive accents visible
  - [ ] 3.8 Verify "NEW" badge styling (olive background from HeroUI theme)

- [ ] Task 4: Migrate Story 1.7 App Layout Components (AC: 1.5.3.4)
  - [ ] 4.1 Locate app layout components (navigation, dashboard structure)
  - [ ] 4.2 Identify navigation elements (sidebar, nav links)
  - [ ] 4.3 Migrate navigation links to HeroUI `Link` or `Button` components as appropriate
  - [ ] 4.4 Update layout styling to use HeroUI spacing and color utilities
  - [ ] 4.5 Remove hardcoded hex colors from layout components
  - [ ] 4.6 Verify dashboard structure renders correctly
  - [ ] 4.7 Test navigation: clicking links navigates to correct pages

- [ ] Task 5: Migrate Story 1.8 Settings Components (AC: 1.5.3.5, 1.5.3.12)
  - [ ] 5.1 Locate settings page components (project management checkboxes, Save button)
  - [ ] 5.2 Replace checkboxes with HeroUI `CheckboxGroup` and `Checkbox`
  - [ ] 5.3 Replace Save button with HeroUI `Button` component (`color="primary"`)
  - [ ] 5.4 Remove hardcoded hex colors from settings page
  - [ ] 5.5 Test settings flow: change project selection → click Save → verify persistence
  - [ ] 5.6 Test keyboard navigation on settings page

- [ ] Task 6: Global Component Audit (AC: 1.5.3.6, 1.5.3.7, 1.5.3.8)
  - [ ] 6.1 Search codebase for hardcoded hex values in Epic 1 component files
  - [ ] 6.2 Replace all hex values with HeroUI color props or HSL design tokens
  - [ ] 6.3 Audit all buttons: ensure all use HeroUI `Button` component
  - [ ] 6.4 Audit all form inputs: ensure all use HeroUI form components
  - [ ] 6.5 Verify no raw `<button>` or `<input type="checkbox">` elements remain

- [ ] Task 7: Functional Regression Testing (AC: 1.5.3.9-1.5.3.12, 1.5.3.16)
  - [ ] 7.1 Test authentication flow: sign in → GitLab OAuth → callback → dashboard
  - [ ] 7.2 Test onboarding flow: first-time user → project selection → Continue → dashboard
  - [ ] 7.3 Test dashboard table: items display correctly with 2-line rows
  - [ ] 7.4 Test settings page: modify projects → Save → verify persistence
  - [ ] 7.5 Test navigation: dashboard ↔ settings navigation works
  - [ ] 7.6 Document any functional issues found (should be none)

- [ ] Task 8: Visual Regression Testing (AC: 1.5.3.15)
  - [ ] 8.1 Take screenshots of Epic 1 pages before migration (if available)
  - [ ] 8.2 Take screenshots of Epic 1 pages after HeroUI migration
  - [ ] 8.3 Compare visual appearance: buttons, forms, table, layout
  - [ ] 8.4 Verify olive accent colors render correctly (buttons, NEW badges, focus rings)
  - [ ] 8.5 Verify gray backgrounds and borders (table rows, form inputs)
  - [ ] 8.6 Document any visual differences (minor improvements expected, no regressions)

- [ ] Task 9: Accessibility Testing (AC: 1.5.3.13, 1.5.3.14)
  - [ ] 9.1 Test keyboard navigation on authentication page (Tab, Enter)
  - [ ] 9.2 Test keyboard navigation on onboarding page (Tab, Space, Enter)
  - [ ] 9.3 Test keyboard navigation on dashboard table (Tab, arrow keys if applicable)
  - [ ] 9.4 Test keyboard navigation on settings page (Tab, Space, Enter)
  - [ ] 9.5 Verify focus indicators visible (olive focus ring from HeroUI theme)
  - [ ] 9.6 Test screen reader labels (Button, Checkbox have accessible names)
  - [ ] 9.7 Verify WCAG 2.1 Level AA compliance maintained (HeroUI provides this)

- [ ] Task 10: Build and TypeScript Validation (AC: 1.5.3.17, 1.5.3.18)
  - [ ] 10.1 Run: `npm run typecheck` to verify no TypeScript errors
  - [ ] 10.2 Run: `npm run build` to verify production build succeeds
  - [ ] 10.3 Check build output for warnings or errors
  - [ ] 10.4 Verify all Epic 1 pages included in build output
  - [ ] 10.5 Production build validation complete

- [ ] Task 11: Documentation Updates (AC: 1.5.3.19, 1.5.3.20)
  - [ ] 11.1 Add migration notes to Story 1.3 file (`docs/sprint-artifacts/1-3-*.md`)
  - [ ] 11.2 Add migration notes to Story 1.4 file (`docs/sprint-artifacts/1-4-*.md`)
  - [ ] 11.3 Add migration notes to Story 1.6 file (`docs/sprint-artifacts/1-6-*.md`)
  - [ ] 11.4 Add migration notes to Story 1.7 file (`docs/sprint-artifacts/1-7-*.md`)
  - [ ] 11.5 Add migration notes to Story 1.8 file (`docs/sprint-artifacts/1-8-*.md`)
  - [ ] 11.6 Update `docs/ui-component-architecture.md` Section 1.5 with Epic 1 migration patterns
  - [ ] 11.7 Document common migration patterns (Button, Checkbox, Table)
  - [ ] 11.8 Add "Epic 1 Migration Complete" note with date

## Dev Notes

### Learnings from Previous Story

**From Story 1.5.2 (Hex → HSL Color System Migration - Status: done):**

- **Unified HSL Color System Available**: All design tokens in `src/styles/globals.css` converted to HSL format with inline hex comments for reference
- **HeroUI Theme Alignment**: Olive colors `hsl(68, 49%, 28%)` (light) and `hsl(68, 36%, 52%)` (dark) match HeroUI theme configuration exactly
- **Visual Regression Testing Pattern**: Use screenshots before/after for comparison, browser DevTools color picker for verification
- **Inline Documentation**: Comprehensive inline comments and conversion tables aid debugging and code review
- **Build Validation Required**: Both `npm run build` and `npm run typecheck` must pass before marking story complete
- **Zero False Completions**: Every task verified with file:line evidence - maintain this quality standard

**Key Files from Story 1.5.2:**
- `src/styles/globals.css` - All design tokens in HSL format (use these instead of hardcoded colors)
- `docs/ui-component-architecture.md` - Section 1.5.3.1 has complete hex→HSL conversion table
- `docs/ux-design-specification.md` - Section 3.1 updated with HSL color definitions

**Patterns to Reuse:**
- **Visual Regression Testing**: Screenshot Epic 1 pages before/after migration for comparison
- **Systematic Verification**: Test each component migration individually before moving to next
- **Comprehensive Documentation**: Update story files with migration notes, include file:line references
- **Build Validation**: Run typecheck and build after major changes to catch errors early

**Critical Context from Story 1.5.2:**
- HeroUI theme uses HSL: `hsl(68, 49%, 28%)` and `hsl(68, 36%, 52%)` for olive colors
- Design tokens available via Tailwind classes: `bg-olive`, `text-olive-light`, `border-olive-hover`
- Test page pattern: `/test-heroui-theme` demonstrates HeroUI component usage (reference for migration patterns)
- Build and typecheck passed with no errors - maintain this standard

### Architecture Decisions

**HeroUI Component Selection for Epic 1 Migration:**

Story 1.5.3 migrates Epic 1 components from React Aria (unstyled) to HeroUI (styled). HeroUI provides styled React Aria components with custom olive theme integration.

**Migration Strategy:**

1. **Button Migration**: Replace all React Aria `Button` with HeroUI `Button`
   - Use `color="primary"` for primary actions (Continue, Save, Sign In)
   - Use `color="default"` for secondary actions (Cancel)
   - Remove custom className styling (HeroUI handles appearance)

2. **Form Component Migration**: Replace React Aria form primitives with HeroUI equivalents
   - `Checkbox` → HeroUI `Checkbox` (with olive checked state from theme)
   - `CheckboxGroup` → HeroUI `CheckboxGroup` (for project selection lists)
   - Remove custom checkbox styling (HeroUI handles appearance)

3. **Table Migration**: Migrate table structure to HeroUI `Table` components
   - Evaluate if HeroUI Table supports 2-line row pattern (may need custom ItemRow)
   - Use HeroUI Table for structure, may retain custom ItemRow for unique 52px height requirement
   - Apply olive accent colors via HeroUI theme (focus rings, hover states)

4. **Layout Migration**: Update app layout to use HeroUI spacing and color utilities
   - Navigation links may use HeroUI `Link` or `Button` as appropriate
   - Remove hardcoded hex colors, use design tokens or HeroUI color props

**Component-by-Component Migration Approach:**

Rather than migrating all components at once, migrate Story-by-Story:
1. Story 1.3 (Auth) → Test → Commit
2. Story 1.4 (Onboarding) → Test → Commit
3. Story 1.6 (Table) → Test → Commit
4. Story 1.7 (Layout) → Test → Commit
5. Story 1.8 (Settings) → Test → Commit

This incremental approach allows:
- Early detection of issues (test after each story migration)
- Easier rollback if needed (git commit per story)
- Progress visibility (track completion per story component)

**Color Token Usage:**

Epic 1 components currently use hardcoded hex values like:
- `bg-[#5e6b24]` (olive) → `bg-olive` or HeroUI `color="primary"`
- `text-[#9DAA5F]` (olive-light) → `text-olive-light`
- `border-[#4B5563]` (gray) → `border-gray-600`

Story 1.5.3 removes all hardcoded hex values, replacing with:
1. HeroUI color props (`color="primary"` for buttons)
2. Tailwind design token classes (`bg-olive`, `text-gray-300`)
3. Direct HSL values only if HeroUI doesn't support the use case

**Keyboard Navigation Preservation:**

HeroUI is built on React Aria, so keyboard navigation is preserved automatically:
- Tab: Focus next interactive element
- Space: Activate checkboxes, buttons
- Enter: Activate buttons, submit forms

No custom keyboard handlers needed for Epic 1 components (Epic 2 will handle vim-style shortcuts).

**Accessibility Compliance:**

HeroUI provides WCAG 2.1 Level AA compliance out of the box:
- Focus indicators: Olive focus ring from custom theme
- Screen reader labels: HeroUI components include proper ARIA attributes
- Keyboard navigation: All interactive elements keyboard-accessible

No additional accessibility work needed beyond using HeroUI components correctly.

### Project Structure Alignment

**Epic 1 Component File Locations:**

Based on Epic 1 story breakdown:

| Story | Component Files | Migration Scope |
|-------|----------------|----------------|
| 1.3 (Auth) | `src/app/page.tsx` (sign-in), BetterAuth components | Sign-in button, auth flow UI |
| 1.4 (Onboarding) | `src/app/onboarding/page.tsx` | Project checkbox list, Continue button |
| 1.6 (Table) | `src/components/dashboard/ItemRow.tsx`, table structure | ItemRow component, table layout |
| 1.7 (Layout) | `src/app/layout.tsx`, navigation components | App structure, nav links |
| 1.8 (Settings) | `src/app/settings/page.tsx` | Settings checkboxes, Save button |

**Files to Modify:**

| File | Expected Changes | Rationale |
|------|------------------|-----------|
| `src/app/page.tsx` | Migrate auth button to HeroUI | Sign-in flow UI coherence |
| `src/app/onboarding/page.tsx` | Migrate checkboxes + Continue button | Onboarding form consistency |
| `src/components/dashboard/ItemRow.tsx` | Migrate to HeroUI Table pattern | Table visual coherence |
| `src/app/layout.tsx` | Migrate navigation links | Layout consistency |
| `src/app/settings/page.tsx` | Migrate checkboxes + Save button | Settings form consistency |
| `docs/ui-component-architecture.md` | Add Epic 1 migration patterns | Developer reference |
| Story files (1.3, 1.4, 1.6, 1.7, 1.8) | Add migration notes | Historical record |

**No New Files Created:** This story is a migration/refactor, all changes to existing files.

**No Database Changes:** This story is UI-only, no schema changes.

**No API Changes:** This story is frontend-only, no backend changes.

### Prerequisites

**Required Before This Story:**
- ✅ Story 1.5.1 (done) - HeroUI installed with HSL theme configuration
- ✅ Story 1.5.2 (done) - All design tokens converted to HSL format
- ✅ Epic 1 (complete) - All components implemented with React Aria

**This Story Enables:**
- Story 1.5.4: Epic 2 Component Migration (Epic 1 migration pattern established)
- Story 1.5.5: Testing & Validation (Epic 1 components migrated)

**This Story Blocks:**
- Stories 1.5.4-1.5.5 depend on Epic 1 migration completion

### References

**Epic & Architecture Documentation:**
- [Epic 1.5: HeroUI Migration](../epics/epic-1-5-heroui-migration.md) - Complete epic context, Story 1.5.3 breakdown (lines 114-134)
- [Architecture: ADR-008](../architecture.md#adr-008-heroui-for-professional-design-system) - HeroUI decision rationale
- [UI Component Architecture](../ui-component-architecture.md) - Section 1.5 HeroUI setup and configuration
- [UX Design Specification](../ux-design-specification.md) - Section 3.1 Color System (HSL values)

**Related Stories:**
- [Story 1.5.1: HeroUI Setup](./1-5-1-heroui-setup-custom-olive-theme.md) - HeroUI installation and theme config
- [Story 1.5.2: Hex → HSL Migration](./1-5-2-hex-to-hsl-color-migration.md) - Design token conversion (reference for color usage)
- Epic 1 Story Files: 1.3, 1.4, 1.6, 1.7, 1.8 (to be updated with migration notes)

**Technical References:**
- [HeroUI Component Documentation](https://heroui.com/docs/components) - Button, Checkbox, Table, Link components
- [HeroUI Theme Customization](https://heroui.com/docs/customization/theme) - Custom olive theme configuration
- [React Aria Components](https://react-spectrum.adobe.com/react-aria/) - Original implementation reference

**HeroUI Components to Use:**
- [Button](https://heroui.com/docs/components/button) - All buttons (primary, secondary, ghost)
- [Checkbox](https://heroui.com/docs/components/checkbox) - Individual checkboxes
- [CheckboxGroup](https://heroui.com/docs/components/checkbox-group) - Project selection lists
- [Table](https://heroui.com/docs/components/table) - Table structure (evaluate for 2-line rows)
- [Link](https://heroui.com/docs/components/link) - Navigation links

### Testing Standards

Per ADR-006 (Minimal Testing for MVP):
- **Required**: TypeScript compilation (`npm run typecheck`)
- **Required**: Production build validation (`npm run build`)
- **Required**: Functional regression testing (manual - all Epic 1 user flows)
- **Required**: Visual regression testing (screenshot comparison)
- **Required**: Keyboard navigation testing (Tab, Space, Enter)
- **Required**: Accessibility testing (focus indicators, screen reader labels)
- **Not Required**: Unit tests, integration tests for MVP

**Functional Regression Test Scenarios:**

1. **Authentication Flow**: Sign in button → GitLab OAuth redirect → callback → dashboard
2. **Onboarding Flow**: First-time user → project selection → Continue button → dashboard
3. **Dashboard Table**: Items display with 2-line rows (badge + title + snippet)
4. **Settings Management**: Modify project selection → Save button → verify persistence
5. **Navigation**: Dashboard ↔ settings navigation links work

**Visual Regression Test Scenarios:**

1. **Button Appearance**: Primary buttons (Continue, Save, Sign In) have olive background
2. **Checkbox Appearance**: Checkboxes have olive checked state, proper hover/focus
3. **Table Appearance**: 2-line rows render correctly, olive NEW badges visible
4. **Focus Indicators**: Olive focus ring visible on all interactive elements
5. **Layout Consistency**: Navigation, dashboard structure visually coherent

**Keyboard Navigation Test Scenarios:**

1. **Auth Page**: Tab focuses Sign In button, Enter triggers OAuth flow
2. **Onboarding Page**: Tab through checkboxes, Space toggles, Enter activates Continue
3. **Dashboard Table**: Tab focuses table, arrow keys navigate (if applicable)
4. **Settings Page**: Tab through checkboxes and Save button, Space and Enter work

**Accessibility Test Scenarios:**

1. **Screen Reader**: All buttons have accessible names ("Sign in with GitLab", "Continue", "Save")
2. **Focus Indicators**: Olive focus ring visible on all interactive elements
3. **Keyboard Navigation**: All interactive elements reachable via Tab, activatable via Space/Enter
4. **WCAG 2.1 AA**: Color contrast meets requirements (HeroUI provides this)

**Definition of Done:**
- All 20 acceptance criteria met with evidence
- All 11 tasks completed and verified
- All Epic 1 user flows work (authentication, onboarding, dashboard, settings)
- No visual regressions (screenshots confirm)
- Keyboard navigation works (manual testing)
- Accessibility maintained (focus indicators, screen reader labels)
- npm run build passes
- npm run typecheck passes
- Documentation updated (story files, ui-component-architecture.md)
- Story file updated with completion notes

### Edge Cases and Considerations

**Edge Case 1: HeroUI Table 2-Line Row Pattern**
- **Issue**: HeroUI Table may not support custom 52px height 2-line rows out of the box
- **Mitigation**: Evaluate HeroUI Table structure, may retain custom ItemRow component with HeroUI styling
- **Acceptance**: Custom ItemRow acceptable if HeroUI Table doesn't support 2-line pattern, as long as olive colors from theme are used

**Edge Case 2: Button Variant Mapping**
- **Issue**: Epic 1 may have multiple button styles (primary, secondary, ghost) that need mapping to HeroUI variants
- **Mitigation**:
  - Primary actions (Continue, Save, Sign In) → `color="primary"` (olive)
  - Secondary actions (Cancel) → `color="default"` (gray)
  - Ghost/minimal → `variant="light"` or `variant="ghost"`

**Edge Case 3: Checkbox List Alignment**
- **Issue**: Project selection checkbox lists may need custom spacing/alignment not provided by HeroUI CheckboxGroup
- **Mitigation**: Use HeroUI CheckboxGroup for structure, add custom spacing classes if needed
- **Acceptance**: Minor layout adjustments acceptable as long as HeroUI components are used for interactive elements

**Edge Case 4: Authentication Flow UI**
- **Issue**: BetterAuth may provide its own sign-in UI, unclear if custom button or BetterAuth component
- **Investigation**: Check Story 1.3 implementation to determine if custom button or BetterAuth component
- **Migration**: If custom button, migrate to HeroUI. If BetterAuth component, leave as-is if not stylable

**Edge Case 5: Navigation Link vs Button**
- **Issue**: Navigation elements may be links (`<a>`) or buttons (`<button>`) depending on routing approach
- **Mitigation**:
  - Internal navigation (Next.js routes) → HeroUI `Link` component with `href`
  - Action navigation (e.g., logout) → HeroUI `Button` component with `onPress`

**Edge Case 6: Partial Migration Conflicts**
- **Issue**: Mixing React Aria (unstyled) and HeroUI (styled) components may look inconsistent during migration
- **Mitigation**: Migrate Story-by-Story (1.3 → 1.4 → 1.6 → 1.7 → 1.8), commit after each story to track progress
- **Acceptance**: Temporary inconsistency acceptable during migration, but should be resolved by story completion

**Edge Case 7: TypeScript Type Errors**
- **Issue**: HeroUI component props may differ from React Aria component props (e.g., `onPress` vs `onClick`)
- **Mitigation**:
  - HeroUI Button uses `onPress` (React Aria pattern)
  - Update all button handlers to use `onPress` instead of `onClick`
  - Run `npm run typecheck` frequently to catch type errors early

### Change Log

**2025-12-01** - Story created by create-story workflow. Status: drafted. Story 1.5.3 migrates all Epic 1 components from React Aria (unstyled primitives) to HeroUI (styled components built on React Aria foundation). Establishes migration patterns for Epic 2 (Story 1.5.4). Enables Stories 1.5.4-1.5.5 with Epic 1 component migration complete. Comprehensive acceptance criteria cover authentication, onboarding, table view, app layout, and settings components with functional, visual, keyboard, and accessibility testing requirements.

---

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
