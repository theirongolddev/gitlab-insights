# Epic 1: Walking Skeleton - Story Breakdown

**Epic Goal:** Prove end-to-end technical stack works with minimal but complete user flow

**Timeline:** Week 1 (3-5 days) | **Value:** Working demo validates full stack

---

## Story 1.1: Initialize T3 Stack Project

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

## Story 1.2: Database Schema & Prisma Setup

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

## Story 1.3: GitLab OAuth Authentication

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

## Story 1.4: Project Selection Onboarding

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

## Story 1.5: GitLab API Client with Manual Refresh

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

## Story 1.6: 2-Line Table View with Hardcoded Query

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

## Story 1.7: Basic App Layout with React Aria

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
