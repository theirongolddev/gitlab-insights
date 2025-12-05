# Story 4.1: Split Pane Component with Toggle Button

**Status:** ready-for-dev
**Epic:** 4 - Split View & Detail Navigation
**Story ID:** 4.1
**Created:** 2025-12-05

---

## Story

**As a** user viewing a query's events
**I want** to toggle a split view on/off
**So that** I can see event details without opening new tabs

---

## Acceptance Criteria

1. **AC1 - Desktop Default Open:** Given I am on desktop (≥1024px), when page loads, then split view is OPEN by default (60/40 table/detail)
2. **AC2 - Toggle Button Visibility:** Given I am on desktop, when page loads, then a toggle button appears in the header
3. **AC3 - Close Split View:** Given split view is open, when I click toggle, then detail pane closes and table expands to full width
4. **AC4 - Open Split View with Last Event:** Given split view is closed, when I click toggle, then detail pane opens and last selected event loads
5. **AC5 - Persistence:** Given I toggle the pane, then my preference persists in localStorage
6. **AC6 - Tablet Default Closed:** Given I am on tablet (768-1023px), when page loads, then split view is CLOSED by default
7. **AC7 - Mobile Navigation:** Given I am on mobile (<768px), then toggle button is NOT visible and clicking rows navigates to /events/:id

---

## Dev Notes

### Implementation Overview

This story implements the foundational split pane component that enables users to view event details side-by-side with the event list. The split pane provides a seamless way to explore multiple events without losing context or opening multiple tabs.

### Architecture Context

**Component Library:** HeroUI (built on React Aria Components)
- HeroUI Button for toggle with olive theme colors
- React Aria focus management for keyboard navigation
- Tailwind CSS for responsive layout and transitions

**State Management Pattern:**
- Custom React hook (`useDetailPane`) for split pane state
- localStorage persistence for user preference
- URL state management via Next.js router (`?detail=eventId`)

**Responsive Strategy:**
- Desktop (≥1024px): Split view OPEN by default (60/40)
- Tablet (768-1023px): Split view CLOSED by default
- Mobile (<768px): Navigate to full-screen `/events/:id` page

### File Structure Requirements

**New Files to Create:**

1. **`src/components/layout/SplitView.tsx`**
   - Main split pane container component
   - Handles layout transitions and animations
   - Integrates with useDetailPane hook

2. **`src/hooks/useDetailPane.ts`**
   - Custom hook managing open/closed state
   - localStorage persistence logic
   - Screen size detection integration

3. **`src/hooks/useMediaQuery.ts`** (if not exists)
   - Responsive breakpoint detection
   - Returns boolean for screen size checks

**Files to Modify:**

1. **`src/app/queries/[id]/page.tsx`**
   - Integrate SplitView component
   - Pass event data and selection handlers
   - Handle URL state with `?detail=eventId`

2. **`src/components/dashboard/EventTable.tsx`**
   - Add `onRowClick` handler prop
   - Wire up row selection to open detail pane
   - Handle mobile navigation to `/events/:id`

3. **`src/components/layout/Header.tsx`**
   - Add toggle button (PanelRightClose/PanelRightOpen icons)
   - Wire to useDetailPane hook
   - Show/hide based on screen size

### Technical Requirements

**HeroUI Button for Toggle:**

```tsx
import { Button } from "@heroui/react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

// In Header component
<Button
  isIconOnly
  variant="light"
  size="sm"
  onPress={toggleDetailPane}
  aria-label={isOpen ? "Close detail pane" : "Open detail pane"}
  className="hidden md:flex" // Hide on mobile
>
  {isOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
</Button>
```

**Custom Hook Pattern (useDetailPane):**

```typescript
// src/hooks/useDetailPane.ts
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'gitlab-insights-split-view-open';

function defaultOpenForScreenSize(): boolean {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= 1024; // Open for desktop only
}

export function useDetailPane() {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    // Initialize from localStorage or default based on screen size
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultOpenForScreenSize();
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isOpen));
  }, [isOpen]);

  return { isOpen, setIsOpen };
}
```

**Media Query Hook (useMediaQuery):**

```typescript
// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
```

**SplitView Component Structure:**

```tsx
// src/components/layout/SplitView.tsx
"use client";

import { ReactNode } from 'react';
import { useDetailPane } from '~/hooks/useDetailPane';
import { useMediaQuery } from '~/hooks/useMediaQuery';
import { cn } from '~/lib/utils';

interface SplitViewProps {
  listContent: ReactNode;
  detailContent: ReactNode;
  selectedEventId: string | null;
}

export function SplitView({ listContent, detailContent, selectedEventId }: SplitViewProps) {
  const { isOpen } = useDetailPane();
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className="flex h-full">
      {/* List/Table Section */}
      <div className={cn(
        "transition-all duration-200",
        isOpen && !isMobile ? "w-3/5" : "w-full"
      )}>
        {listContent}
      </div>

      {/* Detail Pane */}
      {isOpen && !isMobile && selectedEventId && (
        <div className="w-2/5 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          {detailContent}
        </div>
      )}
    </div>
  );
}
```

