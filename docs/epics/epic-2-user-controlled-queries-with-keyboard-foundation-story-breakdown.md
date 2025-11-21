# Epic 2: User-Controlled Queries with Keyboard Foundation - Story Breakdown

**Epic Goal:** Enable users to create personalized queries and establish keyboard-first identity

**Timeline:** Week 1-2 (5-10 days) | **Value:** Users can save and navigate custom queries with vim-style shortcuts

---

## Story 2.1: Keyboard Shortcut System Foundation

**As a** power user
**I want** a global keyboard shortcut system
**So that** I can navigate the app efficiently without using a mouse

**Acceptance Criteria:**
- Given I'm anywhere in the application
- When I press `/`
- Then the search input receives focus
- And when I press `Esc`
- Then focus is removed and any modal/search state is cleared
- And when I press `j` or `k` outside of input fields
- Then item selection moves down or up respectively
- And keyboard shortcuts do NOT trigger when typing in text inputs

**Frontend:**
- Component: `src/components/keyboard/ShortcutHandler.tsx`
- Global keyboard event listener at app root
- Context-aware routing (check if input/textarea focused)
- Shortcut registry: Map<key, handler>
- Prevent default browser shortcuts when appropriate

**Technical Notes:**
```typescript
// Context-aware handler
const handleKeyPress = (e: KeyboardEvent) => {
  // Don't intercept if user is typing
  const isTyping = ['INPUT', 'TEXTAREA'].includes(
    (e.target as HTMLElement).tagName
  );
  if (isTyping && e.key !== 'Escape') return;

  // Route shortcuts
  switch(e.key) {
    case '/': focusSearch(); break;
    case 'j': moveSelectionDown(); break;
    case 'k': moveSelectionUp(); break;
    case 'Escape': clearFocusAndModals(); break;
  }
};
```

**Prerequisites:** Story 1.7 (App layout with React Aria)

**FR Mapping:** FR52 (`/` focus), FR53 (`j/k` navigation), FR58-59 (Keyboard accessibility)

**Definition of Done:**
- ✅ `/` focuses search from anywhere
- ✅ `j/k` navigation works when not typing
- ✅ `Esc` clears focus and closes modals
- ✅ Shortcuts don't interfere with text input
- ✅ No browser default shortcuts hijacked unintentionally

---

## Story 2.2: React Aria Table with vim-style Navigation

**As a** user viewing the dashboard
**I want** to navigate events with `j/k` keys like vim
**So that** I can quickly scan items without reaching for the mouse

