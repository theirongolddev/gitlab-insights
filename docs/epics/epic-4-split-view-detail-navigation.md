# Epic 4: Split View & Detail Navigation

**Goal:** Enable users to explore event details without leaving the app, reducing tab chaos and context switching through a mouse-driven split pane interface.

**Timeline:** 3.5-4 days (28 hours solo)

**Scope:** 7 stories covering split pane UI, detail rendering, section navigation, and responsive behavior

**FR Coverage:**
- FR31-33: Split pane → Stories 4.1-4.3
- FR34-35: Keyword highlighting → Story 4.4
- FR36-37: Section navigation → Story 4.5
- FR38: Query page → Story 4.6
- FR39-40: Scroll persistence → Story 4.7

**Architecture Notes:**
- Uses vertical split (divider line is vertical, content is left-right)
- Built with React Aria Table foundation (keyboard layer can be added in Phase 2)
- URL-based state management (?detail=eventId) for deep linking
- Responsive: Desktop (open by default), Tablet (closed by default), Mobile (full-screen navigation)

---

## Story 4.1: Split Pane Component with Toggle Button

**As a** user viewing a query's events
**I want** to toggle a split view on/off
**So that** I can see event details without opening new tabs

**Acceptance Criteria:**
- Given I am on desktop (≥1024px), when page loads, then split view is OPEN by default (60/40 table/detail)
- Given I am on desktop, when page loads, then a toggle button appears in the header
- Given split view is open, when I click toggle, then detail pane closes and table expands to full width
- Given split view is closed, when I click toggle, then detail pane opens and last selected event loads
- Given I toggle the pane, then my preference persists in localStorage
- Given I am on tablet (768-1023px), when page loads, then split view is CLOSED by default
- Given I am on mobile (<768px), then toggle button is NOT visible and clicking rows navigates to /events/:id

**Frontend:**
- Component: `src/components/layout/SplitView.tsx`
- Hook: `src/hooks/useDetailPane.ts` - manages open/closed state with localStorage
- Responsive: `useMediaQuery` hook for screen size detection
- URL state: `?detail=<eventId>` parameter when pane open
- Toggle button in header with PanelRightClose/PanelRightOpen icons

**Backend:**
- No backend changes needed

**Technical Notes:**
```typescript
// hooks/useDetailPane.ts
export function useDetailPane() {
  const [isOpen, setIsOpen] = useLocalStorage(
    'split-view-open',
    defaultOpenForScreenSize()
  );

  return { isOpen, setIsOpen };
}

const defaultOpenForScreenSize = () => {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= 1024; // Open for desktop only
};

// components/QueryView.tsx
export function QueryView() {
  const { isOpen, setIsOpen } = useDetailPane();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const router = useRouter();
  const queryId = router.query.id as string;

  // Deep linking support
  const { detail } = router.query;
  useEffect(() => {
    if (detail) {
      setSelectedEventId(detail as string);
      setIsOpen(true);
    }
  }, [detail]);

  const handleToggle = () => {
    if (isOpen) {
      router.push(`/queries/${queryId}`, undefined, { shallow: true });
      setIsOpen(false);
    } else {
      if (selectedEventId) {
        router.push(`/queries/${queryId}?detail=${selectedEventId}`, undefined, { shallow: true });
      }
      setIsOpen(true);
    }
  };

  return (
    <div className="flex h-full">
      {/* Table Section */}
      <div className={cn(
        "transition-all duration-200",
        isOpen && !isMobile ? "w-3/5" : "w-full"
      )}>
        <EventTable
          onRowClick={setSelectedEventId}
          selectedEventId={selectedEventId}
        />
      </div>

      {/* Detail Pane */}
      {isOpen && !isMobile && (
        <div className="w-2/5 border-l border-gray-200 bg-white">
          <EventDetail eventId={selectedEventId} />
        </div>
      )}

      {/* Toggle Button (Header) */}
      {!isMobile && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          aria-label={isOpen ? "Close detail pane" : "Open detail pane"}
        >
          {isOpen ? <PanelRightCloseIcon /> : <PanelRightOpenIcon />}
        </Button>
      )}
    </div>
  );
}
```

**Prerequisites:** Epic 1 complete (table view functional)

**FR Mapping:** FR31, FR32