**URL State Management:**

```tsx
// In src/app/queries/[id]/page.tsx
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const router = useRouter();
const { isOpen, setIsOpen } = useDetailPane();
const queryId = params.id;

// Deep linking support - open detail pane if ?detail param present
useEffect(() => {
  const detail = new URLSearchParams(window.location.search).get('detail');
  if (detail) {
    setSelectedEventId(detail);
    setIsOpen(true);
  }
}, []);

// Update URL when detail pane opens/closes
const handleToggle = () => {
  if (isOpen) {
    // Closing - remove ?detail param
    router.push(`/queries/${queryId}`, { scroll: false });
    setIsOpen(false);
  } else {
    // Opening - add ?detail param with selected event
    if (selectedEventId) {
      router.push(`/queries/${queryId}?detail=${selectedEventId}`, { scroll: false });
    }
    setIsOpen(true);
  }
};
```

### Design Token Usage

**CRITICAL:** Follow ui-component-architecture.md Section 1.2 - NEVER use hardcoded hex values.

**Correct Usage:**
```tsx
// ✅ CORRECT - Design tokens
className="border-gray-200 dark:border-gray-800"
className="bg-white dark:bg-gray-900"
className="text-text-primary dark:text-text-primary-dark"

// ❌ WRONG - Hardcoded hex
className="border-[#E5E7EB] dark:border-[#1F2937]"
```

**Transition Classes:**
```tsx
// Smooth 200ms animation
className="transition-all duration-200"
```

**Responsive Utilities:**
```tsx
// Hide on mobile
className="hidden md:flex"

// Conditional width
className={cn(
  "transition-all duration-200",
  isOpen && !isMobile ? "w-3/5" : "w-full"
)}
```

### Testing Requirements

**Manual Testing Checklist:**

1. **Desktop (≥1024px):**
   - [ ] Split view opens by default on page load
   - [ ] Toggle button visible in header
   - [ ] Click toggle closes detail pane smoothly
   - [ ] Click toggle opens detail pane with last selected event
   - [ ] Preference persists after page reload

2. **Tablet (768-1023px):**
   - [ ] Split view closed by default on page load
   - [ ] Toggle button visible and functional
   - [ ] Toggle opens/closes split pane

3. **Mobile (<768px):**
   - [ ] Toggle button NOT visible
   - [ ] Clicking event rows navigates to /events/:id
   - [ ] Full-screen detail page renders correctly

4. **URL State:**
   - [ ] ?detail=eventId auto-opens pane with correct event
   - [ ] Browser back button closes pane (removes ?detail)
   - [ ] Deep linking works (shareable URL)

5. **Animation:**
   - [ ] Smooth 200ms transition when opening
   - [ ] Smooth 200ms transition when closing
   - [ ] No layout shifts or flickering
   - [ ] No horizontal scrollbars at any width

### Previous Story Learnings

**From Story 3.7 (Manual Refresh Button):**
- Custom hooks pattern works well for stateful logic (`useManualRefresh`)
- HeroUI Button integration is smooth and provides consistent styling
- Icon-only buttons need proper `aria-label` for accessibility
- localStorage persistence is straightforward with useEffect

**From Story 3.6 (Last Sync Indicator):**
- Responsive utility hooks are valuable for layout decisions
- Time formatting utilities should be reused (formatRelativeTime)
- Status indicators benefit from color-coded visual feedback

**From Epic 1.5 (HeroUI Migration):**
- Always use HeroUI Button component (not raw `<button>`)
- Design tokens mandatory for all colors (no hardcoded hex)
- Theme system supports both light and dark modes automatically
- HSL color format used throughout (see ui-component-architecture.md Section 1.5.3.1)

### Git Intelligence

**Recent Commit Patterns:**
- Story files follow naming: `{epic}-{story}-{kebab-case-title}.md`
- Commits: "Create and implement story X.Y" format
- Context files: `{story}.context.xml` for complex stories

**Code Patterns from Recent Commits:**
- Custom hooks in `src/hooks/` directory
- Client Components use `"use client"` directive
- HeroUI components imported from `@heroui/react`
- Tailwind classes for responsive behavior

### Architecture Compliance

**Component Library Standards (ui-component-architecture.md):**

1. **HeroUI Button Wrapper Mandatory:**
   - ALL buttons must use HeroUI Button component
   - Import: `import { Button } from "@heroui/react"`
   - Variants: `color="primary"`, `variant="light"`, `isIconOnly`

2. **Design Tokens Only:**
   - Source of truth: `src/styles/globals.css`
   - Use Tailwind classes like `bg-bg-light dark:bg-bg-dark`
   - NEVER hardcode hex values like `bg-[#FDFFFC]`

3. **Responsive Pattern:**
   - Mobile-first with Tailwind responsive prefixes
   - Breakpoints: `md:` (≥768px), `lg:` (≥1024px)
   - useMediaQuery hook for JavaScript-based decisions

