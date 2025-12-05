# Story 6-x: Session Token Refresh

**Epic:** Epic 6 - Reliability & Error Handling
**Status:** Done
**Completed:** 2025-12-05

## Problem Statement

When the OAuth access token acquired after logging in with GitLab expires (after 2 hours), API calls fail silently. The manual refresh button triggers a popup warning, but that's still poor UX. Users should not need to manually re-authenticate when their session is still valid but the access token has expired.

## Solution

Implement automatic OAuth token refresh using better-auth's `getAccessToken` API, which:
1. Returns the current access token if still valid
2. Automatically refreshes the token using the refresh token if expired
3. Returns an error if the refresh token is also expired/revoked

Additionally, implement client-side handling to force logout and redirect to login when token refresh fails (e.g., refresh token expired or revoked).

## Acceptance Criteria

- [x] **AC1:** GitLab access tokens are automatically refreshed when expired
  - Using better-auth's `auth.api.getAccessToken({ body: { providerId: "gitlab", userId } })`
  - Token refresh happens transparently before API calls

- [x] **AC2:** All server-side GitLab API calls use the auto-refresh mechanism
  - `events.manualRefresh` mutation
  - `gitlab.listUserProjects` query
  - Inngest background polling job

- [x] **AC3:** When token refresh fails, user is forced to re-authenticate
  - Client receives UNAUTHORIZED error
  - QueryClient configured to not retry UNAUTHORIZED errors
  - Mutations trigger automatic sign-out and redirect to home page

- [x] **AC4:** Background sync job handles expired tokens gracefully
  - Skips users whose tokens cannot be refreshed
  - Logs appropriate warnings for debugging
  - Continues processing other users

## Technical Implementation

### Files Modified

1. **`src/server/services/gitlab-token.ts`** (new)
   - Created centralized token utility
   - Uses `auth.api.getAccessToken()` for auto-refresh
   - Throws TRPC `UNAUTHORIZED` error on failure

2. **`src/server/api/routers/events.ts`**
   - Replaced direct DB token lookup with `getGitLabAccessToken()`
   - Removed redundant null checks (utility handles this)

3. **`src/server/api/routers/gitlab.ts`**
   - Same pattern as events router

4. **`src/inngest/functions/api-polling.ts`**
   - Uses `getGitLabAccessToken()` for each user
   - Handles both TRPCError and GitLabAPIError for 401s
   - No longer fetches accounts in initial query

5. **`src/trpc/react.tsx`**
   - Added global `handleUnauthorizedError` for mutations
   - Clears query cache before sign-out
   - Redirects to home page after sign-out

### How Token Refresh Works

```
User makes API call
       ↓
getGitLabAccessToken(userId)
       ↓
auth.api.getAccessToken({ providerId: "gitlab", userId })
       ↓
   ┌───────────────────────────────────────┐
   │ Better-auth internally:               │
   │ 1. Checks if accessToken is expired   │
   │ 2. If expired, uses refreshToken to   │
   │    call GitLab's /oauth/token         │
   │ 3. Updates tokens in database         │
   │ 4. Returns fresh accessToken          │
   └───────────────────────────────────────┘
       ↓
   (returns accessToken)
       ↓
GitLab API call with fresh token
```

### Error Flow

```
Token refresh fails (refresh token expired)
       ↓
getGitLabAccessToken throws UNAUTHORIZED
       ↓
tRPC returns UNAUTHORIZED to client
       ↓
QueryClient onError handler triggers
       ↓
handleUnauthorizedError():
  1. Clears query cache
  2. Calls signOut()
  3. Redirects to /
```

## Testing Notes

- Token expiry is 2 hours for access tokens
- Refresh tokens have longer validity (varies by GitLab config)
- To test token refresh: manually expire the access token in DB and make an API call
- To test forced logout: delete both tokens from DB and make an API call

## Dependencies

- better-auth with OAuth provider support
- GitLab OAuth application with refresh token enabled (default)

## Related

- Epic 6: Reliability & Error Handling
- FR8: Graceful handling of API unavailability
- FR90: Graceful handling of API unavailability
