# Story 2.1: Keyboard Shortcut System Foundation

Status: drafted

## Story

As a **power user**,
I want **a global keyboard shortcut system**,
so that **I can navigate the app efficiently without using a mouse**.

## Acceptance Criteria

| AC ID | Criterion |
|-------|-----------|
| 2.1.1 | Pressing `/` from anywhere focuses the search input |
| 2.1.2 | Pressing `Esc` clears focus and closes any open modals |
| 2.1.3 | Pressing `j` outside input fields moves selection down |
| 2.1.4 | Pressing `k` outside input fields moves selection up |
| 2.1.5 | Keyboard shortcuts do NOT trigger when typing in text inputs (except Esc) |

## Tasks / Subtasks

- [ ] Task 1: Create ShortcutHandler Component (AC: 2.1.1-2.1.5)
  - [ ] 1.1 Create `src/components/keyboard/ShortcutHandler.tsx` component
  - [ ] 1.2 Add global `keydown` event listener at document level
  - [ ] 1.3 Implement context detection (check if target is INPUT/TEXTAREA)
  - [ ] 1.4 Create shortcut registry Map<key, handler>
  - [ ] 1.5 Add TypeScript interface for shortcut configuration

- [ ] Task 2: Implement Context-Aware Routing Logic (AC: 2.1.5)
  - [ ] 2.1 Detect when user is typing in input fields
  - [ ] 2.2 Allow `Esc` through when typing (exception)
  - [ ] 2.3 Suppress navigation shortcuts (`/`, `j`, `k`) when typing
  - [ ] 2.4 Add `contenteditable` detection for rich text editors (future-proofing)

- [ ] Task 3: Create Shortcut Context Provider (AC: 2.1.1-2.1.4)
  - [ ] 3.1 Create `src/components/keyboard/ShortcutContext.tsx` with React Context
  - [ ] 3.2 Define context value interface: `{ focusSearch, moveSelectionDown, moveSelectionUp, clearFocusAndModals }`
  - [ ] 3.3 Wrap app with ShortcutProvider in layout
  - [ ] 3.4 Export `useShortcuts` hook for components to register handlers

- [ ] Task 4: Implement Core Shortcut Handlers (AC: 2.1.1-2.1.4)
  - [ ] 4.1 `/` handler: Call `focusSearch()` from context
  - [ ] 4.2 `j` handler: Call `moveSelectionDown()` from context
  - [ ] 4.3 `k` handler: Call `moveSelectionUp()` from context
  - [ ] 4.4 `Esc` handler: Call `clearFocusAndModals()` from context
  - [ ] 4.5 Prevent default browser behavior for intercepted keys

- [ ] Task 5: Integrate with App Layout (AC: 2.1.1-2.1.5)
  - [ ] 5.1 Import ShortcutProvider in `src/app/layout.tsx`
  - [ ] 5.2 Wrap main content with ShortcutProvider
  - [ ] 5.3 Ensure event listener cleanup on unmount
  - [ ] 5.4 Test with existing Header and dashboard components

- [ ] Task 6: Create Placeholder Handlers for Future Stories (AC: 2.1.1-2.1.4)
  - [ ] 6.1 Create no-op placeholder for `focusSearch()` (wired in Story 2.4)
  - [ ] 6.2 Create no-op placeholder for `moveSelectionDown/Up()` (wired in Story 2.2)
  - [ ] 6.3 Create no-op placeholder for `clearFocusAndModals()` (wired progressively)
  - [ ] 6.4 Add console.debug logs for development verification (using pino logger pattern)

- [ ] Task 7: Manual Testing - Keyboard Shortcuts (AC: 2.1.1-2.1.5)
  - [ ] 7.1 Test `/` key focuses search input (verify input receives focus)
  - [ ] 7.2 Test `j/k` keys trigger handlers when not in input (verify debug logs)
  - [ ] 7.3 Test `Esc` clears focus (verify search input blurs)
  - [ ] 7.4 Test shortcuts do NOT fire when typing in search input
  - [ ] 7.5 Test shortcuts do NOT fire when typing in any future input fields
  - [ ] 7.6 Test across browsers (Chrome, Firefox, Safari)

- [ ] Task 8: Add Minimal Search Input to Header (AC: 2.1.1, 2.1.2, 2.1.5)
  - [ ] 8.1 Add search input element to Header component with placeholder "Search... (/)"
  - [ ] 8.2 Create ref for search input element
  - [ ] 8.3 Style input with olive focus ring (`focus:ring-2 focus:ring-[#9DAA5F]`)
  - [ ] 8.4 Register `focusSearch` handler via `useShortcuts()` to focus the input ref
  - [ ] 8.5 Implement `clearFocusAndModals` to blur active element (document.activeElement)
  - [ ] 8.6 Input is non-functional for search (placeholder for Story 2.4)

## Dev Notes

### Learnings from Previous Story

**From Story 1-7-basic-app-layout-with-react-aria (Status: done)**

