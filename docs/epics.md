# gitlab-insights - Epic Breakdown

**Author:** BMad
**Date:** 2025-11-21
**Project Level:** MVP
**Target Scale:** Low Complexity - Web App

---

## Overview

This document provides the complete epic and story breakdown for gitlab-insights, decomposing the requirements from the [PRD](./prd.md) into implementable stories.

**Living Document Notice:** This is the initial version. It will be updated after UX Design and Architecture workflows add interaction and technical details to stories.

---

## Functional Requirements Inventory

### Event Capture & Storage
- **FR1:** System can poll GitLab API for issues, merge requests, and comments (create, update, close, reopen events)
- **FR2:** System can store API-fetched events with essential metadata: title, body, author, project, labels, timestamp, event type, GitLab URL
- **FR3:** System can update existing stored events when API polling detects changes (keeps data fresh, prevents staleness)
- **FR4:** System can schedule background polling every 5-15 minutes (configurable interval)
- **FR5:** System can handle manual refresh requests to fetch latest data immediately
- **FR6:** System can respect GitLab API rate limits with exponential backoff and user notification
- **FR7:** System can display last successful sync timestamp to user
- **FR8:** System can continue operating with stored data when GitLab API temporarily unavailable

### Search & Retrieval
- **FR9:** Users can search across all stored events with <1 second response time
- **FR10:** Users can search by keywords, labels, authors, projects, date ranges
- **FR11:** Search results can show matching items across all event types (Issues, MRs, Comments)
- **FR12:** Users can see which search terms matched in results (keyword highlighting, transparent relevance)
- **FR13:** Users can view event details and click through to GitLab to see full discussion

### Filtering System
- **FR14:** Users can apply temporary filters to current view (keyword, label, author, project, event type, date range)
- **FR15:** Filters can persist across sections when scrolling (apply "keyword: auth" → all sections show only matching items)
- **FR16:** Users can clear filters to return to unfiltered view
- **FR17:** Users can see which filters are currently active
- **FR18:** Users can combine multiple filters (AND/OR logic)

### Query Management
- **FR19:** Users can save filter combinations as persistent queries with custom names
- **FR20:** Saved queries can appear in sidebar navigation
- **FR21:** Users can click a saved query to navigate to its dedicated page
- **FR22:** Users can edit query filters after creation (modify keywords, labels, scope)
- **FR23:** Users can delete queries that are no longer useful
- **FR24:** System can show query effectiveness metrics (match count, items since last viewed)
- **FR25:** Users can create queries from search results ("Save this search as query")
- **FR26:** Users can create queries from active filters on dashboard ("Save current filters as query")

### Dashboard View
- **FR27:** Users can view main dashboard with sectioned layout: Issues section, Merge Requests section, Comments section
- **FR28:** Users can scroll through sections to see recent events of each type
- **FR29:** Users can jump between sections using keyboard shortcuts (absolute: 1/2/3, relative: Ctrl+d/Ctrl+u)
- **FR30:** Dashboard can show unfiltered events by default (all recent activity)
- **FR31:** Dashboard scroll position can persist when navigating away and returning
- **FR32:** Users can toggle digest cards on dashboard to show/hide highlights from saved queries
- **FR33:** Users can trigger manual refresh to fetch latest data from GitLab API
- **FR34:** Dashboard displays last sync timestamp and next scheduled refresh time

### Query Page View
- **FR35:** Each saved query can have dedicated page with same sectioned layout (Issues, MRs, Comments)
- **FR36:** Query pages can show only events matching the query's filters
- **FR37:** Query page sections can display item counts (e.g., "Issues (5)", "MRs (3)")
- **FR38:** Users can edit query filters on query pages with save prompt before navigating away

### View Toggle
- **FR39:** Users can toggle between Card view and Table view for event display
- **FR40:** Card view can show title, snippet, metadata, labels, author avatar
- **FR41:** Table view can show title and key metadata in compact columnar format
- **FR42:** View preference can persist per page (dashboard, individual query pages)
- **FR43:** View toggle applies to all sections on current page

### Catch-Up Mode
- **FR44:** Dashboard can display Catch-Up Mode showing items new since last user login/review
- **FR45:** Catch-Up Mode can group items by saved queries (not base dashboard)
- **FR46:** Each Catch-Up section can show query name, item counts by type, and new items
- **FR47:** Users can mark individual queries as reviewed in Catch-Up Mode
- **FR48:** Users can "Mark All as Reviewed" to reset baseline
- **FR49:** Catch-Up Mode badge can show total count of new items across all queries
- **FR50:** Catch-Up Mode can respect 5-15 items per query target (not 0, not 100)
- **FR51:** Sidebar query badges show count of new items since last viewed for each query

### Keyboard Navigation
- **FR52:** Users can focus search bar with `/` keyboard shortcut
- **FR53:** Users can navigate items within sections with j/k keys (vim-style)
- **FR54:** Users can open selected item in GitLab with o or Enter key
- **FR55:** Users can mark current item as reviewed with `m` keyboard shortcut
- **FR56:** Users can toggle Card/Table view with `v` keyboard shortcut
- **FR57:** Users can view keyboard shortcut help with `?` key
- **FR58:** All interactive elements can be accessible via keyboard (tab navigation)
- **FR59:** Keyboard focus indicators can be visible for all interactive elements
- **FR60:** Users can trigger manual refresh with keyboard shortcut (r)

### User Settings & Preferences
- **FR61:** Users can configure filter preferences (default filters, favorite queries)
- **FR62:** Users can configure Catch-Up Mode preferences (review timing)
- **FR63:** Users can configure view preferences (default to card or table view)
- **FR64:** Users can configure polling interval (5-15 minute range)
- **FR65:** Users can manage GitLab connection (authentication, API token)
- **FR66:** User preferences can persist across sessions

### Performance & Reliability
- **FR67:** Page loads can complete in <500ms
- **FR68:** Search queries can return results in <1 second
- **FR69:** Filter application can complete in <200ms
- **FR70:** API polling can maintain >95% success rate with proper error handling
- **FR71:** System can handle 4 weeks of rolling historical event storage without performance degradation
- **FR72:** Dashboard refresh can complete in <200ms
- **FR73:** Manual refresh can complete in <3 seconds for typical project sizes

### Data Integrity
- **FR74:** System can prevent duplicate events from being stored
- **FR75:** System can handle API response pagination correctly
- **FR76:** Stored events can maintain referential integrity with GitLab (URLs remain valid)
- **FR77:** Query filters can be validated before saving (prevent invalid regex, syntax errors)

### User & Access Management
- **FR78:** Users can register/login with GitLab OAuth
- **FR79:** Each user has isolated query preferences and settings
- **FR80:** User sessions persist with secure token-based authentication
- **FR81:** System supports 3-10 concurrent users (beta scope)

