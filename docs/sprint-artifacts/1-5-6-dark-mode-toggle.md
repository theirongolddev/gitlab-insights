# Story 1.5.6: Dark Mode Toggle & System Preference Detection

**Epic:** 1.5 - HeroUI Migration & HSL Color System
**Status:** ready-for-dev
**Effort:** 1-2 days
**Priority:** Medium
**Dependencies:** Story 1.5.3 (Epic 1 Component Migration) must complete
**Created:** 2025-12-01
**Context Generated:** 2025-12-02

---

## Objective

Implement dark mode toggle mechanism to activate the existing dark theme styling infrastructure created in Stories 1.5.1 and 1.5.2.

---

## User Story

**As a** user of GitLab Insights
**I want to** toggle between light and dark modes
**So that** I can choose the theme that's most comfortable for my eyes and working environment

---

## Context

The HeroUI migration (Stories 1.5.1 and 1.5.2) successfully created comprehensive dark mode styling infrastructure:
- 163 `dark:` Tailwind classes throughout codebase
- Complete HeroUI light/dark theme definitions in `tailwind.config.ts`
- HSL color system fully converted

However, there's no mechanism to activate dark mode. Users are stuck in light mode despite all the dark styling being ready.

**This story completes the theme system by adding:**
- Theme state management (React Context)
- Toggle UI component in Header
- System preference detection
- localStorage persistence
- FOUC prevention

---

## Scope

### In Scope

✅ Theme state management using React Context API
✅ Theme toggle button in Header (icon-only, before settings icon)
✅ System preference detection (auto-detect OS dark mode)
✅ localStorage persistence (remember user choice across sessions)
✅ FOUC prevention (no flash of wrong theme on page load)
✅ Keyboard accessibility (Tab + Space/Enter to toggle)

### Out of Scope

❌ Multiple theme options beyond light/dark
❌ Per-query or per-page theme overrides
❌ Scheduled theme switching (time-based auto-switching)
❌ Theme customization UI (color picker, etc.)

---

## Technical Specification

**Reference Plan:** `/Users/tayloreernisse/.claude/plans/mutable-splashing-kahan.md`

### Implementation Architecture

**Three-Layer Approach:**

**Layer 1: Utilities** (`/src/lib/theme.ts`)
- Type definitions: `ThemeMode` ('light' | 'dark'), `ThemePreference` ('system' | 'light' | 'dark')
- System detection: `getSystemTheme()` using `matchMedia`
- Theme resolution: `resolveTheme()` maps preference to effective theme
- DOM application: `applyTheme()` toggles `dark` class on `<html>`

**Layer 2: State Management** (`/src/contexts/ThemeContext.tsx`)
- ThemeProvider component using Context API
- localStorage persistence (key: `gitlab-insights-theme`)
- Real-time system preference tracking with `matchMedia` listener
- `useTheme()` hook for components

**Layer 3: UI Component** (`/src/components/theme/ThemeToggle.tsx`)
- Icon-only HeroUI Button with sun/moon icons
- Cycles through themes on click
- Accessible with proper aria-labels

**Layer 0: FOUC Prevention** (`/src/app/layout.tsx`)
- Inline blocking `<script>` in `<head>`
- Reads localStorage and applies `dark` class before React hydration
- Prevents flash of wrong theme

### Implementation Steps

**Step 1: Create Theme Utilities**
- **File:** `/src/lib/theme.ts`
- **Content:** Type definitions, utility functions
- **Why First:** No dependencies, provides types for all other files

**Step 2: Create ThemeProvider**
- **File:** `/src/contexts/ThemeContext.tsx`
- **Pattern:** Follow SearchContext, ShortcutContext, ToastContext
- **Content:** State management, localStorage, matchMedia listener

**Step 3: Create ThemeToggle Component**
- **File:** `/src/components/theme/ThemeToggle.tsx`
- **Pattern:** Icon-only HeroUI Button
- **Content:** Sun/moon icons, `useTheme()` hook

**Step 4: Add FOUC Prevention Script**
- **File:** `/src/app/layout.tsx`
- **Content:** Inline `<script>` in `<head>` before body
- **Critical:** Must execute before React hydration

**Step 5: Integrate ThemeProvider**
- **File:** `/src/app/providers.tsx`
- **Change:** Wrap with ThemeProvider (outermost)
- **Why Outermost:** Must wrap HeroUIProvider for theme changes

**Step 6: Add Toggle to Header**
- **File:** `/src/components/layout/Header.tsx`
- **Change:** Insert ThemeToggle before settings icon (line ~150)
- **Position:** Top-right area of Header

### Critical Files to Modify

1. **`/src/lib/theme.ts`** - NEW - Utility functions and types
2. **`/src/contexts/ThemeContext.tsx`** - NEW - Theme state management
3. **`/src/components/theme/ThemeToggle.tsx`** - NEW - Toggle UI component
4. **`/src/app/layout.tsx`** - MODIFY - Add FOUC prevention script to `<head>`
5. **`/src/app/providers.tsx`** - MODIFY - Wrap with ThemeProvider
6. **`/src/components/layout/Header.tsx`** - MODIFY - Add ThemeToggle component

