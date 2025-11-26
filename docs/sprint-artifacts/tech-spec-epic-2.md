# Epic Technical Specification: User-Controlled Queries with Keyboard Foundation

Date: 2025-11-24
Author: BMad
Epic ID: 2
Status: Complete

---

## Overview

Epic 2 establishes the core user-controlled query system that transforms GitLab Insights from a passive event viewer into an active, personalized discovery platform. Building on the walking skeleton from Epic 1 (T3 Stack, database, OAuth, basic UI), this epic delivers the **Filter → Query pipeline** that enables users to explore events through search and filters, then persist useful patterns as saved queries for ongoing monitoring.

The epic introduces vim-style keyboard navigation (j/k, /, s, 1-9) as a foundation for the keyboard-first identity specified in the UX design. Users can search across stored events with PostgreSQL full-text search (<1s response), apply multi-dimensional filters, and save filter combinations as named queries accessible from a persistent sidebar. This establishes the core value proposition: personalized, attention-efficient discovery without manual GitLab searching.

**Key Deliverables:**
- Global keyboard shortcut system with context-aware routing
- React Aria Table with vim-style navigation (j/k)
- PostgreSQL full-text search with GIN indexes
- Search bar UI with debounced input and keyword highlighting
- Filter UI supporting labels, authors, projects, date ranges with AND/OR logic
- Query CRUD operations (create, update, delete) with user isolation
- Persistent sidebar navigation with saved queries
- "Save as Query" workflow from active search/filters
- Create/Edit/Delete query modals

## Objectives and Scope

**Primary Objectives:**
1. Enable users to search stored events with <1s response time (FR9-13)
2. Provide flexible filtering by labels, authors, projects, and date ranges (FR14-18)
3. Allow users to save filter combinations as persistent queries (FR19-26)
4. Establish vim-style keyboard navigation as core interaction pattern (FR52-53, FR58-59)
5. Deliver sidebar navigation for saved queries (FR20-21, FR92-93)

**In Scope:**
- Keyboard shortcut system (`/`, `j/k`, `s`, `Esc`, `1-9`, `e`, `Delete`)
- React Aria Table component with single-row selection
- PostgreSQL FTS with GIN index on events table
- Search bar with 300ms debounce and clear functionality
- Keyword highlighting in search results (olive background)
- Filter builder UI with chip display for active filters
- AND/OR filter logic toggle
- tRPC mutations for query CRUD
- User authorization for query ownership
- Sidebar component with query list and empty state
- "Save as Query" button with keyboard shortcut
- Create Query modal with auto-focus
- Edit/Delete query actions with confirmation dialogs
- Optimistic UI updates for query operations

**Out of Scope for Epic 2:**
- Catch-Up Mode (Epic 3)
- Split pane detail view (Epic 4)
- Query effectiveness metrics display (deferred)
- Advanced filter syntax parsing
- Query sharing between users
- Filter presets/templates

## System Architecture Alignment

**Architecture Decisions Applied:**

| Decision | Application in Epic 2 |
|----------|----------------------|
| ADR-008: React Aria Components | Table, Dialog, Button, Combobox components for accessible, keyboard-navigable UI |
| ADR-004: PostgreSQL FTS | GIN index on events table for <1s search performance |
| ADR-011: Phased MVP | Full keyboard implementation (Phase 2 requirement) - shortcuts wire to existing handlers |
| ADR-001: T3 Stack | tRPC routers for queries, Prisma for database operations |

**Component Architecture:**

```
src/
├── components/
│   ├── keyboard/
│   │   ├── ShortcutContext.tsx      # Keyboard shortcut context provider
│   │   └── ShortcutHandler.tsx      # Global keyboard event listener
│   ├── search/
│   │   ├── SearchBar.tsx            # Tag-pill input with Save button (integrated)
│   │   └── SearchContext.tsx        # Global search state with keywords[]
│   ├── queries/
│   │   ├── QuerySidebar.tsx         # Persistent sidebar navigation
│   │   ├── CreateQueryModal.tsx     # Modal for new queries
│   │   ├── EditQueryModal.tsx       # Modal for editing
│   │   └── DeleteConfirmDialog.tsx  # Confirmation dialog
│   ├── layout/
│   │   ├── Header.tsx               # App header with SearchBar integration
│   │   └── AppLayout.tsx            # Layout wrapper with sidebar
│   └── dashboard/
│       └── EventTable.tsx           # React Aria Table with j/k nav
├── server/api/routers/
│   ├── events.ts                    # Search query endpoint
│   └── queries.ts                   # Query CRUD mutations
└── lib/
    ├── search/
    │   └── postgres-fts.ts          # FTS query builder
    └── filters/
        └── types.ts                 # QueryFiltersSchema (keywords: string[])
```

