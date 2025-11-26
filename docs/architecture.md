# Architecture

## Executive Summary

gitlab-insights is built using the T3 Stack (Next.js 16 + TypeScript + tRPC + Prisma 6 + BetterAuth + Tailwind v4), optimized for rapid full-stack development with end-to-end type safety. The architecture is polling-based, centered on scheduled GitLab API fetching and periodic data synchronization. PostgreSQL serves as the primary data store with Prisma ORM, BetterAuth handles GitLab OAuth authentication, and tRPC provides type-safe client-server APIs.

**Key Architectural Decisions:**
- **Starter Template:** T3 Stack for rapid setup with pre-configured auth, database, and type-safe APIs
- **Performance Strategy:** Aggressive caching, optimized queries, and sub-500ms page load targets
- **Polling Architecture:** Scheduled API fetch (5-15 min) → Database → Dashboard with manual refresh capability
- **Background Processing:** Inngest for scheduled API polling

## Project Initialization

**First Implementation Story:** Initialize project with T3 Stack

```bash
npm create t3-app@latest gitlab-insights -- --trpc --prisma --tailwind --typescript --dbProvider postgres
```

**Note:** The project was initialized without the `--nextAuth` flag. BetterAuth was installed separately after T3 Stack initialization:

```bash
npm install better-auth
```

**Post-Initialization Configuration:**
1. Install and configure BetterAuth for GitLab OAuth
2. Create GitLab OAuth application (obtain client ID/secret)
3. Configure environment variables (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, GITLAB_CLIENT_ID, GITLAB_CLIENT_SECRET)
4. Set up BetterAuth GitLab provider in `src/lib/auth.ts`
5. Run Prisma migrations: `npx prisma migrate dev`
6. Verify authentication flow works with GitLab

## Project Context Understanding

**Project:** gitlab-insights - Attention-efficient discovery platform for PM-less engineering organizations

**Scope:** Polling-based GitLab event dashboard with intelligent filtering, historical research capabilities, and manual refresh control.

**Requirements Analysis:**
- 100 Functional Requirements across core capability groups
- 44 Non-Functional Requirements emphasizing performance, security, and reliability
- Technical Type: web_app (SPA-style dashboard)
- Domain: general (internal productivity tool)
- Complexity: low (focused scope, standard tech patterns)

**Core Capabilities:**
1. **Event Capture & Storage**: GitLab API polling (5-15 min intervals) with >95% reliability, manual refresh capability, event updates
2. **Search & Retrieval**: Fast search (<1s) across all stored events, keyword/label/author/project/date filtering
3. **Filtering System**: Temporary filters with AND/OR logic, multi-dimensional filtering
4. **Query Management**: Filter → Query pipeline (save useful patterns as persistent queries)
5. **Dashboard View**: Sectioned layout (Issues, MRs, Comments) with keyboard navigation and manual refresh
6. **Periodic Updates**: Scheduled sync every 5-15 minutes with manual refresh and last sync timestamp display
7. **Catch-Up Mode**: In-app digest showing new items since last visit, grouped by saved queries
8. **Keyboard-First UX**: Vim-style navigation (j/k, /, o, r for refresh), all features keyboard-accessible
9. **User & Access Management**: GitLab OAuth, per-user isolation, 3-10 concurrent users (beta)
10. **GitLab Project Scoping**: Per-user project selection, group monitoring support

**Critical Non-Functional Requirements:**
- **Performance**: <500ms page loads, <1s search, <200ms filter application, <3s manual refresh
- **Security**: GitLab OAuth only, API token security, encryption at rest/transit, CSRF protection, CSP
- **Reliability**: >95% API polling success rate, automatic retry with backoff, graceful degradation
- **Scalability**: Support 3-10 beta users, design for 50+ users without refactoring
- **Observability**: Health monitoring, polling status tracking, performance metrics

**Unique Architectural Challenges:**
1. **API Polling Reliability**: Must achieve >95% success rate with rate limit handling and exponential backoff
2. **Performance Budget**: Sub-500ms page loads with periodic sync requires aggressive caching and optimization
3. **Attention-Efficient Filtering**: 5-15 items per query target (not 0, not 100) requires smart filtering logic
4. **Periodic + Historical**: Dual access pattern (scheduled polling + fast historical search)
5. **Keyboard-First UX**: All features keyboard-accessible with vim-style shortcuts including manual refresh
6. **Filter → Query Pipeline**: Smooth transition from temporary exploration to persistent patterns

**Functional Requirement Categories Mapped:**
- Event Capture & Storage → API polling job, GitLab API client, database design
- Search & Retrieval → Query optimization, PostgreSQL FTS, indexing strategy
- Filtering System → Frontend state management, backend query builder
- Query Management → User data model, persistence layer
- Dashboard & Views → Frontend architecture, component structure
- Periodic Updates → Scheduled polling, manual refresh, last sync display
- Catch-Up Mode → In-app digest, query-based grouping
- Keyboard Navigation → Frontend event handling, accessibility
- User Management → Authentication, authorization, data isolation
- GitLab Scoping → Multi-tenancy design, permission model

---

## Starter Template Decision

**Chosen:** T3 Stack (Create T3 App)

**Rationale:** Provides pre-configured full-stack setup with type-safe APIs, authentication, and database ORM - optimizes for development velocity while maintaining production quality.

**Technologies Provided by T3:**
- **Next.js** - Full-stack framework (frontend + API routes for webhooks)
- **TypeScript** - End-to-end type safety
- **tRPC** - Type-safe client-server APIs
- **Prisma** - Type-safe database ORM with PostgreSQL
- **Tailwind CSS** - Utility-first styling
- **ESLint** - Code quality and linting

**Additional Dependencies Installed:**
- **BetterAuth** - Authentication with GitLab OAuth provider support (installed separately, not via T3 flag)

**Post-Installation Requirements:**
- Upgrade to Tailwind v4 (required for project)
- Install and configure BetterAuth
- Set up PostgreSQL database
- Configure environment variables

**What T3 Does NOT Provide (Decisions Complete):**
- ✓ Component library - **DECIDED: React Aria Components (Adobe) for accessibility and keyboard navigation**
- ✓ API polling - **DECIDED: Inngest scheduled job**
- ✓ GitLab API client - **DECIDED: Custom implementation with rate limiting**
- ✓ Search optimization - **DECIDED: PostgreSQL FTS**
- ✓ Caching strategy - **DECIDED: Staged (Next.js → Redis if needed)**
- ✓ Monitoring/observability - **DECIDED: Lightweight Combo (Vercel + Sentry + Inngest + Custom)**

---

## Decision Summary

*Architectural decisions made during workflow*

