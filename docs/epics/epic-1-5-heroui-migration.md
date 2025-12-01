# Epic 1.5: HeroUI Migration & HSL Color System

**Status:** Backlog
**Priority:** CRITICAL (blocks Epic 3-7)
**Estimated Duration:** 2-3 weeks (13-20 days)
**Dependencies:** Epic 1 ✅ Complete, Epic 2 ✅ Complete
**Blocks:** Epic 3 (paused until migration complete)

---

## Overview

Migrate all Epic 1-2 UI components from React Aria Components (unstyled primitives) to HeroUI (styled components built on React Aria foundation) and convert the entire color system from hex to HSL format.

**Trigger:** UI coherence issues discovered during Epic 1-2 implementation and Story 3.2 drafting. React Aria (unstyled) approach resulted in inconsistent styling, poor visual coherence, and high maintenance burden.

**Solution:** HeroUI provides professional design system built on React Aria, maintaining accessibility and keyboard navigation while adding coherent styling and design tokens.

---

## Objectives

### Primary Objectives

1. **Migrate UI Components to HeroUI**
   - Replace all React Aria component implementations with HeroUI equivalents
   - Preserve keyboard navigation and accessibility (React Aria foundation maintained)
   - Maintain functional parity with Epic 1-2 implementations

2. **Convert Color System to HSL**
   - Convert all hex color codes → HSL format
   - Implement HSL-based custom olive theme in HeroUI
   - Update design tokens and CSS custom properties

3. **Achieve UI Coherence**
   - Establish consistent design system across all components
   - Professional visual polish with HeroUI styling
   - Reduce maintenance burden for styling

4. **Enable Dark Mode Toggle** (Added 2025-12-01)
   - Implement theme state management with Context API
   - Add toggle UI in Header with system preference detection
   - Persist user preference in localStorage
   - Prevent FOUC (flash of unstyled content)

### Secondary Objectives

1. **Documentation Updates**
   - Revise ADR-008 (HeroUI decision)
   - Update ui-component-architecture.md for HeroUI patterns
   - Update ux-design-specification.md (design system, colors, components)
   - Add migration notes to Epic 1-2 artifacts

2. **Preserve Quality**
   - Maintain WCAG 2.1 Level AA accessibility
   - No performance regressions
   - No functional regressions
   - Vim-style keyboard shortcuts preserved

---

## Success Criteria

Epic 1.5 is complete when:

1. ✅ All Epic 1-2 components migrated to HeroUI
2. ✅ All colors converted from hex → HSL
3. ✅ Custom olive theme renders correctly AND users can toggle between light/dark modes with system preference detection
4. ✅ Keyboard navigation preserved (j/k, vim-style shortcuts)
5. ✅ Accessibility maintained (WCAG 2.1 Level AA)
6. ✅ No visual regressions from Epic 1-2
7. ✅ No functional regressions from Epic 1-2
8. ✅ Performance equivalent or better
9. ✅ Documentation updated (Architecture, UX Spec, UI Component Guide)
10. ✅ Epic 3 ready to resume with HeroUI foundation

---

## Story Breakdown

### Story 1.5.1: HeroUI Setup & Custom Olive Theme Configuration
**Effort:** 2-3 days
**Status:** Backlog

**Scope:**
- Install HeroUI dependencies (`@heroui/react`, `@heroui/theme`)
- Configure custom olive theme in `tailwind.config.js` (HSL-based)
- Update Vite configuration for Tailwind v4
- Verify theme renders correctly (light/dark modes)
- Document theme configuration in ui-component-architecture.md
- Revise ADR-008 in architecture.md (HeroUI decision)

**Deliverables:**
- HeroUI installed and configured
- Custom olive theme working
- ADR-008 revised
- Theme documentation complete

---

### Story 1.5.2: Hex → HSL Color System Migration
**Effort:** 1-2 days
**Status:** Backlog

**Scope:**
- Convert all `src/styles/globals.css` hex → HSL
- Update CSS custom properties
- Verify color rendering identical to hex
- Add inline comments to globals.css
- Document hex→HSL conversion table in ui-component-architecture.md
- Update ux-design-specification.md Section 3.1 (color system)

**Deliverables:**
- All colors converted to HSL
- Visual rendering identical
- Conversion table documented
- UX spec color section updated

---

### Story 1.5.3: Epic 1 Component Migration
**Effort:** 3-4 days
**Status:** Backlog