**Definition of Done:**
- ✅ Toggle button appears in header (desktop/tablet only)
- ✅ Split pane opens/closes on button click
- ✅ Responsive defaults: desktop open, tablet closed, mobile hidden
- ✅ User preference persists in localStorage across sessions
- ✅ URL updates with ?detail param when pane opens
- ✅ Browser back button closes pane
- ✅ Deep links with ?detail param auto-open pane
- ✅ Smooth transition animation (<200ms)
- ✅ No horizontal scrollbars at any screen size

---

## Story 4.2: Detail Pane Content Rendering

**As a** user viewing event details
**I want** to see full event information (title, body, metadata, GitLab link)
**So that** I can understand context without leaving the app

**Acceptance Criteria:**
- Given detail pane is open and event selected, then display: title, body, author, timestamp, project, labels, GitLab link
- Given I click "Open in GitLab" button, then event URL opens in new tab
- Given no event selected, then show placeholder: "Select an event to view details"
- Given event has no body text, then show "(No description)" in body section

**Frontend:**
- Component: `src/components/events/EventDetail.tsx`
- tRPC query: `events.getById` (reuse from Epic 1)
- Layout: Sticky header, scrollable content, footer with GitLab link button
- Sections with IDs for scroll navigation: #title, #body, #metadata

**Backend:**
- Ensure `events.getById` returns full event data including project relation

**Technical Notes:**
```typescript
// components/EventDetail.tsx
export function EventDetail({ eventId }: { eventId: string | null }) {
  const { data: event, isLoading } = api.events.getById.useQuery(
    { id: eventId! },
    { enabled: !!eventId }
  );

  if (!eventId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Select an event to view details</p>
      </div>
    );
  }

  if (isLoading) return <div className="p-4"><Spinner /></div>;
  if (!event) return <div className="p-4">Event not found</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <h2 className="text-xl font-semibold">{event.title}</h2>
        <div className="flex gap-2 mt-2 text-sm text-gray-600">
          <span>{event.author}</span>
          <span>•</span>
          <span>{formatRelativeTime(event.createdAt)}</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section id="title">
          <h3 className="font-medium text-gray-700 mb-2">Title</h3>
          <p>{event.title}</p>
        </section>

        <section id="body">
          <h3 className="font-medium text-gray-700 mb-2">Description</h3>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {event.body || <em className="text-gray-400">(No description)</em>}
          </div>
        </section>

        <section id="metadata">
          <h3 className="font-medium text-gray-700 mb-2">Details</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-600">Project:</dt>
            <dd className="font-medium">{event.project.name}</dd>

            <dt className="text-gray-600">Type:</dt>
            <dd className="font-medium">{event.eventType}</dd>

            <dt className="text-gray-600">Created:</dt>
            <dd className="font-medium">{formatDate(event.createdAt)}</dd>

            {event.labels?.length > 0 && (
              <>
                <dt className="text-gray-600">Labels:</dt>
                <dd className="flex gap-1 flex-wrap">
                  {event.labels.map(label => (
                    <Badge key={label} variant="secondary">{label}</Badge>
                  ))}
                </dd>
              </>
            )}
          </dl>
        </section>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-white">
        <Button
          variant="default"
          className="w-full"
          onClick={() => window.open(event.gitlabUrl, '_blank')}
        >
          Open in GitLab →
        </Button>
      </div>
    </div>
  );
}
```

**Prerequisites:** Story 4.1 complete (split pane structure exists)

**FR Mapping:** FR33 (View event details and click through to GitLab)

**Definition of Done:**
- ✅ Event title, body, metadata render correctly
- ✅ "Open in GitLab" button opens correct URL in new tab
- ✅ Empty state shows when no event selected
- ✅ Empty body shows "(No description)" placeholder
- ✅ Content scrollable if exceeds viewport height
- ✅ Render performance <100ms for typical event (~500 words)
- ✅ Long titles wrap properly without breaking layout
- ✅ Timestamps formatted relative (e.g., "2 hours ago")

---

## Story 4.3: Auto-Update Detail on Row Click

**As a** user browsing events
**I want** detail pane to update when I click different rows
**So that** I can quickly explore multiple events

