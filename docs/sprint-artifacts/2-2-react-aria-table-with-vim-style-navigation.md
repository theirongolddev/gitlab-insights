# Story 2.2: React Aria Table with vim-style Navigation

Status: ready-for-dev

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

## Tasks / Subtasks

- [ ] Task 1: Create EventTable Component with React Aria (AC: 2.2.1, 2.2.5)
  - [ ] 1.1 Create `src/components/dashboard/EventTable.tsx` component
  - [ ] 1.2 Import React Aria Table components: `Table`, `TableHeader`, `TableBody`, `Row`, `Cell`, `Column`
  - [ ] 1.3 Set up table structure with single-selection mode: `selectionMode="single"`
  - [ ] 1.4 Add `selectedKeys` state management using `useState<Selection>(new Set())`
  - [ ] 1.5 Import and integrate existing `ItemRow` component from Story 1.6

- [ ] Task 2: Implement vim-style Navigation (AC: 2.2.2)
  - [ ] 2.1 Add custom `onKeyDown` handler to Table component
  - [ ] 2.2 Intercept `j` keypress: call `e.preventDefault()` and move selection down
  - [ ] 2.3 Intercept `k` keypress: call `e.preventDefault()` and move selection up
  - [ ] 2.4 Implement selection movement logic using React Aria's selection APIs
  - [ ] 2.5 Handle edge cases: first item (k does nothing), last item (j does nothing)

- [ ] Task 3: Implement Focus Router Pattern (AC: 2.2.2)
  - [ ] 3.1 Import `useShortcuts` hook from `@/components/keyboard/ShortcutContext`
  - [ ] 3.2 Create `tableRef` using `useRef` for table element reference
  - [ ] 3.3 Add `tabIndex={0}` to Table component to make it focusable
  - [ ] 3.4 Register `moveSelectionDown` handler: check if table has focus, if NO focus call `tableRef.current?.focus()` then move selection, if HAS focus let Table's onKeyDown handle it (no-op in global handler)
  - [ ] 3.5 Register `moveSelectionUp` handler: same focus check logic as 3.4
  - [ ] 3.6 If `events.length === 0` and j/k pressed, return early (silent no-op, empty state message already visible)

- [ ] Task 4: Style Selected Row with Olive Focus Ring (AC: 2.2.3)
  - [ ] 4.1 Add Tailwind CSS classes to Row component for focus state
  - [ ] 4.2 Apply olive focus ring on `[data-focused]`: `outline-2 outline-[#9DAA5F] outline-offset-[-2px]`
  - [ ] 4.3 Apply olive focus ring on `[data-selected]`: same styling
  - [ ] 4.4 Ensure ring appears on both keyboard focus and selection state
  - [ ] 4.5 Test ring visibility in dark mode

- [ ] Task 5: Ensure WCAG 2.1 AA Compliance (AC: 2.2.4)
  - [ ] 5.1 Verify focus indicators have minimum 2px width (outline-2)
  - [ ] 5.2 Verify contrast ratio: olive (#9DAA5F) against dark background (#2d2e2e) meets 3:1 minimum for UI components
  - [ ] 5.3 Test keyboard navigation without mouse (all table interactions accessible)
  - [ ] 5.4 Verify focus indicators visible when navigating with Tab key
  - [ ] 5.5 Add `aria-label` to Table component: "Events table"

- [ ] Task 6: Integrate with Dashboard Page (AC: 2.2.1)
  - [ ] 6.1 Replace existing table/list rendering in `src/app/dashboard/page.tsx` with EventTable
  - [ ] 6.2 Pass events data from tRPC query to EventTable as props
  - [ ] 6.3 Handle loading state (show skeleton rows or loading spinner)
  - [ ] 6.4 Handle empty state in EventTable: when `events.length === 0`, show centered message "No events to display" with helper text "Try syncing your GitLab projects" instead of table rows
  - [ ] 6.5 Test dashboard page renders EventTable with real data
  - [ ] 6.6 Test empty state displays correctly when no events

- [ ] Task 7: Manual Testing - Table Navigation (AC: 2.2.2, 2.2.3, 2.2.4)
  - [ ] 7.1 Test `j` key moves selection down row-by-row
  - [ ] 7.2 Test `k` key moves selection up row-by-row
  - [ ] 7.3 Test arrow keys do NOT move selection (overridden by j/k)
  - [ ] 7.4 Test focus ring appears on selected row with correct olive color
  - [ ] 7.5 Test Tab key navigation reaches table and shows focus indicators
  - [ ] 7.6 Test with 10+ rows to verify scrolling behavior
  - [ ] 7.7 Test across browsers (Chrome, Firefox, Safari)

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

**2025-11-25** - Story created by create-story workflow. Status: drafted. Story 2.2 implements React Aria Table with vim-style j/k navigation, building on the keyboard shortcut foundation from Story 2.1. Integrates with existing ItemRow component from Epic 1. Next step: Run story-context to generate technical context and mark story ready for development.