**Scope:**
- Migrate Story 1.3 (Auth screens) to HeroUI
- Migrate Story 1.4 (Project selection) to HeroUI
- Migrate Story 1.6 (Table view) to HeroUI
- Migrate Story 1.7 (App layout) to HeroUI
- Test all Epic 1 functionality
- Update Epic 1 component patterns in ui-component-architecture.md
- Add migration notes to tech-spec-epic-1.md
- Add migration notes to story files (1.3, 1.4, 1.6, 1.7)

**Deliverables:**
- All Epic 1 components use HeroUI
- All Epic 1 functionality works
- Epic 1 documentation updated
- Migration notes added

---

### Story 1.5.4: Epic 2 Component Migration
**Effort:** 5-7 days
**Status:** Backlog

**Scope:**
- Migrate Story 2.2 (Table + vim nav) to HeroUI
- Migrate Story 2.4 (Search bar) to HeroUI
- Migrate Story 2.6 (Filters) to HeroUI
- Migrate Story 2.8 (Sidebar) to HeroUI
- Migrate Story 2.9 (Modal) to HeroUI
- Migrate Story 2.10 (Buttons) to HeroUI
- Test all Epic 2 functionality
- Verify vim-style shortcuts work
- Update Epic 2 component patterns in ui-component-architecture.md
- Document vim-style keyboard integration with HeroUI Table
- Add migration notes to tech-spec-epic-2.md
- Add migration notes to story files (2.2, 2.4, 2.6, 2.8, 2.9, 2.10)
- Update ux-design-specification.md Section 1.1 (Design System Choice)
- Update ux-design-specification.md Section 6 (Component Library)

**Deliverables:**
- All Epic 2 components use HeroUI
- All Epic 2 functionality works
- Vim shortcuts preserved
- Epic 2 documentation updated
- UX spec updated

---

### Story 1.5.6: Dark Mode Toggle & System Preference Detection
**Effort:** 1-2 days
**Status:** Backlog
**Added:** 2025-12-01 (Sprint Change Proposal)

**Scope:**
- Create theme utilities (`/src/lib/theme.ts`)
- Create ThemeProvider with Context API (`/src/contexts/ThemeContext.tsx`)
- Create ThemeToggle component (`/src/components/theme/ThemeToggle.tsx`)
- Add FOUC prevention script to layout (`/src/app/layout.tsx`)
- Integrate ThemeProvider in providers (`/src/app/providers.tsx`)
- Add ThemeToggle to Header (`/src/components/layout/Header.tsx`)
- System preference detection (matchMedia API)
- localStorage persistence for user preference
- Update documentation (architecture.md, ui-component-architecture.md, ux-design-specification.md)

**Deliverables:**
- Dark mode toggle working in Header
- System preference auto-detection functioning
- Theme persistence across sessions
- No FOUC (flash of unstyled content)
- All 163 `dark:` classes activate correctly
- Documentation updated

**Reference:** Sprint Change Proposal `/docs/sprint-change-proposal-dark-mode-2025-12-01.md`

---

### Story 1.5.5: Testing, Validation & Polish
**Effort:** 2-3 days
**Status:** Backlog

**Scope:**
- Visual regression testing
- Functional testing (all Epic 1-2 features)
- Keyboard navigation testing
- Accessibility testing (WCAG 2.1 AA)
- Performance testing
- Final documentation consistency review
- Fix any issues found
- Final polish

**Deliverables:**
- All tests pass
- No regressions
- Documentation consistent
- Epic 3 ready to resume

---

## Technical Approach

### HeroUI Integration

**Why HeroUI:**
- Built on React Aria Components (preserves accessibility foundation)
- Professional design system (solves coherence issues)
- Custom theming support (olive/moss green colors)
- Tailwind CSS integration (matches current approach)

**Custom Olive Theme Configuration:**
```js
// tailwind.config.js
const {heroui} = require("@heroui/react");

module.exports = {
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "hsl(68, 49%, 28%)", // #5e6b24
              foreground: "#FFFFFF",
            },
            focus: "hsl(68, 49%, 28%)",
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "hsl(68, 36%, 52%)", // #9DAA5F
              foreground: "#000000",
            },
            focus: "hsl(68, 36%, 52%)",
          },
        },
      },
    }),
  ],
};
```

### HSL Color System