- **Button Component Available**: `src/components/ui/Button.tsx` - React Aria Button wrapper with olive focus ring pattern
- **Header Component Available**: `src/components/layout/Header.tsx` - User session display, logout functionality
- **ViewportCheck Component**: `src/components/layout/ViewportCheck.tsx` - Viewport enforcement pattern
- **Logger Utility**: `src/lib/logger.ts` - Pino structured logging (use `logger.debug()` for dev shortcuts)
- **Root Layout Pattern**: `src/app/layout.tsx` - Where to wrap ShortcutProvider
- **Focus Ring Pattern**: `focus:ring-2 focus:ring-[#9DAA5F]` - Olive accent for focus states
- **React Aria Components**: Already installed (`react-aria-components@^1.13.0`)
- **BetterAuth Session**: `useSession()` hook pattern from `@/lib/auth-client`

**Architectural Patterns from Epic 1:**
- Clean component separation (layout/, ui/, dashboard/)
- TypeScript interfaces for all component props
- Dark mode consistently applied with olive accent
- Server-side structured logging with pino

[Source: docs/sprint-artifacts/1-7-basic-app-layout-with-react-aria.md#Dev-Agent-Record]

### Architecture Alignment

**Epic 2 Tech Spec - Story 2.1 Requirements:**
- Global keyboard event listener at app root
- Context-aware routing (check if input/textarea focused)
- Shortcut registry: `Map<key, handler>`
- Prevent default browser shortcuts when appropriate
- Performance target: <50ms keyboard response time

**Tech Spec - ShortcutHandler Module:**
```
Location: src/components/keyboard/ShortcutHandler.tsx
Responsibility: Global keyboard event listener with context-aware routing.
Detects when user is typing (INPUT/TEXTAREA) and suppresses navigation shortcuts.
Routes `/`, `j/k`, `s`, `Esc`, `1-9`, `e`, `Delete` to appropriate handlers.
```

**Keyboard Shortcut Flow (from Tech Spec):**
```
keydown event
    │
    ▼
┌─────────────────┐
│ Is user typing? │──Yes──► Ignore (except Esc)
│ (INPUT/TEXTAREA)│
└────────┬────────┘
         │ No
         ▼
Route by key:
  "/" → focusSearch()
  "j" → moveSelectionDown()
  "k" → moveSelectionUp()
  "Esc" → clearFocusAndModals()
```

### Implementation Pattern

**Context-aware handler (from Tech Spec):**
```typescript
const handleKeyPress = (e: KeyboardEvent) => {
  // Don't intercept if user is typing
  const isTyping = ['INPUT', 'TEXTAREA'].includes(
    (e.target as HTMLElement).tagName
  );
  if (isTyping && e.key !== 'Escape') return;

  // Route shortcuts
  switch(e.key) {
    case '/':
      e.preventDefault(); // Prevent Quick Find in Firefox
      focusSearch();
      break;
    case 'j': moveSelectionDown(); break;
    case 'k': moveSelectionUp(); break;
    case 'Escape': clearFocusAndModals(); break;
  }
};
```

**Note on Future Shortcuts:**
Story 2.1 establishes the foundation. Additional shortcuts will be wired in subsequent stories:
- `s` → Story 2.8.5 (Save as Query)
- `1-9` → Story 2.8 (Sidebar navigation)
- `e` → Story 2.10 (Edit query)
- `Delete` → Story 2.10 (Delete query)
- `o` → Future (Open in GitLab)

### Project Structure

**New Files to Create:**
```
src/
├── components/
│   └── keyboard/
│       ├── ShortcutHandler.tsx    # Global event listener component
│       └── ShortcutContext.tsx    # React Context for shortcut handlers
```

**Files to Modify:**
```
src/app/layout.tsx                  # Wrap with ShortcutProvider
src/components/layout/Header.tsx    # Add minimal search input (Task 8)
```

### Performance Requirement

- Keyboard response time: <50ms from keypress to visual feedback
- Use `useCallback` for handler functions to prevent recreation
- Event listener added once at mount, cleaned up on unmount

### References

- [Epic 2 Tech Spec - Story 2.1 Acceptance Criteria](docs/sprint-artifacts/tech-spec-epic-2.md#story-21-keyboard-shortcut-system-foundation)
- [Epic 2 Tech Spec - ShortcutHandler Module](docs/sprint-artifacts/tech-spec-epic-2.md#services-and-modules)
- [Epic 2 Tech Spec - Keyboard Shortcut Flow](docs/sprint-artifacts/tech-spec-epic-2.md#workflows-and-sequencing)
- [Epic 2 Tech Spec - Performance NFR](docs/sprint-artifacts/tech-spec-epic-2.md#performance) (keyboard response <50ms)
- [Architecture - ADR-008 React Aria Components](docs/architecture.md#ADR-008)
- [Previous Story - 1.7 App Layout](docs/sprint-artifacts/1-7-basic-app-layout-with-react-aria.md)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

**2025-11-24** - Story scope expanded via party-mode review. Added Task 8: Minimal Search Input to Header. This provides a real focusable element for `/` and `Esc` shortcuts, enabling demonstrable AC validation for 2.1.1, 2.1.2, and 2.1.5. The search input is non-functional (placeholder for Story 2.4) but allows real keyboard interaction testing.

**2025-11-24** - Story created by create-story workflow. Status: drafted. Story 2.1 establishes the global keyboard shortcut foundation for Epic 2, enabling vim-style navigation throughout the app. Leverages React Aria components and patterns from Epic 1. Next step: Run story-context to generate technical context and mark story ready for development.
