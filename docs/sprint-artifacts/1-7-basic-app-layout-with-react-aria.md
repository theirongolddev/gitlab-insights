# Story 1.7: Basic App Layout with React Aria

Status: review

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
  - [x] Verify responsive behavior: compact mode (1280-1679px), standard mode (1680-2559px), wide mode (2560px+)

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

**Modified Files:**
- src/app/layout.tsx - Added Header and ViewportCheck integration, semantic structure
- src/components/layout/Header.tsx - Refactored to use Button wrapper component
- src/app/dashboard/page.tsx - Removed duplicate Header import and component
- src/app/onboarding/page.tsx - Removed duplicate Header import and component
- docs/sprint-artifacts/sprint-status.yaml - Status changed ready-for-dev → in-progress → review

## Change Log

**2025-11-24** - Story created by create-story workflow. Status: drafted. Story 1.7 establishes the consistent app layout foundation with React Aria Components, completing Epic 1 Walking Skeleton. Leverages React Aria components and styling patterns from Story 1.6. Next step: Run story-context to generate technical context and mark story ready for development.

**2025-11-24** - Story context generated via story-context workflow. Status changed: drafted → ready-for-dev. Context file: `1-7-basic-app-layout-with-react-aria.context.xml`. IMPORTANT FINDING: Header component already exists and is fully implemented at src/components/layout/Header.tsx. Main task is to import Header into src/app/layout.tsx for integration. Story is now ready for development.

**2025-11-24** - Party Mode design review and ADR correction. CRITICAL UPDATES: (1) ADR-010 revised from 1920px minimum to 1280px minimum to support laptop users (MacBook Air 13", corporate laptops). Original desktop-only assumption was invalidated by real-world usage patterns. (2) Story scope expanded to include Button wrapper component (src/components/ui/Button.tsx) that encodes design system with primary/secondary/ghost variants. (3) AC-3 updated to reflect laptop+desktop support (1280-2560px range). (4) Tasks updated: Button wrapper creation, Header refactoring to use wrapper, responsive testing at laptop widths. Context XML constraints updated with new requirements. Architecture.md ADR-010 amended with rationale and amendment history.

**2025-11-24** - Story implementation completed by dev-story workflow. All 8 tasks completed successfully. Key deliverables: (1) Root layout with persistent Header in src/app/layout.tsx, (2) Button wrapper component with React Aria at src/components/ui/Button.tsx, (3) ViewportCheck component at src/components/layout/ViewportCheck.tsx for 1280px minimum enforcement, (4) Header refactored to use Button wrapper for accessibility. Removed duplicate Headers from dashboard and onboarding pages. TypeScript builds clean. Status changed: in-progress → review.
