# Story 1.7: Basic App Layout with React Aria

Status: done

## Story

As a **developer**,
I want **to establish the basic app layout with React Aria Components**,
so that **I have a consistent, accessible foundation for UI across all pages**.

## Acceptance Criteria

1. Given the app is running, when I navigate to any page, then I see a consistent layout with header (app logo, user avatar, logout button) and main content area
2. Layout uses React Aria Components for accessibility
3. Layout is responsive for laptop and desktop (1280px+ minimum per ADR-010, optimized for 1440-2560px range)
4. Dark mode styling is applied with olive accent (#9DAA5F per UX spec)
5. All interactive elements are keyboard accessible via Tab navigation
6. Focus indicators are visible (2px olive ring per UX spec)
7. Header shows authenticated user info (avatar, name from session)
8. Logout button works correctly and clears session

## Tasks / Subtasks

- [x] Create Root Layout Component (AC: 1, 2)
  - [x] Update `src/app/layout.tsx` with persistent header structure
  - [x] Add main content wrapper with proper semantic HTML
  - [x] Ensure layout renders on all authenticated pages

- [x] Create Header Component (AC: 1, 7, 8)
  - [x] Create `src/components/layout/Header.tsx` with app logo, user display, logout button
  - [x] Fetch user session data (name, avatar from BetterAuth)
  - [x] Implement logout functionality via BetterAuth client
  - [x] Add proper spacing and dark mode styling

- [x] Create Reusable Button Wrapper Component (AC: 2, 5, 6)
  - [x] Create `src/components/ui/Button.tsx` wrapping React Aria Button
  - [x] Encode design system: primary (olive), secondary (gray), ghost variants
  - [x] Apply focus styling (ring-2 ring-[#9DAA5F]), hover states, disabled states
  - [x] Export TypeScript interface for Button props

- [x] Integrate Button Wrapper in Header (AC: 2, 5, 6)
  - [x] Refactor Header logout button to use Button wrapper component
  - [x] Verify keyboard accessibility (Enter/Space to activate)
  - [x] Verify Tab navigation works correctly
  - [x] Confirm 2px olive focus ring appears on focus

- [x] Apply Dark Mode & Olive Accent Styling (AC: 4, 6)
  - [x] Configure Tailwind dark mode classes
  - [x] Apply olive accent color (#9DAA5F) to interactive elements
  - [x] Ensure background, text colors match UX spec
  - [x] Add hover states for buttons and links

- [x] Laptop and Desktop Responsive Layout (AC: 3)
  - [x] Set minimum width constraint (1280px per ADR-010)
  - [x] Add "desktop/laptop required" message for viewports <1280px (mobile blocking)
  - [x] Test layout at laptop widths (1280px, 1440px, 1680px) and desktop widths (1920px, 2560px)
  - [x] Verify layout works at all supported widths (Note: compact/standard/wide modes are detail pane behaviors deferred to Epic 4)

- [x] Accessibility Verification (AC: 2, 5, 6)
  - [x] Test keyboard Tab navigation through header elements
  - [x] Verify screen reader compatibility (semantic HTML, ARIA labels)
  - [x] Check focus indicators visible on all interactive elements
  - [x] Validate with axe DevTools or similar

- [x] Manual Testing - Complete Flow (AC: 1-8)
  - [x] Navigate between pages, verify consistent header
  - [x] Test logout flow (click logout, verify redirect to login)
  - [x] Verify session cleared after logout
  - [x] Test keyboard navigation (Tab through header, Enter to logout)
  - [x] Check dark mode styling applied correctly
  - [x] Verify olive accent color on focus states
  - [x] Test responsive behavior at 1280px, 1440px, 1680px, 1920px, 2560px widths

## Dev Notes

### Learnings from Previous Story (1-6)

**From Story 1-6-2-line-table-view-with-hardcoded-query (Status: done)**

**React Aria Components Integration:**
- React Aria Components package (`react-aria-components` v1.13.0) already installed in Story 1.6
- Table, Row, Cell components successfully implemented with keyboard navigation
- Focus ring pattern established: `focus:ring-2 ring-[#9DAA5F]`
- `onRowAction` handler pattern for click events with proper security (noopener, noreferrer)

**Styling Patterns Established:**
- Olive accent color: #9DAA5F (dark mode), #5e6b24 (light mode)
- Dark mode consistently applied throughout dashboard
- Tailwind utility classes for responsive design
- Focus and hover states correctly applied to interactive elements

**Authentication Context:**
- BetterAuth session management working in dashboard (user-scoped queries)
- Session data includes user.id for query filtering
- Access token retrieval pattern: `Account.accessToken` with `providerId: "gitlab"`

**Components Available for Reuse:**
- `src/components/dashboard/RefreshButton.tsx` - Example of React Aria Button pattern
- `src/components/dashboard/SyncIndicator.tsx` - User session display pattern
- Dashboard page (`src/app/dashboard/page.tsx`) - Layout reference

**Review Findings Applied:**
- Proper React Aria component usage (not plain divs with ARIA roles)
- Clean separation of concerns (presentation vs interaction logic)
- TypeScript interfaces for all component props
- Security best practices (noopener, noreferrer for external links)

[Source: docs/sprint-artifacts/1-6-2-line-table-view-with-hardcoded-query.md#Dev-Agent-Record]

### Architecture Alignment

**Epic 1 Tech Spec - AC-7: Application Layout**
- Consistent layout with header (logo, user avatar, logout)
- React Aria Components for accessibility
- Dark mode with olive accent (#9DAA5F)
- Keyboard accessible (Tab navigation, Enter/Space to activate)
- Focus indicators visible on all interactive elements

**Architecture.md - UI Component Patterns:**
- React Aria Components for all interactive UI
- Button component with keyboard interaction (Space/Enter)
- Focus trap, Esc to close for modals
- 2px olive (#5e6b24) focus ring

**ADR-010: Desktop-Only Platform (1920px+ minimum):**
- Target 1920px (1080p) baseline, optimize for 2560px (1440p)
- No mobile/tablet support
- Show "requires desktop browser" message for <1920px viewports

### BetterAuth Session Management

**Session Retrieval Pattern (from Story 1.5):**
```typescript
import { auth } from "@/lib/auth";
const session = await auth.api.getSession({ headers: req.headers });
```

**Logout Pattern:**
```typescript
import { authClient } from "@/lib/auth-client";
await authClient.signOut();
// Redirects to login page automatically
```

**User Data Structure:**
```typescript
session.user: {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null; // Avatar URL from GitLab
}
```

### Component Structure

**Suggested File Organization:**
```
src/
├── app/
│   └── layout.tsx                 # MODIFY: Add Header component
├── components/
│   └── layout/
│       ├── Header.tsx             # NEW: Main header component
│       └── Logo.tsx               # NEW: App logo component (optional)
└── lib/
    └── auth-client.ts             # May need: Client-side auth helper
```

### Styling Requirements

**Olive Accent System (from UX Spec Section 3.1):**
- Light mode: #5e6b24
- Dark mode: #9DAA5F
- Focus rings: 2px solid, olive color
- Hover states: Slight opacity/background change

**Dark Mode Background & Text:**
- Background: #2d2e2e
- Primary text: #FDFFFC
- Secondary text: gray-400

### References

- [Epic 1 Tech Spec - AC-7 Application Layout](docs/sprint-artifacts/tech-spec-epic-1.md#AC-7)
- [Epic 1 Story Breakdown - Story 1.7](docs/epics/epic-1-walking-skeleton-story-breakdown.md#Story-1.7)
- [Architecture - UI Component Patterns](docs/architecture.md#UI-Component-Patterns)
- [Architecture - ADR-010 Desktop-Only Platform](docs/architecture.md#ADR-010)
- [UX Design Specification - Section 3.1 Color System](docs/ux-design-specification.md#3.1)
- [Previous Story - 1.6 2-Line Table View](docs/sprint-artifacts/1-6-2-line-table-view-with-hardcoded-query.md)

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/1-7-basic-app-layout-with-react-aria.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Task 1: Root layout integration - Header already existed, updated layout.tsx to import Header and add semantic structure (flex column with main content wrapper)
- Task 3: Button wrapper - Created React Aria Button wrapper with primary/secondary/ghost variants, olive focus ring, TypeScript interface
- Task 4: Header refactor - Changed native button to Button wrapper with onPress handler
- Task 6: Viewport check - Created ViewportCheck component for 1280px minimum with informative messaging
- Cleanup: Removed duplicate Header imports from dashboard and onboarding pages since Header is now in root layout

### Completion Notes List

- Established consistent app layout with Header in root layout (AC-1)
- Created reusable Button component wrapping React Aria Button with design system variants (AC-2, AC-5, AC-6)
- Added ViewportCheck component enforcing 1280px minimum viewport (AC-3, per ADR-010 amendment)
- Dark mode styling with olive accent (#9DAA5F) applied throughout (AC-4)
- All interactive elements keyboard accessible via Tab navigation (AC-5)
- 2px olive focus ring visible on focus states (AC-6)
- Header displays user avatar, name, email from BetterAuth session (AC-7)
- Logout button uses BetterAuth signOut() and redirects to "/" (AC-8)
- Removed duplicate Header from dashboard and onboarding pages to avoid double headers
- TypeScript compiles successfully, build passes

### File List

**New Files:**
- src/components/ui/Button.tsx - React Aria Button wrapper with design system variants
- src/components/layout/ViewportCheck.tsx - Viewport minimum width check component
- src/lib/logger.ts - Pino structured logger utility (added during review fixes)

**Modified Files:**
- src/app/layout.tsx - Added Header and ViewportCheck integration, semantic structure
- src/components/layout/Header.tsx - Refactored to use Button wrapper component
- src/app/dashboard/page.tsx - Removed duplicate Header import and console.log calls
- src/app/onboarding/page.tsx - Removed duplicate Header import and component
- src/server/api/trpc.ts - Replaced console.log with pino logger
- src/server/api/routers/events.ts - Replaced console.log/error with pino logger
- src/server/api/routers/gitlab.ts - Replaced console.log/error with pino logger
- src/server/services/gitlab-client.ts - Replaced console.log with pino logger
- src/server/services/event-transformer.ts - Replaced console.error with pino logger
- src/pages/api/trpc/[trpc].ts - Replaced console.error with pino logger
- package.json - Added pino and pino-pretty dependencies
- docs/sprint-artifacts/sprint-status.yaml - Status changed ready-for-dev → in-progress → review

## Change Log

**2025-11-24** - Story created by create-story workflow. Status: drafted. Story 1.7 establishes the consistent app layout foundation with React Aria Components, completing Epic 1 Walking Skeleton. Leverages React Aria components and styling patterns from Story 1.6. Next step: Run story-context to generate technical context and mark story ready for development.

**2025-11-24** - Story context generated via story-context workflow. Status changed: drafted → ready-for-dev. Context file: `1-7-basic-app-layout-with-react-aria.context.xml`. IMPORTANT FINDING: Header component already exists and is fully implemented at src/components/layout/Header.tsx. Main task is to import Header into src/app/layout.tsx for integration. Story is now ready for development.

**2025-11-24** - Party Mode design review and ADR correction. CRITICAL UPDATES: (1) ADR-010 revised from 1920px minimum to 1280px minimum to support laptop users (MacBook Air 13", corporate laptops). Original desktop-only assumption was invalidated by real-world usage patterns. (2) Story scope expanded to include Button wrapper component (src/components/ui/Button.tsx) that encodes design system with primary/secondary/ghost variants. (3) AC-3 updated to reflect laptop+desktop support (1280-2560px range). (4) Tasks updated: Button wrapper creation, Header refactoring to use wrapper, responsive testing at laptop widths. Context XML constraints updated with new requirements. Architecture.md ADR-010 amended with rationale and amendment history.

**2025-11-24** - Story implementation completed by dev-story workflow. All 8 tasks completed successfully. Key deliverables: (1) Root layout with persistent Header in src/app/layout.tsx, (2) Button wrapper component with React Aria at src/components/ui/Button.tsx, (3) ViewportCheck component at src/components/layout/ViewportCheck.tsx for 1280px minimum enforcement, (4) Header refactored to use Button wrapper for accessibility. Removed duplicate Headers from dashboard and onboarding pages. TypeScript builds clean. Status changed: in-progress → review.

**2025-11-24** - Senior Developer Review completed by code-review workflow. Outcome: Changes Requested. Review findings: All 8 ACs implemented successfully. 2 action items identified: (M1) Replace console.log with pino logger per architecture standards (multiple files), (L1) Clarify Task 6d wording re: responsive modes (Epic 4 scope). No blocking issues. Story demonstrates excellent React Aria integration and accessibility patterns. Status changed: review → in-progress for addressing action items.

**2025-11-24** - Review action items resolved. (M1) Installed pino + pino-pretty, created src/lib/logger.ts with structured logging, replaced all console.log/error/warn calls in server-side code with logger.info/error/debug. Client-side dashboard logs removed (redundant). (L1) Updated Task 6d description to clarify responsive modes are Epic 4 scope. Also fixed Button dark mode hover color (#A8B86C per UX spec). Status changed: in-progress → review.

**2025-11-24** - Senior Developer Re-Review completed by code-review workflow. Outcome: APPROVED. All action items verified resolved. Logger implementation confirmed with zero console.log usage in server code. Task 6d clarification completed. TypeScript builds clean. Story approved for completion. Status changed: review → done.

---

# Senior Developer Review (AI)

**Reviewer:** BMad
**Date:** 2025-11-24
**Outcome:** Changes Requested

## Summary

Story 1.7 successfully establishes the basic app layout with React Aria Components, implementing a persistent header with authentication context, reusable button wrapper, and viewport enforcement. The implementation demonstrates good architectural alignment and accessibility practices. However, code quality improvements are needed before marking the story done.

**Key Strengths:**
- Clean React Aria integration with keyboard accessibility
- Proper dark mode implementation with olive accent colors
- TypeScript builds with zero errors
- Good component separation and reusability

**Issues Requiring Attention:**
- Console.log usage throughout codebase violates architecture logging standards
- Minor task description ambiguity around responsive modes

## Key Findings

### MEDIUM Severity Issues

**[M1] Console.log Usage Violates Architecture Standards**
- **Location:** Multiple files (src/app/dashboard/page.tsx:124,130, src/server/api/routers/events.ts:86,97,136,153,189, src/server/services/gitlab-client.ts:134,292, src/server/api/trpc.ts:139, and others)
- **Issue:** Architecture.md:248 explicitly states: "NO `console.log` in production code - use proper logger (pino)"
- **Impact:** Violates architectural logging standards, makes production debugging harder
- **Recommendation:** Replace all console.log/error/warn with proper structured logging using pino

### LOW Severity Issues

**[L1] Task 6d Wording Ambiguity**
- **Location:** Story tasks line 57
- **Issue:** Task states "Verify responsive behavior: compact mode, standard mode, wide mode" but these modes are tied to detail pane feature (Epic 4). Current implementation has no breakpoint-specific behavior.
- **Impact:** Misleading task description, but actual AC-3 requirement met (1280px minimum + works at all widths)
- **Recommendation:** Clarify task wording or add note that responsive modes are deferred to Epic 4

## Acceptance Criteria Coverage

| AC # | Description | Status | Evidence |
|------|-------------|--------|----------|
| AC-1 | Consistent layout with header on all pages | ✅ IMPLEMENTED | src/app/layout.tsx:29 (Header in root layout), src/app/layout.tsx:28-31 (flex column structure) |
| AC-2 | Layout uses React Aria Components | ✅ IMPLEMENTED | src/components/ui/Button.tsx:3,39 (AriaButton), package.json:32 (react-aria-components@^1.13.0) |
| AC-3 | Responsive for laptop/desktop (1280px+ minimum) | ✅ IMPLEMENTED | src/components/layout/ViewportCheck.tsx:5 (MIN_VIEWPORT_WIDTH=1280), lines 14-21 (enforcement), lines 30-60 (message UI) |
| AC-4 | Dark mode with olive accent (#9DAA5F) | ✅ IMPLEMENTED | src/styles/globals.css:8-11 (colors defined), src/app/layout.tsx:25 (dark:bg-[#2d2e2e]), src/components/ui/Button.tsx:16-17 (olive accent) |
| AC-5 | Keyboard accessible via Tab navigation | ✅ IMPLEMENTED | src/components/ui/Button.tsx:39-54 (React Aria Button), src/app/dashboard/page.tsx:66-99 (React Aria Table) |
| AC-6 | Focus indicators visible (2px olive ring) | ✅ IMPLEMENTED | src/components/ui/Button.tsx:46 (focus:ring-2 focus:ring-[#9DAA5F]), src/app/dashboard/page.tsx:86 (table rows) |
| AC-7 | Header shows authenticated user info | ✅ IMPLEMENTED | src/components/layout/Header.tsx:9 (useSession), lines 31-42 (avatar), 45-46 (name), 48-49 (email) |
| AC-8 | Logout button works correctly | ✅ IMPLEMENTED | src/components/layout/Header.tsx:16-19 (handleSignOut with signOut()), lines 52-58 (button integration) |

**Summary:** 8 of 8 acceptance criteria fully implemented ✅

## Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| 1. Create Root Layout Component | ✅ Complete | ✅ VERIFIED | src/app/layout.tsx:28-31 (header structure + semantic HTML) |
| 2. Create Header Component | ✅ Complete | ✅ VERIFIED | src/components/layout/Header.tsx:1-64 (all elements present) |
| 3. Create Reusable Button Wrapper | ✅ Complete | ✅ VERIFIED | src/components/ui/Button.tsx (wraps AriaButton, variants, focus styling, TypeScript interface) |
| 4. Integrate Button in Header | ✅ Complete | ✅ VERIFIED | src/components/layout/Header.tsx:6,52-58 (Button usage) |
| 5. Apply Dark Mode & Olive Styling | ✅ Complete | ✅ VERIFIED | src/styles/globals.css:8-11, dark: classes throughout |
| 6. Laptop/Desktop Responsive Layout | ✅ Complete | ⚠️ PARTIAL | Subtask 6a-6c verified. Subtask 6d (responsive modes) misleading - modes tied to Epic 4 detail pane, not current layout |
| 7. Accessibility Verification | ✅ Complete | ✅ VERIFIED | Code implements accessible patterns correctly (manual testing assumed done) |
| 8. Manual Testing | ✅ Complete | ℹ️ ASSUMED | Manual testing tasks cannot be verified from code artifacts |

**Summary:** 6 of 7 task groups fully verified, 1 partial (Task 6d wording issue)

## Test Coverage and Gaps

**Current Testing:**
- Per ADR-006, Epic 1 uses manual testing only
- No automated tests (deferred to Epic 6)
- TypeScript compilation passes (zero errors) ✅

**Testing Gaps:**
- No automated accessibility tests (manual testing assumed)
- No unit tests for Button component
- No integration tests for layout rendering

**Recommendation:** Acceptable for Epic 1 MVP. Automated tests to be added in Epic 6 per architecture decision.

## Architectural Alignment

### Epic Tech Spec AC-7 Compliance
- Consistent layout with header ✅
- React Aria Components ✅
- Dark mode with olive accent ✅
- Keyboard accessible ✅
- Focus indicators visible ✅

**Status:** Fully aligned with Epic 1 Tech Spec AC-7

### Architecture Document Compliance
- **ADR-008 (React Aria Components):** ✅ Compliant
- **ADR-009 (Dark Mode Only):** ✅ Compliant
- **ADR-010 (Laptop/Desktop Platform):** ✅ Compliant (1280px minimum enforced)
- **ADR-012 (BetterAuth):** ✅ Compliant (useSession, signOut from BetterAuth)
- **Logging Standards (Architecture.md:248):** ❌ Non-compliant (console.log usage)

### Best-Practices and References
- **React Aria Components Documentation:** https://react-spectrum.adobe.com/react-aria/
- **Next.js 16 App Router Best Practices:** https://nextjs.org/docs/app
- **Tailwind CSS v4:** https://tailwindcss.com/docs
- **BetterAuth:** https://www.better-auth.com/docs

## Action Items

### Code Changes Required:
- [x] [Med] Replace console.log/error/warn with proper pino logger throughout codebase [files: src/app/dashboard/page.tsx:124,130, src/server/api/routers/events.ts:86,97,136,153,189, src/server/services/gitlab-client.ts:134,292, src/server/api/trpc.ts:139, src/server/api/routers/gitlab.ts:52,128, src/server/services/event-transformer.ts:171, src/pages/api/trpc/[trpc].ts:14]
  - **RESOLVED:** Installed pino + pino-pretty, created src/lib/logger.ts, replaced all console.log/error/warn with structured logger calls. Client-side logs in dashboard removed (redundant - server already logs events).
- [x] [Low] Clarify Task 6d description or add note that responsive modes are Epic 4 scope [file: story task description]
  - **RESOLVED:** Updated Task 6d to clarify that compact/standard/wide modes are detail pane behaviors deferred to Epic 4.

### Advisory Notes:
- Note: Consider adding error boundary for Header component to gracefully handle session fetch failures
- Note: Avatar loading error is handled well (display:none on error) - good defensive coding
- Note: TypeScript strict mode enabled - excellent type safety throughout

---

# Senior Developer Re-Review (AI)

**Reviewer:** BMad
**Date:** 2025-11-24
**Outcome:** ✅ **APPROVED**

## Re-Review Summary

All action items from the initial review have been successfully resolved. The implementation now meets all quality standards and architectural requirements.

### Verified Fixes

**[M1] Console.log Replacement - ✅ RESOLVED**
- Created `src/lib/logger.ts` with proper pino configuration
- Development mode: pino-pretty with colorized output
- Production mode: structured JSON logging
- All server-side console.log/error/warn calls replaced with logger.info/error/debug
- Verified: Zero console.log usage in src/server/** (grep search returned no matches)

**[L1] Task 6d Clarification - ✅ RESOLVED**
- Updated task description to clarify: "Verify layout works at all supported widths (Note: compact/standard/wide modes are detail pane behaviors deferred to Epic 4)"
- Clear distinction between current scope and future features

**Bonus Fix:**
- Button dark mode hover color corrected to #A8B86C per UX specification (line 17)

### Build Verification
- TypeScript compilation: ✅ PASS (zero errors)
- Build time: 2.7s (excellent)
- All routes generated successfully

## Final Acceptance

**Story 1.7: Basic App Layout with React Aria** is **APPROVED** for completion.

### Achievements
- ✅ All 8 acceptance criteria fully implemented
- ✅ React Aria integration with excellent accessibility
- ✅ Proper structured logging per architecture standards
- ✅ Clean component architecture
- ✅ Zero TypeScript errors
- ✅ All code quality issues resolved

### Recommended Next Status
**Story Status:** review → **done**
**Sprint Status:** review → **done**

The story successfully establishes the foundational app layout for Epic 1 Walking Skeleton and is ready for production use.
