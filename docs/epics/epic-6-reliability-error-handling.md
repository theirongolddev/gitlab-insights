# Epic 6: Reliability & Error Handling
**Status:** 90% Complete - See [AC Gap Analysis](./epic-6-7-acceptance-criteria-gap-analysis.md) for details  
**Timeline:** 5-7 days (Phase 2, post-keyboard foundation) → **Actual: 0.5-1 day remaining**

**Goal:** Ensure production-grade reliability with graceful error handling

**Value Statement:** Users trust the system to handle failures gracefully and maintain data integrity

---

## Completion Status

### ✅ COMPLETED (No Additional Work Needed)

The following requirements are **fully implemented** with all acceptance criteria met:

- ✅ **API polling >95% success rate with retry logic (FR70)** - Inngest automatic retry (Story 3-5)
- ✅ **Graceful handling of API unavailability (FR8, FR90)** - Error handling + cached data
- ✅ **Error boundaries for React components** - ThemeContext ErrorBoundary wrapper
- ✅ **Toast notifications for errors (FR88 partial)** - Custom toast system implemented
- ✅ **Contextual error messages (FR87)** - Toast + inline errors throughout
- ✅ **API sync status indicator (FR89)** - SyncIndicator component (Story 3-6)
- ✅ **Loading states** - LoadingSpinner component used throughout
- ✅ **Data integrity: deduplication (FR74)** - Prisma upsert by gitlabEventId
- ✅ **Data integrity: pagination handling (FR75)** - GitLab API pagination handled
- ✅ **Data integrity: referential integrity (FR76)** - GitLab URLs stored and valid
- ✅ **Filter validation before saving (FR77)** - Zod schema validation in queries router
- ✅ **Settings page UI (FR61-62, FR66)** - Project management settings (Story 1-8)
- ✅ **User preferences persistence (FR66)** - Database persistence implemented

**Verification:** See [Epic 6 Verification Report](./epic-6-verification-report.md) for detailed audit

---

## ⚠️ REMAINING WORK

### Story 6-3: GitLab API Rate Limiting & Retry Logic (P0 - REQUIRED)
**Estimated Effort:** 4-6 hours  
**Status:** Not started  
**Priority:** P0 (blocking for production)

**Problem:** Direct API calls (manual refresh, save operations) don't have retry logic or rate limit handling. Only background Inngest jobs have automatic retry.

**Scope:**
- ✅ **GitLab API rate limiting with exponential backoff (FR6)** - Inngest done, direct calls need implementation
- ✅ **Toast notifications for rate limits (FR88 complete)** - Add retry countdown UI

**Requirements:**
1. Add exponential backoff retry logic to direct API calls in `gitlab-client.ts`
2. Handle 429 rate limit responses from GitLab API
3. Retry transient failures (network errors, 5xx responses)
4. Max 3 retries with exponential backoff (1s, 2s, 4s)
5. User sees loading state during retries
6. Toast notification: "GitLab API rate limit reached. Retrying in X seconds..."
7. After 3 failures, show error message with manual retry button

**Acceptance Criteria:**
- [ ] Direct API calls retry up to 3 times on failure
- [ ] Exponential backoff implemented (1s → 2s → 4s delays)
- [ ] 429 rate limit responses trigger backoff and user notification
- [ ] User sees toast with retry countdown
- [ ] After 3 failures, user sees error with "Retry" button
- [ ] Background Inngest jobs continue to use automatic retry (no change)

**FRs Addressed:** FR6 (complete), FR88 (complete)

---

## 🚫 DEFERRED (Not Required for Beta)

### Story 6-4: Polling Interval Configuration (P2 - OPTIONAL)
**Estimated Effort:** 6-8 hours  
**Status:** Not started  
**Priority:** P2 (defer post-launch)

**Requirement:** FR64 - Users can configure polling interval (5-15 minute range)

**Rationale for Deferral:**
- Default 15min interval sufficient for most users
- No user feedback requesting this feature
- Can add post-launch if demand identified

**Scope:**
- Add `pollingIntervalMinutes` field to User table (default: 15)
- Add polling interval selector in settings page (5min, 15min, 30min, 1hr options)
- Update Inngest function to read user preference
- Save preference to database on change

---

### Story 6-5: View Preferences (P2 - NEEDS DEFINITION)
**Estimated Effort:** 8-12 hours (if defined)  
**Status:** Not started  
**Priority:** P2 (defer until defined)

**Requirement:** FR63 - Users can configure view preferences (default to card or table view)

**Rationale for Deferral:**
- Requirement is undefined - PRD doesn't specify what "card view" means
- Only table view currently exists
- No design spec or user demand for alternative views
- Speculative feature

**Recommendation:** Wait for user feedback to define actual view preferences needed (table density, column visibility, default sort, etc.)

---

### Story 6-6: Skeleton Loaders (P1 - ENHANCEMENT)
**Estimated Effort:** 6-10 hours  
**Status:** Not started  
**Priority:** P1 (nice-to-have polish)

**Current State:** Loading spinners used everywhere (LoadingSpinner component)

**Enhancement:** Replace spinners with skeleton loaders that match content layout (perceived performance improvement)

**Rationale for Deferral:**
- Loading states work well with spinners
- Skeleton loaders are polish/UX enhancement, not functional requirement
- Can be added in Epic 7 if time permits

---

## Summary

**Original Scope:** 23 items listed  
**Actually Completed:** 13 items (57% of listed scope)  
**Remaining Required:** 1 item (Story 6-3)  
**Optional/Deferred:** 3 items (Stories 6-4, 6-5, 6-6)

**Path to Epic 6 Completion:**
- Complete Story 6-3 (Rate Limiting) - 4-6 hours
- Mark Epic 6 as complete
- Proceed to Epic 7

**FRs Covered:** 
- ✅ FR6 (Rate limits) - Partial, needs Story 6-3
- ✅ FR8 (Offline tolerance) - Complete
- ✅ FR70 (Polling reliability) - Complete
- ✅ FR74-77 (Data integrity) - Complete
- ✅ FR87-90 (Error handling) - Complete
- ✅ FR61-62, FR65-66 (Settings) - Complete
- ⚠️ FR63 (View preferences) - Deferred (undefined)
- ⚠️ FR64 (Polling interval config) - Deferred (optional)

**Rationale:** Epic 6 organic development covered nearly all requirements during earlier stories. Only rate limiting for direct API calls remains as blocking work.