### GitLab Project Scoping
- **FR82:** Users must select GitLab projects to monitor on first login (onboarding requirement)
- **FR83:** Users can add/remove monitored projects from settings after onboarding
- **FR84:** Event capture (API polling) scoped to user's selected projects only
- **FR85:** Users can monitor entire GitLab groups (all projects within a group)
- **FR86:** Filters can include project/group as a filter dimension

### Error Handling & User Feedback
- **FR87:** Users can see clear error messages when operations fail, displayed contextually (search errors in search area, filter errors near filter UI)
- **FR88:** System can gracefully handle GitLab API rate limits with toast notification and retry with backoff
- **FR89:** Users can see API sync status in unobtrusive but visible location (header/footer indicator)
- **FR90:** System can show fallback UI when API temporarily unavailable (toast notification + continue with cached data)
- **FR91:** Users can see system health indicators (API polling success rate, last successful sync) in settings or status page

### Keyboard Navigation (Extended)
- **FR92:** Users can navigate sidebar queries with vim-style keyboard navigation
- **FR93:** Users can activate selected sidebar query with keyboard
- **FR94:** Users can create new query with keyboard shortcut
- **FR95:** Users can edit/delete queries with keyboard shortcuts
- **FR96:** Users can manage filters (apply/remove/clear) with keyboard navigation
- **FR97:** All interactive elements accessible via keyboard without mouse requirement

### Onboarding & First-Run Experience
- **FR98:** System guides users through first-login flow (GitLab OAuth → Project selection)
- **FR99:** Users can see helpful empty states when no queries exist yet

---

**Total:** 99 Functional Requirements

---

## Epics Summary

**Project Phasing:** This project is structured in two phases to optimize for fast validation and progressive enhancement:

**Phase 1: MVP (Mouse-First) - 3-4 weeks**
- Goal: Validate core value proposition (automated GitLab awareness with saved queries and catch-up mode)
- Approach: Mouse-driven UI with buttons, nav links, and clickable elements
- Architecture: Built on React Aria foundation (keyboard-ready but not implemented)
- Timeline: Epics 1-4 (16-21 days solo)

**Phase 2: Power User Experience - 2-3 weeks** (Post-validation)
- Goal: Add vim-style keyboard shortcuts for power users
- Approach: Layer keyboard event handlers onto existing mouse-driven UI (no refactoring needed)
- Timeline: ~2-3 days to add keyboard shortcuts, plus additional polish/production features

**Note:** This phasing was determined through collaborative discussion to prioritize fast MVP delivery for validation before investing in power-user features.

---

# PHASE 1: MVP (Mouse-First Core Workflows)

---

## Epic 1: Walking Skeleton
**Timeline:** Week 1 (3-5 days)

**Goal:** Prove end-to-end technical stack works with minimal but complete user flow

**Value Statement:** Users can see a working filtered GitLab feed with hardcoded query, validating core hypothesis

**Scope:**
- T3 Stack initialization (Next.js + TypeScript + tRPC + Prisma + NextAuth + Tailwind)
- GitLab OAuth authentication
- Project scoping onboarding (select projects to monitor)
- Basic API polling (manual refresh only, no background job)
- Hardcoded query: `label:security`
- 2-line table view (Issues/MRs/Comments sections)
- Click through to GitLab
- Basic layout with React Aria Components foundation

**FRs Covered:** FR78 (GitLab OAuth), FR82-83 (Project selection), FR1-3 (Basic API polling), FR27-28 (Basic dashboard), FR13 (Click through)

**Rationale:** Walking skeleton proves full stack works and delivers demo-able product in 3-5 days. Validates technical decisions early. Establishes foundation for rapid iteration.

---

## Epic 2: User-Controlled Queries
**Timeline:** Week 1-2 (5-7 days)

**Goal:** Enable users to create and manage personalized queries with search and filtering

**Value Statement:** Users can define, save, and navigate custom queries with full search and filter capabilities (mouse-driven for MVP)

**Scope:**
- React Aria Components setup (Table, Dialog, Button, Combobox) - mouse interaction only
- Create/save/delete queries UI and backend (FR19-26)
- Sidebar navigation with query list (FR20-21)
- Search bar (mouse/click to focus)
- Filter UI with temporary filters (FR14-18)
- PostgreSQL full-text search with GIN indexes (FR9-13)
- Keyword highlighting (FR12)
- Query effectiveness metrics (FR24)
- "Save as Query" button when search/filters active
- **Performance DoD:** <500ms page loads, <1s search results

**FRs Covered:** FR19-26 (Query Management), FR14-18 (Filtering), FR9-13 (Search), FR67-69 (Performance baseline)

**Phase 2 Note:** Keyboard shortcuts (`/`, `j/k`, `o`, `s`, etc.) will be added in Phase 2 by layering event handlers onto existing click handlers.

**Rationale:** Delivers core user value (personalized monitoring) with mouse-driven UI for faster MVP validation. React Aria foundation enables easy keyboard layer addition later.

---

## Epic 3: Catch-Up Mode & Background Sync
**Timeline:** Week 2-3 (4-5 days)

**Goal:** Complete primary user workflow with "inbox zero" experience and automated sync

**Value Statement:** Users can see "what's new since last visit" grouped by queries, with automated background updates

**Scope:**
- Catch-Up Mode navigation (Sidebar link to /catch-up route)
- "New since last visit" logic using `last_visited_at` timestamp (FR44-46)
- Query grouping in Catch-Up Mode (FR45-46)
- Mark query as reviewed button (FR47)
- "Mark All as Reviewed" button (FR48)
- Badge counts on sidebar queries (FR51)
- Badge on Catch-Up nav link showing total new items (FR49)
- Inngest scheduled background polling job (5-15 min) (FR4)
- Manual refresh button in header (FR5)
- Sync indicator: last sync timestamp + next refresh time (FR7, FR34)
- Respect 5-15 items per query target (FR50)
- **Performance DoD:** Background job doesn't impact UI responsiveness, <500ms Catch-Up view load

**FRs Covered:** FR44-51 (Catch-Up Mode), FR4-8 (Background polling), FR33-34 (Manual refresh & sync display)

**Phase 2 Note:** Keyboard shortcuts (`c` toggle Catch-Up, `r` manual refresh) will be added in Phase 2.

**Rationale:** Completes primary workflow by week 3 with mouse-driven UI. Users can validate "catch duplicate work" hypothesis. Automated sync removes friction. Achieves "3+ daily users by week 4" target becomes feasible.

---

## Epic 4: Split View & Detail Navigation
**Timeline:** Week 3-4 (3.5-4 days)

**Goal:** Enable users to explore event details without leaving the app, reducing tab chaos and context switching

**Value Statement:** Users can click rows to view full event details in a split pane, with keyword highlighting and section navigation (all mouse-driven)

