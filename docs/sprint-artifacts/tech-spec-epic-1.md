# Epic Technical Specification: Walking Skeleton

Date: 2025-11-21
Author: BMad
Epic ID: 1
Status: Draft

---

## Overview

The Walking Skeleton epic establishes the foundational end-to-end technical stack for the GitLab Insights application. This epic delivers a minimal but complete user flow that validates the core technical hypothesis: users can authenticate with GitLab OAuth, select projects to monitor, and view filtered GitLab events (issues, merge requests, comments) in a clean, dense dashboard interface. The hardcoded query (`label:security`) proves the filtering concept while deferring user-controlled queries to Epic 2.

This epic directly supports the product's core value proposition from the PRD: reducing context-switching overhead by surfacing actionable GitLab events in a unified, keyboard-friendly interface. The walking skeleton validates all critical technology choices (T3 Stack with Next.js 15, tRPC, Prisma, NextAuth, React Aria) and establishes patterns for API polling, event storage, and UI rendering that subsequent epics will extend.

## Objectives and Scope

### In Scope
- **Authentication & Onboarding**: GitLab OAuth integration (FR78), first-time project selection (FR82-83)
- **API Integration**: GitLab API client with manual refresh capability (FR1-3, FR5), rate limit handling, duplicate event prevention
- **Data Storage**: PostgreSQL database with Prisma ORM, schema for users, sessions, events, queries, and monitored projects
- **Dashboard UI**: 2-line dense table view (52px rows) showing Issues/MRs/Comments sections (FR27-28), click-through to GitLab (FR13)
- **Hardcoded Filter**: `label:security` filter demonstrates event filtering without building full query system
- **Basic Layout**: React Aria Components foundation, dark mode with olive accent (#9DAA5F), accessibility basics
- **Manual Sync**: Refresh button with "Last synced" indicator, loading states

### Out of Scope (Deferred to Later Epics)
- User-controlled queries and filters (Epic 2)
- Background polling with Inngest (Epic 3 - manual refresh only for MVP)
- Catch-Up Mode and "new since last visit" logic (Epic 3)
- Split pane detail view (Epic 4)
- Keyboard shortcuts beyond basic navigation (Epic 5)
- Full-text search (Epic 2)
- Advanced error handling and monitoring (Epic 6)
- Production deployment and polish (Epic 7)

### Success Criteria
- User can authenticate with GitLab OAuth in <3s
- Manual refresh fetches and displays events in <3s
- Dashboard loads in <500ms (hard requirement per PRD)
- 8-10 events visible without scrolling (52px rows × 8-10 = 416-520px viewport)
- All interactive elements keyboard accessible (Tab navigation, Enter to activate)
- Zero TypeScript compilation errors

## System Architecture Alignment

### Tech Stack (T3 Stack)
This epic initializes the complete T3 Stack as specified in the architecture document:
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5.x
- **API Layer**: tRPC 11.x for type-safe client-server communication
- **Database**: PostgreSQL with Prisma 5.x ORM
- **Authentication**: NextAuth.js 4.24.x with GitLab OAuth provider
- **Styling**: Tailwind CSS v4 with olive accent colors (#9DAA5F dark, #5e6b24 light)
- **Component Library**: React Aria Components 3.x for accessible primitives

### Architecture Constraints
- **No Backend Separate Service**: All server logic runs in Next.js API routes and tRPC procedures (collocated monolith pattern)
- **User-Scoped Data**: All database queries filter by `userId` to prevent data leakage and enable horizontal scaling
- **Stateless API**: No session state in memory; all session data stored in PostgreSQL via NextAuth
- **OAuth Only**: No local password authentication; GitLab OAuth required (security constraint NFR-S1)

### Component Interactions (Walking Skeleton)
```
[Browser]
  ↓ Next.js Pages (App Router)
  ↓ tRPC Client (type-safe queries/mutations)
  ↓ tRPC Server Procedures (src/server/api/routers/)
  ↓ Prisma Client (database access layer)
  ↓ PostgreSQL (event + user data storage)

[Browser] → [NextAuth] → [GitLab OAuth] → [Session Storage (DB)]
[tRPC mutation: manualRefresh] → [GitLab API Client] → [GitLab REST API v4]
```

### Alignment with Architecture Decisions
- **AD-1**: T3 Stack for rapid iteration ✓
- **AD-2**: PostgreSQL with GIN indexes for future full-text search (schema includes indexes) ✓
- **AD-3**: React Aria for accessibility-first UI ✓
- **AD-5**: Tailwind v4 with custom olive accent ✓
- **AD-7**: GitLab OAuth (no local passwords) ✓
- **AD-9**: Manual refresh only (defers Inngest to Epic 3) ✓

## Detailed Design

### Services and Modules

| Module | Responsibility | Key Inputs | Key Outputs | Owner |
|--------|---------------|------------|-------------|-------|
| **Authentication Service** (`src/server/auth.ts`) | Manage GitLab OAuth, session lifecycle | GitLab OAuth credentials, user profile | Authenticated session, user record | NextAuth.js |
| **GitLab API Client** (`src/lib/gitlab/api-client.ts`) | Fetch events from GitLab REST API v4 | GitLab access token, project IDs, event types | Raw GitLab events (issues/MRs/comments) | Custom module |
| **Event Sync Service** (`src/server/api/routers/events.ts`) | Poll GitLab, transform, store events | User's monitored projects, last sync timestamp | Stored events count, sync status | tRPC router |
| **Dashboard Query Service** (`src/server/api/routers/dashboard.ts`) | Fetch filtered events for display | User ID, filter criteria (hardcoded: `label:security`) | Sectioned events (issues/MRs/comments) | tRPC router |
| **Project Management** (`src/server/api/routers/projects.ts`) | List GitLab projects, save user selections | GitLab API token, user selections | Monitored project records | tRPC router |
| **UI Components** (`src/components/`) | Render dashboard, layout, interactive elements | Event data, user session | React component tree | React Aria + custom |

### Data Models and Contracts

**Database Schema (Prisma):**

```prisma
// NextAuth required models
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  events        Event[]
  queries       UserQuery[]
  projects      MonitoredProject[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String  // "gitlab"
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text // GitLab API token
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// Application models
model Event {
  id            String   @id @default(cuid())
  userId        String
  type          String   // "issue" | "merge_request" | "comment"
  title         String
  body          String?  @db.Text
  author        String
  authorAvatar  String?
  project       String
  projectId     String
  labels        String[] // PostgreSQL array
  gitlabEventId String   @unique // Prevents duplicates
  gitlabUrl     String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)]) // Optimizes dashboard queries
  @@index([gitlabEventId]) // Fast duplicate checking
}

model UserQuery {
  id           String   @id @default(cuid())
  userId       String
  name         String   // Query display name
  filters      Json     // JSON object with filter criteria
  lastViewedAt DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model MonitoredProject {
  id              String   @id @default(cuid())
  userId          String
  gitlabProjectId String
  projectName     String
  projectPath     String
  createdAt       DateTime @default(now())
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, gitlabProjectId]) // Prevent duplicate monitoring
  @@index([userId])
}
```

**Key Contracts:**

```typescript
// GitLab API Response Types
interface GitLabIssue {
  id: number;
  iid: number;
  title: string;
  description: string;
  author: { name: string; avatar_url: string };
  project_id: number;
  labels: string[];
  web_url: string;
  created_at: string;
  updated_at: string;
}

interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  description: string;
  author: { name: string; avatar_url: string };
  project_id: number;
  labels: string[];
  web_url: string;
  created_at: string;
  updated_at: string;
}

// Internal Event Model
interface DashboardEvent {
  id: string;
  type: 'issue' | 'merge_request' | 'comment';
  title: string;
  snippet: string; // First 80-100 chars of body
  author: string;
  authorAvatar: string;
  project: string;
  timeAgo: string; // "5m ago", "2h ago"
  gitlabUrl: string;
  labels: string[];
}

// Dashboard API Response
interface DashboardData {
  issues: DashboardEvent[];
  mergeRequests: DashboardEvent[];
  comments: DashboardEvent[];
  lastSync: string | null; // ISO timestamp
}
```

### APIs and Interfaces

**tRPC Procedures (Type-Safe API Endpoints):**

```typescript
// src/server/api/routers/auth.ts
export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(({ ctx }) => ctx.session),
});

// src/server/api/routers/projects.ts
export const projectsRouter = createTRPCRouter({
  // List user's GitLab projects
  listUserProjects: protectedProcedure.query(async ({ ctx }) => {
    // GET /api/v4/projects?membership=true&per_page=100
    // Returns: { id, name, path_with_namespace }[]
  }),

  // Save monitored project selections
  saveMonitored: protectedProcedure
    .input(z.object({ projectIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      // Upsert MonitoredProject records
      // Returns: { count: number }
    }),
});

// src/server/api/routers/events.ts
export const eventsRouter = createTRPCRouter({
  // Manual refresh: fetch new events from GitLab
  manualRefresh: protectedProcedure.mutation(async ({ ctx }) => {
    // 1. Get user's monitored projects
    // 2. For each project, fetch issues/MRs/comments from GitLab API
    // 3. Transform and upsert events to database
    // 4. Return: { newEvents: number, updatedEvents: number }
  }),

  // Get dashboard data (sectioned events)
  getForDashboard: protectedProcedure.query(async ({ ctx }) => {
    // WHERE userId = ? AND labels @> ARRAY['security']
    // GROUP BY type, ORDER BY createdAt DESC
    // LIMIT 50 per section
    // Returns: DashboardData
  }),
});
```

**GitLab API Client:**

```typescript
// src/lib/gitlab/api-client.ts
export class GitLabClient {
  constructor(private accessToken: string) {}

  async getProjects(): Promise<GitLabProject[]> {
    // GET https://gitlab.com/api/v4/projects?membership=true
  }

  async getIssues(projectId: string, since?: Date): Promise<GitLabIssue[]> {
    // GET https://gitlab.com/api/v4/projects/{id}/issues?updated_after={since}
  }

  async getMergeRequests(projectId: string, since?: Date): Promise<GitLabMergeRequest[]> {
    // GET https://gitlab.com/api/v4/projects/{id}/merge_requests?updated_after={since}
  }

  async getIssueComments(projectId: string, issueIid: number): Promise<GitLabComment[]> {
    // GET https://gitlab.com/api/v4/projects/{id}/issues/{iid}/notes
  }

  // Rate limit handling: exponential backoff on 429 responses
  // Error handling: retry on 5xx, throw on 4xx (except 429)
}
```

### Workflows and Sequencing

**User Authentication Flow:**
```
1. User visits "/" (landing page)
2. Clicks "Sign in with GitLab" button
3. NextAuth redirects to GitLab OAuth (gitlab.com/oauth/authorize)
4. User authorizes application on GitLab
5. GitLab redirects back to /api/auth/callback/gitlab
6. NextAuth exchanges code for access token
7. NextAuth creates User + Account records in database
8. NextAuth creates Session record
9. User redirected to "/onboarding"
```

**Project Selection Onboarding Flow:**
```
1. User lands on "/onboarding" (first-time only)
2. tRPC query: projects.listUserProjects
   → GitLabClient.getProjects() using stored access token
   → GitLab API: GET /api/v4/projects?membership=true
3. Frontend displays checklist (all checked by default)
4. User unchecks unwanted projects
5. User clicks "Continue"
6. tRPC mutation: projects.saveMonitored({ projectIds: [...] })
   → Creates MonitoredProject records
7. User redirected to "/dashboard"
```

**Manual Refresh Flow:**
```
1. User on "/dashboard" clicks "Refresh" button
2. Frontend shows "Syncing..." state
3. tRPC mutation: events.manualRefresh
   a. Query database for user's MonitoredProject records
   b. For each project:
      - GitLabClient.getIssues(projectId)
      - GitLabClient.getMergeRequests(projectId)
      - GitLabClient.getIssueComments(projectId, issueIid) for recent issues
   c. Transform GitLab responses to Event model
   d. Upsert to database (prevents duplicates via gitlabEventId)
   e. Track counts: newEvents, updatedEvents
4. Mutation returns { newEvents, updatedEvents }
5. Frontend refetches dashboard data (tRPC invalidates query)
6. Frontend shows "Last synced: just now"
7. Toast notification: "✓ Synced 15 new events"
```

**Dashboard Render Flow:**
```
1. User navigates to "/dashboard"
2. tRPC query: events.getForDashboard (runs on server)
   → SQL: SELECT * FROM Event
      WHERE userId = ? AND labels @> ARRAY['security']
      ORDER BY createdAt DESC
   → Group by type, limit 50 per section
3. Server returns DashboardData { issues, mergeRequests, comments, lastSync }
4. Frontend renders 3 sections with ItemRow components
5. User clicks row → window.open(event.gitlabUrl, '_blank')
```

## Non-Functional Requirements

### Performance

**Hard Requirements (Must Meet for MVP):**
- **Page Load Time**: <500ms for dashboard initial render (P95)
  - Measured from navigation start to first contentful paint
  - Critical for "attention efficiency" value proposition per PRD
  - Mitigation: Static generation where possible, optimized bundle size (<300KB JS gzipped)

- **Manual Refresh Latency**: <3 seconds from button click to UI update (P95)
  - Includes GitLab API round-trip, database writes, and re-render
  - User expectation: Near-instant feedback for manual actions
  - Mitigation: Optimistic UI updates, parallel API calls per project

- **Dashboard Query Response**: <200ms for filtered event retrieval (P95)
  - SQL query with user scoping and label filtering
  - Enables smooth navigation and filter changes in future epics
  - Mitigation: Database indexes on `(userId, createdAt)` and `gitlabEventId`

**Performance Budgets:**
- JavaScript bundle: <300KB gzipped (initial load)
- CSS bundle: <50KB gzipped
- Time to Interactive (TTI): <1s on 4G connection
- Database query count per page: <10 queries (use tRPC batching)

**Monitoring Targets:**
- Track P50, P95, P99 for all tRPC procedures
- Alert if dashboard load exceeds 500ms for >5% of requests
- Log slow queries (>100ms) for optimization

### Security

**Authentication & Authorization (NFR-S1, NFR-S2, NFR-S7):**
- **OAuth Only**: No local password storage; GitLab OAuth required for all users
- **Supported GitLab Instances**:
  - Single instance configured via environment variable (Epic 1: self-hosted only)
  - Multi-instance support deferred to future epic
  - Instance URL: `GITLAB_INSTANCE_URL` (e.g., `https://gitlab.company.com`)

- **Required OAuth Scopes**:
  - `read_api` - Read access to projects, issues, MRs, comments
  - `read_user` - User profile information
  - Scope validation on login; reject insufficient permissions with clear error message
  - User guidance: Link to documentation on creating user-level OAuth app

- **OAuth Application Setup** (Developer/User Level):
  - Created at: `{GITLAB_INSTANCE_URL}/-/profile/applications` (no admin required)
  - Redirect URI: `{APP_URL}/api/auth/callback/gitlab`
  - Environment variables: `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`, `GITLAB_INSTANCE_URL`

- **Session Management**:
  - Session tokens encrypted at rest in PostgreSQL
  - 24-hour expiration with automatic renewal on activity
  - Sessions persist even if GitLab OAuth temporarily unavailable (users can view cached data)
  - Secure, HttpOnly, SameSite=Lax cookies

- **OAuth Availability Handling**:
  - If GitLab OAuth unreachable during login: Display error, allow retry
  - If GitLab OAuth unreachable for existing session: Session remains valid, manual refresh disabled
  - Banner message: "GitLab connection unavailable. Showing cached events (synced 15m ago)"

- **Permission Validation**:
  - Validate API scopes on first login (check token has `read_api` and `read_user`)
  - Handle 403 Forbidden from GitLab API gracefully (prompt re-authentication)
  - Handle 401 Unauthorized (expired/revoked token): Prompt user to re-login
  - Empty project list: Show helpful message about permission requirements

- **HTTPS Enforcement**: All external communication over TLS 1.3+
  - Development: localhost exception only
  - Production: Automatic redirect HTTP → HTTPS

**API Token Security (NFR-S6):**
- GitLab access tokens stored in `Account.access_token` (encrypted at rest)
- Never exposed to client-side JavaScript
- Tokens rotated on OAuth re-authentication
- Environment variables for OAuth credentials (`GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`)

**Input Validation (NFR-S8):**
- All tRPC inputs validated with Zod schemas
- Search queries: Keyword-only (no SQL injection vectors)
- Query names: Max 256 characters, alphanumeric + spaces only
- Project IDs: UUID format validation

**CSRF Protection (NFR-S11):**
- NextAuth CSRF tokens on all state-changing operations
- Double-submit cookie pattern for mutations
- tRPC middleware validates tokens on `protectedProcedure`

**Data Isolation:**
- All database queries scoped by `userId` (prevents cross-user data access)
- Row-level security enforced at application layer
- No shared query results between users

### Reliability/Availability

**API Polling Reliability (FR70, FR88, FR90):**
- **Target Success Rate**: >95% for manual refresh operations
  - Measured as successful completion / total attempts
  - Excludes user-initiated cancellations

- **Rate Limit Handling**:
  - Exponential backoff on GitLab API 429 responses
  - Initial retry: 2s, then 4s, 8s, 16s (max 5 retries)
  - User-visible status: "Syncing (retrying in 4s)..."

- **Graceful Degradation**:
  - If GitLab API unavailable (5xx errors), display last successful sync data
  - Error message: "GitLab temporarily unavailable. Showing cached events (synced 15m ago)"
  - Automatic retry every 5 minutes in background (Epic 3)

**Database Availability:**
- PostgreSQL connection pooling (max 10 connections for MVP)
- Automatic reconnection on connection loss
- Transaction rollback on failure (prevents partial data)

**Error Recovery:**
- Upsert pattern prevents duplicate events on retry
- Idempotent API operations (safe to retry)
- User session persists across server restarts (DB-backed sessions)

### Observability

**Application Logging:**
- **Structured JSON logs** with levels: `info`, `warn`, `error`
- **Log Format**: `{ timestamp, level, message, userId, context: { operation, duration, error } }`
- **Key Events to Log**:
  - User authentication (success/failure)
  - Manual refresh operations (start, success, error)
  - GitLab API calls (endpoint, status, latency)
  - Database errors (query, error message)

**Error Tracking (Sentry Integration):**
- Automatic error reporting for uncaught exceptions
- Stack traces with source maps
- Breadcrumbs: User actions leading to error
- Context: userId, operation, request details
- Alert on error rate >1% of requests

**Metrics Collection:**
- **API Polling Success Rate**: Track in database
  - Table: `SyncHistory { userId, timestamp, status, eventCount, errorMessage }`
  - Dashboard query: Success rate over last 7 days

- **Manual Refresh Status Indicator**:
  - "Last synced: 5m ago" (updates every minute)
  - Color coding: Green (<10m), Yellow (10-30m), Red (>30m or error)
  - Tooltip shows last sync result: "✓ Synced 15 events" or "⚠ Partial sync (API rate limited)"

**Health Check Endpoint:**
- **Route**: `GET /api/health`
- **Response**: `{ status: "ok" | "degraded", database: "connected", lastPollSuccess: ISO timestamp }`
- Use for uptime monitoring and deployment validation

## Dependencies and Integrations

### T3 Stack Framework

**Initialization**: `npm create t3-app@latest` (Story 1.1)
- Handles all dependency versions automatically
- Includes: Next.js, TypeScript, tRPC, Prisma, NextAuth, Tailwind CSS
- Pre-configured with best practices and type safety

**Additional Dependencies to Install:**
- `react-aria-components` - Accessible UI primitives
- `date-fns` - Date formatting utilities (for "5m ago" timestamps)

**Post-Install Configuration:**
- Upgrade Tailwind to v4 (per architecture requirement)
- Add olive accent color to Tailwind config (#5e6b24 light, #9DAA5F dark)

### External Service Integrations

#### GitLab API (Primary Integration)

**Service**: GitLab REST API v4
**Documentation**: https://docs.gitlab.com/ee/api/api_resources.html
**Instance URL**: Configured via `GITLAB_INSTANCE_URL` environment variable
**Authentication**: OAuth 2.0 access token (stored in `Account.access_token`)

**Endpoints Used in Epic 1:**

| Endpoint | Method | Purpose | Rate Limit | Story |
|----------|--------|---------|------------|-------|
| `/api/v4/user` | GET | Validate OAuth token, get user profile | 300/min | 1.3 |
| `/api/v4/projects` | GET | List user's projects (`?membership=true`) | 300/min | 1.4 |
| `/api/v4/projects/{id}/issues` | GET | Fetch project issues | 300/min | 1.5 |
| `/api/v4/projects/{id}/merge_requests` | GET | Fetch project MRs | 300/min | 1.5 |
| `/api/v4/projects/{id}/issues/{iid}/notes` | GET | Fetch issue comments | 300/min | 1.5 |

**Rate Limiting:**
- Default: 300 requests per minute per user (self-hosted instances may vary)
- Headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Mitigation: Exponential backoff on 429 responses (2s, 4s, 8s, 16s)

**Error Handling:**
- `401 Unauthorized`: Token expired/revoked → Prompt re-authentication
- `403 Forbidden`: Insufficient permissions → Display permission error
- `404 Not Found`: Project/issue doesn't exist → Skip silently
- `429 Too Many Requests`: Rate limited → Exponential backoff
- `5xx Server Error`: GitLab unavailable → Display cached data, retry

**API Client Configuration:**
```typescript
// src/lib/gitlab/api-client.ts
const GITLAB_API_TIMEOUT = 5000; // 5s max per request
const GITLAB_API_RETRY_LIMIT = 3; // Max retries on 5xx
const GITLAB_API_BATCH_SIZE = 100; // Max items per request
```

#### PostgreSQL Database

**Service**: PostgreSQL (latest)
**Connection**: Via Prisma ORM
**Connection String**: `DATABASE_URL` environment variable
**Connection Pooling**: Max 10 connections (sufficient for 3-10 concurrent users)

**Local Development Setup (Docker Compose):**
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:18-alpine
    container_name: gitlab-insights-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: gitlab_insights
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

**Usage:**
- Start: `docker compose up -d`
- Stop: `docker compose down`
- Reset: `docker compose down -v` (deletes data volume)

**Schema Version**: Managed by Prisma Migrations
**Migration Strategy**:
- Development: `prisma migrate dev`
- Production: `prisma migrate deploy` (no prompts, idempotent)

**Backup Strategy** (Deferred to Epic 7):
- Point-in-time recovery
- Daily backups retained 7 days

#### NextAuth Session Store

**Service**: Database adapter (PostgreSQL)
**Session Strategy**: Database sessions (not JWT for Epic 1)
**Session Table**: `Session` model in Prisma schema
**Session Duration**: 24 hours with automatic renewal

### Environment Variables (Required)

**Epic 1 Configuration:**

```bash
# Database (matches docker-compose.yml)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gitlab_insights"

# NextAuth
NEXTAUTH_SECRET="<random-32-char-string>"
NEXTAUTH_URL="http://localhost:3000"

# GitLab OAuth (Create at: {GITLAB_INSTANCE_URL}/-/profile/applications)
GITLAB_INSTANCE_URL="https://gitlab.company.com"  # Your self-hosted instance
GITLAB_CLIENT_ID="<your-oauth-app-id>"
GITLAB_CLIENT_SECRET="<your-oauth-app-secret>"

# Node Environment
NODE_ENV="development"
```

**Security Notes:**
- Never commit `.env` to version control
- Use `.env.example` with placeholder values for documentation
- Rotate `NEXTAUTH_SECRET` if compromised
- `GITLAB_CLIENT_SECRET` is sensitive - treat as password

### Third-Party Service Accounts

**Required for Epic 1:**
1. **GitLab Account** (Self-Hosted Instance)
   - User-level access (no admin required)
   - Permissions: Read access to projects, issues, MRs
   - OAuth app created at: `{GITLAB_INSTANCE_URL}/-/profile/applications`

2. **PostgreSQL Database** (Local Development)
   - Install: `brew install postgresql@14` (macOS) or Docker
   - Database: `gitlab_insights` (created by Prisma)

**Deferred to Later Epics:**
- Sentry (Error tracking - Epic 6)
- Inngest (Background jobs - Epic 3)
- Vercel/Deployment platform (Epic 7)

## Acceptance Criteria (Authoritative)

These criteria define the complete success state for Epic 1: Walking Skeleton. All criteria must be met for epic completion.

### AC-1: Project Initialization and Build
- Given a development environment with Node.js installed
- When I run `npm create t3-app@latest gitlab-insights`
- Then the project initializes with Next.js, TypeScript, tRPC, Prisma, NextAuth, and Tailwind
- And `npm run dev` starts the development server successfully
- And I can access http://localhost:3000 without errors
- And all TypeScript compilation passes with zero errors

### AC-2: Database Schema and Migrations
- Given a `docker-compose.yml` file exists in the project root
- When I run `docker compose up -d`
- Then PostgreSQL container starts successfully on port 5432
- And when I run `npx prisma migrate dev --name init`
- Then the database is created with tables: User, Account, Session, Event, UserQuery, MonitoredProject
- And I can view tables in Prisma Studio (`npx prisma studio`)
- And all Prisma Client types are generated correctly
- And indexes exist on: `Event(userId, createdAt)`, `Event(gitlabEventId)`, `Account(userId)`, `Session(userId)`, `UserQuery(userId)`, `MonitoredProject(userId, gitlabProjectId)`
- And `docker compose down` stops the database cleanly

### AC-3: GitLab OAuth Authentication
- Given I have created an OAuth app at `{GITLAB_INSTANCE_URL}/-/profile/applications`
- And I have configured `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`, `GITLAB_INSTANCE_URL` in `.env`
- When I visit the login page and click "Sign in with GitLab"
- Then I am redirected to GitLab OAuth authorization page
- And after authorizing, I am redirected back to `/onboarding`
- And my User and Account records are created in the database
- And my GitLab access token is stored encrypted in `Account.access_token`
- And my session persists across page refreshes
- And I can logout successfully

### AC-4: Project Selection Onboarding
- Given I am authenticated and landing on `/onboarding` for the first time
- When the page loads
- Then I see a checklist of my GitLab projects fetched from the API
- And all projects are checked by default
- And I can uncheck projects I don't want to monitor
- And I can click "Continue" to save my selection
- And selected projects are saved to `MonitoredProject` table
- And I am redirected to `/dashboard`
- And if I have zero accessible projects, I see a helpful message about permissions

### AC-5: Manual Refresh Functionality
- Given I am on `/dashboard` with monitored projects configured
- When I click the "Refresh" button
- Then I see a "Syncing..." loading state
- And the system fetches issues, MRs, and comments from my monitored projects via GitLab API
- And events are stored in the `Event` table without duplicates (upsert by `gitlabEventId`)
- And the refresh completes in <3 seconds (P95)
- And I see "Last synced: just now" timestamp after completion
- And if API call fails, I see an error message with retry option
- And if rate limited (429), the system retries with exponential backoff

### AC-6: Dashboard Display with Hardcoded Filter
- Given I am on `/dashboard` after successfully refreshing events
- When the page loads
- Then I see events filtered by `label:security` (hardcoded)
- And events are displayed in 3 sections: Issues, Merge Requests, Comments
- And each event shows as a 2-line row (52px height):
  - Line 1: Badge + Title (truncated >120 chars) + Author, Project, Time
  - Line 2: First 80-100 chars of description
- And 8-10 events are visible without scrolling
- And clicking an event row opens the GitLab URL in a new tab
- And if no events match the filter, I see an empty state message
- And the page loads in <500ms (P95)

### AC-7: Application Layout and Accessibility
- Given I am authenticated and using the application
- When I navigate to any page
- Then I see a consistent layout with:
  - Header: App logo, user avatar, logout button
  - Main content area
- And the layout uses React Aria Components
- And dark mode styling is applied with olive accent (#9DAA5F)
- And all interactive elements are keyboard accessible (Tab navigation, Enter to activate)
- And focus indicators are visible (2px olive ring)
- And screen reader navigation works correctly (semantic HTML, ARIA labels)

### AC-8: Error Handling and Graceful Degradation
- Given various error conditions may occur
- When GitLab API is unavailable (5xx errors)
- Then I see cached events with a banner: "GitLab connection unavailable. Showing cached events (synced Xm ago)"
- And when my OAuth token is expired/revoked (401)
- Then I am prompted to re-authenticate
- And when I lack permissions for a project (403)
- Then I see a clear error message about insufficient permissions
- And when database connection fails
- Then I see a user-friendly error message (not a stack trace)

### Epic-Level Success Criteria
- ✅ All 7 stories (1.1 through 1.7) completed with DoD met
- ✅ Walking skeleton demonstrates complete user flow: Login → Select Projects → Refresh → View Events → Click Through
- ✅ No TypeScript compilation errors
- ✅ No console errors during normal operation
- ✅ All authentication flows work correctly (login, logout, session persistence)
- ✅ GitLab API integration fetches real data
- ✅ Performance targets met: <500ms page load, <3s manual refresh
- ✅ Code committed to Git with meaningful commit messages
- ✅ `.env.example` file created with placeholder values

## Traceability Mapping

This table maps Acceptance Criteria to Spec Sections, Implementation Components, and Test Approach.

| AC ID | PRD FRs | Tech Spec Section | Implementation Components | Test Approach |
|-------|---------|-------------------|--------------------------|---------------|
| **AC-1** | Infrastructure | Detailed Design → Services & Modules | T3 Stack init, package.json, tsconfig | Manual: Run `npm create t3-app`, verify server starts |
| **AC-2** | FR2 | Detailed Design → Data Models | Prisma schema, migrations | Manual: Run migrations, inspect Prisma Studio |
| **AC-3** | FR78, FR80 | Detailed Design → APIs (auth), NFR → Security | NextAuth config, GitLab provider, Session table | Manual: OAuth flow, verify token storage, test logout |
| **AC-4** | FR82, FR83 | Detailed Design → APIs (projects), Workflows → Onboarding | tRPC `projects.listUserProjects`, `projects.saveMonitored`, MonitoredProject table | Manual: Onboarding flow, verify DB records created |
| **AC-5** | FR1-3, FR5 | Detailed Design → APIs (events), Workflows → Refresh | tRPC `events.manualRefresh`, GitLabClient, Event table upserts | Manual: Click refresh, verify events in DB, test error cases |
| **AC-6** | FR13, FR27-28 | Detailed Design → APIs (dashboard), UX Design → Layout | tRPC `events.getForDashboard`, ItemRow component, SQL query with `labels @> ARRAY['security']` | Manual: Verify 3 sections, 2-line rows, click-through works |
| **AC-7** | FR58-59 | Detailed Design → UI Components, NFR → Security (layout) | RootLayout, Header, React Aria components, Tailwind config | Manual: Tab navigation, verify focus indicators, dark mode |
| **AC-8** | FR88, FR90 | NFR → Reliability, Detailed Design → Error Handling | GitLabClient retry logic, error boundaries, toast notifications | Manual: Simulate API failures, expired tokens, permission errors |

### Functional Requirement Coverage

| FR | Description | Epic 1 Implementation | Story |
|----|-------------|----------------------|-------|
| FR1 | Poll GitLab for new/updated issues | Manual refresh only (no background polling) | 1.5 |
| FR2 | Store events in local database | Event table with Prisma | 1.2, 1.5 |
| FR3 | Poll for MRs and comments | Manual refresh fetches all event types | 1.5 |
| FR5 | Manual refresh button | Refresh button on dashboard | 1.5 |
| FR13 | Click through to GitLab | ItemRow onClick → window.open(gitlabUrl) | 1.6 |
| FR27 | Dashboard with sections | Issues/MRs/Comments sections | 1.6 |
| FR28 | Scroll through sections | Sectioned layout with overflow | 1.6 |
| FR58-59 | Keyboard accessibility foundation | React Aria Components, Tab navigation | 1.7 |
| FR78 | GitLab OAuth login | NextAuth with GitLab provider | 1.3 |
| FR80 | Session persistence | Database-backed sessions | 1.3 |
| FR82 | Select projects on first login | Onboarding flow with project checklist | 1.4 |
| FR83 | Add/remove monitored projects | MonitoredProject table (remove deferred to Epic 2 settings) | 1.4 |
| FR88 | Retry on errors | Exponential backoff, error handling | 1.5 |
| FR90 | Graceful degradation | Show cached data when API unavailable | 1.5, 1.6 |

### Non-Functional Requirement Coverage

| NFR | Description | Epic 1 Implementation | Verification Method |
|-----|-------------|----------------------|---------------------|
| NFR-S1 | OAuth only (no local passwords) | GitLab OAuth via NextAuth | Code review: No password fields in schema |
| NFR-S2 | Session tokens encrypted | NextAuth encryption, DB storage | Code review: Session table, encryption config |
| NFR-S6 | API tokens in env variables | .env file for OAuth credentials | Code review: No hardcoded secrets |
| NFR-S7 | HTTPS enforcement | Next.js HTTPS redirect config | Manual: Test HTTP → HTTPS redirect |
| NFR-S8 | Input validation | Zod schemas on all tRPC inputs | Code review: tRPC router validation |
| NFR-S10 | 24hr session expiration | NextAuth session config | Code review: NextAuth options |
| NFR-S11 | CSRF protection | NextAuth CSRF tokens | Code review: NextAuth middleware |
| NFR-P1 | Page load <500ms | Performance monitoring, bundle optimization | Manual: Lighthouse audit on dashboard |
| NFR-P2 | Manual refresh <3s | API client timeout, parallel requests | Manual: Measure refresh duration |
| NFR-R1 | >95% polling success rate | GitLabClient retry logic, error tracking | Manual: Simulate failures, verify retries |

### Story-to-AC Mapping

| Story | Primary ACs | Implementation Focus |
|-------|------------|---------------------|
| 1.1: Initialize T3 Stack | AC-1 | Project setup, TypeScript config |
| 1.2: Database Schema | AC-2 | Prisma schema, migrations, indexes |
| 1.3: GitLab OAuth | AC-3, AC-8 (401 handling) | NextAuth, GitLab provider, session management |
| 1.4: Project Selection | AC-4, AC-8 (403 handling) | Onboarding UI, project API, MonitoredProject table |
| 1.5: Manual Refresh | AC-5, AC-8 (5xx handling, rate limits) | GitLab API client, event sync, error handling |
| 1.6: Dashboard Display | AC-6, AC-8 (empty states) | Dashboard query, ItemRow component, hardcoded filter |
| 1.7: App Layout | AC-7 | RootLayout, Header, React Aria, dark mode |

## Risks, Assumptions, Open Questions

### Risks

**R1: OAuth Configuration Complexity (Medium Probability, High Impact)**
- **Risk**: Developers struggle to create user-level OAuth apps at `{GITLAB_INSTANCE_URL}/-/profile/applications`
- **Impact**: Blocks Story 1.3, prevents authentication flow
- **Mitigation**:
  - Create step-by-step setup guide in README
  - Include screenshots of OAuth app creation
  - Provide troubleshooting section for common errors (redirect URI mismatch, scope issues)
- **Contingency**: If user-level OAuth apps not available, document requirement for admin OAuth app

**R2: GitLab API Rate Limiting (High Probability, Medium Impact)**
- **Risk**: Self-hosted GitLab instances may have lower rate limits than expected (default 300/min may vary)
- **Impact**: Manual refresh may fail or timeout for users with many monitored projects
- **Mitigation**:
  - Implement exponential backoff on 429 responses
  - Track `RateLimit-Remaining` header
  - Limit to 100 events per project per refresh
  - Display remaining quota to user
- **Contingency**: Add configuration for custom rate limits per instance

**R3: Database Migration Errors (Low Probability, Critical Impact)**
- **Risk**: Prisma migration fails due to schema conflicts or database permission issues
- **Impact**: Blocks Story 1.2, prevents all database operations
- **Mitigation**:
  - Test migrations on clean PostgreSQL instance
  - Document migration rollback procedure
  - Use Docker Compose for consistent local environment
- **Contingency**: Manual SQL execution if Prisma migration fails

**R4: NextAuth GitLab Provider Compatibility (Low Probability, High Impact)**
- **Risk**: NextAuth's GitLab provider may not work with self-hosted GitLab instances
- **Impact**: OAuth flow fails, authentication impossible
- **Mitigation**:
  - Test OAuth flow early in Story 1.3
  - Verify `GITLAB_INSTANCE_URL` configuration works with NextAuth
  - Check NextAuth documentation for self-hosted GitLab support
- **Contingency**: Implement custom OAuth provider if NextAuth's doesn't support self-hosted

**R5: Performance Targets Not Met (Medium Probability, Medium Impact)**
- **Risk**: Dashboard load exceeds 500ms or manual refresh exceeds 3s
- **Impact**: Poor user experience, fails acceptance criteria
- **Mitigation**:
  - Defer performance optimization - focus on functionality first
  - Accept risk for MVP validation phase
  - Optimize in later epics if needed
- **Contingency**: Relax performance targets for Epic 1, tighten in Epic 6

### Assumptions

**A1: Self-Hosted GitLab API Compatibility**
- Assumption: Self-hosted GitLab instance uses REST API v4 with same endpoints as gitlab.com
- Validation: Test API calls in Story 1.4 (first API integration)
- Risk if Invalid: API endpoints may differ, requiring custom client logic

**A2: User Has Read Access to Projects**
- Assumption: Authenticated user has at least read access to monitored projects
- Validation: Handle 403 Forbidden errors gracefully in Story 1.4
- Risk if Invalid: Empty project list, but handled with clear messaging

**A3: PostgreSQL Runs Locally or in Docker**
- Assumption: Developers can run PostgreSQL via Docker Compose or local installation
- Validation: Document both approaches in README
- Risk if Invalid: Provide cloud database alternative (e.g., Supabase free tier)

**A4: Single Instance Sufficient for MVP**
- Assumption: All users connect to the same GitLab instance for Epic 1
- Validation: Explicitly documented in scope (multi-instance deferred)
- Risk if Invalid: Out of scope for Epic 1, revisit in future epic

**A5: Hardcoded Filter Acceptable for Validation**
- Assumption: `label:security` filter proves concept without full query system
- Validation: User testing with hardcoded filter in Story 1.6
- Risk if Invalid: Still validates tech stack, user-controlled queries in Epic 2

### Open Questions

**Q1: OAuth Scope Persistence**
- Question: Do OAuth scopes persist across token refresh, or must they be re-requested?
- Impact: Token refresh logic in Story 1.3
- Resolution: Test during OAuth implementation, consult NextAuth docs

**Q2: GitLab API Pagination Strategy**
- Question: Should we fetch all pages of results or limit to first 100 items per endpoint?
- Impact: Manual refresh performance and completeness
- Resolution: Start with 100-item limit (Story 1.5), expand if needed in Epic 3

**Q3: Event Deduplication Strategy**
- Question: How do we handle updated events (e.g., issue title changed)?
- Impact: Upsert logic in Story 1.5
- Resolution: Use `gitlabEventId` as unique key, update `updatedAt` timestamp on changes

**Q4: Session Timeout Behavior**
- Question: Should expired sessions redirect to login immediately or show cached data?
- Impact: User experience when session expires
- Resolution: Show cached data with banner, allow manual re-auth (preserves user context)

**Q5: Environment Variable Management**
- Question: How do we handle multiple `.env` files (dev, staging, prod)?
- Impact: Deployment configuration in Epic 7
- Resolution: Deferred to Epic 7, use single `.env` for local dev in Epic 1

## Test Strategy Summary

### Testing Approach for Epic 1

**Philosophy**: Manual testing only for walking skeleton validation. Automated testing deferred to Epic 6.

**Rationale**:
- Walking skeleton validates technical feasibility, not production readiness
- Manual testing sufficient for 7 stories, single developer
- Automated tests add overhead without clear ROI at this stage
- Focus on rapid iteration and learning

### Test Levels

**1. Manual Functional Testing (Primary)**

Each story includes Definition of Done with manual verification steps:

- **Story 1.1**: Verify T3 Stack initialization, dev server runs, no TypeScript errors
- **Story 1.2**: Run migrations, inspect Prisma Studio, verify schema matches spec
- **Story 1.3**: Complete OAuth flow, verify session persistence, test logout
- **Story 1.4**: Test project selection UI, verify MonitoredProject records created
- **Story 1.5**: Click refresh, verify events fetched and stored, test error cases (simulate 401, 403, 429, 5xx)
- **Story 1.6**: Verify 3 sections render, 2-line rows, hardcoded filter works, click-through to GitLab
- **Story 1.7**: Tab through UI, verify focus indicators, check dark mode styling

**2. Integration Testing (Manual)**

Test end-to-end user flows:
- **Happy Path**: Login → Select Projects → Refresh → View Dashboard → Click Event
- **Error Path**: Expired token → Re-auth → Resume session
- **Empty State**: New user with zero projects → Helpful error message
- **Rate Limit**: Simulate 429 response → Verify exponential backoff

**3. Database Testing (Manual)**

Verify data integrity:
- Inspect tables in Prisma Studio after each operation
- Verify foreign keys work (user → events, user → projects)
- Test duplicate event prevention (refresh twice, verify upsert)
- Verify indexes exist (`\d Event` in psql shows indexes)

**4. Security Testing (Manual)**

Basic security validation:
- Verify `.env` not committed to Git (check `.gitignore`)
- Inspect database: `Account.access_token` encrypted (not plaintext)
- Test CSRF protection: Mutation without valid session fails
- Verify SQL injection not possible: Try malicious inputs in search (deferred to Epic 2)

### Test Coverage Goals

**Epic 1 Coverage (Manual Testing)**:
- ✅ All 8 Acceptance Criteria verified manually
- ✅ All 7 stories pass Definition of Done
- ✅ Happy path works end-to-end
- ✅ Error handling tested for common failures (401, 403, 429, 5xx)
- ✅ Database schema matches spec
- ✅ No console errors during normal operation

**Deferred to Epic 6 (Automated Testing)**:
- Unit tests for tRPC procedures
- Integration tests for GitLab API client
- E2E tests with Playwright
- Performance testing (Lighthouse CI)
- Load testing (multiple concurrent users)

### Test Data Strategy

**Development Environment**:
- Use real GitLab account on self-hosted instance
- Monitor 2-3 real projects with mix of issues, MRs, comments
- Create test labels (e.g., `security`, `bug`, `feature`) on issues
- Test with both empty states and populated data

**Test Scenarios**:
1. **First-time user**: New account, select projects, first refresh
2. **Returning user**: Existing session, cached events, manual refresh
3. **Error conditions**: Expired token, rate limited, API down
4. **Edge cases**: Zero projects, zero events matching filter, all projects unchecked

### Exit Criteria for Epic 1

**Testing Complete When**:
- ✅ All 8 Acceptance Criteria pass manual verification
- ✅ End-to-end happy path works consistently (5+ successful iterations)
- ✅ All error paths tested and handled gracefully
- ✅ No blocking bugs discovered
- ✅ Performance targets met (measured manually with browser DevTools)
- ✅ Code review complete (self-review for single developer)
- ✅ `.env.example` created with documentation

**Known Limitations Accepted for Epic 1**:
- No automated test coverage (deferred to Epic 6)
- Performance not optimized (deferred to Epic 6)
- No monitoring/alerting (deferred to Epic 6)
- Single GitLab instance only (multi-instance deferred)
- Hardcoded filter (user queries deferred to Epic 2)