**Note (2025-11-26):** Story 2.6 redesigned the filter UI from separate FilterBar/SaveQueryButton components to an integrated tag-pill pattern within SearchBar. The Save button lives inside SearchBar, and keywords are stored as an array (not singular).

**Integration Points:**
- **Events Router → PostgreSQL FTS:** Search queries use `$queryRaw` for FTS with `ts_rank` ordering
- **Queries Router → Prisma:** CRUD operations on UserQuery model with user isolation
- **ShortcutHandler → All Components:** Context-aware routing via React context
- **React Aria Table → Item Selection:** `selectedKeys` state synced with detail view (future)

## Detailed Design

### Services and Modules

| Module | Location | Responsibility |
|--------|----------|----------------|
| **ShortcutContext** | `src/components/keyboard/ShortcutContext.tsx` | React context for keyboard shortcuts. Uses setter/invoker pattern (e.g., `setFocusSearch`/`focusSearch`). Components register handlers, ShortcutHandler invokes them. |
| **ShortcutHandler** | `src/components/keyboard/ShortcutHandler.tsx` | Global keyboard event listener with context-aware routing. Detects when user is typing (INPUT/TEXTAREA) and suppresses navigation shortcuts. Routes `/`, `j/k`, `s`, `Esc`, `1-9`, `e`, `Delete` to appropriate handlers. |
| **SearchBar** | `src/components/search/SearchBar.tsx` | Tag-pill input pattern (like Gmail/Jira). Keywords display as olive pills with remove buttons. Includes integrated Save button. Uses React Aria TagGroup for accessibility. |
| **SearchContext** | `src/components/search/SearchContext.tsx` | Global search state provider. Manages `keywords: string[]` array with add/remove/clear operations. Triggers FTS query when keywords change. |
| **Header** | `src/components/layout/Header.tsx` | App header containing SearchBar. Manages modal state for CreateQueryModal. Registers keyboard shortcuts. |
| **EventTable** | `src/components/dashboard/EventTable.tsx` | React Aria Table with single-selection mode. Overrides arrow keys with `j/k` vim-style navigation. Displays 2-line ItemRow components with olive focus ring on selection. |
| **QuerySidebar** | `src/components/queries/QuerySidebar.tsx` | Persistent left sidebar (240px) listing saved queries with counts. Supports `1-9` number key navigation. Shows empty state when no queries. |
| **CreateQueryModal** | `src/components/queries/CreateQueryModal.tsx` | React Aria Dialog for naming new query. Auto-focuses name input, displays keywords read-only, calls `queries.create` mutation. |
| **EditQueryModal** | `src/components/queries/EditQueryModal.tsx` | Similar to CreateQueryModal but pre-fills existing query data. Calls `queries.update` mutation. |
| **DeleteConfirmDialog** | `src/components/queries/DeleteConfirmDialog.tsx` | React Aria AlertDialog for delete confirmation. Calls `queries.delete` mutation. |
| **postgres-fts** | `src/lib/search/postgres-fts.ts` | PostgreSQL full-text search query builder. Uses `to_tsvector`, `plainto_tsquery`, `ts_rank`, and `ts_headline` for search with highlighting. Supports multi-keyword AND search. |

### Data Models and Contracts

**UserQuery Model (Existing in Prisma Schema):**
```prisma
model UserQuery {
  id           String    @id @default(cuid())
  userId       String
  name         String    // Query display name, e.g., "Auth Discussions"
  filters      Json      // { keywords: string[] }
  lastViewedAt DateTime? // For Epic 3 Catch-Up Mode
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}
```

**Filter Schema (Updated for Multi-Keyword Search):**
```typescript
// src/lib/filters/types.ts
import { z } from 'zod';

// Story 2.6 introduced multi-keyword search with AND logic
// Keywords stored as array to match SearchContext implementation
export const QueryFiltersSchema = z.object({
  keywords: z.array(z.string().min(1).max(100)).min(1),
});

export type QueryFilters = z.infer<typeof QueryFiltersSchema>;
```

**Note (2025-11-26):** Original spec used singular `keyword: string`. Updated to `keywords: string[]` to match Story 2.6's tag-pill UI implementation where users can add multiple keyword filters with AND logic.

**Search Result Type:**
```typescript
// src/lib/search/types.ts
export interface SearchResult {
  events: Array<Event & {
    rank: number;
    highlightedTitle: string;
    highlightedSnippet: string;
  }>;
  total: number;
}
```