**Acceptance Criteria:**
- Given detail pane is closed, when I click table row, then pane opens and shows clicked event
- Given detail pane is open, when I click different row, then pane updates to new event without closing
- Given I click row, then URL updates to ?detail=<eventId>
- Given I am on mobile, when I click row, then navigate to /events/:id full-screen page

**Frontend:**
- Update `EventTable` component with `onRowClick` handler
- Use React Aria Table's `onSelectionChange` callback
- Mobile detection: `useMediaQuery('(max-width: 767px)')`
- Create mobile detail page: `pages/events/[id].tsx`

**Backend:**
- No backend changes needed (reuses existing `events.getById`)

**Technical Notes:**
```typescript
// components/EventTable.tsx
export function EventTable({
  onRowClick,
  selectedEventId
}: Props) {
  const router = useRouter();
  const { isOpen, setIsOpen } = useDetailPane();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const queryId = router.query.id as string;

  const handleRowClick = (eventId: string) => {
    onRowClick(eventId);

    if (isMobile) {
      // Mobile: Navigate to full-screen detail
      router.push(`/events/${eventId}`);
    } else {
      // Desktop/Tablet: Update split pane
      if (!isOpen) setIsOpen(true);
      router.push(
        `/queries/${queryId}?detail=${eventId}`,
        undefined,
        { shallow: true }
      );
    }
  };

  return (
    <Table
      aria-label="Events"
      selectionMode="single"
      selectedKeys={selectedEventId ? new Set([selectedEventId]) : new Set()}
      onSelectionChange={(keys) => {
        const newId = Array.from(keys)[0] as string;
        if (newId) handleRowClick(newId);
      }}
    >
      <TableHeader>
        <Column key="type" width={100}>Type</Column>
        <Column key="title" isRowHeader>Title</Column>
        <Column key="project" width={150}>Project</Column>
        <Column key="author" width={150}>Author</Column>
        <Column key="created" width={120}>Created</Column>
      </TableHeader>
      <TableBody items={events}>
        {(item) => (
          <Row key={item.id}>
            <Cell>{item.eventType}</Cell>
            <Cell>{item.title}</Cell>
            <Cell>{item.project.name}</Cell>
            <Cell>{item.author}</Cell>
            <Cell>{formatRelativeTime(item.createdAt)}</Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
}

// pages/events/[id].tsx (Mobile full-screen detail)
export default function EventDetailPage() {
  const router = useRouter();
  const eventId = router.query.id as string;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white p-4">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Back
        </Button>
      </div>
      <EventDetail eventId={eventId} />
    </div>
  );
}
```

**Prerequisites:** Story 4.2 complete (detail rendering works)

**FR Mapping:** FR33

**Definition of Done:**
- ✅ Clicking table row opens detail pane (if closed)
- ✅ Clicking table row updates detail pane (if already open)
- ✅ URL updates correctly with ?detail param
- ✅ Mobile navigation goes to /events/:id full-screen page
- ✅ No visual flicker when switching events
- ✅ Selected row visually highlighted in table (React Aria default styling)
- ✅ Back button on mobile returns to previous page

---

## Story 4.4: Keyword Highlighting in Detail View

**As a** user who searched for specific terms
**I want** keywords highlighted in detail view
**So that** I can quickly find relevant information

**Acceptance Criteria:**
- Given I searched for "authentication error", when I open event containing "User authentication failed", then "authentication" is highlighted in yellow
- Given I searched with multiple terms, then all matching terms are highlighted
- Given search is case-insensitive, then matches ignore case
- Given I searched for special characters (email, path), then entire term highlights correctly
- Given I opened event without searching, then no keywords are highlighted

**Frontend:**
- Update `EventDetail` component to accept `searchTerms` prop
- Render highlighted text using `dangerouslySetInnerHTML` with DOMPurify sanitization
- Tailwind classes for highlight: `bg-yellow-200 px-1 rounded`

**Backend:**
- Add `highlightKeywords` utility function
- Update `events.getById` to accept optional `searchTerms` parameter
- Return `titleHighlighted` and `bodyHighlighted` fields with `<mark>` tags

