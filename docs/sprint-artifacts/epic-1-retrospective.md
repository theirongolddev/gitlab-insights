# Epic 1 Retrospective: Walking Skeleton

**Date:** 2025-11-25
**Epic:** Epic 1 - Walking Skeleton
**Status:** Complete (8 stories done)

---

## Executive Summary

Epic 1 successfully delivered a functional Walking Skeleton for GitLab Insights, establishing the foundational architecture and demonstrating end-to-end data flow from GitLab OAuth authentication through event display. All 8 stories completed with code reviews passed. The epic encountered one significant technical pivot (NextAuth → BetterAuth) which was properly documented and managed through the ADR process.

### Key Metrics

| Metric | Value |
|--------|-------|
| Stories Planned | 7 (original) + 1 (added via correct-course) |
| Stories Completed | 8 |
| Completion Rate | 100% |
| Major Tech Pivots | 1 (BetterAuth migration) |
| Critical Blockers Resolved | 2 (Discord OAuth, documentation debt) |

---

## Stories Completed

| Story | Title | Status | Key Deliverable |
|-------|-------|--------|-----------------|
| 1.1 | Initialize T3 Stack Project | Done | T3 Stack foundation with Tailwind v4, olive accent colors |
| 1.2 | Database Schema & Prisma Setup | Done | PostgreSQL + Prisma schema with 6 models |
| 1.3 | GitLab OAuth Authentication | Done | BetterAuth OAuth with session persistence |
| 1.4 | Project Selection Onboarding | Done | Onboarding flow with project checklist |
| 1.5 | GitLab API Client with Manual Refresh | Done | Event sync from GitLab API |
| 1.6 | 2-Line Table View with Hardcoded Query | Done | React Aria Table for event display |
| 1.7 | Basic App Layout with React Aria | Done | Header, Button component, pino logger |
| 1.8 | Project Settings Management | Done | Settings page with shared ProjectSelector |

---

## What Went Well

### 1. T3 Stack Foundation (Story 1.1)
- **Achievement:** Solid foundation established with Next.js 16, TypeScript 5.8, tRPC 11, Prisma 6, Tailwind v4
- **Pattern Established:** Environment variable validation with Zod schemas via @t3-oss/env-nextjs
- **Learning:** Tailwind v4 uses CSS-based configuration instead of JS/TS config files

### 2. Comprehensive Error Handling (Story 1.5)
- **Achievement:** GitLab API client with robust error handling for 401, 403, 429, 5xx, network errors, and timeouts
- **Pattern Established:** AbortSignal.timeout for request timeouts, TRPCError mapping for API errors
- **Learning:** 5-second timeout is appropriate for GitLab API calls (changed from initial 30s)

### 3. Component Reuse (Story 1.8)
- **Achievement:** ProjectSelector component extracted to eliminate ~120 lines of duplicated code
- **Pattern Established:** Shared components between onboarding and settings pages
- **Learning:** Early identification of reuse opportunities improves maintainability

### 4. Accessibility-First UI (Story 1.6, 1.7)
- **Achievement:** React Aria Components integrated for keyboard accessibility
- **Pattern Established:** Mouse-first with keyboard support (ADR-011 Phase 1)
- **Learning:** React Aria Table requires proper client component structure

### 5. Structured Logging (Story 1.7)
- **Achievement:** Pino logger replacing all console.log statements
- **Pattern Established:** `~/lib/logger.ts` with configurable log levels
- **Learning:** Structured logging essential for debugging and future observability

### 6. Code Review Process
- **Achievement:** All stories received thorough Senior Developer Reviews (AI)
- **Pattern Established:** AC coverage tables, task verification, security review
- **Learning:** Review process caught critical issues (Discord OAuth, documentation debt)

---

## What Didn't Go Well

### 1. NextAuth → BetterAuth Migration (Story 1.3, 1.4)
- **Issue:** NextAuth 5.0-beta had compatibility issues with Next.js 16, requiring migration to BetterAuth
- **Impact:** Caused significant documentation debt; all architecture docs referenced obsolete patterns
- **Resolution:** Created ADR-012, updated architecture.md, tech-spec, and change proposal
- **Learning:** Beta libraries (NextAuth 5.0-beta) carry risk; evaluate production readiness carefully