**GIN Index Migration (Story 2.3):**
```sql
-- prisma/migrations/XXXXXX_add_fts_index/migration.sql
CREATE INDEX events_fts_idx ON "event"
USING gin(to_tsvector('english', title || ' ' || COALESCE(body, '')));
```

### APIs and Interfaces

**Events Router - Search Endpoint:**
```typescript
// src/server/api/routers/events.ts
// Updated in Story 2.6 to support multi-keyword AND search
export const eventsRouter = createTRPCRouter({
  search: protectedProcedure
    .input(z.object({
      keywords: z.array(z.string().min(1).max(100)).min(1),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      // Build AND query from keywords array
      const searchTerms = input.keywords.join(' ');

      const results = await ctx.db.$queryRaw<SearchResult[]>`
        SELECT
          *,
          ts_rank(
            to_tsvector('english', title || ' ' || COALESCE(body, '')),
            plainto_tsquery('english', ${searchTerms})
          ) as rank,
          ts_headline(
            'english', title,
            plainto_tsquery('english', ${searchTerms}),
            'StartSel=<mark>, StopSel=</mark>, MaxWords=50'
          ) as "highlightedTitle",
          ts_headline(
            'english', COALESCE(body, ''),
            plainto_tsquery('english', ${searchTerms}),
            'StartSel=<mark>, StopSel=</mark>, MaxWords=100'
          ) as "highlightedSnippet"
        FROM "event"
        WHERE user_id = ${ctx.session.user.id}
          AND to_tsvector('english', title || ' ' || COALESCE(body, ''))
              @@ plainto_tsquery('english', ${searchTerms})
        ORDER BY rank DESC, created_at DESC
        LIMIT ${input.limit}
      `;

      return {
        events: results,
        total: results.length,
      };
    }),
});
```