**Acceptance Criteria:**
- Given I'm on the dashboard with events displayed
- When I press `j`
- Then the selection moves to the next item (down)
- And when I press `k`
- Then the selection moves to the previous item (up)
- And the selected row shows an olive focus ring (2px solid #9DAA5F)
- And arrow keys are overridden (j/k replace ArrowDown/ArrowUp)
- And focus indicators are visible and WCAG 2.1 AA compliant

**Frontend:**
- Component: `src/components/dashboard/EventTable.tsx`
- Use React Aria `<Table>`, `<TableHeader>`, `<TableBody>`, `<Row>`, `<Cell>` components
- Selection mode: `selectionMode="single"`
- Custom `onKeyDown` handler to override arrows
- Track selected row via `selectedKeys` state
- Style: Olive focus ring on `[data-focused]` and `[data-selected]` rows

**Technical Notes:**
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

Tailwind CSS:
```css
.react-aria-Row[data-focused] {
  outline: 2px solid #9DAA5F;
  outline-offset: -2px;
}
```

**Prerequisites:** Story 2.1 (Keyboard system), Story 1.6 (ItemRow component)

**FR Mapping:** FR53 (`j/k` navigation), FR58-59 (Keyboard accessibility, focus indicators)

**Definition of Done:**
- ✅ React Aria Table component implemented
- ✅ `j/k` keys navigate items (arrows overridden)
- ✅ Selected row shows olive focus ring
- ✅ Focus indicators visible and accessible
- ✅ No console errors or React warnings
- ✅ Works with existing ItemRow from Epic 1

---

## Story 2.3: PostgreSQL Full-Text Search Backend

**As a** developer
**I want** PostgreSQL full-text search with GIN indexes
**So that** search queries return results in <1 second

**Acceptance Criteria:**
- Given the Event table contains 10,000+ events
- When a user searches for "authentication"
- Then results are returned in <1 second
- And results are ranked by relevance (ts_rank)
- And the query uses PostgreSQL FTS (`to_tsvector`, `to_tsquery`)
- And a GIN index exists on the search columns
- And the search handles multiple keywords with AND/OR logic

**Backend:**
- Path: `src/lib/search/postgres-fts.ts`
- tRPC query: `events.search(query: string)`
- Use Prisma `$queryRaw` for FTS queries
- GIN index on `to_tsvector('english', title || ' ' || body)`

**Database Migration:**
```sql
-- Migration: add_fts_index
CREATE INDEX events_search_idx
ON events
USING gin(to_tsvector('english', title || ' ' || body));
```

**Query Implementation:**
```typescript
const searchEvents = async (query: string) => {
  return prisma.$queryRaw`
    SELECT
      *,
      ts_rank(
        to_tsvector('english', title || ' ' || body),
        plainto_tsquery('english', ${query})
      ) as rank
    FROM events
    WHERE to_tsvector('english', title || ' ' || body)
          @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC, created_at DESC
    LIMIT 50
  `;
};
```

**Performance Testing:**
- Seed database with 10k events using `scripts/seed-events.ts`
- Run search queries and measure time
- Target: <1s for typical queries, <500ms for simple queries

**Prerequisites:** Story 1.2 (Database schema)

**FR Mapping:** FR9 (<1s search), FR10 (Search by keywords), FR11 (All event types), FR68 (Performance)

**Definition of Done:**
- ✅ GIN index created via Prisma migration
- ✅ Search query returns results <1s on 10k events
- ✅ Results ranked by relevance (ts_rank)
- ✅ Handles multiple keywords correctly
- ✅ Returns events across all types (Issues/MRs/Comments)
- ✅ Performance tested and validated

---

## Story 2.4: Search Bar UI

**As a** user
**I want** to search for events by typing keywords
**So that** I can quickly find relevant discussions

**Acceptance Criteria:**
- Given I'm on the dashboard
- When I press `/`
- Then the search input receives focus with visual indicator
- And when I type "authentication"
- Then search triggers after 300ms debounce
- And loading indicator appears
- And results update in the table below in <1 second
- And when I press `Esc`
- Then the search is cleared and focus removed
- And there's a visible "Clear" button (X icon) when search has text

**Frontend:**
- Component: `src/components/search/SearchBar.tsx`
- Use React Aria `Combobox` component for accessibility
- Debounce input with `useDebounce` hook (300ms)
- Call `trpc.events.search.useQuery()` on debounced value
- Loading spinner during query
- Clear button (X icon) when `value.length > 0`

**Technical Notes:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const debouncedQuery = useDebounce(searchQuery, 300);

const { data, isLoading } = trpc.events.search.useQuery(
  { query: debouncedQuery },
  { enabled: debouncedQuery.length > 0 }
);

// Focus on `/` handled by Story 2.1's ShortcutHandler
```

**Prerequisites:** Story 2.1 (Keyboard system), Story 2.3 (Search backend)

**FR Mapping:** FR52 (`/` focus), FR9 (<1s search), FR10 (Keyword search), FR68 (Performance)

**Definition of Done:**
- ✅ Search input accessible via `/` shortcut
- ✅ Input debounced at 300ms
- ✅ Results appear <1s after typing stops
- ✅ Loading indicator shows during search
- ✅ Clear button visible when text present
- ✅ `Esc` clears search and removes focus
- ✅ No search triggered on empty input

---

## Story 2.5: Keyword Highlighting in Search Results

**As a** user viewing search results
**I want** to see which keywords matched
**So that** I understand why each item was returned

**Acceptance Criteria:**
- Given I search for "authentication"
- When results appear in the table
- Then matching keywords are highlighted with olive background (#9DAA5F with 30% opacity)
- And highlights appear in both title (Line 1) and snippet (Line 2) of ItemRow
- And highlighting is case-insensitive
- And multiple keyword matches are all highlighted
- And highlighting respects word boundaries (no partial matches)

**Frontend:**
- Modify: `src/components/dashboard/ItemRow.tsx`
- Add `highlightKeywords()` utility function
- Use `<mark>` tag for highlights with custom styling
- Sanitize to prevent XSS if body contains HTML

**Backend:**
- Modify `events.search` tRPC query to return matched keywords
- Response format: `{ events: Event[], highlights: Record<eventId, string[]> }`
- Use PostgreSQL `ts_headline()` for snippet generation with highlights

**Technical Notes:**
```typescript
// Backend: Add to search query
ts_headline(
  'english',
  body,
  plainto_tsquery('english', ${query}),
  'StartSel=<mark>, StopSel=</mark>, MaxWords=100'
) as highlighted_snippet

// Frontend: Highlight function
const highlightKeywords = (text: string, keywords: string[]) => {
  let result = text;
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
    result = result.replace(regex, '<mark>$1</mark>');
  });
  return result;
};
```

Tailwind CSS:
```css
mark {
  background-color: rgba(157, 170, 95, 0.3); /* olive with 30% opacity */
  padding: 0 2px;
  border-radius: 2px;
}
```

**Prerequisites:** Story 2.4 (Search UI), Story 1.6 (ItemRow component)

**FR Mapping:** FR12 (Keyword highlighting), FR9-11 (Search & results)

**Definition of Done:**
- ✅ Keywords highlighted in search results
- ✅ Highlights visible in title and snippet
- ✅ Olive background color used
- ✅ Case-insensitive matching
- ✅ No XSS vulnerabilities
- ✅ Highlights improve result transparency

---

## Story 2.6: Filter UI & Logic

**As a** user
**I want** to apply filters (labels, authors, projects, dates)
**So that** I can narrow results to specific criteria

**Acceptance Criteria:**
- Given I'm on the dashboard
- When I click "Add Filter" button
- Then a filter builder UI appears
- And I can select filter type: Label, Author, Project, Date Range
- And I can enter filter values (text input or dropdown)
- And I can add multiple filters
- And filters combine with AND logic by default
- And I can toggle to OR logic
- And active filters display as chips with remove (X) button
- And filters apply in <200ms
- And I can clear all filters with one click

**Frontend:**
- Component: `src/components/filters/FilterBar.tsx`
- Component: `src/components/filters/FilterBuilder.tsx`
- Filter state: `{ type, operator, value }[]`
- Active filters display as chips with remove handler
- "Clear All" button visible when filters active

**Backend:**
- Modify `events.getForDashboard` tRPC query to accept filters
- Build WHERE clause dynamically based on filters
- Support AND/OR logic

**Technical Notes:**
```typescript
interface Filter {
  type: 'label' | 'author' | 'project' | 'dateRange';
  operator: 'is' | 'contains' | 'after' | 'before';
  value: string | Date;
}