### 2. Initial Provider Configuration (Story 1.1)
- **Issue:** T3 Stack scaffolded with Discord OAuth instead of GitLab
- **Impact:** HIGH severity blocker requiring provider replacement before approval
- **Resolution:** Replaced Discord provider with GitLab, made credentials required in production
- **Learning:** Verify scaffolded defaults match project requirements immediately

### 3. Documentation Lag (Story 1.4)
- **Issue:** BetterAuth migration completed without updating architecture documentation
- **Impact:** CRITICAL blocker - future stories referenced incorrect patterns
- **Resolution:** 7 documentation updates required before story approval
- **Learning:** Architectural changes must be documented concurrently, not retroactively

### 4. Scope Creep in UI (Story 1.6)
- **Issue:** FilterToggle component implemented but not in acceptance criteria
- **Impact:** Additional code to maintain; removed during review
- **Resolution:** Removed scope creep, kept implementation focused on ACs
- **Learning:** Adhere strictly to acceptance criteria; nice-to-haves go in future stories

### 5. Type Safety Gaps (Story 1.3)
- **Issue:** `any` types used in auth callbacks instead of proper NextAuth/BetterAuth types
- **Impact:** Reduced type checking, potential runtime errors
- **Resolution:** Added explicit types with TODO for Epic 6 improvements
- **Learning:** Maintain strict typing even in callback functions

---

## Key Lessons Learned

### Technical Lessons

1. **Library Version Selection**
   - Avoid beta versions of critical libraries (NextAuth 5.0-beta)
   - Verify library compatibility with framework versions before starting
   - Have fallback plan for library migrations

2. **Timeout Configuration**
   - Initial 30-second timeouts too long for user experience
   - 5-second timeout appropriate for GitLab API calls
   - Use AbortSignal.timeout for clean timeout handling

3. **Component Architecture**
   - Extract shared components early (ProjectSelector pattern)
   - Native HTML elements with React Aria enhancements work well
   - Client/Server component boundary requires careful planning

4. **Logging Strategy**
   - Replace console.log with structured logging from day one
   - Pino logger with configurable levels is production-ready
   - Log context (userId, requestId) valuable for debugging

### Process Lessons

1. **Documentation Discipline**
   - Update architecture docs alongside code changes
   - ADRs required for any framework/library changes
   - Review process catches documentation gaps

2. **Acceptance Criteria Adherence**
   - Implement exactly what's specified in ACs
   - Additional features create maintenance burden
   - Use correct-course workflow for scope changes

3. **Review Process Value**
   - AI code reviews caught critical issues (2 blockers)
   - AC coverage tables ensure nothing missed
   - Task verification prevents false completion claims

4. **Sprint Management**
   - correct-course workflow effective for mid-sprint additions
   - Story 1.8 added successfully via change proposal
   - Sprint status tracking essential for visibility

---

## Patterns Established for Future Epics

### Authentication & Authorization
- BetterAuth with Prisma adapter for OAuth
- GitLab social provider with self-hosted instance support
- Session validation via tRPC protectedProcedure middleware
- Access token retrieval from Account table by providerId

### Data Access
- User-scoped data pattern: all queries filter by userId
- Prisma transactions for atomic operations
- Composite indexes for dashboard queries (userId, createdAt DESC)
- Unique constraints for duplicate prevention

