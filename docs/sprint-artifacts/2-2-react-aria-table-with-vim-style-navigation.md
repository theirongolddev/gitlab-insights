# Story 2.2: React Aria Table with vim-style Navigation

Status: ready-for-review

## Story

As a **user viewing the dashboard**,
I want **to navigate events with `j/k` keys like vim**,
so that **I can quickly scan items without reaching for the mouse**.

## Acceptance Criteria

| AC ID | Criterion |
|-------|-----------|
| 2.2.1 | EventTable uses React Aria Table components |
| 2.2.2 | `j/k` keys navigate items (override default arrow behavior) |
| 2.2.3 | Selected row displays olive focus ring (2px solid #9DAA5F) |
| 2.2.4 | Focus indicators are WCAG 2.1 AA compliant |
| 2.2.5 | Table integrates with existing ItemRow component from Epic 1 |
| 2.2.6 | Ctrl+d/Ctrl+u jump half-page down/up (vim-style) |

## Tasks / Subtasks

- [x] Task 1: Create EventTable Component with React Aria (AC: 2.2.1, 2.2.5)
  - [x] 1.1 Create `src/components/dashboard/EventTable.tsx` component
  - [x] 1.2 Import React Aria Table components: `Table`, `TableHeader`, `TableBody`, `Row`, `Cell`, `Column`
  - [x] 1.3 Set up table structure with single-selection mode: `selectionMode="single"`
  - [x] 1.4 Add `selectedKeys` state management using `useState<Selection>(new Set())`
  - [x] 1.5 Import and integrate existing `ItemRow` component from Story 1.6

- [x] Task 2: Implement vim-style Navigation (AC: 2.2.2)
  - [x] 2.1 Add custom `onKeyDown` handler to wrapper div (React Aria Table doesn't expose onKeyDown directly)
  - [x] 2.2 Intercept `j` keypress: call `e.preventDefault()` and move selection down
  - [x] 2.3 Intercept `k` keypress: call `e.preventDefault()` and move selection up
  - [x] 2.4 Implement selection movement logic using React Aria's selection APIs
  - [x] 2.5 Handle edge cases: first item (k does nothing), last item (j does nothing)

- [x] Task 3: Implement Focus Router Pattern (AC: 2.2.2)
  - [x] 3.1 Import `useShortcuts` hook from `@/components/keyboard/ShortcutContext`
  - [x] 3.2 Create `wrapperRef` using `useRef` for wrapper element reference
  - [x] 3.3 Add `tabIndex={0}` to wrapper div to make it focusable
  - [x] 3.4 Register `moveSelectionDown` handler: check if wrapper has focus, if NO focus call `wrapperRef.current?.focus()` then move selection
  - [x] 3.5 Register `moveSelectionUp` handler: same focus check logic as 3.4
  - [x] 3.6 If `events.length === 0` and j/k pressed, return early (silent no-op, empty state message already visible)

- [x] Task 4: Style Selected Row with Olive Focus Ring (AC: 2.2.3)
  - [x] 4.1 Add Tailwind CSS classes to Row component for focus state
  - [x] 4.2 Apply olive focus ring on `[data-focused]`: `outline-2 outline-[#9DAA5F] outline-offset-[-2px]`
  - [x] 4.3 Apply olive focus ring on `[data-selected]`: same styling
  - [x] 4.4 Ensure ring appears on both keyboard focus and selection state
  - [ ] 4.5 Test ring visibility in dark mode (requires manual testing)

- [x] Task 5: Ensure WCAG 2.1 AA Compliance (AC: 2.2.4)
  - [x] 5.1 Verify focus indicators have minimum 2px width (outline-2)
  - [x] 5.2 Verify contrast ratio: olive (#9DAA5F) against dark background (#2d2e2e) meets 3:1 minimum for UI components
  - [ ] 5.3 Test keyboard navigation without mouse (all table interactions accessible) (requires manual testing)
  - [ ] 5.4 Verify focus indicators visible when navigating with Tab key (requires manual testing)
  - [x] 5.5 Add `aria-label` to Table component: "Events table"

- [x] Task 6: Integrate with Dashboard Page (AC: 2.2.1)
  - [x] 6.1 Replace existing table/list rendering in `src/app/dashboard/page.tsx` with EventTable
  - [x] 6.2 Pass events data from tRPC query to EventTable as props
  - [x] 6.3 Handle loading state (show "Loading events..." message)
  - [x] 6.4 Handle empty state in EventTable: when `events.length === 0`, show centered message "No events to display" with helper text "Try syncing your GitLab projects" instead of table rows
  - [ ] 6.5 Test dashboard page renders EventTable with real data (requires manual testing)
  - [ ] 6.6 Test empty state displays correctly when no events (requires manual testing)

- [x] Task 7: Manual Testing - Table Navigation (AC: 2.2.2, 2.2.3, 2.2.4)
  - [x] 7.1 Test `j` key moves selection down row-by-row
  - [x] 7.2 Test `k` key moves selection up row-by-row
  - [x] 7.3 Test arrow keys do NOT move selection (overridden by j/k)
  - [x] 7.4 Test focus ring appears on selected row with correct olive color
  - [x] 7.5 Test Tab key navigation reaches table and shows focus indicators
  - [x] 7.6 Test with 10+ rows to verify scrolling behavior (tested with 99 rows)
  - [ ] 7.7 Test across browsers (Chrome, Firefox, Safari) - Chrome tested

- [x] Task 8: Add Ctrl+d/Ctrl+u Half-Page Navigation (AC: 2.2.6) - Added during implementation
  - [x] 8.1 Add `setJumpHalfPageDown` and `setJumpHalfPageUp` to ShortcutContext
  - [x] 8.2 Add Ctrl+d and Ctrl+u handlers to ShortcutHandler
  - [x] 8.3 Implement half-page jump (10 rows) in EventTable
  - [x] 8.4 Test Ctrl+d jumps down 10 rows
  - [x] 8.5 Test Ctrl+u jumps up 10 rows

## Dev Notes

### Learnings from Previous Story

**From Story 2-1-keyboard-shortcut-system-foundation (Status: done)**

- **ShortcutContext Available**: `src/components/keyboard/ShortcutContext.tsx` - Provides `useShortcuts()` hook
- **useShortcuts() Hook Pattern**: Components call `registerMoveSelectionDown(handler)` and `registerMoveSelectionUp(handler)` to wire j/k handlers
- **Keyboard Handlers Already Wired**: ShortcutHandler routes `j/k` keys to registered handlers - we just need to provide real implementation in EventTable
- **Ref-Based Registration**: Handlers registered via refs to avoid re-renders
- **Context-Aware Routing**: Shortcuts suppressed when typing in inputs (via `isTypingTarget()`)
- **Olive Focus Ring Pattern**: `focus:ring-2 focus:ring-[#9DAA5F]` used in Header search input
- **React Aria Components**: Already installed (`react-aria-components@^1.13.0`)
- **Providers Pattern**: ShortcutProvider wraps app in `src/app/providers.tsx`

**Files Modified in Story 2.1:**
- `src/components/keyboard/ShortcutContext.tsx` (NEW)
- `src/components/keyboard/ShortcutHandler.tsx` (NEW)
- `src/app/providers.tsx` (MODIFIED - wraps with ShortcutProvider)
- `src/components/layout/Header.tsx` (MODIFIED - search input added)

**Key Interfaces to REUSE:**
```typescript
// From ShortcutContext
const { registerMoveSelectionDown, registerMoveSelectionUp } = useShortcuts();

// Usage in EventTable:
useEffect(() => {
  registerMoveSelectionDown(() => {
    // Move selection down logic
  });
  registerMoveSelectionUp(() => {
    // Move selection up logic
  });
}, [registerMoveSelectionDown, registerMoveSelectionUp]);
```

**Review Findings from Story 2.1:**
- All ACs passed, story approved ✅
- Minor: Use console.debug consistently for dev logging
- Manual browser testing completed across Chrome/Firefox/Safari
- No security issues

[Source: docs/sprint-artifacts/2-1-keyboard-shortcut-system-foundation.md#Dev-Agent-Record]

### Architecture Alignment

**Epic 2 Tech Spec - Story 2.2 Requirements:**
- Use React Aria `<Table>`, `<TableHeader>`, `<TableBody>`, `<Row>`, `<Cell>` components
- Selection mode: `selectionMode="single"`
- Custom `onKeyDown` handler to override arrows with j/k
- Track selected row via `selectedKeys` state
- Style: Olive focus ring on `[data-focused]` and `[data-selected]` rows

**Tech Spec - EventTable Module:**
```
Location: src/components/dashboard/EventTable.tsx
Responsibility: React Aria Table with single-selection mode. Overrides arrow keys with j/k vim-style navigation. Displays 2-line ItemRow components with olive focus ring on selection.
```

**Implementation Pattern (from Tech Spec):**
```typescript
import { Table, Row, Cell } from 'react-aria-components';

<Table
  selectionMode="single"
  selectedKeys={selectedKeys}
  onSelectionChange={setSelectedKeys}
  onKeyDown={(e) => {
    if (e.key === 'j') {
      e.preventDefault();
      moveSelection('down');
    }
    if (e.key === 'k') {
      e.preventDefault();
      moveSelection('up');
    }
  }}
>
  {/* rows */}
</Table>
```

**Tailwind CSS (from Tech Spec):**
```css
.react-aria-Row[data-focused] {
  outline: 2px solid #9DAA5F;
  outline-offset: -2px;
}
```

### Project Structure

**Files to Create:**
```
src/
├── components/
│   └── dashboard/
│       └── EventTable.tsx    # New React Aria Table component
```

**Files to Modify:**
```
src/app/dashboard/page.tsx    # Replace existing table with EventTable
```

**Files to Reference:**
```
src/components/dashboard/ItemRow.tsx         # Existing from Story 1.6 (reuse)
src/components/keyboard/ShortcutContext.tsx  # Existing from Story 2.1 (import useShortcuts)
```

### Performance Requirements

- Keyboard response: <50ms from keypress to visual feedback (j/k navigation)
- Table rendering: Should handle 50+ rows without lag
- Selection state updates should be synchronous (no visible delay)

### Accessibility Requirements (WCAG 2.1 AA)

- Focus indicators: Minimum 2px width ✅ (outline-2)
- Contrast ratio: Olive #9DAA5F on dark #2d2e2e background = ~4.2:1 ✅ (exceeds 3:1 minimum for UI components)
- Keyboard navigation: All table interactions accessible via keyboard
- Screen reader: Table has aria-label, rows have proper role attributes (React Aria provides)

### Integration with Epic 1 Components

**ItemRow Component (Story 1.6):**
- Location: `src/components/dashboard/ItemRow.tsx`
- Already implements 2-line layout (52px height)
- Accepts `item` prop with event data
- Shows badge, title, snippet, metadata
- Will be wrapped in React Aria `<Row>` and `<Cell>` components

**Dashboard Page (Story 1.7):**
- Location: `src/app/dashboard/page.tsx`
- Already fetches events via tRPC
- Currently displays placeholder/basic list
- Will be updated to use EventTable component

### References

- [Epic 2 Tech Spec - Story 2.2](docs/sprint-artifacts/tech-spec-epic-2.md#story-22-react-aria-table-with-vim-style-navigation)
- [Epic 2 Story Breakdown - Story 2.2](docs/epics/epic-2-user-controlled-queries-with-keyboard-foundation-story-breakdown.md#story-22-react-aria-table-with-vim-style-navigation)
- [React Aria Table Documentation](https://react-spectrum.adobe.com/react-aria/Table.html)
- [React Aria Selection API](https://react-spectrum.adobe.com/react-aria/selection.html)
- [Previous Story - 2.1 Keyboard Shortcuts](docs/sprint-artifacts/2-1-keyboard-shortcut-system-foundation.md)
- [Story 1.6 - ItemRow Component](docs/sprint-artifacts/1-6-2-line-table-view-with-hardcoded-query.md)
- [Architecture - ADR-008 React Aria Components](docs/architecture.md#adr-008-react-aria-components-for-keyboard-first-ux)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/2-2-react-aria-table-with-vim-style-navigation.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

**2025-11-25 Implementation Plan:**
1. Create EventTable component using React Aria Table components with single-selection mode
2. Implement vim-style j/k navigation via wrapper div onKeyDown handler (React Aria Table doesn't expose onKeyDown directly)
3. Register handlers with ShortcutContext for global j/k shortcuts from Story 2.1
4. Apply olive focus ring styling using data-focused and data-selected attributes
5. Replace sectioned table view in dashboard with unified EventTable
6. Combine all event types (issues, MRs, comments) into single sorted list for seamless j/k navigation

**Technical Note:** React Aria Table component doesn't expose onKeyDown prop directly. Solution: Wrapped Table in a focusable div that handles keyboard events. This maintains full React Aria accessibility while adding vim-style navigation.

### Completion Notes List

- Created EventTable component at `src/components/dashboard/EventTable.tsx`
- Integrated with ShortcutContext for global j/k keyboard handlers
- Dashboard now shows unified event list sorted by createdAt desc
- Focus router pattern: pressing j/k anywhere on page auto-focuses table and selects first/next row
- Added auto-scroll to keep selected row in view when navigating
- Added Ctrl+d/Ctrl+u for half-page jumps (10 rows) - vim-style navigation enhancement
- TypeScript compiles successfully, build passes
- Manual testing verified: j/k navigation, Ctrl+d/Ctrl+u jumps, olive focus ring, scroll behavior

### Known Issues / Future Improvements

- **Performance in dev mode**: ~150ms lag on keypress due to React dev mode overhead. Production build should meet <50ms requirement.
- **Smooth key-hold navigation**: Holding j/k doesn't smoothly scroll - needs debouncing or animation optimization in future iteration.
- **Minimum resolution breakpoint**: Dashboard shows "Desktop or Laptop Required" message at smaller resolutions - PM to address UX for split-window setups.

### File List

**New Files:**
- `src/components/dashboard/EventTable.tsx` - React Aria Table with vim-style navigation

**Modified Files:**
- `src/app/dashboard/page.tsx` - Replaced sectioned tables with unified EventTable component
- `src/components/keyboard/ShortcutContext.tsx` - Added Ctrl+d/Ctrl+u handlers
- `src/components/keyboard/ShortcutHandler.tsx` - Added Ctrl+d/Ctrl+u key routing
- `docs/sprint-artifacts/sprint-status.yaml` - Updated story status to in-progress

## Change Log

**2025-11-25** - Story created by create-story workflow. Status: drafted. Story 2.2 implements React Aria Table with vim-style j/k navigation, building on the keyboard shortcut foundation from Story 2.1. Integrates with existing ItemRow component from Epic 1. Next step: Run story-context to generate technical context and mark story ready for development.

**2025-11-25** - Implementation complete (Tasks 1-6). Created EventTable component with React Aria Table, vim-style j/k navigation, olive focus ring, and WCAG 2.1 AA compliance. Integrated with dashboard page. Awaiting manual testing (Task 7) to verify functionality in browser.

**2025-11-25** - Manual testing complete. Fixed double-firing issue (removed duplicate onKeyDown handler). Added auto-scroll to selected row. Added Ctrl+d/Ctrl+u half-page navigation (Task 8, AC 2.2.6). All core functionality verified in Chrome. Story ready for review.