**Conversion Table (Hex → HSL):**
```
/* Olive/Moss Accent */
#5e6b24 → hsl(68, 49%, 28%)
#9DAA5F → hsl(68, 36%, 52%)

/* Backgrounds */
#2d2e2e → hsl(0, 2%, 18%)
#FDFFFC → hsl(120, 100%, 99%)

/* Semantic Colors */
#16A34A → hsl(142, 71%, 37%)  // success
#F59E0B → hsl(38, 92%, 50%)   // warning
#B91C1C → hsl(0, 72%, 42%)    // error
#0284C7 → hsl(199, 97%, 39%)  // info
```

**Benefits:**
- Easier color manipulation (lightness/saturation)
- Better theme system support
- More maintainable
- Standard for modern CSS

### Migration Pattern

**Before (React Aria):**
```tsx
import { Button } from 'react-aria-components';

<Button className="px-4 py-2 bg-olive text-white hover:bg-olive-hover">
  Click Me
</Button>
```

**After (HeroUI):**
```tsx
import { Button } from '@heroui/react';

<Button color="primary">
  Click Me
</Button>
```

### Keyboard Navigation Preservation

**Critical:** HeroUI uses React Aria under the hood, so keyboard navigation is preserved. Custom vim-style shortcuts must be maintained:

```tsx
<Table
  aria-label="Items"
  onKeyDown={(e) => {
    if (e.key === 'j') handleNextItem();
    if (e.key === 'k') handlePrevItem();
  }}
>
  {/* table content */}
</Table>
```

---

## Risks & Mitigation

### Risk 1: Timeline Slippage
**Probability:** Medium
**Impact:** Medium (delays Epic 3-7)
**Mitigation:**
- Clear story breakdown with effort estimates
- Regular progress tracking
- Parallel work where possible

### Risk 2: Keyboard Navigation Regression
**Probability:** Low
**Impact:** High (breaks core UX principle)
**Mitigation:**
- HeroUI uses React Aria under hood
- Dedicated testing in Story 1.5.5
- Preserve custom keyboard handlers

### Risk 3: Theme Customization Issues
**Probability:** Low
**Impact:** Medium (olive colors not working)
**Mitigation:**
- ✅ Already verified HeroUI supports custom themes
- Story 1.5.1 validates theme early

### Risk 4: Scope Creep
**Probability:** Medium
**Impact:** Medium (timeline extension)
**Mitigation:**
- Strict scope: Only migrate, don't redesign
- Focus on functional parity
- Defer enhancements to Epic 3+

---

## Dependencies

### Depends On
- ✅ Epic 1: Walking Skeleton (complete)
- ✅ Epic 2: User-Controlled Queries (complete)

### Blocks
- ⏸️ Epic 3: Catch-Up Mode & Background Sync (paused at Story 3.2)
- Epic 4: Split View & Detail Navigation
- Epic 5: Keyboard Foundation
- Epic 6: Reliability & Error Handling
- Epic 7: Production Readiness & Polish

---

## Related Artifacts

**Sprint Change Proposal:**
- `docs/sprint-change-proposal-heroui-migration-2025-11-28.md`

**Documentation to Update:**
- `docs/architecture.md` (ADR-008)
- `docs/ui-component-architecture.md` (complete rewrite)
- `docs/ux-design-specification.md` (Sections 1.1, 3.1, 6)
- `docs/sprint-artifacts/tech-spec-epic-1.md` (migration notes)
- `docs/sprint-artifacts/tech-spec-epic-2.md` (migration notes)

**Code Artifacts:**
- `tailwind.config.js` (HeroUI theme configuration)
- `src/styles/globals.css` (hex → HSL conversion)
- `vite.config.ts` (Tailwind v4 plugin)
- All Epic 1-2 component files

---

## Timeline Impact

**Original MVP:** 6-8 weeks
**With Epic 1.5:** 8-11 weeks (+2-3 weeks)
**Quality Improvement:** Significant (coherent UI, maintainable colors)

**Justification:** 2-3 week investment now prevents accumulating technical debt and increases velocity for Epic 3-7.

---

## Definition of Done

Epic 1.5 is done when:

1. All 5 stories completed (1.5.1 through 1.5.5)
2. All acceptance criteria met for each story
3. All tests pass (visual, functional, keyboard, accessibility, performance)
4. All documentation updated and reviewed
5. Epic 1.5 retrospective completed (optional but recommended)
6. Sprint status updated
7. Epic 3 Story 3.2 ready to resume development

---

**Next Action:** Draft Story 1.5.1 using `/bmad:bmm:workflows:create-story`