// Backend query builder
const buildWhereClause = (filters: Filter[], logic: 'AND' | 'OR') => {
  const conditions = filters.map(f => {
    switch(f.type) {
      case 'label': return { labels: { has: f.value } };
      case 'author': return { author: { contains: f.value } };
      case 'project': return { project: f.value };
      case 'dateRange': return { createdAt: { gte: f.value } };
    }
  });

  return logic === 'AND' ? { AND: conditions } : { OR: conditions };
};
```

**Prerequisites:** Story 2.4 (Search UI), Story 2.2 (Table display)

**FR Mapping:** FR14-18 (Filtering system), FR69 (<200ms filter application)

**Definition of Done:**
- ✅ Filter UI allows adding multiple filters
- ✅ Supports labels, authors, projects, date ranges
- ✅ AND/OR logic toggle works
- ✅ Active filters visible as chips
- ✅ Filters apply <200ms
- ✅ Clear all filters button works
- ✅ Filters persist when navigating sections

---

## Story 2.7a: Create Query Backend

**As a** developer
**I want** tRPC mutations to create saved queries
**So that** users can persist filter combinations

**Acceptance Criteria:**
- Given a user wants to save their current filters as a query
- When they provide a query name and filters
- Then a new UserQuery record is created in the database
- And the query is associated with the current user (userId)
- And filters are stored as JSON
- And the query ID is returned
- And duplicate query names are allowed (user may want multiple "Security" queries)

**Backend:**
- Path: `src/server/api/routers/queries.ts`
- tRPC mutation: `queries.create`
- Zod schema validation for input
- Prisma insert into UserQuery table

**Technical Notes:**
```typescript
export const queriesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      filters: z.object({
        keywords: z.array(z.string()).optional(),
        labels: z.array(z.string()).optional(),
        authors: z.array(z.string()).optional(),
        projects: z.array(z.string()).optional(),
        dateRange: z.object({
          from: z.date().optional(),
          to: z.date().optional(),
        }).optional(),
        logic: z.enum(['AND', 'OR']).default('AND'),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const query = await ctx.db.userQuery.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          filters: input.filters,
        },
      });
      return query;
    }),
});
```

**Prerequisites:** Story 1.2 (Database schema)

**FR Mapping:** FR19 (Save filter combinations), FR25-26 (Create from search/filters)

**Definition of Done:**
- ✅ `queries.create` mutation works
- ✅ Input validated with Zod
- ✅ Query saved to database
- ✅ Returns created query with ID
- ✅ User isolation enforced (userId)
- ✅ Filters stored as JSON correctly

---

## Story 2.7b: Update/Delete Query Backend

**As a** user
**I want** to edit or remove saved queries
**So that** I can maintain my query list

**Acceptance Criteria:**
- Given I own a saved query
- When I update the query name or filters
- Then the changes are persisted to the database
- And when I delete a query
- Then it's removed from the database
- And I cannot modify or delete queries I don't own (authorization check)

**Backend:**
- Path: `src/server/api/routers/queries.ts`
- tRPC mutations: `queries.update`, `queries.delete`
- Authorization: Check `ctx.session.user.id === query.userId`
- Return error if user doesn't own query

**Technical Notes:**
```typescript
update: protectedProcedure
  .input(z.object({
    id: z.string(),
    name: z.string().min(1).max(100).optional(),
    filters: z.object({...}).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Authorization check
    const existing = await ctx.db.userQuery.findUnique({
      where: { id: input.id },
    });
    if (existing?.userId !== ctx.session.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    return ctx.db.userQuery.update({
      where: { id: input.id },
      data: {
        name: input.name,
        filters: input.filters,
      },
    });
  }),

delete: protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Authorization check (same as update)
    const existing = await ctx.db.userQuery.findUnique({
      where: { id: input.id },
    });
    if (existing?.userId !== ctx.session.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    await ctx.db.userQuery.delete({
      where: { id: input.id },
    });
    return { success: true };
  }),
```

**Prerequisites:** Story 2.7a (Create query backend)

**FR Mapping:** FR22 (Edit queries), FR23 (Delete queries)

**Definition of Done:**
- ✅ `queries.update` mutation works
- ✅ `queries.delete` mutation works
- ✅ Authorization prevents modifying others' queries
- ✅ Returns appropriate errors for unauthorized access
- ✅ Updates persist correctly
- ✅ Deletes remove records

---

## Story 2.8: Sidebar Navigation

**As a** user
**I want** to see my saved queries in a sidebar
**So that** I can quickly navigate to them

**Acceptance Criteria:**
- Given I have saved queries
- When I'm on any page
- Then I see a persistent sidebar on the left
- And the sidebar lists all my saved queries
- And I can click a query to navigate to `/queries/[id]`
- And I can press `1-9` number keys to jump to queries by position
- And if I have no queries, I see a helpful empty state: "Create your first query with / search"

**Frontend:**
- Component: `src/components/queries/QuerySidebar.tsx`
- Fetch queries via `trpc.queries.list.useQuery()`
- Sidebar fixed position, left side
- Number shortcuts handled by Story 2.1's ShortcutHandler
- Navigation via Next.js `<Link>` or `router.push`

**Backend:**
- tRPC query: `queries.list`
- Returns user's queries ordered by `createdAt DESC`

**Technical Notes:**
```typescript
const { data: queries } = trpc.queries.list.useQuery();

// In ShortcutHandler (Story 2.1):
if (['1','2','3','4','5','6','7','8','9'].includes(e.key)) {
  const index = parseInt(e.key) - 1;
  if (queries?.[index]) {
    router.push(`/queries/${queries[index].id}`);
  }
}
```

Sidebar styling:
- Width: 240px
- Background: dark gray (#1a1a1a)
- Query items: Hover state, active state (olive accent)
- Empty state with illustration

**Prerequisites:** Story 2.7a (Query CRUD backend), Story 2.1 (Keyboard shortcuts)

**FR Mapping:** FR20 (Queries in sidebar), FR21 (Navigate to query page), FR92-93 (Keyboard navigation)

**Definition of Done:**
- ✅ Sidebar visible on all pages
- ✅ Lists user's saved queries
- ✅ Click query navigates to query page
- ✅ Number keys `1-9` jump to queries
- ✅ Empty state shown when no queries
- ✅ Sidebar styled per UX spec

---

## Story 2.8.5: "Save as Query" Entry Points

**As a** user exploring events
**I want** a "Save as query" button when I search or filter
**So that** I can easily persist useful patterns

**Acceptance Criteria:**
- Given I have typed a search query OR applied filters
- When the search/filters are active
- Then I see a "Save as query" button (olive accent, prominent)
- And the button is disabled when no search/filters active
- And I can click the button (or press `s` keyboard shortcut)
- Then the Create Query modal opens (Story 2.9)
- And the modal is pre-filled with my current search/filters
- And if I have both search AND filters, both are included in the saved query

**Frontend:**
- Component: `src/components/queries/SaveQueryButton.tsx`
- Button placement: Next to search bar, right-aligned
- Enabled state: `hasActiveSearch || hasActiveFilters`
- Click handler opens modal with current state
- Keyboard shortcut `s` (handled in Story 2.1)

**Technical Notes:**
```typescript
const SaveQueryButton = ({ searchQuery, activeFilters }) => {
  const isEnabled = searchQuery.length > 0 || activeFilters.length > 0;

  const handleSave = () => {
    // Open modal with pre-filled data
    openCreateQueryModal({
      filters: {
        keywords: searchQuery ? [searchQuery] : [],
        ...buildFiltersFromActive(activeFilters),
      },
    });
  };

  return (
    <Button
      onPress={handleSave}
      isDisabled={!isEnabled}
      className="bg-olive-500 disabled:opacity-50"
    >
      Save as query (s)
    </Button>
  );
};

// Add to ShortcutHandler (Story 2.1):
case 's':
  if (!isTyping && (hasSearch || hasFilters)) {
    handleSaveQuery();
  }
  break;
```

**Prerequisites:** Story 2.4 (Search UI), Story 2.6 (Filter UI), Story 2.1 (Keyboard shortcuts)

**FR Mapping:** FR25 (Create from search), FR26 (Create from filters), FR94 (Keyboard shortcut)

**Definition of Done:**
- ✅ Button visible next to search bar
- ✅ Button enabled when search/filters active
- ✅ Button disabled when no search/filters
- ✅ Clicking opens modal with pre-filled data
- ✅ `s` keyboard shortcut triggers save
- ✅ Both search and filters pre-filled if both active
- ✅ Button styled with olive accent

---

## Story 2.9: Create Query Modal

**As a** user
**I want** a modal to name and save my query
**So that** I can create persistent queries

**Acceptance Criteria:**
- Given the "Save as query" button is clicked
- When the modal opens
- Then I see a dialog with:
  - Query name input (required, auto-focused)
  - Read-only display of filters being saved
  - Save and Cancel buttons
- And when I enter a name and click Save
- Then the query is saved via Story 2.7a's backend
- And the modal closes
- And I see a success toast: "Query saved!"
- And the new query appears in the sidebar immediately
- And when I click Cancel or press `Esc`
- Then the modal closes without saving

**Frontend:**
- Component: `src/components/queries/CreateQueryModal.tsx`
- Use React Aria `Dialog` component
- Auto-focus name input on open
- Display filters as read-only summary
- Call `trpc.queries.create.mutate()` on save
- Optimistic update to sidebar

**Technical Notes:**
```typescript
<Dialog>
  <Heading>Save as Query</Heading>
  <TextField
    label="Query name"
    autoFocus
    value={queryName}
    onChange={setQueryName}
  />

  <div className="filters-summary">
    <Text>Filters:</Text>
    {filters.keywords?.length > 0 && (
      <Text>Keywords: {filters.keywords.join(', ')}</Text>
    )}
    {filters.labels?.length > 0 && (
      <Text>Labels: {filters.labels.join(', ')}</Text>
    )}
    {/* ... other filters */}
  </div>

  <ButtonGroup>
    <Button onPress={handleSave}>Save</Button>
    <Button onPress={onClose} variant="secondary">Cancel</Button>
  </ButtonGroup>
</Dialog>
```

Modal styling:
- Centered overlay
- Dark background with blur
- Olive accent on Save button
- Focus trap within modal

**Prerequisites:** Story 2.8.5 (Save button), Story 2.7a (Create backend)

**FR Mapping:** FR19 (Save filter combinations), FR25-26 (Create from search/filters)

**Definition of Done:**
- ✅ Modal opens from "Save as query" button
- ✅ Query name input auto-focused
- ✅ Filters displayed as read-only summary
- ✅ Save creates query and closes modal
- ✅ Cancel closes modal without saving
- ✅ `Esc` closes modal
- ✅ Success toast on save
- ✅ New query appears in sidebar immediately
- ✅ Modal keyboard-accessible

---

## Story 2.10: Edit/Delete Query Actions

**As a** user
**I want** to edit or delete saved queries
**So that** I can maintain my query list

**Acceptance Criteria:**
- Given I have saved queries in the sidebar
- When I hover over a query
- Then I see Edit and Delete icons appear
- And when I click Edit
- Then a modal opens with the query name and filters pre-filled
- And I can modify the name or filters
- And clicking Save updates the query
- And when I click Delete
- Then a confirmation dialog appears: "Delete query '[name]'?"
- And clicking Confirm deletes the query
- And the query is removed from the sidebar immediately

**Frontend:**
- Modify: `src/components/queries/QuerySidebar.tsx` to add Edit/Delete icons on hover
- Component: `src/components/queries/EditQueryModal.tsx` (similar to Story 2.9)
- Component: `src/components/queries/DeleteConfirmDialog.tsx`
- Call `trpc.queries.update.mutate()` for edit
- Call `trpc.queries.delete.mutate()` for delete
- Optimistic UI updates

**Keyboard Shortcuts:**
- When query selected in sidebar, `e` opens Edit modal
- When query selected, `Delete` key opens Delete confirmation

**Technical Notes:**
```typescript
// Sidebar item with actions
<div className="query-item group">
  <Link href={`/queries/${query.id}`}>
    {query.name}
  </Link>
  <div className="actions opacity-0 group-hover:opacity-100">
    <IconButton
      icon={<PencilIcon />}
      onPress={() => openEditModal(query)}
      aria-label="Edit query"
    />
    <IconButton
      icon={<TrashIcon />}
      onPress={() => openDeleteDialog(query)}
      aria-label="Delete query"
    />
  </div>
</div>

// Delete confirmation
<AlertDialog>
  <Heading>Delete query?</Heading>
  <Content>
    Are you sure you want to delete "{query.name}"? This cannot be undone.
  </Content>
  <ButtonGroup>
    <Button onPress={handleDelete} variant="destructive">Delete</Button>
    <Button onPress={onClose}>Cancel</Button>
  </ButtonGroup>
</AlertDialog>
```

**Prerequisites:** Story 2.8 (Sidebar), Story 2.7b (Update/Delete backend)

**FR Mapping:** FR22 (Edit queries), FR23 (Delete queries), FR95 (Keyboard shortcuts for edit/delete)

**Definition of Done:**
- ✅ Edit/Delete icons appear on hover
- ✅ Edit modal opens with pre-filled data
- ✅ Can update query name and filters
- ✅ Delete shows confirmation dialog
- ✅ Deleting removes from sidebar immediately
- ✅ Keyboard shortcuts work (`e` for edit, `Delete` for delete)
- ✅ Optimistic UI updates feel instant
- ✅ Error handling for failed operations

---

**Epic 2 Summary:**
- **11 stories** (was 10, added Story 8.5 during discussion)
- **Timeline:** 5-10 days (solo developer)
- **Demo-able:** Users can search, filter, save queries, navigate with keyboard shortcuts
- **Value:** Core discovery workflow complete - explore → save → monitor
- **Performance:** <500ms loads, <1s search, <200ms filters (validated in DoD)

**Epic 2 Definition of Done:**
✅ All 11 stories complete
✅ End-to-end test passes: Search → Save as Query → Navigate via Sidebar
✅ Performance validated: <500ms loads, <1s search, <200ms filters
✅ Keyboard shortcuts functional: `/`, `j/k`, `s`, `1-9`, `Esc`
✅ Accessibility audit: React Aria Table navigable, focus indicators visible
✅ No regression: Epic 1 functionality still works

---
