# Story 1.5.1: HeroUI Setup & Custom Olive Theme Configuration

Status: ready-for-dev

## Story

As a **developer implementing Epic 1-2 component migrations**,
I want **HeroUI installed with a custom olive/moss green theme configured**,
so that **I have a professional design system foundation that maintains our brand colors and supports both light/dark modes**.

## Context

**Epic:** 1.5 - HeroUI Migration & HSL Color System
**Priority:** CRITICAL (blocks Epic 3-7)
**Estimated Effort:** 2-3 days

**Background:**
Epic 1-2 were implemented using React Aria Components (unstyled primitives), resulting in UI coherence issues, inconsistent styling, and high maintenance burden. This story initiates the migration to HeroUI - a professional design system built on the React Aria foundation.

Story 1.5.1 establishes the foundation for the entire Epic 1.5 migration by:
1. Installing HeroUI dependencies
2. Configuring custom olive/moss green theme (brand colors)
3. Ensuring light/dark mode support
4. Documenting the architectural decision and theme configuration

**Why HeroUI:**
- Built on React Aria Components (preserves accessibility and keyboard navigation)
- Professional design system (solves coherence issues from Epic 1-2)
- Custom theming support (olive/moss green colors)
- Tailwind CSS integration (matches current approach)

**Relationship to Previous Work:**
- Story 3.1 was the last completed story (Catch-Up Mode Backend)
- Epic 1.5 was inserted to address UI quality issues before continuing Epic 3
- This story enables Stories 1.5.2-1.5.5 (color migration and component migration)

## Acceptance Criteria

| AC ID | Criterion |
|-------|-----------|
| 1.5.1.1 | HeroUI packages (`@heroui/react`, `@heroui/theme`) installed in package.json with compatible versions |
| 1.5.1.2 | `tailwind.config.js` includes HeroUI plugin configuration with custom olive theme using HSL color format |
| 1.5.1.3 | Custom olive theme includes both light mode (hsl(68, 49%, 28%)) and dark mode (hsl(68, 36%, 52%)) primary colors |
| 1.5.1.4 | `vite.config.ts` updated for Tailwind v4 compatibility (if changes required) |
| 1.5.1.5 | Simple test component renders successfully with HeroUI Button showing olive theme in both light and dark modes |
| 1.5.1.6 | `docs/ui-component-architecture.md` Section 1 updated to document HeroUI setup and theme configuration |
| 1.5.1.7 | `docs/architecture.md` ADR-008 revised to document HeroUI decision (replacing React Aria decision) |
| 1.5.1.8 | `npm run build` succeeds with no errors |
| 1.5.1.9 | `npm run typecheck` passes with no TypeScript errors |

## Tasks / Subtasks

- [ ] Task 1: Install HeroUI Dependencies (AC: 1.5.1.1)
  - [ ] 1.1 Check current project dependencies in package.json
  - [ ] 1.2 Check HeroUI documentation for latest stable version compatibility with React 19 and Next.js 16
  - [ ] 1.3 Run: `npm install @heroui/react @heroui/theme`
  - [ ] 1.4 Verify installation in package.json (both packages listed in dependencies)
  - [ ] 1.5 Run: `npm install` to ensure lock file updated
  - [ ] 1.6 Check for peer dependency warnings (resolve if present)