| Category | Decision | Affects FR Categories | Rationale | Provided By |
| -------- | -------- | -------------------- | --------- | ----------- |
| **Authentication Library** | BetterAuth 1.4.1 (not NextAuth) | User Management (FR78-82) | NextAuth 5.0-beta has compatibility issues with Next.js 16. Official NextAuth team recommends BetterAuth for Next.js 16+ projects. BetterAuth provides stable, production-ready OAuth with GitLab provider support. Simpler API, better TypeScript support, actively maintained. | Decision |
| **Component Library** | React Aria Components (Adobe) + Tailwind CSS | All UI (Dashboard, Keyboard Nav, Accessibility) | Best-in-class keyboard navigation essential for vim-style shortcuts (j/k, d, o, m, r, s), unstyled primitives enable custom olive accent color (#5e6b24), WCAG AA+ accessibility out of the box, battle-tested by Adobe. Complete design control while maintaining accessibility. Chosen over shadcn/ui for superior keyboard support. | Decision |
| **Event Capture** | Scheduled GitLab API Polling (Inngest) | Event Capture & Storage (FR1-9) | Simpler MVP than webhooks, no webhook infrastructure, respects API rate limits with exponential backoff, 5-15min latency acceptable for discovery use case, manual refresh provides user control | Decision |
| **Background Jobs** | Inngest | Event Capture (FR5) | Serverless (no infrastructure), built-in retry/scheduling/monitoring, TypeScript SDK, Vercel-friendly, minimal operational overhead for solo dev | Decision |
| **Search** | PostgreSQL Full-Text Search | Search & Retrieval (FR10-14) | Zero additional infrastructure, GIN indexes meet <1s requirement at MVP scale, native Prisma integration, simple to implement. Migration path to Elasticsearch if needed post-MVP. | Decision |
| **Caching** | Staged: Next.js Built-in → Redis (if needed) | Performance & Reliability (FR68-74) | Phase 1 (MVP): Next.js caching (unstable_cache, React cache) + PostgreSQL optimization. Phase 2 (if metrics show need): Add Upstash Redis for hot paths. Measure first, optimize second approach. | Decision |
| **Monitoring & Observability** | Lightweight Combo (Vercel + Sentry + Inngest + Custom) | All (Observability NFR-O1-O6) | Vercel Analytics for performance/web vitals, Sentry for error tracking, Inngest dashboard for jobs, custom metrics in DB for API polling success rate. Comprehensive beta coverage at minimal cost. | Decision |

**Inngest Implementation Details:**
- **API Polling Job:** Scheduled function runs every 5-15 minutes (configurable per deployment), fetches new/updated issues, MRs, and comments from GitLab API for monitored projects
- **Event Flow:** Inngest trigger → GitLab API fetch → Parse and validate → Store in database → Update last_synced_at timestamp
- **Rate Limiting:** Respects GitLab API rate limits, exponential backoff on 429 responses, automatic retry up to 5 attempts
- **Monitoring:** Built-in Inngest dashboard for job status, success/failure tracking, execution duration
- **Configuration:** Inngest SDK in Next.js app, function defined in `src/inngest/api-polling.ts`
- **Error Handling:** Failed API calls logged to Sentry, persistent failures after retries trigger alert

**PostgreSQL Full-Text Search Implementation Details:**
- **Index:** GIN index on `to_tsvector('english', title || ' ' || body)` for events table
- **Query:** Prisma raw SQL using `to_tsvector()` and `to_tsquery()` or `plainto_tsquery()`
- **Ranking:** `ts_rank()` for relevance scoring in results
- **Highlighting:** `ts_headline()` for keyword highlighting in snippets
- **Combined Filters:** Full-text search + label/author/project filters in single query (WHERE clauses)
- **Performance:** GIN index + proper query planning should achieve <500ms for typical searches
- **Trigram Support:** Optional `pg_trgm` extension for fuzzy/typo-tolerant search if needed
- **Migration Path:** If scale demands it post-MVP, add Elasticsearch with dual-write pattern (Postgres remains source of truth)

**Caching Implementation Details:**

**Phase 1 (MVP - Built-in Optimization):**
- **Next.js `unstable_cache`:** Cache dashboard queries (recent events), TTL 30-60s
- **React `cache`:** Deduplicate requests within single render cycle
- **PostgreSQL:** Connection pooling via Prisma (reduces connection overhead), proper indexes on frequently queried columns (user_id, created_at, project_id)
- **Monitoring:** Track actual page load times, identify slow queries
- **Target:** Achieve <500ms page loads with just Phase 1 optimizations

**Phase 2 (If Metrics Show Need):**
- **Upstash Redis:** Serverless-friendly, HTTP-based Redis
- **Hot Paths:** Cache recent events per user (10min TTL), user queries/filters (cache until modified), project/label lists (1hr TTL)
- **Invalidation:** On polling sync completion, invalidate relevant user caches (by user_id + project match)
- **Implementation:** Add `@upstash/redis` package, wrap Prisma queries with Redis check
- **Cost:** ~$10-30/month based on usage

**Decision Trigger:** If page loads consistently >400ms or search >800ms after Phase 1 optimizations, implement Phase 2

**Monitoring & Observability Implementation Details:**

**1. Vercel Analytics (Performance & Web Vitals):**
- **Setup:** Enable in Vercel dashboard (one-click)
- **Metrics:** Core Web Vitals (LCP, FID, CLS), page load times, visitor analytics
- **Use:** Track <500ms page load requirement, identify slow pages
- **Cost:** Included with Vercel Pro ($20/month, needed for production anyway)

**2. Sentry (Error Tracking):**
- **Setup:** `npm install @sentry/nextjs`, add DSN to env vars, run init script
- **Capture:** Automatic error tracking, unhandled exceptions, API errors
- **Features:** Stack traces, breadcrumbs (user actions before error), release tracking, source maps
- **Integration:** Wrap Next.js API routes and server components
- **Alerts:** Email/Slack on new errors or error rate spikes
- **Cost:** Free tier (5k events/month), Pro at $26/month if needed

**3. Inngest Dashboard (Background Jobs):**
- **Included:** Built-in dashboard at inngest.com
- **Metrics:** Job success/failure rates, retry attempts, execution duration
- **Debugging:** View job payloads, execution logs, trace job history
- **Alerts:** Email on job failures (configurable)
- **Use:** Monitor API polling job success rate, execution time, failure patterns

**4. Custom Metrics (Database-Backed):**
- **API Polling Success Rate:**
  ```sql
  SELECT
    COUNT(*) as attempts,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as successes,
    (SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as success_rate
  FROM polling_logs
  WHERE created_at > NOW() - INTERVAL '24 hours';
  ```
- **Query Performance:** Log slow queries (>1s) to database table, review periodically
- **Health Check Endpoint:** `/api/health` returns DB status, polling status, last sync timestamp
- **Dashboard:** Simple admin page querying these metrics (optional)

**Monitoring Coverage:**
| Area | Tool | Metric |
|------|------|--------|
| Page Performance | Vercel Analytics | Load times, Core Web Vitals |
| Application Errors | Sentry | Error rate, stack traces |
| Background Jobs | Inngest | Job success rate, retries |
| API Polling Reliability | Custom (DB) + Inngest | Success rate (target >95%) |
| User Engagement | Vercel Analytics | DAU, page views |
| System Health | Custom (/api/health) | DB, API status, last sync |

**Cost Summary:** $0-50/month (Sentry free tier, Vercel Pro for production)

---

## Cross-Cutting Concerns

**These patterns apply to ALL components and MUST be followed by all AI agents for consistency.**

### UI Component Architecture

**Reference Document:** [`docs/ui-component-architecture.md`](./ui-component-architecture.md)

**Critical Standards:**
1. **Design Tokens Only** - NEVER use hardcoded hex values (e.g., `text-[#9DAA5F]`). Always use design tokens defined in `src/styles/globals.css`.
2. **React Aria First** - Use React Aria Components for all interactive and semantic UI elements (buttons, headings, text, form inputs, modals).
3. **Button Wrapper Mandatory** - ALL buttons must use `~/components/ui/Button.tsx` wrapper component.
4. **Form Components** - Use React Aria `TextField`, `Checkbox`, `Select`, etc. instead of raw HTML inputs.
5. **Typography** - Use React Aria `Heading` and `Text` components instead of raw `<h1-6>`, `<p>`, `<span>`.

**Quick Reference:**
- ✅ CORRECT: `<Button variant="primary">Save</Button>`
- ❌ WRONG: `<button className="bg-[#5e6b24]">Save</button>`

- ✅ CORRECT: `<Heading level={1} className="text-xl">Dashboard</Heading>`
- ❌ WRONG: `<h1 className="text-xl text-[#FDFFFC]">Dashboard</h1>`

**Rationale:** Ensures accessibility (WCAG 2.1 Level AA), consistency across codebase, and maintainability through systematic color changes.

**Established:** 2025-11-26 (Epic 2 Retrospective action item)

### Error Handling Strategy
- **API/Backend (tRPC):** Throw `TRPCError` with typed codes (`BAD_REQUEST`, `UNAUTHORIZED`, `INTERNAL_SERVER_ERROR`, `NOT_FOUND`)
- **Frontend:** React Error Boundaries catch component errors, toast notifications for user-facing errors
- **API Polling Job (Inngest):** Inngest handles retries automatically with exponential backoff, log to Sentry on persistent failure, graceful degradation (continue with cached data)
- **GitLab API Errors:** Rate limit (429) → backoff and retry, timeout → retry with increased timeout, 4xx client errors → log and skip, 5xx server errors → retry
- **Principle:** Fail fast, log full context, provide user-friendly messages, never expose internal details to users

### Logging Approach
- **Logger:** `pino` (industry standard, fastest Node.js logger, structured JSON)
- **Log Levels:**
  - `debug` - Development only (verbose details)
  - `info` - Important events (webhook received, digest sent, user action)
  - `warn` - Recoverable issues (API rate limit warning, cache miss)
  - `error` - Failures requiring attention (DB error, webhook validation failure)
- **Required Context:** Always include `userId`, `requestId`, `operation` in log objects
- **Format:** Structured JSON logs for parsing/querying
- **Example:**
  ```typescript
  logger.info({ userId, operation: 'webhook_received', eventId, projectId }, 'GitLab webhook processed');
  logger.error({ userId, error: err.message, stack: err.stack }, 'Failed to process webhook');
  ```
- **Rule:** NO `console.log` in production code - use proper logger

### Date/Time Handling
- **Storage:** PostgreSQL `timestamptz` (UTC in database, timezone-aware)
- **API Layer:** ISO 8601 strings in UTC (e.g., `2025-11-20T10:30:00Z`)
- **Display Layer:** Format in user's local timezone via browser
- **Library:** `date-fns` for date manipulation and formatting
  - `formatDistance()` for relative times ("2 hours ago")
  - `formatRelative()` for contextual times ("yesterday at 3:45 PM")
  - `format()` for custom date formatting
- **Principle:** Store in UTC, display in user's timezone, use date-fns for all date operations

### Testing Strategy
- **CRITICAL: Minimal testing for fast iteration during MVP phase**
- **Unit Tests ONLY:** Test critical business logic only (filter matching, query parsing, API client)
- **NO Integration Tests:** Infrastructure will change rapidly, avoid testing implementation details
- **NO E2E Tests:** Defer until post-MVP when UX stabilizes
- **Testing Library:** Vitest (fast, TypeScript-native, Vite-compatible)
- **Coverage Target:** No coverage requirements - test what would cause critical bugs, nothing more
- **Philosophy:** Fast iteration over test coverage. Tests should not slow down development.
- **When to Add Tests:** Only when debugging the same bug twice - add test to prevent regression

### Platform & Responsive Strategy
- **Target Platform:** Desktop web application only (internal tool)
- **Minimum Width:** 1920px (1080p) - baseline support
- **Optimal Width:** 2560px (1440p) - primary optimization target, standard in office
- **Wide Displays:** 3840px+ (4K/ultra-wide) - centered content with max-width
- **Mobile/Tablet:** NOT SUPPORTED - show message: "GitLab Insights requires desktop browser (1920px minimum)"
- **Rationale:** All engineers use 1440p+ displays, internal tool (no public mobile access), dense table layout requires horizontal space, keyboard-first UX assumes physical keyboard
- **Browser Support:** Modern browsers only (Chrome, Firefox, Safari, Edge latest versions)
- **Color Mode:** Dark mode only for MVP (light mode post-MVP)
- **Responsive Behavior:**
  - 1080p (1920-2559px): Split pane defaults OFF, toggle ON with `d`
  - 1440p (2560-3839px): Split pane defaults ON, toggle OFF with `d`
  - 4K+ (3840px+): Split pane ON, content centered with max-width constraints

### Code Organization
- **Structure:** Feature-based within layers (src/server, src/app, src/lib)
- **Co-location:** Keep related code together, avoid deep nesting
- **Example Structure:**
  ```
  src/
    server/
      api/routers/
        events.ts      # Event-related tRPC procedures
        queries.ts     # Query management procedures
        users.ts       # User preferences procedures
      db/
        schema.prisma  # Prisma schema
    app/               # Next.js App Router pages
      dashboard/
        page.tsx
      queries/[id]/
        page.tsx
    lib/               # Shared utilities
      webhooks/        # Webhook utilities
      filters/         # Filter logic
      validators/      # Zod schemas
    emails/            # React Email templates
      DigestEmail.tsx
    inngest/           # Inngest functions
      daily-digest.ts
      webhook-retry.ts
  ```

---

## Project Structure

**Complete source tree with architectural boundaries:**

```
gitlab-insights/
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Template for required env vars
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Prisma migrations
├── src/
│   ├── server/
│   │   ├── api/
│   │   │   ├── root.ts          # tRPC app router root
│   │   │   ├── trpc.ts          # tRPC initialization
│   │   │   └── routers/
│   │   │       ├── events.ts    # FR10-14 (Search), FR28-35 (Dashboard & Query Pages)
│   │   │       ├── queries.ts   # FR20-27 (Query Management), FR62-67 (User Preferences)
│   │   │       ├── filters.ts   # FR15-19 (Filtering System)
│   │   │       └── users.ts     # FR79-82 (User Management), FR83-87 (Project Scoping)
│   │   ├── auth.ts              # BetterAuth config - FR79-82 (Authentication)
│   │   └── db.ts                # Prisma client initialization
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Landing/login page
│   │   ├── dashboard/
│   │   │   └── page.tsx         # FR28-32 (Dashboard View), FR40-44 (View Toggle), FR45-52 (Catch-Up Mode)
│   │   ├── queries/
│   │   │   └── [id]/
│   │   │       └── page.tsx     # FR36-39 (Query Page View)
│   │   ├── settings/
│   │   │   └── page.tsx         # FR62-67 (User Settings), FR83-87 (Project Scoping)
│   │   ├── onboarding/
│   │   │   └── page.tsx         # FR99-100 (Onboarding), FR83 (Project Selection)
│   │   └── api/
│   │       ├── health/
│   │       │   └── route.ts     # NFR-O4 (Health Check)
│   │       ├── trpc/
│   │       │   └── [trpc]/
│   │       │       └── route.ts # tRPC API handler
│   │       └── inngest/
│   │           └── route.ts     # Inngest webhook endpoint
│   ├── lib/
│   │   ├── gitlab/
│   │   │   ├── api-client.ts    # FR1-9 (GitLab API client with rate limiting)
│   │   │   └── parser.ts        # GitLab API response parsing
│   │   ├── filters/
│   │   │   ├── engine.ts        # FR15-19 (Filter logic), FR20-27 (Query matching)
│   │   │   └── types.ts         # Filter type definitions
│   │   ├── search/
│   │   │   └── postgres-fts.ts  # FR10-14 (PostgreSQL full-text search)
│   │   ├── validators/
│   │   │   └── schemas.ts       # Zod schemas for validation
│   │   └── utils.ts             # Shared utilities
│   ├── components/              # React components
│   │   ├── dashboard/
│   │   │   ├── ItemRow.tsx      # FR28-32 (2-line row: badge + title + snippet)
│   │   │   ├── SplitPane.tsx    # Toggleable split pane container (press 'd')
│   │   │   ├── DetailPane.tsx   # Right pane: full content preview with highlights
│   │   │   ├── SectionNav.tsx   # FR30 (Section Navigation: Issues/MRs/Comments)
│   │   │   ├── CatchUpModeToggle.tsx # FR45-52 (Dashboard ↔ Catch-Up Mode toggle)
│   │   │   ├── SyncIndicator.tsx # Last sync time + manual refresh button
│   │   │   └── RefreshButton.tsx # FR34, FR61 (Manual Refresh)
│   │   ├── filters/
│   │   │   ├── FilterBar.tsx    # FR15-18 (Filter UI with search)
│   │   │   └── FilterBuilder.tsx # Filter creation/editing
│   │   ├── queries/
│   │   │   ├── QuerySidebar.tsx # FR21 (Persistent sidebar with saved queries)
│   │   │   └── QueryEditor.tsx  # FR23-24 (Edit/Delete queries)
│   │   ├── keyboard/
│   │   │   └── ShortcutHandler.tsx # FR53-61, FR93-98 (Vim-style: j/k/d/o/m/r/s/c/1-9)
│   │   └── ui/                  # React Aria Components (Table, Dialog, Button, etc.)
│   ├── inngest/                 # Inngest functions
│   │   ├── client.ts            # Inngest client setup
│   │   └── api-polling.ts       # FR5 (Scheduled API polling job)
│   └── styles/
│       └── globals.css          # Global Tailwind styles
├── public/                      # Static assets
└── tests/                       # Vitest unit tests (minimal)
    └── lib/
        ├── filters.test.ts      # Filter logic tests
        └── gitlab-api.test.ts   # GitLab API client tests
```

### FR Category to Architecture Mapping

| FR Category | Primary Location | Secondary Locations |
|-------------|------------------|---------------------|
| **Event Capture & Storage (FR1-9)** | `src/inngest/api-polling.ts`, `src/lib/gitlab/api-client.ts` | `src/server/api/routers/events.ts` |
| **Search & Retrieval (FR10-14)** | `src/lib/search/postgres-fts.ts`, `src/server/api/routers/events.ts` | `src/app/dashboard/` |
| **Filtering System (FR15-19)** | `src/lib/filters/`, `src/server/api/routers/filters.ts` | `src/components/filters/FilterBar.tsx` |
| **Query Management (FR20-27)** | `src/server/api/routers/queries.ts`, `src/lib/filters/engine.ts` | `src/components/queries/QuerySidebar.tsx` |
| **Dashboard View (FR28-32)** | `src/app/dashboard/page.tsx`, `src/components/dashboard/ItemRow.tsx` (2-line rows) | `src/components/dashboard/SplitPane.tsx`, `src/components/dashboard/DetailPane.tsx` |
| **Query Page View (FR36-39)** | `src/app/queries/[id]/page.tsx` | `src/components/dashboard/ItemRow.tsx` |
| **Catch-Up Mode (FR45-52)** | `src/components/dashboard/CatchUpModeToggle.tsx` | `src/app/dashboard/page.tsx` |
| **Keyboard Navigation (FR53-61, FR93-98)** | `src/components/keyboard/ShortcutHandler.tsx` (j/k/d/o/m/r/s/c/1-9, /) | All page components, `SplitPane.tsx` (d toggle) |
| **User Settings (FR62-67)** | `src/app/settings/page.tsx`, `src/server/api/routers/users.ts` | Prisma User model |
| **Performance (FR68-74)** | Next.js caching, PostgreSQL indexes | All query paths |
| **Data Integrity (FR75-78)** | Prisma schema constraints, `src/lib/validators/` | Database layer |
| **User & Access Management (FR79-82)** | `src/lib/auth.ts`, BetterAuth | Prisma User model |
| **GitLab Project Scoping (FR83-87)** | `src/server/api/routers/users.ts`, `src/app/onboarding/` | Prisma schema |
| **Error Handling (FR88-92)** | tRPC error handling, React Error Boundaries, Sentry | All components |
| **Onboarding (FR99-100)** | `src/app/onboarding/page.tsx` | `src/server/api/routers/users.ts` |

### Integration Points

**Database ↔ API:**
- Prisma Client in `src/server/db.ts` provides typed database access
- All tRPC routers use Prisma for data operations
- Connection pooling handled by Prisma

**Polling Job → GitLab API → Database:**
- Inngest scheduled job (`src/inngest/api-polling.ts`) triggers every 5-15 minutes
- GitLab API client (`src/lib/gitlab/api-client.ts`) fetches new/updated events
- Parse and validate API responses
- Store events in database via Prisma with upsert pattern (update existing, insert new)
- Update `last_synced_at` timestamp on successful completion

**tRPC Client → Server:**
- Client-side tRPC client auto-generated from server router types
- Type-safe end-to-end (request/response fully typed)
- Error handling via `TRPCError` codes

**Manual Refresh Flow:**
- User triggers refresh (button or keyboard shortcut `r`)
- tRPC mutation calls Inngest API to trigger immediate polling job
- Dashboard polls for completion status or shows optimistic "refreshing" state
- On completion, dashboard refetches data via tRPC query

**Inngest Functions:**
- Triggered by schedule (every 5-15 minutes)
- Access Prisma directly for database operations
- GitLab API calls via `src/lib/gitlab/api-client.ts`
- Monitored via Inngest dashboard

**BetterAuth → Prisma:**
- User, Account, Session tables managed by BetterAuth
- GitLab OAuth provider configured in `src/lib/auth.ts`
- Session persistence in PostgreSQL
- BetterAuth schema compatible with Prisma adapter pattern

---

## Implementation Patterns (Agent Consistency Rules)

**CRITICAL: These patterns ensure multiple AI agents write compatible code. All agents MUST follow these conventions exactly.**

### Quality-First Development Principle

**Core Expectation:** Proactive quality assurance over compliance

**What This Means:**
1. **Surface Concerns Proactively** - If you identify issues in documentation, code, architecture, or patterns, ALERT the user immediately. Don't silently proceed.
2. **Challenge When Appropriate** - If requirements seem incomplete, inconsistent, or problematic, raise concerns and propose alternatives.
3. **Quality Over Speed** - Top-quality results matter more than fast completion. Take time to do it right.
4. **Document Gaps** - If you notice missing documentation, incomplete patterns, or unclear standards, call them out explicitly.
5. **Don't Just Comply** - Following instructions exactly is baseline; thoughtful critique and improvement suggestions are valued.

**Examples:**
- ✅ GOOD: "I noticed the UX spec defines 30 colors but only 6 are implemented in globals.css. This will cause developers to hardcode values. Should I complete the design token system?"
- ❌ BAD: Silently hardcoding `text-[#9DAA5F]` because you saw it in existing code.

- ✅ GOOD: "This component uses raw `<button>` but we have a Button wrapper. This creates inconsistency. Should I refactor?"
- ❌ BAD: Copying the raw `<button>` pattern without questioning it.

- ✅ GOOD: "The story says 'add authentication' but doesn't specify token refresh logic. Should we handle OAuth token expiration?"
- ❌ BAD: Implementing basic auth without considering token lifecycle.

**When in Doubt:**
- Ask clarifying questions
- Propose solutions with trade-offs
- Document assumptions explicitly
- Escalate architectural concerns

**What Makes BMad Happy:**
- Being alerted to quality issues before they compound
- Thoughtful analysis of requirements and patterns
- Proactive identification of gaps or inconsistencies
- Honest assessment of implementation quality

**What Doesn't:**
- Silently following broken patterns
- Marking tasks complete when quality is compromised
- Avoiding difficult conversations about technical debt
- Prioritizing speed over correctness

**Established:** 2025-11-26 (Epic 2 Retrospective)

### Naming Conventions

**Files & Directories:**
- Components: PascalCase (`EventCard.tsx`, `QueryList.tsx`)
- Utilities/libs: kebab-case (`postgres-fts.ts`, `webhook-validator.ts`)
- API routes: kebab-case folders (`/api/webhooks/gitlab/route.ts`)
- Test files: Match source file with `.test.ts` suffix (`filters.test.ts`)

**Code:**
- React components: PascalCase (`<EventCard />`, `<FilterBar />`)
- Functions: camelCase (`getUserQueries`, `validateWebhook`)
- Constants: UPPER_SNAKE_CASE (`WEBHOOK_TIMEOUT_MS`, `MAX_EVENTS_PER_PAGE`)
- Types/Interfaces: PascalCase with descriptive names (`GitLabEvent`, `UserQuery`, `FilterCriteria`)
- tRPC procedures: camelCase (`events.getRecent`, `queries.create`)

**Database:**
- Tables: snake_case, plural (`events`, `user_queries`, `webhook_logs`)
- Columns: snake_case (`created_at`, `gitlab_event_id`, `user_id`)
- Foreign keys: `{table}_id` format (`user_id`, `project_id`)
- Indexes: `{table}_{columns}_idx` format (`events_created_at_idx`, `events_search_idx`)

**URLs/Routes:**
- Pages: kebab-case (`/dashboard`, `/queries/[id]`, `/settings`)
- API endpoints: kebab-case (`/api/webhooks/gitlab`, `/api/events/stream`)
- Query params: camelCase (`?userId=123&projectId=456`)

### API Response Formats

**tRPC Responses:**
- Success: Return data directly (typed by procedure return type)
- Error: Throw `TRPCError` with code and message
```typescript
// Success
return { events, total, hasMore };

// Error
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Query not found',
});
```

**REST Endpoints (webhooks, SSE):**
- Success: Appropriate HTTP status (200, 201, 204)
- Error: HTTP status + JSON body
```typescript
// Success
return new Response(JSON.stringify({ success: true }), { status: 200 });

// Error
return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
```

**SSE Events:**
- Format: `data: {JSON}\n\n`
- Event types: `event-created`, `event-updated`, `query-matched`
```typescript
`data: ${JSON.stringify({ type: 'event-created', payload: event })}\n\n`
```

### Data Flow Patterns

**Webhook → Database → SSE Flow:**
1. Webhook receiver validates request
2. Parse and validate payload with Zod schema
3. Prisma transaction: insert event + update related data
4. On success, emit SSE event to subscribers
5. Return 200 OK to GitLab

**tRPC Query Pattern:**
1. Client calls typed procedure: `trpc.events.getRecent.useQuery()`
2. Server procedure validates input with Zod
3. Check authentication (userId from session)
4. Query Prisma with proper indexes
5. Return typed response
6. Client receives typed data automatically

**Filter Evaluation Pattern:**
1. User creates/modifies filters via UI
2. Save filter as UserQuery in database
3. On new event (from polling), match against all user queries (filter engine)
4. If match, mark as relevant for that user
5. Catch-Up Mode uses same filter engine to show new items since last visit

### State Management

**Client State:**
- Server state: tRPC + React Query (automatic caching, refetching)
- UI state: React useState for ephemeral (view toggle, sidebar open)
- No global state library needed (tRPC handles server state)

**Real-Time State:**
- SSE connection maintains event stream
- New events from SSE automatically added to React Query cache
- Optimistic updates for user actions (instant UI feedback)

### File Organization Rules

**Co-location:**
- Components live near their pages: `app/dashboard/components/` not `components/dashboard/`
- Test files next to source: `lib/filters/engine.test.ts` next to `engine.ts`
- Types co-located with implementation: `lib/filters/types.ts`

**Imports:**
- Absolute imports via tsconfig paths: `@/lib/filters` not `../../lib/filters`
- Group imports: external → absolute → relative
```typescript
// External
import { z } from 'zod';

// Absolute (@ alias)
import { prisma } from '@/server/db';
import { filterEngine } from '@/lib/filters/engine';

// Relative
import { EventCard } from './EventCard';
```

### Error Handling Patterns

**tRPC Procedures:**
```typescript
export const getUserQueries = protectedProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ input, ctx }) => {
    try {
      const queries = await ctx.db.userQuery.findMany({
        where: { userId: input.userId },
      });
      return queries;
    } catch (error) {
      logger.error({ error, userId: input.userId }, 'Failed to fetch user queries');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch queries',
        cause: error,
      });
    }
  });
```

**React Components:**
```typescript
// Use Error Boundaries for component errors
<ErrorBoundary fallback={<ErrorFallback />}>
  <Dashboard />
</ErrorBoundary>

// Use toast for user-facing errors
try {
  await createQuery(data);
  toast.success('Query created');
} catch (error) {
  toast.error('Failed to create query');
}
```

### Database Query Patterns

**Always Use Proper Indexes:**
```typescript
// Good - uses index
const events = await prisma.event.findMany({
  where: {
    userId: userId,           // Indexed
    createdAt: { gte: startDate }  // Indexed
  },
  orderBy: { createdAt: 'desc' },
  take: 50,
});

// Bad - full table scan
const events = await prisma.event.findMany({
  where: {
    title: { contains: keyword }  // Not indexed, slow
  },
});
```

**Use Transactions for Multi-Step Operations:**
```typescript
await prisma.$transaction(async (tx) => {
  const event = await tx.event.create({ data: eventData });
  await tx.webhookLog.create({ data: { eventId: event.id, success: true } });
  return event;
});
```

### Environment Variables

**Required Format:**
- Database: `DATABASE_URL`
- Auth: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`
- External APIs: `RESEND_API_KEY`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `SENTRY_DSN`
- Webhooks: `GITLAB_WEBHOOK_SECRET`

**Access Pattern:**
```typescript
// Server-side only
import { env } from '@/env.mjs';  // Validated via t3-env

// Never in client code
const secret = process.env.SECRET;  // ❌ Wrong - client bundle exposure
```

### Consistency Patterns

**Dates:**
- Always store as `timestamptz` in PostgreSQL
- Always transmit as ISO 8601 UTC strings
- Always format with date-fns for display

**IDs:**
- User-facing IDs: cuid (`cuid()`)
- Internal/sequential: Auto-increment when needed
- Never expose internal DB IDs in URLs (use slugs or cuids)

**Pagination:**
- Cursor-based for infinite scroll: `{ cursor: string, limit: number }`
- Page-based for admin: `{ page: number, perPage: number }`
- Always include `hasMore` in response

### UI Component Patterns (React Aria Components)

**Component Library:** React Aria Components (Adobe) for all interactive UI components

**Core Components Used:**
- **Table:** Main list view with focus management, keyboard navigation
  - Override arrow keys with j/k (vim-style)
  - Row selection with olive (#5e6b24) focus ring
- **Dialog/Modal:** Save query, settings, confirmations
  - Focus trap, Esc to close, auto-focus first input
- **Button:** Primary (olive), secondary (gray), icon-only variants
  - Keyboard interaction (Space/Enter), loading states
- **Search/Combobox:** Filter syntax input with autocomplete
  - Real-time filtering (debounced 300ms)
- **Tooltip:** (Post-MVP) Hover previews with 300ms delay
- **Checkbox:** Settings preferences, query options

**Custom Components Built on React Aria:**
- **SplitPane:** Toggleable split pane using React Aria focus management
- **ItemRow:** 2-line table row (52px height) - custom implementation
- **QuerySidebar:** Persistent navigation with keyboard shortcuts (1-9)
- **DetailPane:** Full content preview with keyboard navigation (j/k)

**Styling:** Tailwind CSS with custom olive accent color system
```css
/* Olive/Moss Accent */
--accent-light: #9DAA5F;      /* Dark mode */
--accent-dark: #5e6b24;       /* Light mode */
```

### Keyboard Shortcut System

**Implementation:** `src/components/keyboard/ShortcutHandler.tsx`

**Global Shortcuts (work anywhere):**
- `j/k` - Navigate items (vim-style, override React Aria Table default arrows)
- `/` - Focus search/filter input
- `?` - Show keyboard shortcuts help modal
- `Esc` - Close modal, exit search, collapse detail pane

**Context Shortcuts (specific views):**
- `c` - Toggle Catch-Up Mode (Dashboard ↔ Catch-Up)
- `d` - Toggle detail pane (split view with 200ms animation)
- `o` - Open selected item in GitLab (new tab)
- `m` - Mark selected item/query as reviewed
- `r` - Manual refresh (trigger immediate API polling)
- `s` - Save current search as query
- `e` - Expand item details (inline, not split pane)
- `1-9` - Jump to sidebar query by position
- `Ctrl+d/u` - Page down/up (if list exceeds viewport)

**Shortcut Conflicts Handling:**
- Avoid Ctrl/Cmd+ shortcuts (browser reserved)
- When search focused, disable navigation shortcuts (j/k)
- Esc removes search focus, restores navigation

**Discovery Mechanisms:**
- Help modal: Press `?` shows all shortcuts
- Button hints: "Open in GitLab (o)" in gray text
- Tooltips: Hover shows shortcut if applicable

**Implementation Pattern:**
```typescript
// ShortcutHandler wraps app, listens for key events
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (isModalOpen || isSearchFocused) return; // Skip when typing

    switch (e.key) {
      case 'j': moveDown(); break;
      case 'k': moveUp(); break;
      case 'd': toggleSplitPane(); break;
      // ... other shortcuts
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [isModalOpen, isSearchFocused]);
```

### Two-Line Row Layout Pattern

**Component:** `src/components/dashboard/ItemRow.tsx`

**Spec:** 52px height, 8-10 items visible on screen without scrolling

**Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Badge] Title text with NEW badge if new           [Meta]       │  Line 1 (24px)
│         First 80-100 chars of content snippet...                │  Line 2 (20px)
└─────────────────────────────────────────────────────────────────┘  8px padding
```

**Line 1 (24px height):**
- Badge: Issue (purple), MR (blue), Comment (gray) - 11px text
- Title: Primary text, truncate if >120 chars with ellipsis
- NEW badge: Olive background, "NEW" text (if unreviewed)
- Metadata (right-aligned): Author, project, time (gray, 11px)

**Line 2 (20px height):**
- Snippet: First 80-100 chars of description/comment
- Color: gray-400 (secondary text)
- Font: 13px (text-sm)
- Truncate with ellipsis if exceeds width

**States:**
- **Default:** Normal appearance
- **Hover:** Slight background highlight (gray-800 in dark mode)
- **Selected (split pane):** 2px olive ring around row
- **Dimmed:** Lower opacity when another row selected

**React Aria Integration:**
```typescript
<Table>
  <TableBody>
    {items.map(item => (
      <Row key={item.id} className="h-[52px] border-b hover:bg-gray-800">
        <Cell>
          <ItemRow item={item} isSelected={selected === item.id} />
        </Cell>
      </Row>
    ))}
  </TableBody>
</Table>
```

### Split Pane Pattern

**Component:** `src/components/dashboard/SplitPane.tsx`

**Toggle:** Press `d` key or click detail button

**Animation:** 200ms ease-out slide animation
- Closed → Opening: Detail pane slides in from right
- Open → Closing: Detail pane slides out to right

**Layout:**
- **Closed (default 1080p):** Full-width table
- **Open:** List pane (480px) + Detail pane (remaining space)
- **1440p+:** Split pane defaults to ON, can toggle OFF

**Persistent Setting:**
- User preference saved in localStorage
- Checkbox in settings: "Always show detail pane"
- Responsive: <1600px width = overlay mode instead

**Detail Pane Contents (DetailPane.tsx):**
- Header: Badge, title, NEW badge, item number (!456)
- Matched Query: Shows which query matched and why
- Content: Full description with highlighted keywords (olive background)
- Metadata Grid: Author, project, labels, time, stats
- Actions: "Open in GitLab (o)", "Mark as Reviewed (m)", "Next (j/k)"

**Implementation:**
```typescript
const [splitPaneOpen, setSplitPaneOpen] = useState(defaultOpen);

// 'd' key handler in ShortcutHandler
const toggleSplitPane = () => {
  setSplitPaneOpen(prev => !prev);
  localStorage.setItem('splitPanePreference', !splitPaneOpen);
};

// Layout
<div className="flex">
  <div className={cn(
    "transition-all duration-200",
    splitPaneOpen ? "w-[480px]" : "w-full"
  )}>
    <ItemTable />
  </div>
  {splitPaneOpen && (
    <div className="flex-1 border-l animate-slide-in">
      <DetailPane item={selectedItem} />
    </div>
  )}
</div>
```

### Progressive Disclosure Pattern

**Three-tier architecture aligned with UX spec:**

**Tier 1 - Table View (Default):**
- 2-line rows showing title + snippet
- 8-10 items visible, rapid scanning
- Keyboard: j/k to navigate

**Tier 2 - Split Pane (Press 'd'):**
- List stays visible (480px)
- Detail pane shows full content with highlights
- Keyboard: j/k moves selection, detail updates instantly
- Close: Press 'd' again or Esc

**Tier 3 - GitLab (Press 'o'):**
- Opens in new tab
- Full discussion thread, code changes, all metadata
- Return focus to app after opening

**Goal:** Show minimal info by default, expand on demand, dive deep selectively

---

## Architecture Decision Records (ADRs)

### ADR-001: T3 Stack for Rapid Development
**Decision:** Use T3 Stack (Next.js + TypeScript + tRPC + Prisma + NextAuth + Tailwind)
**Rationale:** Pre-configured auth, database, and type-safe APIs optimize for velocity while maintaining production quality
**Consequences:** Faster initial setup, strong type safety, some framework lock-in
**Status:** Accepted

### ADR-002: API Polling over Webhooks for MVP
**Decision:** Use scheduled GitLab API polling (5-15 min intervals) instead of webhook-based real-time event capture
**Rationale:** Simpler MVP architecture, no webhook infrastructure setup, no signature validation complexity, 5-15min latency acceptable for discovery use case, manual refresh provides user control
**Consequences:** Slightly higher latency (5-15 min vs real-time), but significantly simpler infrastructure, easier to implement and debug, respects API rate limits naturally
**Status:** Accepted

### ADR-003: Inngest for Scheduled Polling
**Decision:** Use Inngest for scheduled API polling job (only use case in MVP)
**Rationale:** Serverless-friendly, built-in retry/scheduling/monitoring, TypeScript SDK, minimal ops overhead, free tier covers MVP usage
**Consequences:** $0 at MVP scale, vendor dependency (but easy migration to Vercel Cron if needed)
**Status:** Accepted

### ADR-004: PostgreSQL Full-Text Search for MVP
**Decision:** Use PostgreSQL FTS with GIN indexes, not Elasticsearch
**Rationale:** Zero additional infrastructure, meets <1s requirement at MVP scale, native Prisma integration
**Consequences:** Simpler architecture, migration path to Elasticsearch documented if needed
**Status:** Accepted

### ADR-005: Staged Caching Strategy
**Decision:** Phase 1 (MVP): Next.js caching + PostgreSQL optimization. Phase 2 (if needed): Add Upstash Redis
**Rationale:** Measure first, optimize second. Avoid premature optimization.
**Consequences:** Achieve <500ms goal with simpler stack, add complexity only if metrics demand
**Status:** Accepted

### ADR-006: Minimal Testing for Fast Iteration
**Decision:** Unit tests ONLY for critical logic. NO integration or E2E tests during MVP.
**Rationale:** Fast iteration over test coverage. Infrastructure will change rapidly.
**Consequences:** **CRITICAL** - Tests must not slow development. Add tests only when debugging same bug twice.
**Status:** Accepted

### ADR-007: No Email Digest in MVP
**Decision:** Use in-app Catch-Up Mode instead of email digest for MVP
**Rationale:** Eliminates email infrastructure (Resend, React Email), reduces complexity, faster to implement, user has control over when to review
**Consequences:** No external dependencies for email, users must open app to see updates, email digest deferred to post-MVP
**Status:** Accepted

### ADR-008: React Aria Components for Keyboard-First UX
**Decision:** Use React Aria Components (Adobe) instead of shadcn/ui or other component libraries
**Rationale:** Keyboard-first UX is core product identity requiring vim-style navigation (j/k, d, o, m, r, s, c). React Aria provides industry-leading keyboard navigation and focus management out of the box. Unstyled primitives enable custom olive accent color (#5e6b24) and complete design control while maintaining WCAG AA+ accessibility.
**Consequences:** More initial styling work (worth it for keyboard quality), no pre-made components (build custom on React Aria foundation), exceptional accessibility and keyboard navigation as product differentiator
**Status:** Accepted

### ADR-009: Dark Mode Only for MVP
**Decision:** Ship dark mode only for MVP, defer light mode to post-MVP
**Rationale:** Target users (engineers) strongly prefer dark mode, especially for code-adjacent tools. Single color mode reduces testing surface, faster MVP delivery. Light mode adds complexity with minimal MVP value (can add post-validation).
**Consequences:** Faster MVP delivery, reduced CSS complexity, may exclude minority of light mode users (acceptable for beta), light mode deferred to post-MVP
**Status:** Accepted
**Colors:** Background #2d2e2e, Primary text #FDFFFC, Accent #9DAA5F (lightened olive for dark bg contrast)

### ADR-010: Laptop and Desktop Platform (1280px+ minimum)
**Decision:** Target laptop and desktop web browsers, 1280px minimum width, optimized for 1440px-2560px range
**Rationale:** Target users (mid-senior engineers) work on both laptops and desktops. Common laptop resolutions include MacBook Air 13" (1440×900 scaled), MacBook Pro 14" (1512×982 scaled), and standard corporate laptops (1366×768 - 1920×1080). Internal tool (no mobile use case). Dense 2-line table layout requires horizontal space but adapts responsively. Keyboard-first UX assumes physical keyboard (present on laptops). Supporting real-world laptop usage critical for remote work and flexible engineering workflows.
**Consequences:** Mobile/tablet not optimized but accessible (acceptable for internal tool), responsive design testing at multiple widths required, optimized UX for laptop and desktop environments, graceful degradation on smaller viewports (no hard lockout)
**Status:** Accepted (Amended 2025-11-24 - reduced minimum from 1920px to 1280px to support laptop users)
**Responsive Strategy:**
- Compact laptop mode (1280-1679px): Reduced column widths, detail pane off by default, 10-12 items visible
- Standard mode (1680-2559px): Full table layout, detail pane toggleable, 8-10 items visible
- Wide mode (2560px+): Detail pane on by default, maximum information density

**Amendment History:**
- **2025-11-24**: Revised minimum from 1920px to 1280px. Original ADR assumed "all engineers use 1440p+ displays" without user validation. Real-world usage revealed engineers use laptops (1280-1680px width) for remote work, video calls, and flexible setups. The 1920px minimum would have blocked most laptop usage, creating poor UX for actual engineering workflows.

### ADR-011: Phased MVP - Mouse-First with Keyboard Layer
**Decision:** Ship Phase 1 MVP with mouse-driven UI (buttons, nav links, clickable elements), then layer keyboard shortcuts in Phase 2 after validation
**Rationale:**
- **Fast Validation:** Mouse-driven MVP can ship in 3-4 weeks vs 5-8 weeks with keyboard shortcuts, enabling faster user feedback and hypothesis validation
- **Progressive Enhancement:** React Aria Components already support both mouse AND keyboard interactions - Phase 1 uses mouse interactions only, Phase 2 adds keyboard event handlers that call the same underlying functions (no refactoring needed)
- **Lower Risk:** If core value prop (automated GitLab awareness with saved queries and catch-up mode) fails, we save 2-4 weeks of keyboard implementation work
- **Architectural Soundness:** ADR-008 (React Aria Components) remains correct for both phases - components are architected to handle both input methods from day 1

**Phase 1 (MVP - 3-4 weeks):**
- Mouse interactions: Click, hover, button clicks, dropdown selections
- Navigation: Sidebar links, page navigation
- Actions: Buttons trigger all operations (save query, mark reviewed, manual refresh, toggle split pane)
- Table selection: Click to select rows, click to open detail pane
- Section navigation: Clickable chip buttons (Title/Body/Details)
- React Aria Components foundation: Table, Dialog, Button, Combobox (mouse-only for now)

**Phase 2 (Keyboard Layer - 2-3 days):**
- Add global keyboard event handler with typing detection (don't intercept input fields)
- Wire shortcuts to existing click handlers:
  - `/` → `focusSearch()` (same function as click)
  - `j/k` → `moveSelection()` (calls React Aria's selection APIs)
  - `o` → `openInGitLab()` (same function as double-click)
  - `d` → `toggleDetailPane()` (same function as button click)
  - `s` → `openSaveQueryModal()` (same function as button click)
  - `c` → `navigateToCatchup()` (same function as nav link click)
  - `r` → `triggerManualRefresh()` (same function as button click)
  - `1/2/3` → `scrollToSection()` (same function as chip button click)
- Add help modal (`?` key) with keyboard shortcut reference
- Add visual keyboard indicators (shortcut hints on hover)
- **No refactoring required** - keyboard handlers are wrappers around existing mouse handlers

**Code Example (No Refactoring Needed):**
```typescript
// Phase 1: Button click handler
const handleRefresh = () => {
  triggerManualRefresh(); // Core function
};

<Button onClick={handleRefresh}>Refresh</Button>

// Phase 2: Add keyboard handler (calls same function)
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'r' && !isTyping(e.target)) {
    e.preventDefault();
    triggerManualRefresh(); // Same function
  }
};

<div onKeyDown={handleKeyDown}>
  <Button onClick={handleRefresh}>Refresh (r)</Button>
</div>
```

**Consequences:**
- **Pro:** 2-4 weeks faster MVP delivery enables early user feedback
- **Pro:** Lower implementation risk - validate core value before investing in power-user features
- **Pro:** React Aria architecture enables clean keyboard layer addition (no refactoring)
- **Pro:** MVP is fully functional for mouse users (not a degraded experience)
- **Con:** Phase 1 users won't have vim-style shortcuts (but mouse UI is complete)
- **Con:** Must communicate phasing to early adopters (keyboard shortcuts coming in v2.0)
- **Mitigation:** Architecture designed for progressive enhancement from day 1 - React Aria components already support keyboard, we're just not wiring up the event listeners yet

**Validation Approach:**
- Phase 1 success = 3+ daily active users by week 4 using mouse-driven UI
- If validated → Phase 2 adds keyboard layer (2-3 days)
- If not validated → Saved 2-4 weeks of keyboard work, pivot based on user feedback

**React Aria Confirmation (ADR-008 Still Valid):**
React Aria Components remain the correct choice for BOTH phases:
- Phase 1: Uses React Aria's mouse interaction APIs (onClick, onSelectionChange)
- Phase 2: Adds keyboard interaction APIs (onKeyDown) that call the same underlying functions
- No component library swap needed - React Aria was designed for exactly this progressive enhancement pattern

**Status:** Accepted (2025-11-21)
**Updated:** Architecture document, PRD (FR52-60, FR92-97 marked Phase 2), Epics document (Phase 1/Phase 2 sections)

### ADR-012: BetterAuth for Next.js 16 Compatibility

**Decision:** Use BetterAuth 1.4.1 instead of NextAuth for authentication

**Context:**
During Story 1.3 (GitLab OAuth Authentication) implementation, NextAuth 5.0.0-beta exhibited compatibility issues with Next.js 16.0.4. The NextAuth team officially recommends migrating to BetterAuth for Next.js 16+ projects, as NextAuth v5 remains in beta with no stable release timeline.

**Rationale:**
- **Stability**: BetterAuth is production-ready (v1.4.1 stable), NextAuth v5 is beta
- **Next.js 16 Support**: BetterAuth designed specifically for Next.js 15+ with full App Router support
- **Official Recommendation**: NextAuth maintainers explicitly recommend BetterAuth for new projects
- **Better DX**: Simpler API surface, improved TypeScript inference, clearer documentation
- **Active Maintenance**: Regular releases, responsive maintainers, growing ecosystem
- **Feature Parity**: Supports GitLab OAuth provider with same capabilities as NextAuth

**Consequences:**
- **Pro**: Eliminates beta dependency, improves stability
- **Pro**: Future-proof decision aligned with ecosystem direction
- **Pro**: Better TypeScript support reduces type errors
- **Pro**: Simpler mental model (fewer abstractions than NextAuth)
- **Con**: Smaller community compared to NextAuth (mitigated by official recommendation)
- **Con**: Documentation references NextAuth in T3 Stack guides (easily adapted)
- **Migration Path**: If reverting needed, BetterAuth → NextAuth migration straightforward (both use similar OAuth patterns)

**Implementation Details:**
- Configuration: `src/lib/auth.ts` (BetterAuth convention, not `src/server/auth.ts`)
- Environment Variables: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (not `NEXTAUTH_*`)
- Database Schema: BetterAuth uses similar User/Account/Session tables with minor differences
- Session Management: BetterAuth provides equivalent session handling with simpler API

**Status:** Accepted (2025-11-24)

**Related Decisions:** ADR-001 (T3 Stack), ADR-011 (Phased MVP)

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-11-21_
_For: BMad_
_Updated: Aligned with PRD v1.1 (polling-based) and UX Design Specification v1.0_
_Phase 2 Update: ADR-011 added for phased MVP rollout strategy (2025-11-21)_