**Scope:**
- Split pane component with toggle button (FR31-32)
- Responsive: Desktop (60/40 split, open by default), Tablet (toggle), Mobile (full-screen nav)
- Detail pane with full content rendering (FR33)
- Auto-update detail when clicking different rows
- Keyword highlighting in detail view (FR12, FR34-35)
- Section navigation with clickable chips (Title/Body/Details) (FR36-37)
- Query metadata page for editing query details (FR38)
- Scroll position persistence (FR31, FR39-40)
- URL-based state (?detail=eventId) for deep linking
- **Performance DoD:** <100ms detail render, <50ms highlighting, <16ms section scroll

**FRs Covered:** FR31-33 (Split pane), FR34-35 (Keyword highlighting), FR36-37 (Section nav), FR38 (Query page), FR39-40 (Scroll persistence)

**Phase 2 Note:** Keyboard shortcuts (`d` toggle split, `1/2/3` section jumps) will be added in Phase 2 by calling the same click handlers.

**Rationale:** Reduces context switching and tab chaos without requiring keyboard shortcuts. Core information discovery feature delivered in MVP. Built with React Aria foundation for easy keyboard layer addition.

---

**Phase 1 MVP Summary:**
- **Total:** 31 stories across 4 epics
- **Timeline:** 16-21 days (3-4 weeks solo)
- **Deliverable:** Fully functional GitLab activity monitor with search, saved queries, catch-up mode, and split view detail exploration - all mouse-driven
- **Validation Goal:** 3+ daily active users by end of week 4

---

# PHASE 2: Power User Experience (Post-Validation)

---

## Epic 5: Keyboard Foundation
**Timeline:** 2-3 days (post Phase 1 validation)

**Goal:** Layer vim-style keyboard shortcuts onto existing mouse-driven UI

**Value Statement:** Power users can navigate the entire app without touching the mouse

**Scope:**
- Global keyboard event handler with typing detection
- Wire shortcuts to existing click handlers:
  - `/` focus search
  - `j/k` table navigation
  - `o` open in GitLab
  - `d` toggle detail pane
  - `s` save query
  - `c` navigate to catch-up
  - `r` manual refresh
  - `1/2/3` section navigation
- Help modal (`?` key) with categorized shortcut reference (FR57)
- Visual keyboard indicators (shortcut hints on buttons)
- **No refactoring needed** - just add event listeners

**FRs Covered:** FR52-60 (Keyboard Navigation Core)

**Rationale:** Keyboard layer adds power-user appeal after core value validated. 2-3 days to implement because foundation was architected correctly in Phase 1.

---

## Epic 6: Reliability & Error Handling
**Timeline:** 5-7 days (Phase 2, post-keyboard foundation)

**Goal:** Ensure production-grade reliability with graceful error handling

**Value Statement:** Users trust the system to handle failures gracefully and maintain data integrity

**Scope:**
- GitLab API rate limiting with exponential backoff (FR6)
- API polling >95% success rate with retry logic (FR70)
- Graceful handling of API unavailability (FR8, FR90)
- Error boundaries for React components
- Toast notifications for errors (FR88)
- Contextual error messages (FR87)
- API sync status indicator (FR89)
- Loading states and skeleton loaders
- Data integrity: deduplication, pagination handling (FR74-76)
- Filter validation before saving (FR77)
- Settings page UI (FR61-66)
- User preferences persistence (FR66)
- Polling interval configuration (FR64)
- View preferences (FR63)
- **Performance DoD:** Graceful degradation, no blocking errors

**FRs Covered:** FR6 (Rate limits), FR70 (Polling reliability), FR74-77 (Data integrity), FR87-91 (Error handling), FR61-66 (Settings), FR8 (Offline tolerance)

**Rationale:** Production-grade reliability before launch. Users can configure preferences. Data quality ensured.

---

## Epic 7: Production Readiness & Polish
**Timeline:** 3-5 days (Phase 2, final epic)

**Goal:** Polish for production launch with monitoring, accessibility, and onboarding improvements

**Value Statement:** Users experience a professional, accessible, monitored production application

**Scope:**
- Monitoring and observability setup (Vercel Analytics, Sentry, Inngest dashboard)
- Health check endpoint (`/api/health`) (FR91)
- Custom metrics (API polling success rate tracking)
- Onboarding flow polish (FR98-99)
- Empty states with helpful guidance (FR99)
- Accessibility audit (WCAG 2.1 AA compliance)
- Focus indicators polish (FR59)
- Dark mode refinements (olive accent throughout)
- Animation polish and micro-interactions
- Performance optimization pass (final tuning to hit <500ms target)
- Documentation: README, setup guide
- **Performance DoD:** Final validation <500ms loads, <1s search, Lighthouse score >90

**FRs Covered:** FR91 (Health indicators), FR98-99 (Onboarding polish), FR58-59 (Accessibility), FR67-73 (Final performance validation)

**Rationale:** Professional polish for beta launch. Monitoring ensures early issue detection. Accessibility ensures inclusive experience.

---

## FR Coverage Map

### Phase 1: MVP (Epics 1-4)

**Epic 1: Walking Skeleton**
- FR1: Poll GitLab API (basic, manual refresh only)
- FR2: Store events with metadata
- FR3: Update existing events
- FR13: Click through to GitLab
- FR27: Sectioned dashboard (Issues/MRs/Comments)
- FR28: Scroll through sections
- FR78: GitLab OAuth login
- FR79: Isolated user preferences (basic setup)
- FR80: Secure session persistence
- FR81: Support 3-10 concurrent users
- FR82: Select projects on first login (onboarding)
- FR83: Add/remove projects (basic UI)

**Epic 2: User-Controlled Queries**
- FR9: Search with <1s response time
- FR10: Search by keywords, labels, authors, projects, dates
- FR11: Show results across all event types
- FR12: Keyword highlighting and transparent relevance
- FR14: Apply temporary filters
- FR15: Filters persist across sections
- FR16: Clear filters
- FR17: Show active filters
- FR18: Combine filters (AND/OR logic)
- FR19: Save filter combinations as named queries
- FR20: Queries appear in sidebar
- FR21: Click query to navigate to dedicated page
- FR22: Edit query filters
- FR23: Delete queries
- FR24: Show query effectiveness metrics
- FR25: Create query from search results
- FR26: Create query from active filters
- FR59: Visible focus indicators
- FR67: <500ms page loads (baseline established)
- FR68: <1s search (baseline established)
- FR69: <200ms filter application

**Epic 3: Catch-Up Mode & Background Sync**
- FR4: Schedule background polling (5-15 min)
- FR5: Handle manual refresh requests (button)
- FR7: Display last sync timestamp
- FR8: Continue with cached data when API unavailable (basic)
- FR33: Manual refresh button
- FR34: Display last sync time and next refresh
- FR44: Catch-Up Mode shows new items since last visit
- FR45: Group by saved queries
- FR46: Show query name, counts, new items
- FR47: Mark individual queries as reviewed
- FR48: "Mark All as Reviewed"
- FR49: Badge shows total new item count
- FR50: Respect 5-15 items per query target
- FR51: Sidebar badges show new counts

