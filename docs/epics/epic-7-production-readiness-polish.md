# Epic 7: Production Readiness & Polish
**Status:** ~30% Complete - See [AC Gap Analysis](./epic-6-7-acceptance-criteria-gap-analysis.md) for details  
**Timeline:** 3-5 days (Final phase before launch) → **Actual: 5-8 days estimated**

**Goal:** Production-ready application with professional polish

**Value Statement:** Users experience a polished, performant, and production-grade application

---

## Completion Status

### ✅ COMPLETED (No Additional Work Needed)

The following requirements are **fully implemented** with all acceptance criteria met:

- ✅ **Focus indicators (FR59)** - HeroUI + Tailwind focus-visible throughout
- ✅ **Onboarding flow (FR98)** - GitLab OAuth → Project selection flow (Story 1-4)
- ✅ **Empty states with helpful guidance (FR99)** - QuerySidebar EmptyState component
- ✅ **Dark mode** - HeroUI dark mode with olive theme (Story 1-5-6)

**Verification:** See [Epic 6-7 AC Gap Analysis](./epic-6-7-acceptance-criteria-gap-analysis.md) for detailed verification

---

## 🚧 REMAINING WORK

### Story 7-1: Monitoring, Observability & Health Check (P0 - REQUIRED)
**Estimated Effort:** 3-4 hours  
**Status:** Not started  
**Priority:** P0 (required for production)

**Scope:**
- **Health check endpoint `/api/health` (FR91 partial)** - System status for monitoring
- **Vercel Analytics integration** - Page view tracking, performance metrics
- **Sentry error tracking setup** - Production error monitoring
- **Inngest dashboard configuration** - Background job monitoring
- **Custom metrics** - API polling success rate tracking (FR91 partial)
- **Performance baseline measurement** - Validate FR67-69 targets

**Acceptance Criteria:**
- [ ] `/api/health` endpoint returns `{"status": "ok"}` or error state
- [ ] Vercel Analytics configured and collecting data
- [ ] Sentry error tracking active in production
- [ ] Inngest dashboard accessible for job monitoring
- [ ] Custom performance metrics logged (page load, search, filter times)
- [ ] Performance targets validated: <500ms page load (FR67), <1s search (FR68), <200ms filters (FR69)

**FRs Addressed:** FR91 (partial - health endpoint), FR67-69 (performance validation)

---

### Story 7-2: Accessibility Audit & Remediation (P1 - RECOMMENDED)
**Estimated Effort:** 4-6 hours  
**Status:** Not started  
**Priority:** P1 (important for quality)

**Scope:**
- WCAG 2.1 AA compliance audit
- Focus indicators validation (FR59 already implemented, verify coverage)
- Keyboard navigation testing
- Screen reader testing (VoiceOver, NVDA)
- Color contrast validation
- ARIA labels and roles verification

**Acceptance Criteria:**
- [ ] Lighthouse accessibility score >90
- [ ] All interactive elements keyboard accessible
- [ ] Screen reader announces page sections correctly
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus indicators visible on all interactive elements
- [ ] No accessibility violations in axe DevTools

**FRs Addressed:** FR59 (focus indicators - validation)

---

### Story 7-3: Empty States & Onboarding Polish (P1 - RECOMMENDED)
**Estimated Effort:** 3-4 hours  
**Status:** Not started  
**Priority:** P1 (polish, not blocking)

**Scope:**
- Empty state polish for all views (queries, dashboard, catch-up mode)
- Onboarding flow refinements (copy improvements, visual polish)
- Helpful error messages and recovery paths
- First-time user experience validation

**Current State:**
- ✅ Onboarding flow exists (FR98 complete)
- ✅ QuerySidebar empty state exists (FR99 complete)
- ⚠️ Dashboard empty state needs verification
- ⚠️ Catch-up mode empty state needs verification

**Acceptance Criteria:**
- [ ] All empty states have helpful messaging and next actions
- [ ] Onboarding flow copy is clear and concise
- [ ] First-time user can complete onboarding without confusion
- [ ] Error states provide recovery actions (retry, help links)

**FRs Addressed:** FR98-99 (polish/enhancement)

---

### Story 7-4: Keyboard Shortcuts Help Modal (P1 - RECOMMENDED)
**Estimated Effort:** 2-3 hours  
**Status:** Not started  
**Priority:** P1 (nice-to-have, not blocking)  
**Origin:** Moved from Epic 5 (only missing keyboard feature)

**Scope:**
- Press `?` to open help overlay showing all keyboard shortcuts
- Categorized shortcut reference (Navigation, Actions, Search)
- Keyboard accessible (close with Esc)
- Visual design consistent with HeroUI theme

**Acceptance Criteria:**
- [ ] `?` key opens help modal
- [ ] Modal shows all keyboard shortcuts organized by category
- [ ] Shortcuts displayed with visual key indicators (e.g., `Cmd+K`)
- [ ] Modal closes with `Esc` or close button
- [ ] Modal is keyboard navigable and screen reader accessible

**FRs Addressed:** FR57 (keyboard shortcut help - from Epic 5)

---