**Queries Router - CRUD Operations:**
```typescript
// src/server/api/routers/queries.ts
export const queriesRouter = createTRPCRouter({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const queries = await ctx.db.userQuery.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { createdAt: 'desc' },
      });

      // Get counts for each query
      const queriesWithCounts = await Promise.all(
        queries.map(async (query) => {
          const filters = query.filters as QueryFilters;
          const count = await ctx.db.$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(*) as count FROM "event"
            WHERE user_id = ${ctx.session.user.id}
              AND to_tsvector('english', title || ' ' || COALESCE(body, ''))
                  @@ plainto_tsquery('english', ${filters.keyword})
          `;
          return { ...query, count: Number(count[0].count) };
        })
      );

      return queriesWithCounts;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      filters: QueryFiltersSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userQuery.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          filters: input.filters,
        },
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
      filters: QueryFiltersSchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Authorization check
      const existing = await ctx.db.userQuery.findUnique({
        where: { id: input.id },
      });
      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
      }

      return ctx.db.userQuery.update({
        where: { id: input.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.filters && { filters: input.filters }),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Authorization check
      const existing = await ctx.db.userQuery.findUnique({
        where: { id: input.id },
      });
      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
      }

      await ctx.db.userQuery.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
```

### Workflows and Sequencing

**User Flow: Search → Save → Navigate**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER SEARCHES                                                 │
├─────────────────────────────────────────────────────────────────┤
│ User presses "/" → SearchBar receives focus                      │
│ User types "webhook" → 300ms debounce → trpc.events.search()    │
│ Results appear in EventTable with highlighted keywords           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. USER SAVES QUERY                                              │
├─────────────────────────────────────────────────────────────────┤
│ "Save as Query" button enabled (keyword active)                  │
│ User clicks button or presses "s"                                │
│ CreateQueryModal opens with keyword pre-filled                   │
│ User enters name: "Webhook Discussions"                          │
│ User clicks Save → trpc.queries.create()                         │
│ Modal closes, toast: "Query saved!"                              │
│ Sidebar updates with new query                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. USER NAVIGATES TO QUERY                                       │
├─────────────────────────────────────────────────────────────────┤
│ User sees "Webhook Discussions (12)" in sidebar                  │
│ User clicks sidebar item or presses "1" (first query)            │
│ Navigation to /queries/[id]                                      │
│ Query page loads, runs FTS with stored keyword                   │
│ Results displayed in same EventTable component                   │
└─────────────────────────────────────────────────────────────────┘
```

**Keyboard Shortcut Flow:**

```
┌──────────────────────────────────────────────────────────────────┐
│                    ShortcutHandler (App Root)                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  keydown event                                                    │
│       │                                                           │
│       ▼                                                           │
│  ┌─────────────────┐                                              │
│  │ Is user typing? │──Yes──► Ignore (except Esc)                  │
│  │ (INPUT/TEXTAREA)│                                              │
│  └────────┬────────┘                                              │
│           │ No                                                    │
│           ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Route by key:                                                │ │
│  │  "/" → focusSearch()                                         │ │
│  │  "j" → moveSelectionDown()                                   │ │
│  │  "k" → moveSelectionUp()                                     │ │
│  │  "s" → openSaveQueryModal() (if keyword active)              │ │
│  │  "o" → openInGitLab() (if item selected)                     │ │
│  │  "1-9" → navigateToQuery(n)                                  │ │
│  │  "e" → openEditModal() (if query selected in sidebar)        │ │
│  │  "Delete" → openDeleteDialog() (if query selected)           │ │
│  │  "Esc" → clearFocusAndModals()                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Component Interaction Sequence:**

```
SearchBar          EventTable         QuerySidebar       Modal
    │                  │                   │               │
    │ onSearch(kw)     │                   │               │
    ├─────────────────►│                   │               │
    │                  │ display results   │               │
    │                  │◄──────────────────┤               │
    │                  │                   │               │
    │ onSave()         │                   │               │
    ├──────────────────┼───────────────────┼──────────────►│
    │                  │                   │      open     │
    │                  │                   │               │
    │                  │                   │  onConfirm()  │
    │                  │                   │◄──────────────┤
    │                  │                   │               │
    │                  │    refetch()      │               │
    │                  │◄──────────────────┤               │
    │                  │                   │ show new query│
    │                  │                   │               │
```

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement | Story |
|--------|--------|-------------|-------|
| Page load time | <500ms | Time from navigation to content visible | All stories |
| Search response | <1s on 10k events | Time from query submission to results displayed | Story 2.3, 2.4 |
| Filter application | <200ms | Time from keyword entry to results update | Story 2.6 |
| Keyboard response | <50ms | Time from keypress to visual feedback | Story 2.1 |
| Sidebar count refresh | <500ms | Time to fetch query counts on load | Story 2.8 |
| Modal open | <100ms | Time from trigger to modal visible | Story 2.9, 2.10 |

**Performance Implementation:**
- GIN index on events table enables O(log n) FTS queries
- 300ms debounce prevents excessive API calls during typing
- Optimistic UI updates for query CRUD operations
- React Query caching for sidebar query list
- Limit search results to 50 items by default

**Performance Testing:**
- Seed script (`scripts/seed-events.ts`) generates 10k realistic events
- Performance assertions in Story 2.3 DoD: `console.time/timeEnd` validation
- Manual validation with Chrome DevTools Performance tab

### Security

| Concern | Mitigation | Story |
|---------|------------|-------|
| **User isolation** | All queries filter by `ctx.session.user.id` | All backend stories |
| **Authorization** | Query update/delete verify `userId` ownership | Story 2.7b |
| **XSS in highlights** | `ts_headline` output sanitized before rendering; use `dangerouslySetInnerHTML` only on sanitized content | Story 2.5 |
| **SQL injection** | Prisma parameterized queries; `$queryRaw` uses tagged template literals | Story 2.3 |
| **Input validation** | Zod schemas validate all tRPC inputs | All backend stories |

**Security Implementation:**
```typescript
// Authorization pattern for all mutations
const existing = await ctx.db.userQuery.findUnique({ where: { id } });
if (!existing || existing.userId !== ctx.session.user.id) {
  throw new TRPCError({ code: 'FORBIDDEN' });
}

// XSS-safe highlight rendering
import DOMPurify from 'dompurify';
const safeHtml = DOMPurify.sanitize(highlightedSnippet);
```

### Reliability/Availability

| Aspect | Approach |
|--------|----------|
| **Database connection** | Prisma connection pooling (default 5 connections) |
| **FTS index availability** | GIN index created via migration; verified in CI |
| **Graceful degradation** | Search returns empty results on FTS error, doesn't crash |
| **Mutation rollback** | Prisma transactions for multi-step operations |

**Error Handling:**
- tRPC error boundaries display user-friendly messages
- Search errors show "Unable to search. Please try again." with retry button
- Query save errors show toast with specific message
- Network errors trigger React Query retry (3 attempts)

### Observability

| Signal | Implementation |
|--------|----------------|
| **Logging** | Pino logger for server-side operations |
| **Search metrics** | Log search keyword, result count, duration |
| **Query metrics** | Log query CRUD operations with user ID (hashed) |
| **Error tracking** | Log FTS failures, authorization failures |

**Logging Examples:**
```typescript
// Search logging
logger.info({
  event: 'search_executed',
  keywordCount: input.keywords.length, // Log count only for privacy
  resultCount: results.length,
  durationMs: Date.now() - startTime,
});

// Authorization failure
logger.warn({
  event: 'auth_failure',
  operation: 'query_update',
  queryId: input.id,
  attemptedBy: ctx.session.user.id,
});
```

## Dependencies and Integrations

### Epic Dependencies

| Dependency | Source | Required For | Status |
|------------|--------|--------------|--------|
| User authentication | Epic 1 (Story 1.3) | All user-scoped queries | ✅ Complete |
| Event model & data | Epic 1 (Story 1.2) | FTS search target | ✅ Complete |
| ItemRow component | Epic 1 (Story 1.6) | EventTable display | ✅ Complete |
| UserQuery model | Epic 1 (Story 1.2) | Query CRUD operations | ✅ Exists in schema |
| App layout | Epic 1 (Story 1.7) | Sidebar placement | ✅ Complete |

### Internal Story Dependencies

```
Story 2.1 (Keyboard System)
    │
    ├──► Story 2.2 (React Aria Table) ──► Story 2.6 (Filter UI)
    │                                          │
    │                                          ▼
    │                                    Story 2.8.5 (Save Button)
    │                                          │
    │                                          ▼
    │                                    Story 2.9 (Create Modal)
    │
    ├──► Story 2.4 (Search Bar) ──► Story 2.5 (Highlighting)
    │         │
    │         └──► Story 2.3 (FTS Backend)
    │
    └──► Story 2.8 (Sidebar) ──► Story 2.10 (Edit/Delete)
              │
              └──► Stories 2.7a, 2.7b (Query Backend)
```

### External Dependencies

| Package | Version | Purpose | Already Installed |
|---------|---------|---------|-------------------|
| `react-aria-components` | ^1.13.0 | Table, Dialog, Button, Combobox | ✅ Yes |
| `@react-aria/table` | ^3.17.8 | Table accessibility hooks | ✅ Yes |
| `@tanstack/react-query` | ^5.69.0 | Server state, caching, optimistic updates | ✅ Yes |
| `zod` | ^3.24.2 | Input validation schemas | ✅ Yes |
| `pino` | ^10.1.0 | Server-side logging | ✅ Yes |

**New Dependencies Required:**
| Package | Version | Purpose |
|---------|---------|---------|
| `dompurify` | ^3.x | XSS sanitization for highlighted content |

### Integration Points

| Integration | Direction | Protocol | Notes |
|-------------|-----------|----------|-------|
| PostgreSQL FTS | App → DB | SQL via Prisma `$queryRaw` | GIN index required |
| tRPC queries router | Frontend → Backend | tRPC over HTTP | New router for Epic 2 |
| React Query cache | Frontend | In-memory | Invalidate on query CRUD |
| Next.js routing | Frontend | File-based | `/queries/[id]` page |

### Database Migrations Required

| Migration | Description | Story |
|-----------|-------------|-------|
| `add_fts_index` | Create GIN index on events for FTS | Story 2.3 |

**Note:** No schema changes required - `UserQuery` model already exists from Epic 1.

## Acceptance Criteria (Authoritative)

### Story 2.1: Keyboard Shortcut System Foundation
| AC ID | Criterion |
|-------|-----------|
| 2.1.1 | Pressing `/` from anywhere focuses the search input |
| 2.1.2 | Pressing `Esc` clears focus and closes any open modals |
| 2.1.3 | Pressing `j` outside input fields moves selection down |
| 2.1.4 | Pressing `k` outside input fields moves selection up |
| 2.1.5 | Keyboard shortcuts do NOT trigger when typing in text inputs (except Esc) |

### Story 2.2: React Aria Table with vim-style Navigation
| AC ID | Criterion |
|-------|-----------|
| 2.2.1 | EventTable uses React Aria Table components |
| 2.2.2 | `j/k` keys navigate items (override default arrow behavior) |
| 2.2.3 | Selected row displays olive focus ring (2px solid #9DAA5F) |
| 2.2.4 | Focus indicators are WCAG 2.1 AA compliant |
| 2.2.5 | Table integrates with existing ItemRow component from Epic 1 |

### Story 2.3: PostgreSQL Full-Text Search Backend
| AC ID | Criterion |
|-------|-----------|
| 2.3.1 | GIN index created on events table via Prisma migration |
| 2.3.2 | Search returns results in <1s on 10k events |
| 2.3.3 | Results ranked by relevance using `ts_rank` |
| 2.3.4 | Search returns events across all types (Issues, MRs, Comments) |
| 2.3.5 | Seed script creates 10k realistic test events |

### Story 2.4: Search Bar UI
| AC ID | Criterion |
|-------|-----------|
| 2.4.1 | Search input receives focus on `/` keypress |
| 2.4.2 | Search triggers after 300ms debounce |
| 2.4.3 | Loading indicator appears during search |
| 2.4.4 | Results appear in <1s after typing stops |
| 2.4.5 | Clear button (X icon) visible when search has text |
| 2.4.6 | `Esc` clears search and removes focus |

### Story 2.5: Keyword Highlighting in Search Results
| AC ID | Criterion |
|-------|-----------|
| 2.5.1 | Keywords highlighted with olive background (rgba(157, 170, 95, 0.3)) |
| 2.5.2 | Highlights appear in both title and snippet |
| 2.5.3 | Highlighting is case-insensitive |
| 2.5.4 | Highlighted text maintains minimum 4.5:1 contrast ratio (use gray-200) |
| 2.5.5 | No XSS vulnerabilities in highlight rendering |

### Story 2.6: Filter UI (Simplified)
| AC ID | Criterion |
|-------|-----------|
| 2.6.1 | Active keyword displays as chip with remove button |
| 2.6.2 | Clicking remove clears the keyword and search results |
| 2.6.3 | "Save as Query" button visible when keyword active |
| 2.6.4 | Button disabled when no keyword active |

### Story 2.7a: Create Query Backend
| AC ID | Criterion |
|-------|-----------|
| 2.7a.1 | `queries.create` mutation saves query to database |
| 2.7a.2 | Input validated with Zod schema |
| 2.7a.3 | Query associated with current user's ID |
| 2.7a.4 | Returns created query with ID |

### Story 2.7b: Update/Delete Query Backend
| AC ID | Criterion |
|-------|-----------|
| 2.7b.1 | `queries.update` mutation updates query name |
| 2.7b.2 | `queries.delete` mutation removes query from database |
| 2.7b.3 | Authorization prevents modifying queries owned by other users |
| 2.7b.4 | Returns FORBIDDEN error for unauthorized access |

### Story 2.8: Sidebar Navigation
| AC ID | Criterion |
|-------|-----------|
| 2.8.1 | Sidebar visible on all authenticated pages |
| 2.8.2 | Lists user's saved queries with counts (e.g., "Auth (12)") |
| 2.8.3 | Clicking query navigates to `/queries/[id]` |
| 2.8.4 | Number keys `1-9` jump to queries by position |
| 2.8.5 | Empty state shown when no queries: "Create your first query with / search" |

### Story 2.8.5: "Save as Query" Entry Points
| AC ID | Criterion |
|-------|-----------|
| 2.8.5.1 | Button enabled when search keyword is active |
| 2.8.5.2 | Button disabled when no keyword active |
| 2.8.5.3 | Clicking opens CreateQueryModal with keyword pre-filled |
| 2.8.5.4 | `s` keyboard shortcut triggers save (when not typing) |

### Story 2.9: Create Query Modal
| AC ID | Criterion |
|-------|-----------|
| 2.9.1 | Modal opens from "Save as Query" button |
| 2.9.2 | Query name input auto-focused on open |
| 2.9.3 | Keyword displayed as read-only |
| 2.9.4 | Save creates query and closes modal |
| 2.9.5 | Cancel/Esc closes modal without saving |
| 2.9.6 | Success toast displayed on save |
| 2.9.7 | New query appears in sidebar immediately |

### Story 2.10: Edit/Delete Query Actions
| AC ID | Criterion |
|-------|-----------|
| 2.10.1 | Edit/Delete icons appear on sidebar item hover |
| 2.10.2 | Edit opens modal with pre-filled query data |
| 2.10.3 | Delete shows confirmation dialog |
| 2.10.4 | Confirmed delete removes query from sidebar immediately |
| 2.10.5 | `e` keyboard shortcut opens edit (when query focused) |
| 2.10.6 | `Delete` key opens delete confirmation (when query focused) |

## Traceability Mapping

### PRD Requirements → Stories

| PRD Requirement | Description | Story | AC IDs |
|-----------------|-------------|-------|--------|
| FR9 | Search returns results <1 second | 2.3, 2.4 | 2.3.2, 2.4.4 |
| FR10 | Search events by keywords | 2.3, 2.4 | 2.3.3, 2.4.2 |
| FR11 | Search across all event types | 2.3 | 2.3.4 |
| FR12 | Keyword highlighting | 2.5 | 2.5.1-2.5.3 |
| FR14-18 | Filtering system | 2.6 | 2.6.1-2.6.4 (keyword only, advanced deferred) |
| FR19 | Save filter combinations | 2.7a, 2.9 | 2.7a.1-2.7a.4, 2.9.1-2.9.7 |
| FR20 | Queries in sidebar | 2.8 | 2.8.1-2.8.2 |
| FR21 | Navigate to query page | 2.8 | 2.8.3-2.8.4 |
| FR22 | Edit queries | 2.7b, 2.10 | 2.7b.1, 2.10.1-2.10.2 |
| FR23 | Delete queries | 2.7b, 2.10 | 2.7b.2, 2.10.3-2.10.4 |
| FR24 | Query effectiveness metrics | 2.8 | 2.8.2 (basic count only) |
| FR25-26 | Create query from search/filters | 2.8.5, 2.9 | 2.8.5.1-2.8.5.4, 2.9.1-2.9.7 |
| FR52 | `/` focuses search | 2.1, 2.4 | 2.1.1, 2.4.1 |
| FR53 | `j/k` navigation | 2.1, 2.2 | 2.1.3-2.1.4, 2.2.2 |
| FR58-59 | Keyboard accessibility | 2.1, 2.2 | 2.1.5, 2.2.4 |
| FR67-69 | Performance baseline | 2.3, 2.4 | 2.3.2, 2.4.4 |
| FR92-93 | Keyboard navigation | 2.8 | 2.8.4 |
| FR94 | `s` saves query | 2.8.5 | 2.8.5.4 |
| FR95 | Edit/delete shortcuts | 2.10 | 2.10.5-2.10.6 |

### Deferred Requirements

| PRD Requirement | Description | Deferred To | Rationale |
|-----------------|-------------|-------------|-----------|
| FR14-17 | Label/Author/Project filters | Post-MVP | Simplified to keyword-only for MVP |
| FR18 | AND/OR filter logic | Post-MVP | Single keyword per query for MVP |
| FR24 (full) | Advanced query metrics | Post-MVP | Basic count satisfies MVP |
| - | Filter autocomplete | Post-MVP | Per user decision during planning |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **FTS performance degrades with scale** | Medium | High | GIN index, limit results to 50, monitor query times in logs |
| **Keyboard shortcuts conflict with browser** | Low | Medium | Test across browsers; only override app-specific keys |
| **React Aria Table learning curve** | Medium | Medium | Reference existing implementations; start with simple single-select |
| **XSS via highlight injection** | Low | High | Use DOMPurify; review `ts_headline` output format |
| **Optimistic UI causes stale state** | Low | Low | Invalidate React Query cache on mutations; show error toasts |

### Assumptions

| Assumption | Validated? | Impact if Wrong |
|------------|------------|-----------------|
| UserQuery model already in schema | ✅ Yes | Would need migration |
| Epic 1 ItemRow component reusable | ✅ Yes | Would need new component |
| PostgreSQL FTS sufficient for MVP | Assumed | May need dedicated search (Elasticsearch) at scale |
| Single keyword per query is sufficient for MVP | Per user | Would need multi-keyword if users request |
| 10k events is realistic test scale | Assumed | May need larger dataset for production validation |

### Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| ~~Should queries support multiple keywords?~~ | User | ✅ Resolved: Single keyword per query for MVP |
| ~~Include FR24 metrics in Epic 2?~~ | User | ✅ Resolved: Basic count only |
| ~~Include filter autocomplete?~~ | User | ✅ Resolved: Deferred to post-MVP |
| How should empty search results be displayed? | UX | Open - suggest helpful message |
| Should query names be unique per user? | PM | Open - currently allows duplicates |

## Test Strategy Summary

### Testing Approach

Per ADR-006, Epic 2 follows the **"Tests First, AI Implements, Suite Validates"** pattern with focus on unit tests for critical paths.

| Test Type | Scope | Tools |
|-----------|-------|-------|
| **Unit Tests** | tRPC routers, FTS queries, shortcut handler | Vitest |
| **Component Tests** | Modal interactions, keyboard navigation | Vitest + Testing Library |
| **Manual Testing** | End-to-end flows, performance validation | Developer verification |

### Critical Test Scenarios

**1. PostgreSQL FTS (Story 2.3)**
```typescript
describe('events.search', () => {
  it('returns matching events ranked by relevance', async () => {
    // Seed: events with "authentication" in title/body
    const results = await caller.events.search({ keywords: ['authentication'] });
    expect(results.events.length).toBeGreaterThan(0);
    expect(results.events[0].rank).toBeGreaterThan(results.events[1].rank);
  });

  it('supports multi-keyword AND search', async () => {
    // Story 2.6: Multiple keywords use AND logic
    const results = await caller.events.search({ keywords: ['auth', 'oauth'] });
    // Results must contain BOTH keywords
    expect(results.events.length).toBeGreaterThanOrEqual(0);
  });

  it('returns results in <1s on 10k events', async () => {
    // Requires seed script to have run
    const start = Date.now();
    await caller.events.search({ keywords: ['test'] });
    expect(Date.now() - start).toBeLessThan(1000);
  });

  it('returns empty array for non-matching keywords', async () => {
    const results = await caller.events.search({ keywords: ['xyznonexistent'] });
    expect(results.events).toEqual([]);
  });
});
```

**2. Query Authorization (Story 2.7b)**
```typescript
describe('queries.update', () => {
  it('allows owner to update query', async () => {
    const query = await createQueryAsUser(userA);
    const updated = await callerAsUserA.queries.update({
      id: query.id,
      name: 'New Name'
    });
    expect(updated.name).toBe('New Name');
  });

  it('rejects update from non-owner', async () => {
    const query = await createQueryAsUser(userA);
    await expect(
      callerAsUserB.queries.update({ id: query.id, name: 'Hack' })
    ).rejects.toThrow('FORBIDDEN');
  });
});
```

**3. Keyboard Shortcut Context (Story 2.1)**
```typescript
describe('ShortcutHandler', () => {
  it('routes "/" to focusSearch when not typing', () => {
    const focusSearch = vi.fn();
    fireEvent.keyDown(document, { key: '/' });
    expect(focusSearch).toHaveBeenCalled();
  });

  it('ignores "j" when input is focused', () => {
    const moveSelection = vi.fn();
    const input = screen.getByRole('searchbox');
    input.focus();
    fireEvent.keyDown(input, { key: 'j' });
    expect(moveSelection).not.toHaveBeenCalled();
  });

  it('allows Esc when input is focused', () => {
    const clearFocus = vi.fn();
    const input = screen.getByRole('searchbox');
    input.focus();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(clearFocus).toHaveBeenCalled();
  });
});
```

### Performance Validation

| Metric | Test Method | Pass Criteria |
|--------|-------------|---------------|
| Search <1s | `console.time` in seed script | <1000ms on 10k events |
| Page load <500ms | Chrome DevTools | LCP <500ms |
| Keyboard response <50ms | Manual testing | Imperceptible delay |

### Test Data Seeding

**Seed Script: `scripts/seed-events.ts`**
```typescript
const SAMPLE_TITLES = [
  'Add authentication middleware for API routes',
  'Fix rate limiting bug in webhook handler',
  'Implement OAuth2 flow for GitLab integration',
  'Update security headers configuration',
  'Refactor database connection pooling',
  // ... 100+ realistic titles
];

const SAMPLE_BODIES = [
  'This PR adds middleware to validate JWT tokens...',
  'The webhook endpoint was hitting rate limits because...',
  // ... realistic body content
];

async function seedEvents(count: number, userId: string) {
  const events = Array.from({ length: count }, (_, i) => ({
    id: `seed-${i}`,
    userId,
    type: randomFrom(['issue', 'merge_request', 'comment']),
    title: randomFrom(SAMPLE_TITLES),
    body: randomFrom(SAMPLE_BODIES),
    author: randomFrom(['alice', 'bob', 'charlie']),
    project: randomFrom(['api-service', 'web-app', 'infra']),
    projectId: randomFrom(['1', '2', '3']),
    labels: randomSubset(['bug', 'feature', 'security', 'api']),
    gitlabEventId: `gitlab-seed-${i}`,
    gitlabUrl: `https://gitlab.com/project/-/issues/${i}`,
    createdAt: randomDate(30), // Last 30 days
  }));

  await prisma.event.createMany({ data: events });
  console.log(`Seeded ${count} events`);
}
```

### Definition of Done Checklist (Epic Level)

- [ ] All 11 stories complete with passing tests
- [ ] End-to-end flow validated: Search → Save Query → Navigate via Sidebar
- [ ] Performance validated: <500ms loads, <1s search, <200ms filters
- [ ] Keyboard shortcuts functional: `/`, `j/k`, `s`, `1-9`, `Esc`, `e`, `Delete`
- [ ] Accessibility validated: React Aria Table navigable, focus indicators visible
- [ ] No regression: Epic 1 functionality still works
- [ ] Code review completed
- [ ] Tech spec updated with any implementation deviations