4. **Authentication Architecture:**
   - Query pages use Server Component + Client Component split
   - Server Component calls `requireAuth()` before rendering
   - Client Component handles UI and interactivity

### File Structure Pattern

**Component Organization:**
```
src/
  components/
    layout/
      SplitView.tsx          # New - split pane container
      Header.tsx             # Modify - add toggle button
    dashboard/
      EventTable.tsx         # Modify - add onRowClick handler
  hooks/
    useDetailPane.ts         # New - split pane state management
    useMediaQuery.ts         # New (if not exists) - responsive detection
  app/
    queries/
      [id]/
        page.tsx             # Modify - integrate SplitView
    events/
      [id]/
        page.tsx             # New (mobile) - full-screen detail view
```

### Library & Framework Requirements

**Dependencies (already installed):**
- `@heroui/react` v2.8.5 - Button component
- `lucide-react` - PanelRightClose/PanelRightOpen icons
- `next` v16 - useRouter, Link, navigation
- `react` v19 - useState, useEffect hooks
- `tailwindcss` v4 - Responsive utilities

**No new dependencies required.**

### Latest Technical Specifics (Web Research)

**React 19 Changes:**
- `use client` directive required for Client Components
- Server Actions supported but not needed for this story
- useRouter from `next/navigation` (not `next/router`)

**Next.js 16 Router:**
- `router.push()` accepts options: `{ scroll: false }` to prevent scroll on navigation
- URL params accessed via `useSearchParams()` hook
- Shallow routing with query params updates URL without full page reload

**HeroUI 2.8.5 Button API:**
- `isIconOnly` prop for icon-only buttons
- `variant="light"` for minimal styling (no background)
- `size="sm"` for compact header buttons
- `onPress` (not `onClick`) for press events
- `aria-label` required for accessibility

**Tailwind CSS v4:**
- Dark mode via `dark:` prefix (class-based strategy)
- Transition utilities: `transition-all duration-200`
- Responsive width: `w-3/5` and `w-2/5` for 60/40 split
- Hidden utilities: `hidden md:flex` for responsive visibility

### Security & Performance Considerations

**localStorage Best Practices:**
- Check for availability before access (SSR compatibility)
- JSON.stringify/parse for boolean values
- Fallback to default if localStorage disabled
- No sensitive data stored (just UI preference)

**Performance:**
- Smooth 200ms transitions (no janky animations)
- No layout shifts during toggle
- Lazy load detail content if not already cached
- Debounce screen size detection if needed

**Accessibility:**
- Toggle button has descriptive `aria-label`
- Keyboard navigation works (Tab to button, Enter/Space to toggle)
- Focus management when pane opens/closes
- Screen reader announces state changes

### Definition of Done

**Code Complete:**
- [ ] SplitView component created and integrated
- [ ] useDetailPane hook implemented with localStorage
- [ ] useMediaQuery hook created (if needed)
- [ ] Toggle button added to Header
- [ ] EventTable onRowClick handler added
- [ ] Mobile detail page created (/events/[id])
- [ ] URL state management implemented
- [ ] All design tokens used (no hardcoded colors)

**Testing Complete:**
- [ ] Manual testing checklist passed (all 5 sections)
- [ ] Desktop default open behavior verified
- [ ] Tablet default closed behavior verified
- [ ] Mobile navigation to full-screen verified
- [ ] localStorage persistence verified
- [ ] URL deep linking verified
- [ ] Animation smoothness verified
- [ ] No regressions in Epic 1-3 functionality

**Documentation Complete:**
- [ ] Code comments for complex logic
- [ ] Type definitions for all props
- [ ] Accessibility attributes in place

---

## Dev Agent Record

### Context Reference

Story context completed by workflow.xml automation (2025-12-05)

### Agent Model Used

To be filled by implementing agent

### Debug Log References

To be filled during implementation

### Completion Notes List

To be filled during implementation

### File List

**Files to Create:**
- `src/components/layout/SplitView.tsx`
- `src/hooks/useDetailPane.ts`
- `src/hooks/useMediaQuery.ts` (if not exists)
- `src/app/events/[id]/page.tsx` (mobile full-screen)

**Files to Modify:**
- `src/app/queries/[id]/page.tsx`
- `src/components/dashboard/EventTable.tsx`
- `src/components/layout/Header.tsx`

---

## References

**Source Documents:**
- [Epic 4 - Split View & Detail Navigation](docs/epics/epic-4-split-view-detail-navigation.md)
- [Architecture](docs/architecture.md) - ADR-008 (HeroUI), ADR-010 (Responsive)
- [UI Component Architecture](docs/ui-component-architecture.md) - Section 1.2, 1.5, 9.2
- [UX Design Specification](docs/ux-design-specification.md) - Section 4.2 (Split Pane)
- [PRD](docs/prd.md) - FR31-33 (Split Pane Requirements)

**Related Stories:**
- Story 3.7 - Manual Refresh Button (useManualRefresh pattern)
- Story 1.5.6 - Dark Mode Toggle (theme integration)
- Story 2.2 - React Aria Table (keyboard navigation)
