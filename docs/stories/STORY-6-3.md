# STORY-6-3: GitLab API Rate Limiting & Retry Logic

**Epic:** Epic 6 - Reliability & Error Handling
**Priority:** P0 (Must Have - Blocking for Production)
**Story Points:** 5
**Status:** In Progress
**Assigned To:** Developer
**Created:** 2025-12-11
**Sprint:** Epic 6

---

## User Story

As a **user performing manual refresh operations**
I want the **system to automatically retry failed API calls with intelligent backoff**
So that **transient failures don't interrupt my workflow and I understand what's happening**

---

## Description

### Background

Currently, the GitLab client has partial retry logic:
- **Background Inngest jobs**: Have automatic retry (3 retries configured in Inngest)
- **Direct API calls** (manual refresh): Have retry for 5xx errors and network errors, but **NOT for 429 rate limits**

When users hit GitLab's rate limit during manual refresh, the request immediately fails with a "rate limit exceeded" error. This creates a poor user experience because:
1. Users don't know when to retry
2. Users must manually click refresh repeatedly
3. No visibility into what's happening during retries

### Current Implementation Analysis

**`gitlab-client.ts:fetchWithRetry()`** (lines 304-344):
- Retries on 5xx server errors with exponential backoff (1s, 2s, 4s)
- Retries on network errors (timeout, connection refused)
- Does NOT retry on 429 rate limit responses
- `GitLabAPIError` class has `isRateLimit` flag but it's not used for retry

**`events.ts:manualRefresh`** (lines 140-170):
- Catches `GitLabAPIError.isRateLimit` and converts to `TRPCError`
- No automatic retry - immediately throws error to client

**`useManualRefresh.ts`**:
- Calls mutation and handles errors
- No retry countdown UI or automatic retry logic

### Scope

**In scope:**
- Enhance `fetchWithRetry()` to handle 429 rate limit responses
- Add retry countdown notification for rate limits
- Implement max 3 retries with exponential backoff (1s, 2s, 4s)
- Toast notification showing retry progress
- After exhausting retries, show clear error with manual retry option
- Preserve existing retry logic for 5xx and network errors

**Out of scope:**
- Changes to Inngest background job retry logic (already working)
- Rate limit prediction/preemption
- Per-endpoint rate limit tracking
- Circuit breaker pattern (post-MVP)

### User Flow

**Happy Path (no rate limit):**
1. User clicks "Refresh" button
2. System fetches events from GitLab API
3. User sees success toast
4. Dashboard updates with new events

**Rate Limit Path:**
1. User clicks "Refresh" button
2. GitLab returns 429 rate limit response
3. User sees toast: "GitLab rate limit reached. Retrying in 1s..."
4. System waits 1 second
5. System retries request
6. If still rate limited, toast updates: "Still rate limited. Retrying in 2s..."
7. System waits 2 seconds, retries
8. If still rate limited, toast updates: "Still rate limited. Retrying in 4s..."
9. System waits 4 seconds, retries
10. If successful: success toast, dashboard updates
11. If still fails after 3 retries: error toast with "Retry" button option

---

## Acceptance Criteria

- [x] **AC1:** Direct API calls (manual refresh) retry up to 3 times on 429 rate limit responses
- [x] **AC2:** Exponential backoff implemented: 1s delay after 1st failure, 2s after 2nd, 4s after 3rd
- [x] **AC3:** User sees toast notification when rate limit is hit: "GitLab rate limit reached. Retrying in Xs..."
- [x] **AC4:** Toast countdown updates as system retries (user sees progress)
- [x] **AC5:** After exhausting 3 retries, user sees error toast with "Retry" button option
- [x] **AC6:** Loading state (spinner/button disabled) persists during retry delays
- [x] **AC7:** Background Inngest jobs continue using Inngest's built-in retry (no changes)
- [x] **AC8:** Existing retry logic for 5xx errors and network errors preserved
- [x] **AC9:** Rate limit retry can be cancelled by user (e.g., navigating away)
- [x] **AC10:** Retry countdown visible in UI (toast or status indicator)

---

## Technical Notes

### Components Affected

**Backend:**
- `src/server/services/gitlab-client.ts` - Enhance `fetchWithRetry()` to handle 429
- `src/server/api/routers/events.ts` - May need to expose retry metadata

**Frontend:**
- `src/hooks/useManualRefresh.ts` - Add retry logic with toast integration
- Toast system (already exists) - Use for countdown notifications

### Implementation Approach

**Option A: Backend-only retry (Recommended)**
- Handle all retry logic in `fetchWithRetry()`
- No changes needed to frontend hooks
- Simpler, but user doesn't see countdown during backend retry

**Option B: Frontend retry with countdown UI**
- Backend throws immediately on 429
- Frontend `useManualRefresh` handles retry with countdown
- More complex, but better UX with visible countdown

**Recommended: Option B** - The UX of seeing countdown is important for user confidence. Backend can still do immediate retry for 5xx, but 429s should bubble up for frontend handling.

### Detailed Implementation

**1. Update `gitlab-client.ts`:**
```typescript
// In fetchWithRetry, add 429 handling alongside 5xx:
if (response.status === 429 && attempt < retries) {
  const backoff = Math.pow(2, attempt) * 1000;
  // Could return a special error to let frontend handle countdown
  throw new GitLabAPIError(
    `Rate limit exceeded. Retry after ${backoff}ms`,
    429,
    true // isRateLimit
  );
}
```