- [ ] Task 2: Configure HeroUI Plugin in Tailwind Config (AC: 1.5.1.2, 1.5.1.3)
  - [ ] 2.1 Open `tailwind.config.js` (or `tailwind.config.ts` if TypeScript)
  - [ ] 2.2 Import HeroUI plugin: `const { heroui } = require("@heroui/react");`
  - [ ] 2.3 Add heroui() to plugins array
  - [ ] 2.4 Configure custom olive theme with light/dark variants:
    - Light mode primary: `hsl(68, 49%, 28%)` (#5e6b24)
    - Dark mode primary: `hsl(68, 36%, 52%)` (#9DAA5F)
    - Focus color matches primary for each mode
  - [ ] 2.5 Set foreground colors (white for light mode olive, black for dark mode olive)
  - [ ] 2.6 Reference Epic 1.5 docs for complete theme configuration example (lines 199-229)
  - [ ] 2.7 Verify syntax and save file

- [ ] Task 3: Update Vite Configuration for Tailwind v4 (AC: 1.5.1.4)
  - [ ] 3.1 Check current Tailwind CSS version in package.json
  - [ ] 3.2 Review `vite.config.ts` for Tailwind plugin configuration
  - [ ] 3.3 If Tailwind v4: Verify vite config includes Tailwind plugin correctly
  - [ ] 3.4 If Tailwind v3: Add migration notes to Dev Notes (defer v4 upgrade if not critical)
  - [ ] 3.5 Ensure PostCSS configured properly for HeroUI
  - [ ] 3.6 Note: HeroUI works with both Tailwind v3 and v4

- [ ] Task 4: Create Test Component to Verify Theme (AC: 1.5.1.5)
  - [ ] 4.1 Create test page: `src/app/test-heroui-theme/page.tsx`
  - [ ] 4.2 Import HeroUI Button: `import { Button } from "@heroui/react";`
  - [ ] 4.3 Add HeroUIProvider wrapper (required for HeroUI components)
  - [ ] 4.4 Create test buttons with different variants (primary, secondary, default)
  - [ ] 4.5 Add theme toggle button to switch between light/dark modes
  - [ ] 4.6 Run dev server: `npm run dev`
  - [ ] 4.7 Navigate to `/test-heroui-theme` in browser
  - [ ] 4.8 Verify olive primary color renders correctly in both modes
  - [ ] 4.9 Verify button interactions work (hover, focus, press states)
  - [ ] 4.10 Take screenshots for documentation (optional)
  - [ ] 4.11 Note: Test page will be deleted after Epic 1.5 completion

- [ ] Task 5: Update ui-component-architecture.md (AC: 1.5.1.6)
  - [ ] 5.1 Open `docs/ui-component-architecture.md`
  - [ ] 5.2 Update Section 1 (Executive Summary) to reflect HeroUI as primary UI library
  - [ ] 5.3 Add new section: "1.5 HeroUI Setup & Configuration"
  - [ ] 5.4 Document installation steps (npm install commands)
  - [ ] 5.5 Document theme configuration (tailwind.config.js example)
  - [ ] 5.6 Document HSL color values for olive theme (light/dark modes)
  - [ ] 5.7 Add code examples for basic HeroUI component usage
  - [ ] 5.8 Update migration strategy section (React Aria → HeroUI patterns)
  - [ ] 5.9 Add note: "Updated as part of Story 1.5.1 (2025-11-28)"

- [ ] Task 6: Revise ADR-008 in architecture.md (AC: 1.5.1.7)
  - [ ] 6.1 Open `docs/architecture.md`
  - [ ] 6.2 Locate ADR-008 (currently about React Aria Components)
  - [ ] 6.3 Revise title: "ADR-008: HeroUI for Professional Design System"
  - [ ] 6.4 Update Decision section: HeroUI instead of React Aria
  - [ ] 6.5 Update Rationale: Professional design system built on React Aria foundation
  - [ ] 6.6 Document why changed: UI coherence issues from unstyled primitives
  - [ ] 6.7 Update Consequences: Pros (coherent UI, easier maintenance) and Cons (larger bundle)
  - [ ] 6.8 Add amendment history: "Revised 2025-11-28 in Story 1.5.1"
  - [ ] 6.9 Note: React Aria still foundation (HeroUI built on it)
  - [ ] 6.10 Keep original ADR-008 context in amendment history for traceability

- [ ] Task 7: Build and TypeScript Validation (AC: 1.5.1.8, 1.5.1.9)
  - [ ] 7.1 Run: `npm run typecheck` to verify no TypeScript errors
  - [ ] 7.2 Fix any type errors related to HeroUI imports
  - [ ] 7.3 Run: `npm run build` to verify production build succeeds
  - [ ] 7.4 Check build output for warnings or errors
  - [ ] 7.5 Verify build size is reasonable (HeroUI adds ~100-200KB)
  - [ ] 7.6 Test production build locally if possible: `npm run start`

## Dev Notes

### Learnings from Previous Story

**From Story 3.1 (Catch-Up Mode Backend - Status: done):**

- **Quality-First Development**: Story 3.1 achieved zero false completions - every task marked complete was verified. This standard must be maintained.
- **TypeScript Safety**: npm typecheck + npm build required before marking story complete
- **Test Infrastructure**: Created test page (`/test-catch-up`) for manual validation - follow same pattern for HeroUI theme testing
- **Documentation Standards**: Comprehensive Dev Notes with citations, architectural alignment verification, security review
- **Prisma Patterns**: Used `@map()` directive for DB/code naming differences (not applicable to this story but good reference)
- **File Management**: Test pages created during development should be documented for later removal

**Key Files from Story 3.1:**
- `prisma/schema.prisma` - Database schema updates
- `src/server/api/routers/queries.ts` - tRPC procedures
- Test page pattern at `src/app/test-catch-up/page.tsx` (reference for Task 4)

**Patterns to Reuse:**
- Create test page for manual validation (Task 4)
- Comprehensive task validation before marking complete
- Build + typecheck validation (Task 7)
- Document all file changes in Dev Agent Record

**Review Standards Applied:**
- All ACs must have clear evidence of completion
- No tasks marked complete without verification
- Documentation updates are part of DoD, not optional

### Architecture Decisions

**HeroUI Selection Rationale:**

HeroUI chosen over continuing with React Aria Components (unstyled) for:
1. **Professional Design System**: Coherent, polished UI out of the box
2. **React Aria Foundation**: Maintains accessibility and keyboard navigation benefits
3. **Custom Theming**: Supports our olive/moss green brand colors
4. **Tailwind Integration**: Works seamlessly with existing Tailwind v4 setup
5. **Maintenance Reduction**: Less custom styling code, more standardized components

**Theme Configuration Strategy:**

```javascript
// tailwind.config.js
const {heroui} = require("@heroui/react");

module.exports = {
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "hsl(68, 49%, 28%)", // #5e6b24 - Olive
              foreground: "#FFFFFF",
            },
            focus: "hsl(68, 49%, 28%)",
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "hsl(68, 36%, 52%)", // #9DAA5F - Olive Light
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

**HSL Color Format:**
- Using HSL instead of hex for easier color manipulation
- Enables theme variations (lighter/darker) by adjusting lightness value
- Standard format for modern CSS theming systems
- Story 1.5.2 will convert all remaining hex colors to HSL

**Vite + Tailwind v4 Compatibility:**
- HeroUI supports both Tailwind v3 and v4
- No major vite.config changes expected
- PostCSS configuration should work out of the box

### Project Structure Alignment

**Files to Modify:**
| File | Changes | Rationale |
|------|---------|-----------|
| `package.json` | Add @heroui/react, @heroui/theme | Core dependencies |
| `tailwind.config.js` (or .ts) | Add heroui plugin with custom theme | Theme configuration |
| `vite.config.ts` | Verify Tailwind v4 compatibility | Build configuration |
| `docs/ui-component-architecture.md` | Section 1 + new Section 1.5 | HeroUI setup documentation |
| `docs/architecture.md` | Revise ADR-008 | Architectural decision record |

**Files to Create:**
| File | Description | Purpose |
|------|-------------|---------|
| `src/app/test-heroui-theme/page.tsx` | Test page for theme validation | Manual testing (AC 1.5.1.5) |

**No Database Changes:** This story is configuration-only, no schema changes.

**No API Changes:** This story is UI-only, no backend changes.

### Prerequisites

**Required Before This Story:**
- ✅ Epic 1: Walking Skeleton (complete) - T3 Stack initialized
- ✅ Epic 2: User-Controlled Queries (complete) - Tailwind CSS configured
- ✅ Story 3.1 (complete) - Previous story context available
- ✅ Node.js + npm installed
- ✅ Tailwind CSS v4 configured (verify in Task 3)

**This Story Enables:**
- Story 1.5.2: Hex → HSL Color System Migration (requires HeroUI theme as reference)
- Story 1.5.3: Epic 1 Component Migration (requires HeroUI installed)
- Story 1.5.4: Epic 2 Component Migration (requires HeroUI installed)
- Story 1.5.5: Testing & Validation (requires all migrations complete)

### References

**HeroUI Documentation:**
- [HeroUI Official Docs](https://heroui.com/) - Component library documentation
- [HeroUI Theme Customization](https://heroui.com/docs/customization/theme) - Custom theme guide
- [HeroUI with Next.js](https://heroui.com/docs/frameworks/nextjs) - Next.js integration
- [HeroUI GitHub](https://github.com/heroui-inc/heroui) - Source code and issues

**Epic & Architecture Documentation:**
- [Epic 1.5: HeroUI Migration](../epics/epic-1-5-heroui-migration.md) - Complete epic context
- [Architecture: ADR-008](../architecture.md#adr-008-react-aria-components-for-keyboard-first-ux) - Current decision (to be revised)
- [UI Component Architecture](../ui-component-architecture.md) - Component standards (to be updated)
- [UX Design Specification](../ux-design-specification.md) - Color system and design tokens

**Related Stories:**
- [Story 3.1: Catch-Up Mode Backend](./3-1-catch-up-mode-backend-new-since-last-visit-logic.md) - Previous completed story
- Epic 1.5 Story Breakdown in [Epic 1.5 docs](../epics/epic-1-5-heroui-migration.md#story-breakdown)

**Technical References:**
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs) - Styling framework
- [HSL Color Format](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl) - Color notation reference
- [Vite Configuration](https://vitejs.dev/config/) - Build tool configuration

### Testing Standards

Per ADR-006 (Minimal Testing for MVP):
- **Required**: TypeScript compilation (`npm run typecheck`)
- **Required**: Production build validation (`npm run build`)
- **Required**: Manual testing via test page (AC 1.5.1.5)
- **Not Required**: Unit tests, integration tests for MVP

**Manual Test Scenarios:**
1. **Installation Verification**: Check package.json for @heroui dependencies
2. **Theme Configuration**: Verify tailwind.config includes heroui plugin
3. **Light Mode Theme**: Test page shows olive (#5e6b24) primary button
4. **Dark Mode Theme**: Toggle to dark, verify olive-light (#9DAA5F) primary button
5. **Button Interactions**: Hover, focus, press states work correctly
6. **Build Success**: No errors in production build
7. **TypeScript Safety**: No type errors in typecheck

**Definition of Done:**
- All 9 acceptance criteria met with evidence
- All 7 tasks completed and verified
- Test page renders successfully with olive theme
- Documentation updated (ui-component-architecture.md, architecture.md ADR-008)
- npm run build passes
- npm run typecheck passes
- Story file updated with completion notes

### Edge Cases and Considerations

**Edge Case 1: HeroUI Version Compatibility**
- **Issue**: HeroUI may not support React 19 or Next.js 16 yet (bleeding edge)
- **Mitigation**: Check HeroUI docs for latest compatibility matrix in Task 1.2
- **Fallback**: If incompatible, document in Dev Notes and escalate to PM for decision

**Edge Case 2: Tailwind v4 Plugin Conflicts**
- **Issue**: HeroUI plugin may conflict with existing Tailwind v4 setup
- **Mitigation**: Review vite.config and PostCSS setup carefully in Task 3
- **Resolution**: HeroUI documentation should cover Tailwind v4 integration

**Edge Case 3: Custom Theme Not Rendering**
- **Issue**: Theme configuration may not apply correctly
- **Mitigation**: Test page (Task 4) validates theme before proceeding
- **Debugging**: Check browser DevTools for CSS custom properties, verify HeroUIProvider wrapper

**Edge Case 4: Build Size Increase**
- **Issue**: HeroUI adds ~100-200KB to bundle size
- **Mitigation**: Verify build size in Task 7.5, document impact
- **Acceptance**: Acceptable for MVP given UI quality benefits (per Epic 1.5 decision)

**Edge Case 5: Existing React Aria Components Break**
- **Issue**: Installing HeroUI might conflict with existing React Aria imports
- **Mitigation**: This story only installs HeroUI, doesn't remove React Aria yet
- **Note**: Stories 1.5.3-1.5.4 handle migration, both can coexist temporarily

### Change Log

**2025-11-28** - Story created by create-story workflow. Status: drafted. Story 1.5.1 establishes HeroUI foundation for Epic 1.5 migration by installing dependencies, configuring custom olive theme, and updating documentation (ADR-008, ui-component-architecture.md). Enables Stories 1.5.2-1.5.5 for complete UI migration from React Aria (unstyled) to HeroUI (styled design system).

---

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/1-5-1-heroui-setup-custom-olive-theme.context.xml`

### Agent Model Used

<!-- Agent model name and version will be recorded during implementation -->

### Debug Log References

<!-- Implementation notes, decisions, and debugging references will be added during development -->

### Completion Notes List

<!-- Detailed completion notes for each AC will be added when story is marked complete -->

### File List

**Modified Files:**
<!-- List files modified during implementation with brief description of changes -->

**Created Files:**
<!-- List files created during implementation with purpose -->

