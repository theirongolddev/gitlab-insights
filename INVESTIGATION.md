# Bug Investigation: Event Click → Logout

## User Report
"clicking on an event in dashboard, then clicking on another event triggers a getById error and then logs the user out"

## Root Cause Analysis

### 1. **DISCOVERED: Queries DON'T trigger logout on UNAUTHORIZED**
**Location:** `src/trpc/react.tsx:91`

```typescript
defaultOptions: {
  queries: {
    retry: shouldRetryError,
    refetchOnWindowFocus: false,
  },
  mutations: {
    retry: shouldRetryError,
    onError: handleUnauthorizedError,  // ← ONLY ON MUTATIONS!
  },
}
```

**Issue:** The `handleUnauthorizedError` handler that logs users out is ONLY registered for mutations, NOT queries!

This means:
- If `api.events.getById` returns UNAUTHORIZED → query fails silently, shows error UI
- User is NOT logged out automatically
- Inconsistent with mutation behavior (mutations DO log out on UNAUTHORIZED)

### 2. **DISCOVERED: Non-null assertion could cause runtime error**
**Location:** `src/components/events/EventDetail.tsx:81`

```typescript
const { data: event, isLoading, error } = api.events.getById.useQuery(
  {
    id: eventId!,  // ← Non-null assertion!
    searchTerms,
  },
  { enabled: !!eventId }
);
```

**Issue:** If `eventId` is null/undefined and React Query's `enabled` check fails to prevent the query, the `!` assertion will pass `null` as the ID, causing a server error.

### 3. **DISCOVERED: React Query cache race condition**
**Location:** `src/hooks/useEventDetailPane.ts:212-214`

```typescript
// Desktop/Tablet: Split into instant visual + debounced commit
setVisualSelectedEventId(eventId);  // Instant visual feedback (no lag)
debouncedCommit(eventId);            // Debounced side effects (200ms)
setDetailPaneOpen(true);             // Open pane immediately for UX
```

**Race Condition:**
1. User clicks Event A at T=0ms
   - `setVisualSelectedEventId("A")` - instant
   - `debouncedCommit("A")` - scheduled for T=200ms
   - EventDetail renders with `eventId="A"`
   - Query `getById({ id: "A" })` starts

2. User clicks Event B at T=100ms (before debounce completes!)
   - `setVisualSelectedEventId("B")` - instant
   - Previous debounce cancelled
   - `debouncedCommit("B")` - scheduled for T=300ms
   - EventDetail re-renders with `eventId="B"`
   - Query `getById({ id: "B" })` starts

3. At T=150ms: Query A completes (or errors)
4. At T=300ms: Query B completes

**But:**
- React Query keeps BOTH queries in cache with different keys
- If Query A errors after Query B is already displaying, the error state is visible briefly
- If the session expired between clicks, BOTH queries fail with UNAUTHORIZED
- The error UI shows "Failed to load event details"
- **BUT** user is NOT logged out because queries don't have the onError handler!

## The Real Bug

The user reports being logged out, but based on the code analysis:

**Queries with UNAUTHORIZED errors DON'T trigger automatic logout!**

This suggests one of two scenarios:

### Scenario A: Mutation is being triggered alongside the query
- Check if there's a hidden mutation (markAsRead, etc.) that runs on event click
- That mutation could be failing with UNAUTHORIZED and triggering the logout

### Scenario B: Manual session checking elsewhere
- Some component is manually checking session state and redirecting
- Could be in an effect hook that monitors query errors

## Next Steps
1. Search for any mutations triggered on event click
2. Check for useEffect hooks that monitor query error states
3. Check if useSession hook triggers logout on invalid sessions
4. Reproduce the bug to capture the exact error sequence
