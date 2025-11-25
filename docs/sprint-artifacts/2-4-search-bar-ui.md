# Story 2.4: Search Bar UI

Status: ready-for-dev

## Story

As a **user**,
I want **to search for events by typing keywords**,
so that **I can quickly find relevant discussions**.

## Acceptance Criteria

| AC ID | Criterion |
|-------|-----------|
| 2.4.1 | Search input receives focus on `/` keypress |
| 2.4.2 | Search triggers after 300ms debounce |
| 2.4.3 | Loading indicator appears during search |
| 2.4.4 | Results appear in <1s after typing stops |
| 2.4.5 | Clear button (X icon) visible when search has text |
| 2.4.6 | `Esc` clears search and removes focus |

## Tasks / Subtasks

- [ ] Task 1: Create SearchBar Component (AC: 2.4.1, 2.4.3, 2.4.5, 2.4.6)
  - [ ] 1.1 Create `src/components/search/SearchBar.tsx` as controlled component using React Aria SearchField
  - [ ] 1.2 Props interface: `{ value, onChange, onClear, isLoading, inputRef }`
  - [ ] 1.3 Add search input with placeholder text "Search events..."
  - [ ] 1.4 Add Clear button (X icon) that appears when `value.length > 0`
  - [ ] 1.5 Inline loading spinner replaces X button when `isLoading={true}` (no layout shift)
  - [ ] 1.6 SearchBar handles Esc internally via React Aria - calls `onClear()` and blurs input
  - [ ] 1.7 Style with olive accent colors per UX spec (#9DAA5F focus ring)

- [ ] Task 2: Implement Debounced Search in Dashboard (AC: 2.4.2, 2.4.4)
  - [ ] 2.1 Create `src/hooks/useDebounce.ts` hook with configurable delay
  - [ ] 2.2 Add search state to `dashboard/page.tsx`: `searchQuery`, `setSearchQuery`
  - [ ] 2.3 Apply 300ms debounce to searchQuery before API call
  - [ ] 2.4 Call `trpc.events.search.useQuery()` with debounced value
  - [ ] 2.5 Only enable query when `debouncedQuery.length > 0`
  - [ ] 2.6 Pass `isLoading` from tRPC query to SearchBar

- [ ] Task 3: Integrate with Keyboard Shortcut System (AC: 2.4.1)
  - [ ] 3.1 Dashboard creates inputRef and passes to SearchBar
  - [ ] 3.2 Dashboard registers `setFocusSearch()` handler that calls `inputRef.current?.focus()`
  - [ ] 3.3 Verify ShortcutHandler already calls `focusSearch()` on `/` (no changes needed)
  - [ ] 3.4 Verify `/` focuses search from anywhere in the app

- [ ] Task 4: Connect Search Results to EventTable (AC: 2.4.4)
  - [ ] 4.1 Dashboard conditionally passes events: `searchQuery ? searchResults : dashboardEvents`
  - [ ] 4.2 Transform SearchResultEvent[] to DashboardEvent[] format if needed
  - [ ] 4.3 Show all events when search is empty/cleared (automatic via conditional)
  - [ ] 4.4 Verify results appear in <1s using browser DevTools

- [ ] Task 5: Testing and Validation (AC: All)
  - [ ] 5.1 Verify `/` focuses search input from dashboard
  - [ ] 5.2 Verify 300ms debounce (type fast, observe single request in Network tab)
  - [ ] 5.3 Verify loading spinner appears inside input during search
  - [ ] 5.4 Verify results in <1s with 10k events (run db:seed-events first)
  - [ ] 5.5 Verify X button clears search and shows all events
  - [ ] 5.6 Verify `Esc` clears search text and removes focus

## Dev Notes

### Learnings from Previous Story

**From Story 2-3-postgresql-full-text-search-backend (Status: done)**

- **FTS Backend Ready**: `events.search` tRPC endpoint available at `src/server/api/routers/events.ts:289-338`
- **Search Function**: `searchEvents()` in `src/lib/search/postgres-fts.ts` handles FTS with ranking and highlighting
- **Performance Validated**: <100ms search times on 23,938 events (well under 1s requirement)
- **Response Format**: Returns `{ events: SearchResult[], total: number }` with `highlightedTitle` and `highlightedSnippet`
- **Input Schema**: `{ keyword: z.string().min(1).max(100), limit: z.number().default(50) }`
- **Helper Available**: `countSearchResults()` for future query counts in sidebar

**Files Created in Story 2.3:**
- `prisma/migrations/20251125143604_add_fts_index/migration.sql` (GIN index)
- `src/lib/search/postgres-fts.ts` (FTS query builder)
- `scripts/seed-events.ts` (Performance test data seeder)
- `scripts/test-fts-performance.ts` (FTS validation script)

**Files Modified in Story 2.3:**
- `src/server/api/routers/events.ts` - Added events.search query endpoint
- `package.json` - Added tsx devDependency and db:seed-events script

**Review Outcome**: APPROVED - All 5 ACs verified, no HIGH/MEDIUM issues

[Source: docs/sprint-artifacts/2-3-postgresql-full-text-search-backend.md#Dev-Agent-Record]

### Architecture Alignment

**State Management (Party Mode Decision 2025-11-25):**
Dashboard owns ALL search state. SearchBar is a controlled/presentational component.

```typescript
// Dashboard manages state:
const [searchQuery, setSearchQuery] = useState('');
const debouncedQuery = useDebounce(searchQuery, 300);
const { data: searchResults, isLoading } = api.events.search.useQuery(
  { keyword: debouncedQuery },
  { enabled: debouncedQuery.length > 0 }
);

// Conditional data flow:
const displayEvents = debouncedQuery ? searchResults?.events : dashboardEvents;

// SearchBar is purely presentational:
<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  onClear={() => setSearchQuery('')}
  isLoading={isLoading}
  inputRef={searchInputRef}
/>
```

**State Behavior:**
- Empty search query (length 0) → display all events (dashboard default)
- Non-empty query → display search results after 300ms debounce
- Clearing via X or Esc → searchQuery becomes '', showing all events

**Esc Key Handling (Party Mode Decision 2025-11-25):**
SearchBar handles Esc internally via React Aria SearchField's built-in keyboard handling. When Esc is pressed while input is focused:
1. Calls `onClear()` prop (clears searchQuery in dashboard)
2. Blurs the input (removes focus)
No ShortcutContext registration needed for Esc - React Aria handles it.

**Loading Indicator (Party Mode Decision 2025-11-25):**
Inline spinner inside search input, right-aligned. Replaces X button during loading to prevent layout shift:
- Idle: `[🔍 Search events...          ]`
- Loading: `[🔍 authentication        ⟳  ]`
- Results: `[🔍 authentication        ✕  ]`

**Keyboard Shortcut Integration:**
Per Story 2.1's ShortcutHandler, the `/` key calls `focusSearch()`. Dashboard registers handler via `setFocusSearch()` that focuses the SearchBar's input ref.

**Performance Requirements:**
- Search response: <1s after typing stops (backend delivers <100ms, UI should add minimal overhead)
- Debounce: 300ms prevents excessive API calls during typing

[Source: docs/sprint-artifacts/tech-spec-epic-2.md#story-24-search-bar-ui]
[Source: docs/architecture.md#keyboard-shortcut-system]

### Project Structure Notes

**Files to Create:**
```
src/
├── components/
│   └── search/
│       └── SearchBar.tsx    # Controlled presentational component
├── hooks/
│   └── useDebounce.ts       # Generic debounce hook
```

**Files to Modify:**
```
src/app/dashboard/page.tsx           # Add search state, SearchBar, conditional EventTable data
```

**Files NOT Modified (no changes needed):**
```
src/components/keyboard/ShortcutContext.tsx  # Already has setFocusSearch/focusSearch
src/components/keyboard/ShortcutHandler.tsx  # Already routes `/` to focusSearch()
```

**Existing Components to Integrate With:**
- `EventTable.tsx` - Receives events prop (search results or dashboard events)
- `ShortcutContext.tsx` - Dashboard registers focusSearch handler
- `events.ts` router - Has `search` endpoint ready at lines 289-338

[Source: docs/architecture.md#project-structure]

### React Aria Components

Use React Aria `SearchField` component for accessibility:
```typescript
import { SearchField, Input, Button, Label } from 'react-aria-components';

<SearchField
  value={searchQuery}
  onChange={setSearchQuery}
  onClear={() => setSearchQuery('')}
>
  <Label className="sr-only">Search events</Label>
  <Input placeholder="Search events..." />
  <Button>✕</Button>
</SearchField>
```

[Source: docs/architecture.md#ui-component-patterns-react-aria-components]

### Styling Guidelines

- Dark mode only (ADR-009)
- Olive accent: #9DAA5F for focus states
- Background: #2d2e2e
- Input styling: Dark input with subtle border, olive focus ring

[Source: docs/architecture.md#adr-009-dark-mode-only-for-mvp]

### References

- [Epic 2 Tech Spec - Story 2.4](docs/sprint-artifacts/tech-spec-epic-2.md#story-24-search-bar-ui)
- [Epic 2 Story Breakdown - Story 2.4](docs/epics/epic-2-user-controlled-queries-with-keyboard-foundation-story-breakdown.md#story-24-search-bar-ui)
- [Architecture - Keyboard Shortcut System](docs/architecture.md#keyboard-shortcut-system)
- [Architecture - React Aria Components](docs/architecture.md#ui-component-patterns-react-aria-components)
- [Previous Story - 2.3 PostgreSQL FTS](docs/sprint-artifacts/2-3-postgresql-full-text-search-backend.md)
- [React Aria SearchField Documentation](https://react-spectrum.adobe.com/react-aria/SearchField.html)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/2-4-search-bar-ui.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

**2025-11-25** - Story created by create-story workflow. Status: drafted. Story 2.4 implements the Search Bar UI that connects to the PostgreSQL FTS backend from Story 2.3. The search input integrates with the keyboard shortcut system (Story 2.1) for `/` focus and uses debounced queries for optimal performance. Next step: Run story-context to generate technical context and mark story ready for development.

**2025-11-25** - Story context generated. Status: drafted → ready-for-dev. Context file created at docs/sprint-artifacts/2-4-search-bar-ui.context.xml.

**2025-11-25** - Party Mode review with full agent team. Identified and resolved 4 gaps:
1. **Esc handling** - SearchBar handles internally via React Aria (no context registration)
2. **State management** - Dashboard owns all state, SearchBar is controlled/presentational
3. **Loading indicator** - Inline spinner replaces X button (no layout shift)
4. **Empty search state** - Documented in Dev Notes (not new AC)
Tasks restructured: consolidated from 6 to 5 tasks, clarified responsibilities between SearchBar and Dashboard.
