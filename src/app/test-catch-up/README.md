# Test Catch-Up Mode Page

**Path:** `/test-catch-up`

**Purpose:** Manual testing UI for Catch-Up Mode backend features (Stories 3.1-3.4)

**Status:** Active for Stories 3.1-3.4, **DELETE after Story 3.4 validation**

---

## Overview

This test page provides a UI for manually validating the catch-up mode backend implementation across Epic 3 Stories 3.1-3.4. It follows the same pattern as `/test-queries` (Story 2.7b) for testing tRPC mutations and queries.

## Stories Covered

### Story 3.1: Catch-Up Mode Backend - "New Since Last Visit" Logic ✅
**Status:** Implemented
**Endpoints:**
- `queries.getNewItems({ queryId })` - Returns events created after lastVisitedAt
- `queries.testSetup({ action: "nullLastVisited", queryId })` - Test helper to NULL lastVisitedAt

**Test Cases:**
- ✅ AC 3.1.3: getNewItems returns events created after lastVisitedAt
- ✅ AC 3.1.4: Never-visited query (NULL lastVisitedAt) returns all matching events
- ✅ AC 3.1.5: Recently visited query returns empty array
- ✅ AC 3.1.7: Response shape includes queryId, queryName, newCount, events[]
- ✅ AC 3.1.8: Query filters combined with "new since" using AND logic
- ✅ Authorization: FORBIDDEN for other user's queries
- ✅ Error handling: NOT_FOUND for invalid queryId

### Story 3.2: Catch-Up Mode View with Toggle
**Status:** Not yet implemented
**Planned Additions:**
- UI section for testing catch-up mode frontend view
- Toggle button test (switch between normal view and catch-up mode)
- Verify grouping by queries
- Test "No new items" message display

### Story 3.3: Mark Query as Reviewed
**Status:** Not yet implemented
**Planned Additions:**
- Button to call `queries.updateLastVisited({ queryId })` (or similar mutation)
- Verify lastVisitedAt updates to current timestamp
- Test that getNewItems returns empty after marking as reviewed

### Story 3.4: Sidebar New Item Badges
**Status:** Not yet implemented
**Planned Additions:**
- Display newCount badges on query list
- Verify badge counts update after marking as reviewed
- Test badge disappears when newCount = 0

---

## How to Use

### Prerequisites

1. **Login:** Navigate to `/api/auth/signin` and log in with GitLab OAuth
2. **Create Queries:** Go to `/test-queries` and create 1-2 test queries with different keywords
3. **Create Events:** Ensure you have some events in the database matching your query keywords

### Story 3.1 Manual Testing

#### Test AC 3.1.4 - Never Visited Query (NULL lastVisitedAt)

1. Navigate to `/test-catch-up`
2. Select a query from the list
3. Click **"NULL lastVisitedAt"** button
4. Click **"Get New Items"** button
5. **Expected:** Response shows ALL events matching the query's keyword filters
6. **Verify:** newCount equals total matching events, events[] array is populated

#### Test AC 3.1.5 - Recently Visited Query

1. Select a query (don't NULL it)
2. Click **"Get New Items"** button
3. Immediately click **"Get New Items"** again
4. **Expected:** Second response shows newCount: 0, empty events[] array
5. **Verify:** Activity log shows "0 new items"

#### Test AC 3.1.7 - Response Shape

1. Select a query and click **"Get New Items"**
2. **Verify in "getNewItems Response" panel:**
   - ✅ queryId: present (string)
   - ✅ queryName: present (string)
   - ✅ newCount: present (number)
   - ✅ events: present (array)

#### Test AC 3.1.8 - Filter AND Logic

1. Select a query with specific keywords (e.g., "security")
2. Click **"Get New Items"**
3. **Verify:** All returned events contain the keyword AND have createdAt > lastVisitedAt
4. **Check:** Events NOT matching keywords should NOT appear, even if they're recent

#### Test Authorization (FORBIDDEN)

1. Open Prisma Studio: `npx prisma studio`
2. Create a UserQuery with a different `userId`
3. Copy the query's `id`
4. In browser console, try to call getNewItems with that ID:
   ```javascript
   // This will fail in UI, so test via browser dev tools
   ```
5. **Expected:** [FORBIDDEN] error in activity log

#### Test NOT_FOUND Error

1. Click **"Get New Items (Fake ID)"** button
2. **Expected:** Activity log shows `[NOT_FOUND] Query not found`

---

## Extending for Future Stories

### Story 3.2 - Add Frontend View Tests

When implementing Story 3.2, add a new section to this page:

```tsx
{/* Story 3.2: Catch-Up Mode View */}
<div className="rounded-lg bg-gray-800 p-4">
  <h2 className="mb-3 text-lg font-semibold text-purple-400">
    Story 3.2: Catch-Up Mode View
  </h2>
  {/* Add toggle button, view mode selector, etc. */}
</div>
```

### Story 3.3 - Add Mark as Reviewed Tests

Add mutation for updating lastVisitedAt:

```tsx
const markReviewedMutation = api.queries.updateLastVisited.useMutation({
  onSuccess: () => {
    addLog("✅ Query marked as reviewed");
    utils.queries.list.invalidate();
  },
});
```

### Story 3.4 - Add Badge Count Tests

Display newCount badges on the query selection list:

```tsx
<div className="flex items-center justify-between">
  <div>{q.name}</div>
  {q.newCount > 0 && (
    <span className="rounded-full bg-olive-light px-2 py-1 text-xs">
      {q.newCount}
    </span>
  )}
</div>
```

---

## Cleanup

**DELETE THIS ENTIRE DIRECTORY** (`src/app/test-catch-up/`) after Story 3.4 is complete and all acceptance criteria are validated.

**Checklist before deletion:**
- [ ] Story 3.1 validated and merged
- [ ] Story 3.2 validated and merged
- [ ] Story 3.3 validated and merged
- [ ] Story 3.4 validated and merged
- [ ] All manual tests documented in story files
- [ ] No dependencies on this test page in production code

---

## Technical Notes

### Query Pattern

The page uses tRPC's `useQuery` with `enabled: false` for manual triggering:

```tsx
const getNewItemsMutation = api.queries.getNewItems.useQuery(
  { queryId: selectedQueryId },
  { enabled: false } // Only run when manually triggered
);

// Then trigger with:
const result = await getNewItemsMutation.refetch();
```

This avoids auto-fetching on mount and gives us control over when the query runs.

### State Management

- `selectedQueryId` - Tracks which query is selected for testing
- `getNewItemsData` - Stores the last response from getNewItems for display
- `log` - Activity log showing all actions and responses

### Timezone Display

The page displays `createdAt` timestamps in the user's local timezone using `new Date(event.createdAt).toLocaleString()`. This tests AC 3.1.6 indirectly (backend stores UTC, frontend displays local).

---

**Created:** 2025-11-26 (Story 3.1)
**Last Updated:** 2025-11-26
**Maintainer:** BMad Development Team
