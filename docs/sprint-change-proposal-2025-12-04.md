# Sprint Change Proposal: Light Mode Color Specification & Contrast Fixes

**Date:** 2025-12-04
**Author:** BMad Method (Correct Course Workflow)
**Status:** Approved & Applied

---

## 1. Change Summary

**Trigger:** Story 1.5.6 (Dark Mode Toggle) implemented successfully, but:
1. The UX specification lacked explicit light mode color definitions
2. Light mode had poor contrast between page backgrounds and elevated surfaces (cards, header, sidebar)

**Category:** Misunderstanding/gap in original requirements - UX spec was written dark-mode-first, and light mode contrast was not visually validated

**Resolution:** Direct Adjustment - Documentation updates AND code fixes to establish proper light mode visual hierarchy

---

## 2. Problem Statement

### 2.1 Documentation Gap
The dark mode toggle was implemented correctly, but the supporting documentation was incomplete:

1. **`globals.css`** - Semantic tokens explicitly labeled "Dark Mode Context" with no light mode equivalents
2. **UX Design Specification** - Color values showed dark/light pairs but usage mapping only documented dark mode
3. **UI Component Architecture** - Semantic tokens section only referenced dark mode context

### 2.2 Light Mode Contrast Issue
Components used `bg-bg-light` (#FDFFFC) for page backgrounds and `bg-white` (#FFFFFF) for elevated surfaces - these colors are nearly identical, creating **zero visual hierarchy** between:
- Page background vs. header
- Page background vs. cards
- Page background vs. sidebar

---

## 3. Impact Assessment

| Area | Impact | Action Required |
|------|--------|-----------------|
| PRD | None | No changes |
| Architecture | None | No changes |
| Epics | None | No epic modifications |
| UX Specification | **Primary** | Added light/dark mode pairing table |
| UI Component Architecture | **Secondary** | Updated semantic tokens section |
| globals.css | **Primary** | Added light mode semantic tokens |
| **Component Code** | **Primary** | Fixed light mode backgrounds for contrast |

---

## 4. Documentation Changes Applied

### 4.1 `src/styles/globals.css`

**Added:** Light mode semantic tokens alongside existing dark mode tokens

```css
/* Light Mode Semantic Tokens (Default) */
--color-text-primary: var(--color-gray-900);
--color-text-secondary: var(--color-gray-500);
--color-text-tertiary: var(--color-gray-400);
--color-bg-surface: var(--color-bg-light);
--color-bg-elevated: var(--color-gray-50);
--color-border-default: var(--color-gray-200);
--color-border-subtle: var(--color-gray-100);

/* Dark Mode Semantic Tokens */
--color-text-primary-dark: var(--color-gray-50);
--color-text-secondary-dark: var(--color-gray-300);
--color-text-tertiary-dark: var(--color-gray-400);
--color-bg-surface-dark: var(--color-bg-dark);
--color-bg-elevated-dark: var(--color-gray-800);
--color-border-default-dark: var(--color-gray-600);
--color-border-subtle-dark: var(--color-gray-700);
```

### 4.2 `docs/ux-design-specification.md`

**Added:** "Light vs Dark Mode Color Pairing Pattern" section

- Complete pairing table showing light/dark mode value mappings
- Tailwind usage pattern example
- Semantic color pairing table (success, warning, error, info)
- Key principle: "Light mode uses darker/richer values; dark mode uses lighter/brighter values"

### 4.3 `docs/ui-component-architecture.md`

**Updated:** Section 1.1 "Semantic Tokens (Contextual)" → "Semantic Tokens (Theme-Aware)"

- Added table showing token mappings for both light and dark modes
- Added reference to `globals.css` as source of truth
- Added Tailwind usage example with dark: prefix pattern

---

## 5. Code Changes Applied

### 5.1 Light Mode Background Contrast Fix

**Problem:** `bg-bg-light` (#FDFFFC) and `bg-white` (#FFFFFF) are visually identical, creating no contrast between page background and elevated surfaces.

**Solution:** 
- Page background: `bg-gray-100` (#F3F4F6) - provides visible tint
- Elevated surfaces (header, sidebar, cards): `bg-white` - pure white stands out

### 5.2 Files Modified - Background Contrast

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Changed body background from `bg-bg-light` to `bg-gray-100` |
| `src/app/page.tsx` | Removed redundant `bg-bg-light` (inherits from body) |
| `src/components/dashboard/DashboardClient.tsx` | Removed redundant `bg-bg-light` from container and loading states |
| `src/components/onboarding/OnboardingClient.tsx` | Removed redundant `bg-bg-light` from loading states |
| `src/components/projects/ProjectSelectionLayout.tsx` | Removed redundant `bg-bg-light` from container and loading states |
| `src/components/dashboard/SimpleEventList.tsx` | Replaced hardcoded hex colors with design tokens |

### 5.3 Tag Pill / Accent Color Contrast Fix

**Problem:** Tag pills and selected states used `olive-light` (lighter olive) backgrounds in light mode, creating poor contrast against light backgrounds.

**Solution:** Apply the light/dark pairing pattern consistently:
- Light mode: Use `olive` (darker) for backgrounds - provides visible contrast
- Dark mode: Use `olive-light` (lighter) for backgrounds - provides visible contrast

### 5.4 Files Modified - Tag Pill Contrast

| File | Change |
|------|--------|
| `src/components/search/SearchBar.tsx` | Tag pills: `bg-olive-light/15` → `bg-olive/15`, border and remove button colors updated |
| `src/components/queries/QueryDetailClient.tsx` | Keyword pills: `bg-olive-light/15` → `bg-olive/15` |
| `src/components/queries/CreateQueryModal.tsx` | Keyword pills: `bg-olive-light/15` → `bg-olive/15` |
| `src/components/ui/NavList.tsx` | Active nav item: `bg-olive-light/10` → `bg-olive/10`, shortcut badge updated |
| `src/components/dashboard/EventTable.tsx` | Selected row: `bg-olive-light/10` → `bg-olive/10` |

### 5.5 Light Mode Visual Hierarchy (After Fix)

```
┌─────────────────────────────────────────────────────────┐
│ Header: bg-white                                         │  ← Elevated (white)
├─────────────────────────────────────────────────────────┤
│         │                                               │
│ Sidebar │  Page Content Area                            │
│ bg-white│  bg-gray-100                                  │  ← Page background (tinted)
│         │                                               │
│         │  ┌─────────────────────────────────────────┐  │
│         │  │ Card: bg-white                         │  │  ← Elevated (white)
│         │  └─────────────────────────────────────────┘  │
│         │                                               │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Validation

- [x] Documentation updates complete
- [x] Light mode now has visible contrast between page background and elevated surfaces
- [x] Tag pills and accent colors now have proper contrast in light mode
- [x] Dark mode unchanged (backward compatible)
- [x] No `bg-bg-light` usages remain in src/ directory
- [x] Hardcoded hex colors replaced with design tokens
- [x] TypeScript compilation passes with no errors

---

## 7. Follow-Up Actions

None required. Both documentation and code changes are complete.

---

## 8. Approval

| Role | Approver | Date |
|------|----------|------|
| Product Owner | Taylor | 2025-12-04 |

---

*Generated by BMad Method Correct Course Workflow*