**2. Enhance `useManualRefresh.ts`:**
```typescript
const [retryState, setRetryState] = useState<{
  isRetrying: boolean;
  attempt: number;
  nextRetryIn: number;
} | null>(null);

// On rate limit error:
// 1. Show toast with countdown
// 2. Wait for delay
// 3. Retry mutation
// 4. Repeat up to 3 times
```

**3. Toast Integration:**
- Use existing toast system
- Toast type: `info` for retry in progress
- Toast type: `error` for final failure with action button
- Auto-dismiss progress toasts when retry succeeds

### API Error Handling

GitLab API rate limit response:
```
HTTP 429 Too Many Requests
RateLimit-Limit: 600
RateLimit-Observed: 601
RateLimit-Remaining: 0
RateLimit-Reset: 1607459660
RateLimit-ResetTime: Tue, 08 Dec 2020 20:14:20 GMT
```

Could optionally read `RateLimit-Reset` header to determine exact wait time, but exponential backoff is simpler and works regardless of header availability.

### Edge Cases

1. **User navigates away during retry**: Cancel pending retry, clean up state
2. **Multiple refresh clicks**: Debounce or disable button during retry sequence
3. **Token expires during retry**: Handle gracefully, prompt re-auth
4. **Network error during retry**: Fall through to existing network error handling
5. **Rate limit clears between retries**: Success on subsequent attempt

### Security Considerations

- No secrets exposed in toast messages
- Rate limit errors don't reveal API internals
- Retry logic doesn't bypass authentication

---

## Dependencies

**Prerequisite Stories:**
- None - Can be implemented independently

**Blocked Stories:**
- None - This is the last P0 blocker for Epic 6

**External Dependencies:**
- GitLab API rate limit behavior (well-documented, stable)

---

## Definition of Done

- [ ] Code implemented and committed to feature branch
- [ ] Unit tests written and passing:
  - [ ] `fetchWithRetry` correctly handles 429 responses
  - [ ] Exponential backoff timing is correct
  - [ ] Max retry count honored
- [ ] Integration tests passing:
  - [ ] Manual refresh retry flow works end-to-end
  - [ ] Toast notifications appear correctly
- [ ] Code reviewed and approved
- [ ] Manual testing completed:
  - [ ] Verify retry countdown in UI
  - [ ] Verify final error with retry button
  - [ ] Verify existing 5xx retry still works
- [ ] Acceptance criteria validated (all checked)
- [ ] Merged to main branch

---

## Story Points Breakdown

- **Backend (gitlab-client.ts):** 1 point - Minor enhancement to existing retry logic
- **Frontend (useManualRefresh.ts):** 2 points - Retry state machine with countdown
- **Toast Integration:** 1 point - Wire up notifications
- **Testing:** 1 point - Unit and integration tests
- **Total:** 5 points

**Rationale:** Most infrastructure exists (retry logic, toast system). Main work is wiring up the retry state machine in the frontend hook and ensuring good UX with countdown visibility. Estimated 4-6 hours of focused work.

---

## Additional Notes

### Testing Strategy

**Unit Tests:**
```typescript
// gitlab-client.test.ts
describe('fetchWithRetry', () => {
  it('retries on 429 with exponential backoff', async () => {
    // Mock fetch to return 429, then 429, then 200
    // Verify delays: 1s, 2s
    // Verify final success
  });

  it('stops after max retries on persistent 429', async () => {
    // Mock fetch to always return 429
    // Verify throws after 3 attempts
    // Verify total delay ~7s (1+2+4)
  });
});
```

**Manual Testing Checklist:**
1. [ ] Trigger rate limit (may need to temporarily lower limit in test)
2. [ ] Observe toast countdown
3. [ ] Verify retry succeeds if rate limit clears
4. [ ] Verify error message after max retries
5. [ ] Click "Retry" button, verify new retry sequence starts
6. [ ] Navigate away during retry, verify cleanup

### Related FRs

- **FR6:** System can respect GitLab API rate limits with exponential backoff and user notification
- **FR88:** System can gracefully handle GitLab API rate limits with toast notification and retry with backoff

### References

- [GitLab Rate Limits Documentation](https://docs.gitlab.com/ee/user/admin_area/settings/user_and_ip_rate_limits.html)
- Epic 6 analysis: `docs/epics/epic-6-reliability-error-handling.md`
- Existing implementation: `src/server/services/gitlab-client.ts:304-344`

---

## Progress Tracking

**Status History:**
- 2025-12-11: Story created
- 2025-12-11: Implementation started
- 2025-12-11: Code complete, all acceptance criteria validated

**Actual Effort:** 5 points (matched estimate)

**Implementation Notes:**
- Used Option B (Frontend retry with countdown UI) as recommended in story
- Enhanced `useManualRefresh.ts` hook with retry state machine
- Exponential backoff: 1s, 2s, 4s delays (RETRY_DELAYS constant)
- Max 3 retries before showing final error toast
- RetryState exposed for UI components to show countdown
- Cleanup on unmount (AC9) using useEffect cleanup
- No changes needed to backend - rate limit errors bubble up to frontend
- Existing 5xx/network retry in `gitlab-client.ts` preserved (AC8)
- Inngest background jobs unchanged (AC7)

---

**This story was created using BMAD Method v6 - Phase 4 (Implementation Planning)**
