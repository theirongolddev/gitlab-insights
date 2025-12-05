# Story 6-2: Route Architecture Refactor

**Epic:** Epic 6 - Reliability & Error Handling
**Status:** Done
**Completed:** 2025-12-05

## Problem Statement

The original route architecture had `AppLayout` wrapping all routes in the root layout, which caused:

1. **Auth-required API calls on public pages** - `NewItemsProvider` made queries (`queries.list`, `events.getLastSync`) even on the `/` login page
2. **UNAUTHORIZED errors on login** - With story 6-x's token refresh, failed auth triggered sign-out flows on the login page itself
3. **Mixed concerns** - Single layout trying to handle both authenticated and public states with conditionals
4. **Poor separation** - No clear distinction between public and authenticated routes

## Solution

Restructured routes using Next.js route groups for clean separation:

```
src/app/
  (auth)/                    # Route group for authenticated pages
    layout.tsx               # Server-side auth check + AuthenticatedLayout
    dashboard/page.tsx
    queries/[id]/page.tsx
    settings/page.tsx
    onboarding/page.tsx
  (public)/                  # Route group for public pages  
    layout.tsx               # Simple layout, no auth providers
    login/page.tsx           # Login page with GitLab button
  layout.tsx                 # Root layout (Providers, Header only)
  page.tsx                   # Smart redirect: auth → dashboard, unauth → login
```

## Acceptance Criteria

- [x] **AC1:** `/` route performs server-side redirect based on auth status
  - Authenticated → `/dashboard`
  - Unauthenticated → `/login`

- [x] **AC2:** `/login` route exists as dedicated login page
  - Shows GitLab sign-in button
  - No auth-required API calls
  - Redirects to dashboard if already authenticated

- [x] **AC3:** All auth-required routes use `(auth)` route group
  - `/dashboard`, `/queries/[id]`, `/settings`, `/onboarding`
  - Server-side auth check redirects unauthenticated users to `/login`

- [x] **AC4:** AuthenticatedLayout only renders for authenticated routes
  - No more `NewItemsProvider` or `BackgroundSyncWatcher` on public pages
  - Sidebar shown on appropriate routes (not onboarding)

- [x] **AC5:** Sign-out redirects to `/login` instead of `/`
  - Header sign-out button
  - TRPC UNAUTHORIZED error handler

## Technical Implementation

### Files Created

1. **`src/app/(auth)/layout.tsx`**
   - Server-side auth check with `getServerSession()`
   - Redirects unauthenticated to `/login`
   - Wraps children in `AuthenticatedLayout`

2. **`src/app/(public)/layout.tsx`**
   - Simple layout with no auth providers
   - Just renders children in a `<main>` tag

3. **`src/app/(public)/login/page.tsx`**
   - GitLab OAuth sign-in button
   - Client-side redirect if already authenticated

4. **`src/components/layout/AuthenticatedLayout.tsx`**
   - Extracted from old `AppLayout`
   - `NewItemsProvider`, `BackgroundSyncWatcher`, `QuerySidebar`
   - Conditionally hides sidebar on `/onboarding`

### Files Modified

1. **`src/app/page.tsx`**
   - Changed from login UI to server-side redirect logic

2. **`src/app/layout.tsx`**
   - Removed `AppLayout` wrapper
   - Just renders `Header` + `{children}`

3. **`src/trpc/react.tsx`**
   - Updated UNAUTHORIZED handler to redirect to `/login`

4. **`src/components/layout/Header.tsx`**
   - Updated sign-out to redirect to `/login`

### Files Moved

- `src/app/dashboard/` → `src/app/(auth)/dashboard/`
- `src/app/queries/` → `src/app/(auth)/queries/`
- `src/app/settings/` → `src/app/(auth)/settings/`
- `src/app/onboarding/` → `src/app/(auth)/onboarding/`

### Files Deleted

- `src/components/layout/AppLayout.tsx` (replaced by `AuthenticatedLayout`)

## Route Flow Diagrams

### Unauthenticated User

```
User visits /
     ↓
Server: getServerSession() → null
     ↓
redirect("/login")
     ↓
Login page renders (no auth queries)
     ↓
User clicks "Sign in with GitLab"
     ↓
OAuth flow → callback → redirect to /dashboard
     ↓
(auth) layout: getServerSession() → session
     ↓
AuthenticatedLayout renders with sidebar
```

### Authenticated User

```
User visits /
     ↓
Server: getServerSession() → session
     ↓
redirect("/dashboard")
     ↓
(auth) layout: getServerSession() → session
     ↓
AuthenticatedLayout renders with sidebar
```

### Token Expiry (Story 6-x)

```
User on /dashboard, token expires
     ↓
API call triggers getGitLabAccessToken()
     ↓
Token refresh fails (refresh token also expired)
     ↓
UNAUTHORIZED error returned
     ↓
TRPC handleUnauthorizedError()
     ↓
signOut() + redirect to /login
     ↓
Login page renders (clean state, no errors)
```

## Benefits

1. **No more UNAUTHORIZED errors on login page** - Public routes never make auth-required calls
2. **Clear mental model** - Developers know which routes require auth
3. **Future-proof** - `/` can become a marketing landing page
4. **Better error handling** - UNAUTHORIZED on auth routes is a real error, not a race condition
5. **Simpler code** - No conditional auth checks scattered throughout layouts

## Testing Notes

1. Visit `/` when logged out → should redirect to `/login`
2. Visit `/` when logged in → should redirect to `/dashboard`
3. Visit `/login` when logged in → should redirect to `/dashboard`
4. Visit `/dashboard` when logged out → should redirect to `/login`
5. Sign out → should redirect to `/login`
6. Token expiry → should sign out and redirect to `/login`

## Related

- Story 6-x: Session Token Refresh (prerequisite - exposed the architecture issue)
- Story 2.8: Sidebar Navigation
- Story 3.4: Sidebar New Item Badges