---

## Acceptance Criteria

### Functional Requirements

1. ✅ **AC 1.5.6.1:** App defaults to system preference (light/dark OS setting detected automatically)
2. ✅ **AC 1.5.6.2:** Manual toggle in Header works and cycles between light/dark modes
3. ✅ **AC 1.5.6.3:** Theme preference persists across sessions (stored in localStorage)
4. ✅ **AC 1.5.6.4:** No FOUC on page load (inline script prevents flash of wrong theme)
5. ✅ **AC 1.5.6.5:** All existing `dark:` classes (163 instances) activate correctly in dark mode
6. ✅ **AC 1.5.6.6:** HeroUI components use dark theme colors (olive-light #9DAA5F / hsl(68, 36%, 52%))
7. ✅ **AC 1.5.6.7:** Toggle button is keyboard accessible (Tab navigation + Space/Enter activation)
8. ✅ **AC 1.5.6.8:** System preference changes update app automatically (no reload required)

### Technical Requirements

9. ✅ **AC 1.5.6.9:** `npm run typecheck` passes with no TypeScript errors
10. ✅ **AC 1.5.6.10:** `npm run build` succeeds with no build errors
11. ✅ **AC 1.5.6.11:** No React hydration warnings in browser console
12. ✅ **AC 1.5.6.12:** Bundle size increase < 5KB (theme code is lightweight)

### Accessibility Requirements

13. ✅ **AC 1.5.6.13:** Toggle button has proper aria-label ("Switch to dark mode" / "Switch to light mode")
14. ✅ **AC 1.5.6.14:** Focus ring visible when tabbing to toggle (olive theme color)
15. ✅ **AC 1.5.6.15:** Screen reader announces theme change action

---

## Testing Strategy

### Manual Testing

**Test 1: System Preference Detection**
1. Clear localStorage (`localStorage.clear()` in console)
2. Set OS to light mode → Verify app loads in light mode
3. Set OS to dark mode → Verify app loads in dark mode
4. ✅ Expected: App matches OS preference

**Test 2: Manual Toggle**
1. Load app in light mode
2. Click toggle button → Verify switches to dark mode
3. Click toggle button again → Verify switches back to light mode
4. ✅ Expected: Toggle cycles between themes

**Test 3: Persistence**
1. Toggle to dark mode
2. Hard reload page (Cmd+Shift+R / Ctrl+Shift+R)
3. ✅ Expected: Dark mode persists after reload

**Test 4: Real-Time System Tracking**
1. Ensure theme preference is set to 'system' (clear localStorage)
2. Change OS theme while app is open (System Preferences → Appearance)
3. ✅ Expected: App updates automatically without reload

**Test 5: FOUC Prevention**
1. Set localStorage to 'dark' (`localStorage.setItem('gitlab-insights-theme', 'dark')`)
2. Hard reload page
3. ✅ Expected: NO flash of light mode before dark mode loads

**Test 6: HeroUI Component Rendering**
1. Toggle to dark mode
2. Verify HeroUI Button uses olive-light color (#9DAA5F)
3. Check all interactive components (buttons, inputs, dropdowns, modals)
4. ✅ Expected: All components render correctly in dark mode

### Keyboard Accessibility Testing

1. Tab to toggle button → ✅ Olive focus ring visible
2. Press Space → ✅ Theme changes
3. Press Enter → ✅ Theme changes
4. ✅ Screen reader announces action ("Switch to dark mode")

### Visual Regression Testing

1. Take screenshots of key pages in light mode
2. Toggle to dark mode
3. Take screenshots of same pages in dark mode
4. Compare: All `dark:` classes should activate
5. ✅ Expected: Visual consistency in both themes

### Edge Case Testing

**Edge Case 1: localStorage Disabled (Privacy Mode)**
- Toggle theme in privacy mode
- ✅ Expected: Theme works per-session, resets on reload, no errors thrown

**Edge Case 2: Hydration Mismatch**
- FOUC script and ThemeProvider read same localStorage key
- ✅ Expected: States match by hydration time, no warnings

**Edge Case 3: System Preference Changes**
- matchMedia listener updates automatically
- ✅ Expected: Only active when preference is 'system'

---

## Documentation Updates

As part of this story, update the following documentation:

1. **architecture.md**
   - Update ADR-008 (HeroUI Decision) with theme system details
   - Add theme management to Frontend Stack section

2. **ui-component-architecture.md**
   - Add new section: "Theme Management"
   - Document ThemeContext architecture and file responsibilities

3. **ux-design-specification.md**
   - Update Section 1.1: Mark dark mode implementation as completed
   - Add Section 3.5: Dark Mode Support details

---

## Tasks / Subtasks

- [ ] **Task 1:** Create theme utilities (`/src/lib/theme.ts`)
  - [ ] 1.1 Define TypeScript types (ThemeMode, ThemePreference)
  - [ ] 1.2 Implement `getSystemTheme()` using matchMedia
  - [ ] 1.3 Implement `resolveTheme()` preference mapping
  - [ ] 1.4 Implement `applyTheme()` DOM class toggling
  - [ ] 1.5 Export `THEME_STORAGE_KEY` constant

- [ ] **Task 2:** Create ThemeProvider (`/src/contexts/ThemeContext.tsx`)
  - [ ] 2.1 Set up ThemeContext with React.createContext
  - [ ] 2.2 Implement ThemeProvider component
  - [ ] 2.3 Add localStorage initialization (default: 'system')
  - [ ] 2.4 Add matchMedia listener for system preference changes
  - [ ] 2.5 Implement useEffect for DOM application
  - [ ] 2.6 Add localStorage persistence on change
  - [ ] 2.7 Create useTheme() hook
  - [ ] 2.8 Export ThemeProvider and useTheme

- [ ] **Task 3:** Create ThemeToggle component (`/src/components/theme/ThemeToggle.tsx`)
  - [ ] 3.1 Import HeroUI Button and useTheme hook
  - [ ] 3.2 Implement toggle button (isIconOnly, variant="light", size="sm")
  - [ ] 3.3 Add sun icon (for dark mode → "click for light")
  - [ ] 3.4 Add moon icon (for light mode → "click for dark")
  - [ ] 3.5 Wire up toggleTheme() on button press
  - [ ] 3.6 Add proper aria-label for accessibility

- [ ] **Task 4:** Add FOUC prevention script (`/src/app/layout.tsx`)
  - [ ] 4.1 Locate `<head>` section in layout
  - [ ] 4.2 Add inline `<script>` with dangerouslySetInnerHTML
  - [ ] 4.3 Implement localStorage read and validation
  - [ ] 4.4 Implement system preference detection (matchMedia)
  - [ ] 4.5 Apply 'dark' class if needed
  - [ ] 4.6 Wrap in try/catch for safety

- [ ] **Task 5:** Integrate ThemeProvider (`/src/app/providers.tsx`)
  - [ ] 5.1 Import ThemeProvider from contexts
  - [ ] 5.2 Wrap existing provider chain (must be outermost)
  - [ ] 5.3 Verify provider order: ThemeProvider → HeroUIProvider → ...

- [ ] **Task 6:** Add ThemeToggle to Header (`/src/components/layout/Header.tsx`)
  - [ ] 6.1 Import ThemeToggle component
  - [ ] 6.2 Insert before settings icon (around line 150)
  - [ ] 6.3 Verify layout and spacing

- [ ] **Task 7:** Testing & Validation
  - [ ] 7.1 Run all manual test cases
  - [ ] 7.2 Run keyboard accessibility tests
  - [ ] 7.3 Run visual regression tests
  - [ ] 7.4 Test edge cases
  - [ ] 7.5 Verify `npm run typecheck` passes
  - [ ] 7.6 Verify `npm run build` succeeds
  - [ ] 7.7 Check bundle size impact (<5KB)

- [ ] **Task 8:** Documentation Updates
  - [ ] 8.1 Update architecture.md (ADR-008)
  - [ ] 8.2 Update ui-component-architecture.md (Theme Management)
  - [ ] 8.3 Update ux-design-specification.md (Sections 1.1 and 3.5)

---

## Definition of Done

Story 1.5.6 is complete when:

1. ✅ All 6 implementation steps completed
2. ✅ All 15 acceptance criteria met
3. ✅ All test cases pass (manual, keyboard, visual regression, edge cases)
4. ✅ TypeScript compilation passes (`npm run typecheck`)
5. ✅ Production build succeeds (`npm run build`)
6. ✅ No hydration warnings
7. ✅ Bundle size increase < 5KB verified
8. ✅ All documentation updated (architecture, ui-component, ux-design)
9. ✅ Code reviewed and approved
10. ✅ Merged to main branch

---

## Related Artifacts

**Implementation Plan:** `/Users/tayloreernisse/.claude/plans/mutable-splashing-kahan.md`

**Sprint Change Proposal:** `/docs/sprint-change-proposal-dark-mode-2025-12-01.md`

**Epic:** `/docs/epics/epic-1-5-heroui-migration.md`

**Related Stories:**
- Story 1.5.1: HeroUI Setup & Custom Olive Theme Configuration (created theme definitions)
- Story 1.5.2: Hex → HSL Color System Migration (converted to HSL)
- Story 1.5.3: Epic 1 Component Migration (revealed the gap)
- Story 1.5.5: Testing, Validation & Polish (includes dark mode testing)

**Code References:**
- Tailwind Config: `tailwind.config.ts` (light/dark theme definitions)
- Existing Contexts: `src/contexts/SearchContext.tsx`, `src/contexts/ShortcutContext.tsx`, `src/contexts/ToastContext.tsx`
- Header Component: `src/components/layout/Header.tsx`

---

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/1-5-6-dark-mode-toggle.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List