**Technical Notes:**
```typescript
// server/api/utils/highlighting.ts
export const highlightKeywords = (text: string, keywords: string[]): string => {
  if (!keywords.length || !text) return text;

  // Escape special regex characters
  const escapedKeywords = keywords.map(k =>
    k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );

  const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

// server/api/routers/events.ts
events: {
  getById: protectedProcedure
    .input(z.object({
      id: z.string(),
      searchTerms: z.array(z.string()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: { id: input.id },
        include: { project: true },
      });

      if (!event) return null;

      // Apply highlighting if search terms provided
      if (input.searchTerms?.length) {
        return {
          ...event,
          titleHighlighted: highlightKeywords(event.title, input.searchTerms),
          bodyHighlighted: highlightKeywords(event.body || '', input.searchTerms),
        };
      }

      return event;
    }),
}

// components/EventDetail.tsx
export function EventDetail({ eventId, searchTerms }: Props) {
  const { data: event } = api.events.getById.useQuery({
    id: eventId!,
    searchTerms,
  }, { enabled: !!eventId });

  if (!event) return null;

  return (
    <div className="h-full flex flex-col">
      <section id="title">
        <h3 className="font-medium text-gray-700 mb-2">Title</h3>
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(event.titleHighlighted || event.title)
          }}
          className="[&_mark]:bg-yellow-200 [&_mark]:px-1 [&_mark]:rounded"
        />
      </section>

      <section id="body">
        <h3 className="font-medium text-gray-700 mb-2">Description</h3>
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(event.bodyHighlighted || event.body || '<em class="text-gray-400">(No description)</em>')
          }}
          className="prose prose-sm [&_mark]:bg-yellow-200 [&_mark]:px-1 [&_mark]:rounded"
        />
      </section>
    </div>
  );
}
```

**Prerequisites:** Story 4.3 complete (detail updates work)

**FR Mapping:** FR12 (See which search terms matched), FR34-35 (Keyword highlighting)

**Definition of Done:**
- ✅ Search terms highlighted in yellow
- ✅ Highlighting is case-insensitive
- ✅ Special characters don't break highlighting (test: email, paths, regex chars)
- ✅ Multiple search terms all highlighted
- ✅ Events opened without search show no highlights
- ✅ Highlight rendering <50ms for 10KB event body
- ✅ XSS protection: Use DOMPurify to sanitize HTML before rendering
- ✅ No broken layouts from long highlighted phrases

---

## Story 4.5: Section Navigation with Clickable Headers

**As a** user reading long event details
**I want** to quickly jump to specific sections
**So that** I can find information faster

**Acceptance Criteria:**
- Given detail pane open with event, when I view header, then see clickable chips: "Title", "Body", "Details"
- Given I click "Body" chip, then detail pane smoothly scrolls to body section
- Given I click chips rapidly, then final click completes scroll (previous animations cancel)
- Given event has no body, then "Body" chip still clickable and scrolls to empty section

**Frontend:**
- Add sticky section nav header in `EventDetail` component
- Use `scrollIntoView({ behavior: 'smooth', block: 'start' })`
- Chips styled with Tailwind: `px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200`

**Backend:**
- No backend changes needed

**Technical Notes:**
```typescript
// components/EventDetail.tsx
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};

export function EventDetail({ eventId, searchTerms }: Props) {
  // ... existing query code

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <h2 className="text-xl font-semibold">{event.title}</h2>
        {/* ... timestamp ... */}
      </div>

      {/* Sticky Section Navigation */}
      <div className="flex gap-2 p-3 border-b bg-white sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => scrollToSection('title')}
          className="px-3 py-1.5 text-sm rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          type="button"
        >
          Title
        </button>
        <button
          onClick={() => scrollToSection('body')}
          className="px-3 py-1.5 text-sm rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          type="button"
        >
          Body
        </button>
        <button
          onClick={() => scrollToSection('metadata')}
          className="px-3 py-1.5 text-sm rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          type="button"
        >
          Details
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section id="title">{/* ... */}</section>
        <section id="body">{/* ... */}</section>
        <section id="metadata">{/* ... */}</section>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-white">
        <Button onClick={() => window.open(event.gitlabUrl, '_blank')}>
          Open in GitLab →
        </Button>
      </div>
    </div>
  );
}
```

**Phase 2 Note:** In Phase 2, keyboard shortcuts `1/2/3` will call the same `scrollToSection()` function. No refactoring needed.

**Prerequisites:** Story 4.4 complete (detail content rendered)

**FR Mapping:** FR29 (Jump between sections), FR36-37 (Section navigation)