**Epic 4: Split View & Detail Navigation**
- FR12: Keyword highlighting (in detail view)
- FR31: Persist scroll position
- FR32: Split pane toggle (button)
- FR33: View event details and click through
- FR34-35: Keyword highlighting in detail view
- FR36-37: Section navigation (clickable chips)
- FR38: Query metadata page
- FR39-40: Scroll position persistence

### Phase 2: Power User Experience (Epics 5-7)

**Epic 5: Keyboard Foundation**
- FR52: `/` focuses search
- FR53: `j/k` navigate items (vim-style)
- FR54: `o/Enter` open in GitLab
- FR55: `m` mark as reviewed
- FR56: `v` toggle Card/Table view
- FR57: `?` show keyboard shortcuts (help modal)
- FR58: All elements keyboard accessible
- FR59: Visible focus indicators
- FR60: `r` manual refresh keyboard shortcut
- FR92: Navigate sidebar with keyboard
- FR93: Activate sidebar query with keyboard
- FR94: Create query with keyboard shortcut
- FR95: Edit/delete queries with keyboard
- FR96: Manage filters with keyboard
- FR97: No mouse required
- FR29: Jump between sections (1/2/3 shortcuts)

**Epic 6: Reliability & Error Handling**
- FR6: Respect API rate limits with backoff
- FR8: Continue with cached data when API unavailable (full implementation)
- FR61: Configure filter preferences
- FR62: Configure Catch-Up Mode preferences
- FR63: Configure view preferences
- FR64: Configure polling interval
- FR65: Manage GitLab connection
- FR66: Preferences persist across sessions
- FR70: >95% polling success rate
- FR73: <3s manual refresh
- FR74: Prevent duplicate events
- FR75: Handle API pagination
- FR76: Maintain GitLab URL integrity
- FR77: Validate filters before saving
- FR84: Event capture scoped to selected projects (enforcement)
- FR85: Monitor GitLab groups
- FR86: Filter by project/group
- FR87: Clear contextual error messages
- FR88: Graceful API rate limit handling
- FR89: API sync status indicator
- FR90: Fallback UI when API unavailable

**Epic 7: Production Readiness & Polish**
- FR67: <500ms page loads (final validation)
- FR68: <1s search (final validation)
- FR71: Handle 4 weeks storage without degradation
- FR72: <200ms dashboard refresh
- FR91: System health indicators
- FR98: First-login flow polish
- FR99: Helpful empty states

---

**FR Coverage Validation:**
- ✅ All 99 FRs mapped across 7 epics (4 in Phase 1, 3 in Phase 2)
- ✅ No unmapped FRs
- ✅ Phase 1 (MVP) delivers complete user value without keyboard shortcuts
- ✅ Phase 2 layers keyboard shortcuts onto existing mouse UI (no refactoring)
- ✅ Performance requirements embedded in every epic (not deferred to polish phase)
- ✅ Catch-Up Mode delivered by week 3 (Epic 3)
- ✅ User value delivery starts in Epic 1 (walking skeleton week 1)
- ✅ Split view in Phase 1 MVP (Epic 4) - not tied to keyboard shortcuts

---

## Epic 1: Walking Skeleton - Story Breakdown

**Epic Goal:** Prove end-to-end technical stack works with minimal but complete user flow

**Timeline:** Week 1 (3-5 days) | **Value:** Working demo validates full stack

---

### Story 1.1: Initialize T3 Stack Project

**As a** developer
**I want** to initialize the project with T3 Stack
**So that** I have the foundational infrastructure ready

**Acceptance Criteria:**
- Given a new project directory
- When I run `npm create t3-app@latest gitlab-insights`
- Then project is created with Next.js, TypeScript, tRPC, Prisma, NextAuth, Tailwind
- And I can run `npm run dev` and see Next.js dev server running
- And tsconfig is configured for absolute imports (`@/` alias)
- And ESLint and Prettier are configured