### UI Components
- React Aria Components for accessibility
- Olive accent color system (#5e6b24 light, #9DAA5F dark)
- Dark mode with #2d2e2e background, #FDFFFC text
- Button wrapper component with variants (primary, secondary, ghost)

### API Patterns
- tRPC routers for type-safe APIs
- Comprehensive error handling with TRPCError mapping
- 5-second timeouts for external API calls
- Loading/error/empty state handling in UI

### Logging & Observability
- Pino logger from ~/lib/logger.ts
- No console.log in production code
- Structured logging with context

---

## Recommendations for Epic 2+

### Technical Recommendations

1. **Token Refresh Logic (Epic 3)**
   - Deferred from Story 1.3: implement OAuth token refresh
   - BetterAuth may handle this; verify before implementation
   - Add TODO comments referencing this recommendation

2. **Comprehensive Error Handling (Epic 6)**
   - Custom error pages for 401, 403, scope validation
   - User-friendly messages for re-authentication prompts
   - Error tracking integration (Sentry or similar)

3. **Test Coverage (Epic 6)**
   - Manual testing worked for MVP (ADR-006)
   - Add unit tests for critical business logic
   - Integration tests for API endpoints

4. **Virtual Scrolling (Future)**
   - ProjectSelector could benefit from virtualization
   - Large project lists may impact performance
   - React Aria has virtualization support

### Process Recommendations

1. **ADR Process**
   - Create ADRs for any library/framework changes
   - Update architecture docs same day as implementation
   - Include migration impact in ADR

2. **Story Scope**
   - Keep stories focused on acceptance criteria
   - Use separate stories for enhancements
   - correct-course for mid-sprint changes

3. **Code Review**
   - Continue AI code reviews for all stories
   - AC coverage tables essential for validation
   - Security review for auth-related changes

---

## Epic 2 Impact Assessment

### Dependencies Established
- Authentication: BetterAuth patterns in src/lib/auth.ts
- Database: Prisma schema with 6 models, indexes configured
- API: tRPC routers for GitLab and Projects
- UI: React Aria Table, Button component, Header with navigation

### Schema Ready for Epic 2
- Event model with all fields for GitLab events
- UserQuery model for saved queries (Epic 2 feature)
- MonitoredProject for filtering events by project

### Patterns to Follow
- User-scoped data access
- Comprehensive error handling
- React Aria Components for new UI
- Pino logging for all server-side operations

---

## Appendix: Story-by-Story Summary

### Story 1.1: Initialize T3 Stack Project
- **Key Learning:** Tailwind v4 CSS-based config, verify scaffolded defaults
- **Blocker:** Discord OAuth instead of GitLab (resolved)
- **Pattern:** Environment validation with Zod

### Story 1.2: Database Schema & Prisma Setup
- **Key Learning:** PostgreSQL arrays (String[]), JSON fields work well
- **Pattern:** User-scoped data with userId foreign keys
- **Note:** docker-compose.yml version attribute obsolete (advisory)

### Story 1.3: GitLab OAuth Authentication
- **Key Learning:** NextAuth 5.0-beta incompatible with Next.js 16
- **Pivot:** Migrated to BetterAuth 1.4.1
- **Deferred:** AC 8-10 (token validation, error handling) to Epic 3, 6

### Story 1.4: Project Selection Onboarding
- **Key Learning:** Document architectural changes immediately
- **Blocker:** Documentation debt (7 updates required)
- **Pattern:** Opt-out model (all projects selected by default)

### Story 1.5: GitLab API Client with Manual Refresh
- **Key Learning:** 5-second timeout, component extraction
- **Pattern:** TRPCError mapping for API errors
- **Components:** RefreshButton, SyncIndicator, SimpleEventList

### Story 1.6: 2-Line Table View with Hardcoded Query
- **Key Learning:** React Aria Table requires client components
- **Issue:** Scope creep (FilterToggle) removed during review
- **Deviation:** "bug" filter label instead of "security" per user's instance

### Story 1.7: Basic App Layout with React Aria
- **Key Learning:** Replace console.log with pino from day one
- **Pattern:** Button wrapper with design system variants
- **Components:** Header, Button, ViewportCheck

### Story 1.8: Project Settings Management
- **Key Learning:** Early component extraction (ProjectSelector)
- **Pattern:** Shared components between pages
- **Added:** Via correct-course workflow mid-sprint

---

**Retrospective completed by:** Claude Code (Claude Opus 4.5)
**Date:** 2025-11-25