**Definition of Done:**
- ✅ Three clickable section chips in sticky header
- ✅ Clicking chip scrolls to correct section
- ✅ Smooth scroll animation completes <500ms
- ✅ Rapid clicks don't cause scroll conflicts
- ✅ Sticky header visible while scrolling content
- ✅ Works for events with missing sections (empty body)
- ✅ Visual hover state on chips

---

## Story 4.6: Query Metadata Page

**As a** user managing saved queries
**I want** to view and edit query details
**So that** I can keep queries organized

**Acceptance Criteria:**
- Given I'm viewing a query, when I click "Query Details" link, then navigate to /queries/:id/details
- Given I'm on query details page, then see: name, description, filters, last run time, new item count
- Given I click "Edit Name", then inline input appears and I can update name
- Given I save changes, then query updates and I see success toast
- Given I click "Back to Results", then return to /queries/:id table view

**Frontend:**
- Page: `pages/queries/[id]/details.tsx`
- Form for editing query name
- Display filters as read-only list
- tRPC mutations: `queries.update`

**Backend:**
- Add `queries.update` mutation to tRPC router

**Technical Notes:**
```typescript
// pages/queries/[id]/details.tsx
export default function QueryDetailsPage() {
  const router = useRouter();
  const queryId = router.query.id as string;
  const utils = api.useUtils();

  const { data: query } = api.queries.getById.useQuery({ id: queryId });
  const updateQuery = api.queries.update.useMutation({
    onSuccess: () => {
      toast.success('Query updated successfully');
      utils.queries.getById.invalidate({ id: queryId });
    },
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (query) setName(query.name);
  }, [query]);

  const handleSaveName = async () => {
    await updateQuery.mutateAsync({ id: queryId, name });
    setIsEditingName(false);
  };

  if (!query) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button variant="ghost" onClick={() => router.push(`/queries/${queryId}`)}>
        ← Back to Results
      </Button>

      <div className="mt-6 space-y-6">
        {/* Query Name */}
        <div>
          <label className="text-sm font-medium text-gray-700">Query Name</label>
          {isEditingName ? (
            <div className="flex gap-2 mt-1">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSaveName} disabled={!name.trim()}>
                Save
              </Button>
              <Button variant="ghost" onClick={() => setIsEditingName(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-medium">{query.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingName(true)}
              >
                Edit
              </Button>
            </div>
          )}
        </div>

        {/* Filters (Read-only for MVP) */}
        <div>
          <label className="text-sm font-medium text-gray-700">Filters</label>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-2">
            {query.filters.searchTerm && (
              <div className="text-sm">
                <span className="text-gray-600">Search: </span>
                <span className="font-medium">"{query.filters.searchTerm}"</span>
              </div>
            )}
            {query.filters.eventTypes?.length > 0 && (
              <div className="text-sm">
                <span className="text-gray-600">Types: </span>
                <span className="font-medium">{query.filters.eventTypes.join(', ')}</span>
              </div>
            )}
            {query.filters.projects?.length > 0 && (
              <div className="text-sm">
                <span className="text-gray-600">Projects: </span>
                <span className="font-medium">
                  {query.filters.projects.map(p => p.name).join(', ')}
                </span>
              </div>
            )}
            {query.filters.authors?.length > 0 && (
              <div className="text-sm">
                <span className="text-gray-600">Authors: </span>
                <span className="font-medium">{query.filters.authors.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Activity Metadata */}
        <div>
          <label className="text-sm font-medium text-gray-700">Activity</label>
          <dl className="mt-2 space-y-1 text-sm">
            <div>
              <dt className="inline text-gray-600">Last viewed: </dt>
              <dd className="inline font-medium">
                {formatRelativeTime(query.lastVisitedAt)}
              </dd>
            </div>
            <div>
              <dt className="inline text-gray-600">New items: </dt>
              <dd className="inline font-medium">{query.newItemCount || 0}</dd>
            </div>
            <div>
              <dt className="inline text-gray-600">Created: </dt>
              <dd className="inline font-medium">
                {formatDate(query.createdAt)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

// server/api/routers/queries.ts
queries: {
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userQuery.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id, // Ensure user owns query
        },
        data: {
          name: input.name,
          description: input.description,
        },
      });
    }),
}
```

**Prerequisites:** Epic 2 complete (queries exist)