**Technical Notes:**
- Command: `npm create t3-app@latest gitlab-insights -- --trpc --prisma --nextAuth --tailwind --typescript --dbProvider postgres`
- Upgrade to Tailwind v4 (required per architecture)
- Add olive accent color to Tailwind config (#5e6b24 light mode, #9DAA5F dark mode)
- Configure dark mode only for MVP

**Prerequisites:** None (first story)

**FR Mapping:** Infrastructure foundation

**Definition of Done:**
- ✅ Project runs locally on http://localhost:3000
- ✅ All TypeScript compilation passes
- ✅ Git repository initialized with `.gitignore`
- ✅ `.env.example` created with placeholder variables

---

### Story 1.2: Database Schema & Prisma Setup

**As a** developer
**I want** to define the database schema with Prisma
**So that** I can store events, users, and queries

**Acceptance Criteria:**
- Given the initialized T3 project
- When I define Prisma schema in `prisma/schema.prisma`
- Then schema includes tables: User, Account, Session (NextAuth), Event, UserQuery, MonitoredProject
- And Event table has fields: id, type, title, body, author, project, labels[], createdAt, updatedAt, gitlabUrl, gitlabEventId
- And UserQuery table has fields: id, userId, name, filters (JSON), lastViewedAt, createdAt
- And MonitoredProject table has fields: id, userId, gitlabProjectId, projectName
- And I can run `npx prisma migrate dev --name init` successfully
- And database is created locally (PostgreSQL)

**Technical Notes:**
- Install PostgreSQL locally (or use Docker container)
- Set `DATABASE_URL` in `.env`
- Use `cuid()` for user-facing IDs
- Add indexes: `@@index([userId, createdAt])` on Event, `@@index([userId])` on UserQuery
- Add GIN index for full-text search: `@@index([title, body])` with `gin` type

**Prerequisites:** Story 1.1

**FR Mapping:** FR2 (Store events), FR78-81 (User management foundation)

**Definition of Done:**
- ✅ Prisma migration runs successfully
- ✅ Database tables visible in Prisma Studio (`npx prisma studio`)
- ✅ Prisma Client generates TypeScript types
- ✅ No TypeScript errors in schema

---

### Story 1.3: GitLab OAuth Authentication

**As a** user
**I want** to log in with my GitLab account
**So that** I can access the application securely

**Acceptance Criteria:**
- Given I'm on the login page (`/`)
- When I click "Sign in with GitLab"
- Then I'm redirected to GitLab OAuth authorization page
- And after authorizing, I'm redirected back to `/onboarding`
- And my session is persisted in the database
- And I can see my GitLab username/avatar displayed

**Technical Notes:**
- Create GitLab OAuth application at gitlab.com/oauth/applications
- Set callback URL: `http://localhost:3000/api/auth/callback/gitlab`
- Configure NextAuth GitLab provider in `src/server/auth.ts`
- Environment variables: `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- Store GitLab access token in Account table (needed for API calls)

**Prerequisites:** Story 1.2

**FR Mapping:** FR78 (GitLab OAuth), FR80 (Session persistence)

**Definition of Done:**
- ✅ User can log in with GitLab OAuth
- ✅ Session persists across page refreshes
- ✅ User data (name, email, avatar) stored in database
- ✅ GitLab access token stored securely
- ✅ Logout works correctly

---

### Story 1.4: Project Selection Onboarding

**As a** first-time user
**I want** to select which GitLab projects to monitor
**So that** my feed shows only relevant events

**Acceptance Criteria:**
- Given I just logged in for the first time
- When I land on `/onboarding` page
- Then I see a checklist of my GitLab projects (fetched from GitLab API)
- And all projects are checked by default
- And I can uncheck projects I don't want to monitor
- And I can click "Continue" to save my selection
- Then my selected projects are saved to MonitoredProject table
- And I'm redirected to `/dashboard`

**Frontend:**
- `OnboardingPage.tsx` with project checklist
- Fetch user's projects via tRPC on page load
- Loading state while fetching projects
- "Select All" / "Deselect All" buttons

**Backend:**
- tRPC query: `gitlab.listUserProjects` - calls GitLab API `/api/v4/projects?membership=true`
- tRPC mutation: `projects.saveMonitored` - saves selected project IDs to database
- Use stored GitLab access token for API calls

**Prerequisites:** Story 1.3

**FR Mapping:** FR82 (Select projects on first login), FR83 (Add/remove projects)

**Definition of Done:**
- ✅ User can see their GitLab projects
- ✅ User can select/deselect projects
- ✅ Selected projects saved to database
- ✅ User redirected to dashboard after saving
- ✅ If user has no projects, show helpful empty state

---

### Story 1.5: GitLab API Client with Manual Refresh

**As a** user
**I want** to fetch GitLab events with a manual refresh button
**So that** I can see recent activity from my monitored projects

**Acceptance Criteria:**
- Given I'm logged in and have selected projects to monitor
- When I click the "Refresh" button on dashboard
- Then the system fetches recent issues, MRs, and comments from my monitored projects via GitLab API
- And events are stored in the Event table
- And duplicate events are prevented (upsert by gitlabEventId)
- And I see a loading indicator while fetching
- And after fetching completes, I see the events displayed in the table
- And I see "Last synced: just now" timestamp

**Frontend:**
- `RefreshButton.tsx` component with loading state
- Call tRPC mutation on click
- Show toast on success/error

**Backend:**
- tRPC mutation: `events.manualRefresh`
- Fetch from GitLab API:
  - `/api/v4/projects/{id}/issues` (recent 100)
  - `/api/v4/projects/{id}/merge_requests` (recent 100)
  - `/api/v4/projects/{id}/issues/{id}/notes` (comments)
- Parse GitLab responses and store in database
- Upsert pattern: `prisma.event.upsert({ where: { gitlabEventId } })`
- Return count of new/updated events

**Prerequisites:** Story 1.4

**FR Mapping:** FR1-3 (API polling basics), FR5 (Manual refresh)

**Definition of Done:**
- ✅ Manual refresh button works
- ✅ Events fetched from GitLab API
- ✅ Events stored in database without duplicates
- ✅ Loading state shows during fetch
- ✅ Success/error messages displayed
- ✅ Handles API errors gracefully

---

### Story 1.6: 2-Line Table View with Hardcoded Query

**As a** user
**I want** to see GitLab events in a 2-line dense table view
**So that** I can quickly scan recent activity

**Acceptance Criteria:**
- Given I'm on the dashboard after refreshing events
- When the page loads
- Then I see events filtered by hardcoded query: `label:security`
- And events are displayed in 3 sections: Issues, Merge Requests, Comments
- And each event shows as a 2-line row (52px height):
  - Line 1: [Badge] Title (truncated if >120 chars) [Author, Project, Time]
  - Line 2: First 80-100 chars of description
- And I can scroll through sections
- And clicking an event row opens it in GitLab (new tab)

**Frontend:**
- `DashboardPage.tsx` with sectioned layout
- `ItemRow.tsx` component (52px height, 2-line layout per UX spec)
- React Aria Table component for accessibility
- Badge colors: Issue (purple), MR (blue), Comment (gray)
- Click handler opens `event.gitlabUrl` in new tab

**Backend:**
- tRPC query: `events.getForDashboard`
- Hardcoded filter: `WHERE labels @> ARRAY['security']` (PostgreSQL array containment)
- Return events grouped by type: { issues: [], mergeRequests: [], comments: [] }
- Limit 50 per section

**Prerequisites:** Story 1.5

**FR Mapping:** FR27-28 (Dashboard sections), FR13 (Click through to GitLab)

**Definition of Done:**
- ✅ Dashboard shows 3 sections (Issues/MRs/Comments)
- ✅ Events display in 2-line rows (52px height)
- ✅ Hardcoded query filters to security-labeled items
- ✅ Clicking row opens GitLab in new tab
- ✅ 8-10 items visible without scrolling (per UX spec)
- ✅ Empty state if no events match filter

---

### Story 1.7: Basic App Layout with React Aria

**As a** developer
**I want** to establish the basic app layout with React Aria Components
**So that** I have a consistent, accessible foundation for UI

**Acceptance Criteria:**
- Given the app is running
- When I navigate to any page
- Then I see a consistent layout with:
  - Header: App logo, user avatar, logout button
  - Main content area
  - Footer (optional for MVP)
- And layout uses React Aria Components for accessibility
- And layout is responsive (desktop only, 1920px+)
- And dark mode styling is applied (olive accent #9DAA5F)

**Frontend:**
- `RootLayout.tsx` with persistent header
- `Header.tsx` component with user session display
- Install React Aria Components: `npm install react-aria-components`
- Configure Tailwind with custom olive accent colors
- Dark mode by default (no toggle in MVP)

**Technical Notes:**
- React Aria Components docs: https://react-spectrum.adobe.com/react-aria/
- Use React Aria Button for logout
- Use React Aria Menu for user dropdown (optional)
- Implement focus-visible styles (olive ring)

**Prerequisites:** Story 1.6

**FR Mapping:** FR58-59 (Keyboard accessibility foundation)

**Definition of Done:**
- ✅ Consistent layout across all pages
- ✅ React Aria Components library installed
- ✅ Header shows user info and logout
- ✅ Dark mode styling applied
- ✅ Olive accent color (#9DAA5F) used throughout
- ✅ Focus indicators visible on all interactive elements

---

**Epic 1 Summary:**
- **7 stories** delivering walking skeleton
- **Timeline:** 3-5 days (solo developer)
- **Demo-able:** Working GitLab feed with hardcoded security-label filter
- **Value:** Validates full stack (Next.js + tRPC + Prisma + GitLab API + React Aria)
- **Foundation:** Ready for Epic 2 (user-controlled queries)

---

## Epic 2: User-Controlled Queries with Keyboard Foundation - Story Breakdown

**Epic Goal:** Enable users to create personalized queries and establish keyboard-first identity

**Timeline:** Week 1-2 (5-10 days) | **Value:** Users can save and navigate custom queries with vim-style shortcuts

---

### Story 2.1: Keyboard Shortcut System Foundation

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

### Story 2.2: React Aria Table with vim-style Navigation

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

### Story 2.3: PostgreSQL Full-Text Search Backend

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

### Story 2.4: Search Bar UI

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

### Story 2.5: Keyword Highlighting in Search Results

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

### Story 2.6: Filter UI & Logic

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

### Story 2.7a: Create Query Backend

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

### Story 2.7b: Update/Delete Query Backend

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

### Story 2.8: Sidebar Navigation

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

### Story 2.8.5: "Save as Query" Entry Points

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

### Story 2.9: Create Query Modal

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

### Story 2.10: Edit/Delete Query Actions

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

## Epic 3: Catch-Up Mode & Background Sync - Story Breakdown

**Epic Goal:** Complete primary user workflow with "inbox zero" experience and automated sync

**Timeline:** Week 2-3 (4-5 days) | **Value:** Users see "what's new since last visit" with automated background updates

---

### Story 3.1: Catch-Up Mode Backend - "New Since Last Visit" Logic

**As a** user
**I want** the system to track when I last viewed each query
**So that** I can see only new items since my last visit

**Acceptance Criteria:**
- Given a user has saved queries
- When the system tracks `last_visited_at` timestamp per query
- Then I can query for events created after that timestamp
- And the query returns only events newer than `last_visited_at`
- And if I've never visited a query, it returns all matching events
- And timestamps are stored in UTC but displayed in user's local timezone

**Backend:**
- Path: `src/server/api/routers/queries.ts`
- Add `last_visited_at` field to UserQuery Prisma model
- tRPC query: `queries.getNewItems({ queryId: string })`
- Query logic: Get events matching query filters WHERE `created_at > last_visited_at`

**Database Migration:**
```sql
-- Migration: add_last_visited_at
ALTER TABLE "UserQuery"
ADD COLUMN "last_visited_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
```

**Technical Notes:**
```typescript
export const queriesRouter = createTRPCRouter({
  getNewItems: protectedProcedure
    .input(z.object({ queryId: z.string() }))
    .query(async ({ ctx, input }) => {
      const query = await ctx.db.userQuery.findUnique({
        where: { id: input.queryId },
      });

      if (!query || query.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const lastVisited = query.last_visited_at || new Date(0);

      // Apply query filters + "new since" filter
      const newEvents = await ctx.db.event.findMany({
        where: {
          AND: [
            buildFilterWhereClause(query.filters), // From Story 2.6
            { createdAt: { gt: lastVisited } }
          ]
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        queryId: query.id,
        queryName: query.name,
        newCount: newEvents.length,
        events: newEvents,
      };
    }),
});
```

**Prerequisites:** Story 2.7a (Query CRUD backend), Story 2.6 (Filter logic)

**FR Mapping:** FR44 (New items since last visit), FR46 (Show counts)

**Definition of Done:**
- ✅ `last_visited_at` field added to UserQuery model
- ✅ Migration runs successfully
- ✅ `getNewItems` query returns correct events
- ✅ Edge case: Never visited returns all items
- ✅ Edge case: Visited 1 second ago returns empty
- ✅ Timezone handling correct (UTC storage, local display)

---

### Story 3.2: Catch-Up Mode View with Toggle

**As a** user
**I want** to toggle between Dashboard and Catch-Up Mode
**So that** I can switch between "all events" and "new events only"

**Acceptance Criteria:**
- Given I'm on the dashboard
- When I press `c` key
- Then the view switches to Catch-Up Mode
- And I see a header: "Catch-Up: X new items since [last visit time]"
- And events are grouped by my saved queries
- And each query section shows: "[Query Name] (X new items)"
- And when I press `c` again
- Then I return to normal Dashboard view
- And if I have no saved queries, I see: "Create saved queries to use Catch-Up Mode"
- And if all queries have 0 new items, I see: "All caught up! No new items since last visit."

**Frontend:**
- Component: `src/components/catchup/CatchUpView.tsx`
- Component: `src/components/catchup/CatchUpModeToggle.tsx` (button in header)
- State: `isCatchUpMode` boolean toggle
- Keyboard shortcut `c` (add to Story 2.1's ShortcutHandler)
- Fetch new items for all queries via `trpc.queries.getNewItems`

**Technical Notes:**
```typescript
const CatchUpView = () => {
  const { data: queries } = trpc.queries.list.useQuery();

  // Fetch new items for each query
  const newItemsQueries = queries?.map(q =>
    trpc.queries.getNewItems.useQuery({ queryId: q.id })
  );

  const totalNew = newItemsQueries?.reduce(
    (sum, q) => sum + (q.data?.newCount || 0),
    0
  );

  if (queries?.length === 0) {
    return <EmptyState message="Create saved queries to use Catch-Up Mode" />;
  }

  if (totalNew === 0) {
    return <EmptyState message="All caught up! No new items since last visit." />;
  }

  return (
    <div>
      <h2>Catch-Up: {totalNew} new items since {lastVisit}</h2>
      {newItemsQueries?.map(queryResult => (
        <QuerySection
          key={queryResult.data?.queryId}
          query={queryResult.data}
        />
      ))}
    </div>
  );
};

// In ShortcutHandler (Story 2.1):
case 'c':
  if (!isTyping) {
    toggleCatchUpMode();
  }
  break;
```

Header toggle button:
- Icon: Bell with badge showing total new count
- Keyboard hint: "Press c to toggle"
- Active state: Olive accent when in Catch-Up Mode

**Prerequisites:** Story 3.1 (Backend logic), Story 2.8 (Sidebar with queries)

**FR Mapping:** FR44 (Catch-Up Mode display), FR45 (Group by queries), FR46 (Show counts)

**Definition of Done:**
- ✅ `c` key toggles between Dashboard and Catch-Up views
- ✅ Catch-Up Mode groups events by query
- ✅ Total new count displayed in header
- ✅ Empty state for no queries
- ✅ Empty state for 0 new items (all caught up)
- ✅ Toggle button visible in header
- ✅ View loads <500ms

---

### Story 3.3: Mark Query as Reviewed

**As a** user
**I want** to mark a query as reviewed
**So that** items I've seen are no longer shown as "new"

**Acceptance Criteria:**
- Given I'm in Catch-Up Mode viewing new items for a query
- When I click "Mark as Reviewed" button for that query
- Then `last_visited_at` is updated to current timestamp
- And the query's new item count updates to 0
- And the items disappear from the Catch-Up view
- And I see a toast: "[Query name] marked as reviewed"
- And the sidebar badge for that query updates to 0

**Frontend:**
- Component: `src/components/catchup/MarkAsReviewedButton.tsx`
- Button placement: Below each query section in Catch-Up view
- Call `trpc.queries.markAsReviewed.mutate()`
- Optimistic UI update (immediately hide items)

**Backend:**
- Path: `src/server/api/routers/queries.ts`
- tRPC mutation: `queries.markAsReviewed({ queryId: string })`
- Updates `last_visited_at` to NOW

**Technical Notes:**
```typescript
// Backend
markAsReviewed: protectedProcedure
  .input(z.object({ queryId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const query = await ctx.db.userQuery.findUnique({
      where: { id: input.queryId },
    });

    if (!query || query.userId !== ctx.session.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    return ctx.db.userQuery.update({
      where: { id: input.queryId },
      data: { last_visited_at: new Date() },
    });
  }),

// Frontend - Optimistic update
const markAsReviewed = trpc.queries.markAsReviewed.useMutation({
  onMutate: async ({ queryId }) => {
    // Cancel outgoing fetches
    await utils.queries.getNewItems.cancel();

    // Optimistically update to empty
    utils.queries.getNewItems.setData(
      { queryId },
      (old) => ({ ...old, newCount: 0, events: [] })
    );
  },
  onSuccess: () => {
    toast.success(`${queryName} marked as reviewed`);
  },
});
```

Button styling:
- Secondary style (not primary action)
- Shows checkmark icon
- Disabled state when no new items

**Prerequisites:** Story 3.2 (Catch-Up view), Story 3.1 (Backend)

**FR Mapping:** FR47 (Mark individual queries as reviewed)

**Definition of Done:**
- ✅ Button marks query as reviewed
- ✅ `last_visited_at` updated to NOW
- ✅ New count updates to 0 immediately (optimistic)
- ✅ Items removed from Catch-Up view
- ✅ Toast notification shows
- ✅ Sidebar badge updates
- ✅ Action completes <200ms

---

### Story 3.4: Sidebar New Item Badges

**As a** user
**I want** to see badge counts on sidebar queries
**So that** I know which queries have new items without entering Catch-Up Mode

**Acceptance Criteria:**
- Given I'm viewing any page with the sidebar visible
- When a query has new items
- Then I see a badge with the count next to the query name
- And the badge has olive background (#9DAA5F)
- And the badge updates when I mark a query as reviewed
- And queries with 0 new items show no badge

**Frontend:**
- Modify: `src/components/queries/QuerySidebar.tsx` (from Story 2.8)
- Fetch new counts for all queries
- Display badge component next to query name
- Update on mark-reviewed action

**Technical Notes:**
```typescript
const QuerySidebar = () => {
  const { data: queries } = trpc.queries.list.useQuery();

  return (
    <nav className="sidebar">
      {queries?.map((query, index) => (
        <Link
          key={query.id}
          href={`/queries/${query.id}`}
          className="query-item"
        >
          <span className="query-name">{query.name}</span>
          <span className="shortcut-hint">{index + 1}</span>
          <NewItemsBadge queryId={query.id} />
        </Link>
      ))}
    </nav>
  );
};

const NewItemsBadge = ({ queryId }: { queryId: string }) => {
  const { data } = trpc.queries.getNewItems.useQuery({ queryId });

  if (!data || data.newCount === 0) return null;

  return (
    <span className="badge bg-olive-500 text-white px-2 py-0.5 rounded-full text-xs">
      {data.newCount}
    </span>
  );
};
```

Badge styling:
- Background: #9DAA5F (olive)
- Text: White
- Border radius: Full (pill shape)
- Font size: 11px
- Positioned right side of query name

**Prerequisites:** Story 3.1 (New items backend), Story 2.8 (Sidebar)

**FR Mapping:** FR51 (Sidebar badges show new counts), FR49 (Badge shows total new count)

**Definition of Done:**
- ✅ Badges visible on sidebar queries
- ✅ Correct new count displayed
- ✅ Badge hidden when count is 0
- ✅ Olive background color used
- ✅ Updates in real-time after mark-reviewed
- ✅ Accessible (screen reader announces count)

---

### Story 3.5: Inngest Background Polling Job

**As a** developer
**I want** a scheduled background job that polls GitLab API
**So that** events are automatically fetched every 5-15 minutes

**Acceptance Criteria:**
- Given the Inngest background job is deployed
- When the scheduled time arrives (every 10 minutes by default)
- Then the job fetches new events from GitLab API for all monitored projects
- And events are stored in the database (upsert pattern)
- And the job completes in <10 seconds for typical project sizes
- And the job logs success/failure to Inngest dashboard
- And if the job fails, it retries with exponential backoff (up to 3 times)

**Backend:**
- Path: `src/inngest/api-polling.ts`
- Path: `src/app/api/inngest/route.ts` (webhook endpoint)
- Install Inngest SDK: `npm install inngest`
- Create scheduled function with cron trigger
- Reuse GitLab API client from Story 1.5

**Technical Notes:**
```typescript
// src/inngest/client.ts
import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'gitlab-insights',
  name: 'GitLab Insights'
});

// src/inngest/api-polling.ts
import { inngest } from './client';
import { fetchAndStoreEvents } from '@/lib/gitlab/api-client';

export const apiPollingJob = inngest.createFunction(
  {
    id: "gitlab-api-polling",
    name: "GitLab API Polling",
    retries: 3,
  },
  { cron: "*/10 * * * *" }, // Every 10 minutes
  async ({ event, step }) => {
    console.log('Starting GitLab API polling...');

    // Get all users and their monitored projects
    const users = await step.run('fetch-users', async () => {
      return prisma.user.findMany({
        include: { monitoredProjects: true }
      });
    });

    // Fetch events for each user's projects
    for (const user of users) {
      await step.run(`fetch-events-user-${user.id}`, async () => {
        // Reuse logic from Story 1.5
        return fetchAndStoreEvents(user.id, user.monitoredProjects);
      });
    }

    return { success: true, usersProcessed: users.length };
  }
);

// src/app/api/inngest/route.ts
import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { apiPollingJob } from '@/inngest/api-polling';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [apiPollingJob],
});
```

**Environment Variables:**
```
INNGEST_EVENT_KEY=your_event_key
INNGEST_SIGNING_KEY=your_signing_key
```

**Deployment:**
- Deploy to Inngest Cloud (free tier)
- Register function via Inngest dashboard
- Monitor execution via Inngest dashboard

**Prerequisites:** Story 1.5 (GitLab API client), Story 1.2 (Database schema)

**FR Mapping:** FR4 (Schedule background polling), FR70 (>95% success rate)

**Definition of Done:**
- ✅ Inngest SDK installed and configured
- ✅ Scheduled job runs every 10 minutes
- ✅ Events fetched and stored successfully
- ✅ Job completes <10s for typical workload
- ✅ Retry logic works (3 attempts with backoff)
- ✅ Success/failure logged to Inngest dashboard
- ✅ Monitored for 24 hours, >95% success rate

---

### Story 3.6: Last Sync Indicator

**As a** user
**I want** to see when data was last refreshed
**So that** I know if I'm viewing current information

**Acceptance Criteria:**
- Given I'm on any page
- When I look at the header
- Then I see "Last synced: X minutes ago"
- And the timestamp updates after background polling completes
- And the timestamp shows relative time (e.g., "2 minutes ago", "1 hour ago")
- And if sync is currently running, I see "Syncing..." with spinner
- And if last sync failed, I see "Sync failed - trying again" with retry time

**Frontend:**
- Component: `src/components/sync/SyncIndicator.tsx`
- Placement: Header, right side (near user avatar)
- Use `date-fns` `formatDistance` for relative time
- Poll for updates every 30 seconds
- Subscribe to sync completion events

**Backend:**
- Add `last_synced_at` timestamp to global app state
- Update after Inngest job completes
- Expose via tRPC query: `sync.getStatus()`

**Technical Notes:**
```typescript
const SyncIndicator = () => {
  const { data: syncStatus } = trpc.sync.getStatus.useQuery(
    undefined,
    { refetchInterval: 30000 } // Poll every 30s
  );

  if (!syncStatus) return null;

  const { lastSyncedAt, status, nextSyncAt } = syncStatus;

  if (status === 'syncing') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Spinner size="sm" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 text-sm text-red-400">
        <AlertIcon />
        <span>Sync failed - retrying in {formatDistance(nextSyncAt, new Date())}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <CheckIcon className="text-olive-500" />
      <span>Last synced: {formatDistanceToNow(lastSyncedAt, { addSuffix: true })}</span>
    </div>
  );
};
```

**Prerequisites:** Story 3.5 (Background polling job)

**FR Mapping:** FR7 (Display last sync timestamp), FR34 (Last sync time)

**Definition of Done:**
- ✅ Sync indicator visible in header
- ✅ Shows relative time ("2 minutes ago")
- ✅ Updates every 30 seconds
- ✅ Shows "Syncing..." during active sync
- ✅ Shows error state if sync fails
- ✅ Timestamp accurate (within 1 minute)

---

### Story 3.7: Manual Refresh Button with `r` Shortcut

**As a** user
**I want** to manually trigger a refresh
**So that** I can get the latest data immediately without waiting for scheduled sync

**Acceptance Criteria:**
- Given I'm on the dashboard
- When I press `r` key OR click the refresh button
- Then a manual sync is triggered immediately
- And I see a loading indicator during the refresh
- And after completion (<3 seconds), I see a toast: "Refreshed! X new items found"
- And the last sync indicator updates to "just now"
- And the dashboard updates with new events

**Frontend:**
- Component: `src/components/sync/RefreshButton.tsx` (enhance from Story 1.5)
- Keyboard shortcut `r` (add to Story 2.1's ShortcutHandler)
- Loading state during refresh
- Toast notification on completion

**Backend:**
- tRPC mutation: `sync.triggerManualRefresh()`
- Calls Inngest API to trigger immediate job execution
- Returns count of new events found

**Technical Notes:**
```typescript
const RefreshButton = () => {
  const utils = trpc.useUtils();
  const { mutate: refresh, isLoading } = trpc.sync.triggerManualRefresh.useMutation({
    onSuccess: (data) => {
      toast.success(`Refreshed! ${data.newItemsCount} new items found`);
      // Invalidate queries to refetch
      utils.events.invalidate();
      utils.queries.getNewItems.invalidate();
    },
    onError: () => {
      toast.error('Refresh failed. Please try again.');
    },
  });

  return (
    <Button
      onPress={() => refresh()}
      isDisabled={isLoading}
      className="flex items-center gap-2"
    >
      {isLoading ? <Spinner /> : <RefreshIcon />}
      <span>Refresh (r)</span>
    </Button>
  );
};

// In ShortcutHandler (Story 2.1):
case 'r':
  if (!isTyping) {
    triggerManualRefresh();
  }
  break;

// Backend - trigger Inngest job immediately
triggerManualRefresh: protectedProcedure
  .mutation(async ({ ctx }) => {
    // Send event to Inngest to trigger immediate execution
    await inngest.send({
      name: 'gitlab/manual-refresh',
      data: { userId: ctx.session.user.id }
    });

    // Or call the polling logic directly for immediate response
    const result = await fetchAndStoreEvents(
      ctx.session.user.id,
      userMonitoredProjects
    );

    return {
      success: true,
      newItemsCount: result.newEvents,
    };
  }),
```

Button placement:
- Header, next to sync indicator
- Icon: Refresh/reload circular arrow
- Keyboard hint visible on hover

**Prerequisites:** Story 3.5 (Background polling), Story 2.1 (Keyboard shortcuts)

**FR Mapping:** FR5 (Manual refresh), FR60 (`r` shortcut), FR73 (<3s manual refresh)

**Definition of Done:**
- ✅ `r` key triggers manual refresh
- ✅ Button triggers manual refresh
- ✅ Loading state visible during refresh
- ✅ Refresh completes <3 seconds
- ✅ Toast shows new item count
- ✅ Dashboard updates with new events
- ✅ Last sync indicator updates to "just now"
- ✅ Error handling if refresh fails

---

**Epic 3 Summary:**
- **7 stories** delivering Catch-Up Mode and background automation
- **Timeline:** 4-5 days (solo developer, some parallel work)
- **Demo-able:** "Inbox zero" workflow - users see what's new, mark as reviewed, automated updates
- **Value:** Primary user workflow complete - automated monitoring with catch-up

**Epic 3 Definition of Done:**
✅ All 7 stories complete
✅ End-to-end Catch-Up workflow test passes (manual refresh → Catch-Up → mark reviewed → verify)
✅ Background job monitored for 24 hours, >95% success rate
✅ Performance: <500ms Catch-Up view load, <200ms mark-reviewed action
✅ Keyboard shortcuts: `c` toggle Catch-Up Mode, `r` manual refresh
✅ No race conditions between mark-reviewed and background polling
✅ Empty states work: "No queries", "All caught up"
✅ Sync indicator accurate (within 1 minute)
✅ No regression: Epic 1-2 functionality still works

---

## Epic 4: Split View & Detail Navigation

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

### Story 4.1: Split Pane Component with Toggle Button

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

### Story 4.2: Detail Pane Content Rendering

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

### Story 4.3: Auto-Update Detail on Row Click

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

### Story 4.4: Keyword Highlighting in Detail View

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

### Story 4.5: Section Navigation with Clickable Headers

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

### Story 4.6: Query Metadata Page

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

### Story 4.7: Scroll Position Persistence

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