### Story 7-5: Performance Validation & Optimization (P1 - RECOMMENDED)
**Estimated Effort:** 4-6 hours  
**Status:** Not started  
**Priority:** P1 (important for quality)

**Scope:**
- **Load testing with realistic data** (4 weeks of events - FR71)
- **Performance measurement** (dashboard refresh - FR72, manual refresh - FR73)
- **Database query optimization** (if needed)
- **Lighthouse performance audit** (target >90 score)
- **Performance regression testing** (validate FR67-69 targets)

**Acceptance Criteria:**
- [ ] Load test with 4 weeks of event data shows no degradation (FR71)
- [ ] Dashboard refresh <200ms (FR72)
- [ ] Manual refresh <3 seconds for typical projects (FR73)
- [ ] Page loads <500ms (FR67)
- [ ] Search queries <1s (FR68)
- [ ] Filter application <200ms (FR69)
- [ ] Lighthouse performance score >90
- [ ] Database indexes optimized for slow queries

**FRs Addressed:** FR67-73 (performance targets - validation)

---

### Story 7-6: Documentation & Launch Prep (P0 - REQUIRED)
**Estimated Effort:** 2-4 hours  
**Status:** Not started  
**Priority:** P0 (required for launch)

**Scope:**
- README with project overview and features
- Setup instructions (local development, environment variables)
- Deployment guide (Vercel, database, Inngest)
- User guide / feature overview
- Troubleshooting section

**Acceptance Criteria:**
- [ ] README has clear project description
- [ ] Setup instructions allow new developer to run locally
- [ ] Environment variables documented with examples
- [ ] Deployment guide covers production setup
- [ ] User guide explains key features and workflows

**FRs Addressed:** Documentation (non-FR requirement)

---

## 🚫 DEFERRED (Not Required for Beta)

### Skeleton Loaders (from Epic 6)
**Estimated Effort:** 6-10 hours  
**Priority:** P2 (defer post-launch)

**Scope:** Replace LoadingSpinner with skeleton loaders matching content layout

**Rationale:** Current loading states work well. Skeleton loaders are polish enhancement with significant effort.

---

### Health/Status Page UI (FR91 full implementation)
**Estimated Effort:** 2-3 hours  
**Priority:** P2 (defer post-launch)

**Scope:** Dedicated health page showing API polling success rate, system status indicators

**Rationale:** `/api/health` endpoint sufficient for monitoring. Inngest dashboard available internally. User-facing health page is low priority.

---

### Polling Interval Configuration (FR64 - from Epic 6)
**Estimated Effort:** 6-8 hours  
**Priority:** P2 (defer post-launch)

**Rationale:** See Epic 6 Story 6-4 - default 15min sufficient

---

### View Preferences (FR63 - from Epic 6)
**Estimated Effort:** 8-12 hours  
**Priority:** P2 (defer post-launch)

**Rationale:** See Epic 6 Story 6-5 - undefined requirement

---

## Summary

**Original Scope:** 11 items listed  
**Actually Completed:** 4 items (36% of listed scope)  
**Remaining Required (P0):** 2 items (Stories 7-1, 7-6) = 5-8 hours  
**Recommended (P1):** 4 items (Stories 7-2, 7-3, 7-4, 7-5) = 13-19 hours  
**Optional/Deferred (P2):** 4 items = 22-33 hours

**Path to Beta Launch:**

**Minimum (P0 only):**
- Story 7-1: Monitoring & Health Check (3-4 hours)
- Story 7-6: Documentation (2-4 hours)
- **Total: 5-8 hours**

**Recommended (P0 + P1):**
- Story 7-1: Monitoring & Health Check (3-4 hours)
- Story 7-2: Accessibility Audit (4-6 hours)
- Story 7-3: Empty States Polish (3-4 hours)
- Story 7-4: Keyboard Help Modal (2-3 hours)
- Story 7-5: Performance Validation (4-6 hours)
- Story 7-6: Documentation (2-4 hours)
- **Total: 18-27 hours**

**Combined with Epic 6:**
- Epic 6 Story 6-3: Rate Limiting (4-6 hours) - P0
- Epic 7 Stories (P0): 5-8 hours
- **Minimum to Beta: 9-14 hours (1-2 days)**

**With recommended polish (P0 + P1):**
- Epic 6 Story 6-3: Rate Limiting (4-6 hours)
- Epic 7 Stories (P0 + P1): 18-27 hours
- **Recommended to Beta: 22-33 hours (3-4 days)**

**FRs Covered:**
- ✅ FR59 (Focus indicators) - Complete, validation in Story 7-2
- ⚠️ FR67-73 (Performance targets) - Needs validation in Story 7-5
- ⚠️ FR91 (Health check) - Partial, endpoint in Story 7-1
- ✅ FR98 (Onboarding) - Complete, polish in Story 7-3
- ✅ FR99 (Empty states) - Complete, polish in Story 7-3

**Rationale:** Most Epic 7 polish work was completed during organic development (focus indicators, onboarding, empty states, dark mode). Remaining work is production requirements (monitoring, health check, documentation) and quality validation (accessibility, performance).