**FR Mapping:** FR38 (Query page view with metadata)

**Definition of Done:**
- ✅ Query details page accessible via /queries/:id/details
- ✅ Query name, filters, metadata display correctly
- ✅ Inline editing of query name works
- ✅ Save persists to database
- ✅ Success toast shows after save
- ✅ "Back to Results" returns to /queries/:id
- ✅ Validation: Empty name shows error, blocks save
- ✅ Only query owner can edit (authorization check)

---

## Story 4.7: Scroll Position Persistence

**As a** user browsing long event lists
**I want** scroll position preserved when opening/closing detail pane
**So that** I don't lose my place

**Acceptance Criteria:**
- Given I scrolled table to row 50, when I open detail pane, then table stays at row 50
- Given detail pane open and I scrolled to row 80, when I close pane, then table stays at row 80
- Given I navigate away, when I return to same query, then table restores previous scroll position
- Given I switch to different query, then scroll resets to top (different dataset)

**Frontend:**
- Custom hook: `useScrollRestoration(key)` with sessionStorage
- Hook returns `scrollContainerRef` and `handleScroll` callback
- Key format: `table-scroll-${queryId}` for per-query persistence

**Backend:**
- No backend changes needed

**Technical Notes:**
```typescript
// hooks/useScrollRestoration.ts
export function useScrollRestoration(key: string) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load saved scroll position on mount
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const savedScrollY = sessionStorage.getItem(`scroll-${key}`);
    if (savedScrollY) {
      // Small delay to ensure content is rendered
      requestAnimationFrame(() => {
        container.scrollTop = parseInt(savedScrollY, 10);
      });
    }
  }, [key]);

  // Save scroll position on scroll (debounced)
  const handleScroll = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (e: React.UIEvent<HTMLDivElement>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollY = e.currentTarget.scrollTop;
        sessionStorage.setItem(`scroll-${key}`, scrollY.toString());
      }, 100); // Debounce 100ms
    };
  }, [key]);

  return { scrollContainerRef, handleScroll };
}

// components/EventTable.tsx
export function EventTable({ queryId, events, ...props }: Props) {
  const { scrollContainerRef, handleScroll } = useScrollRestoration(queryId);

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="overflow-y-auto h-full"
    >
      <Table {...props}>
        {/* ... table content ... */}
      </Table>
    </div>
  );
}
```

**Why sessionStorage not localStorage:**
- sessionStorage clears when tab closes (doesn't pollute storage indefinitely)
- Scroll position is session-specific (user might want fresh start in new tab)
- Avoids stale scroll positions for changed queries

**Prerequisites:** Story 4.3 complete (row clicks work)

**FR Mapping:** FR31 (Dashboard scroll position persists), FR39-40 (Scroll persistence)

**Definition of Done:**
- ✅ Table scroll position persists when opening detail pane
- ✅ Table scroll position persists when closing detail pane
- ✅ Scroll position restores after navigating away and back
- ✅ Switching queries resets scroll to top
- ✅ No visible flicker or jump during restoration
- ✅ sessionStorage used (not localStorage)
- ✅ Debounced scroll handler (no performance issues)
- ✅ Works on mobile full-screen view

---

**Epic 4 Summary:**
- **7 stories** delivering split view exploration and detail navigation
- **Timeline:** 3.5-4 days (28 hours solo, some stories can run in parallel)
- **Demo-able:** Users can explore events without tab chaos, highlight keywords, jump to sections
- **Value:** Reduced context switching, faster information discovery

**Epic 4 Definition of Done:**
✅ All 7 stories complete with acceptance criteria met
✅ Playwright E2E test: Browse table → Click row → Detail opens → Click another row → Detail updates → Close detail → Table scroll preserved
✅ Responsive behavior tested: Desktop (split), Tablet (split toggle), Mobile (full-screen)
✅ Performance: Detail pane render <100ms, keyword highlighting <50ms, section scroll <16ms, no layout shifts
✅ Deep linking works: ?detail=<eventId> auto-opens pane with correct event
✅ Browser navigation: Back button closes pane, forward reopens
✅ Zero memory leaks: Detail pane cleanup verified (unmount test)
✅ Accessibility: Keyboard focus management, ARIA labels on toggle button
✅ No regression: Epics 1-3 functionality still works

---
