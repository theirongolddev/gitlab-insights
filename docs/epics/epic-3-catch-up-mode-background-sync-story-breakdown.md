# Epic 3: Catch-Up Mode & Background Sync - Story Breakdown

**Epic Goal:** Complete primary user workflow with "inbox zero" experience and automated sync

**Timeline:** Week 2-3 (4-5 days) | **Value:** Users see "what's new since last visit" with automated background updates

---

## Story 3.1: Catch-Up Mode Backend - "New Since Last Visit" Logic

**As a** user
**I want** the system to track when I last viewed each query
**So that** I can see only new items since my last visit

**Acceptance Criteria:**
- Given a user has saved queries
- When the system tracks `last_visited_at` timestamp per query
- Then I can query for events created after that timestamp
- And the query returns only events newer than `last_visited_at`
- And if I've never visited a query, it returns all matching events
- And timestamps are stored in UTC but displayed in user's local timezone

**Backend:**
- Path: `src/server/api/routers/queries.ts`
- Add `last_visited_at` field to UserQuery Prisma model
- tRPC query: `queries.getNewItems({ queryId: string })`
- Query logic: Get events matching query filters WHERE `created_at > last_visited_at`

**Database Migration:**
```sql
-- Migration: add_last_visited_at
ALTER TABLE "UserQuery"
ADD COLUMN "last_visited_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
```

**Technical Notes:**
```typescript
export const queriesRouter = createTRPCRouter({
  getNewItems: protectedProcedure
    .input(z.object({ queryId: z.string() }))
    .query(async ({ ctx, input }) => {
      const query = await ctx.db.userQuery.findUnique({
        where: { id: input.queryId },
      });

      if (!query || query.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const lastVisited = query.last_visited_at || new Date(0);

      // Apply query filters + "new since" filter
      const newEvents = await ctx.db.event.findMany({
        where: {
          AND: [
            buildFilterWhereClause(query.filters), // From Story 2.6
            { createdAt: { gt: lastVisited } }
          ]
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        queryId: query.id,
        queryName: query.name,
        newCount: newEvents.length,
        events: newEvents,
      };
    }),
});
```

**Prerequisites:** Story 2.7a (Query CRUD backend), Story 2.6 (Filter logic)

**FR Mapping:** FR44 (New items since last visit), FR46 (Show counts)

**Definition of Done:**
- ✅ `last_visited_at` field added to UserQuery model
- ✅ Migration runs successfully
- ✅ `getNewItems` query returns correct events
- ✅ Edge case: Never visited returns all items
- ✅ Edge case: Visited 1 second ago returns empty
- ✅ Timezone handling correct (UTC storage, local display)

---

## Story 3.2: Catch-Up Mode View with Toggle

**As a** user
**I want** to toggle between Dashboard and Catch-Up Mode
**So that** I can switch between "all events" and "new events only"

**Acceptance Criteria:**
- Given I'm on the dashboard
- When I press `c` key
- Then the view switches to Catch-Up Mode
- And I see a header: "Catch-Up: X new items since [last visit time]"
- And events are grouped by my saved queries
- And each query section shows: "[Query Name] (X new items)"
- And when I press `c` again
- Then I return to normal Dashboard view
- And if I have no saved queries, I see: "Create saved queries to use Catch-Up Mode"
- And if all queries have 0 new items, I see: "All caught up! No new items since last visit."

**Frontend:**
- Component: `src/components/catchup/CatchUpView.tsx`
- Component: `src/components/catchup/CatchUpModeToggle.tsx` (button in header)
- State: `isCatchUpMode` boolean toggle
- Keyboard shortcut `c` (add to Story 2.1's ShortcutHandler)
- Fetch new items for all queries via `trpc.queries.getNewItems`

**Technical Notes:**
```typescript
const CatchUpView = () => {
  const { data: queries } = trpc.queries.list.useQuery();

  // Fetch new items for each query
  const newItemsQueries = queries?.map(q =>
    trpc.queries.getNewItems.useQuery({ queryId: q.id })
  );

  const totalNew = newItemsQueries?.reduce(
    (sum, q) => sum + (q.data?.newCount || 0),
    0
  );

  if (queries?.length === 0) {
    return <EmptyState message="Create saved queries to use Catch-Up Mode" />;
  }

  if (totalNew === 0) {
    return <EmptyState message="All caught up! No new items since last visit." />;
  }

  return (
    <div>
      <h2>Catch-Up: {totalNew} new items since {lastVisit}</h2>
      {newItemsQueries?.map(queryResult => (
        <QuerySection
          key={queryResult.data?.queryId}
          query={queryResult.data}
        />
      ))}
    </div>
  );
};

// In ShortcutHandler (Story 2.1):
case 'c':
  if (!isTyping) {
    toggleCatchUpMode();
  }
  break;
```

Header toggle button:
- Icon: Bell with badge showing total new count
- Keyboard hint: "Press c to toggle"
- Active state: Olive accent when in Catch-Up Mode

**Prerequisites:** Story 3.1 (Backend logic), Story 2.8 (Sidebar with queries)

**FR Mapping:** FR44 (Catch-Up Mode display), FR45 (Group by queries), FR46 (Show counts)

**Definition of Done:**
- ✅ `c` key toggles between Dashboard and Catch-Up views
- ✅ Catch-Up Mode groups events by query
- ✅ Total new count displayed in header
- ✅ Empty state for no queries
- ✅ Empty state for 0 new items (all caught up)
- ✅ Toggle button visible in header
- ✅ View loads <500ms

---

## Story 3.3: Mark Query as Reviewed

**As a** user
**I want** to mark a query as reviewed
**So that** items I've seen are no longer shown as "new"

**Acceptance Criteria:**
- Given I'm in Catch-Up Mode viewing new items for a query
- When I click "Mark as Reviewed" button for that query
- Then `last_visited_at` is updated to current timestamp
- And the query's new item count updates to 0
- And the items disappear from the Catch-Up view
- And I see a toast: "[Query name] marked as reviewed"
- And the sidebar badge for that query updates to 0

**Frontend:**
- Component: `src/components/catchup/MarkAsReviewedButton.tsx`
- Button placement: Below each query section in Catch-Up view
- Call `trpc.queries.markAsReviewed.mutate()`
- Optimistic UI update (immediately hide items)

**Backend:**
- Path: `src/server/api/routers/queries.ts`
- tRPC mutation: `queries.markAsReviewed({ queryId: string })`
- Updates `last_visited_at` to NOW

**Technical Notes:**
```typescript
// Backend
markAsReviewed: protectedProcedure
  .input(z.object({ queryId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const query = await ctx.db.userQuery.findUnique({
      where: { id: input.queryId },
    });

    if (!query || query.userId !== ctx.session.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    return ctx.db.userQuery.update({
      where: { id: input.queryId },
      data: { last_visited_at: new Date() },
    });
  }),

// Frontend - Optimistic update
const markAsReviewed = trpc.queries.markAsReviewed.useMutation({
  onMutate: async ({ queryId }) => {
    // Cancel outgoing fetches
    await utils.queries.getNewItems.cancel();

    // Optimistically update to empty
    utils.queries.getNewItems.setData(
      { queryId },
      (old) => ({ ...old, newCount: 0, events: [] })
    );
  },
  onSuccess: () => {
    toast.success(`${queryName} marked as reviewed`);
  },
});
```

Button styling:
- Secondary style (not primary action)
- Shows checkmark icon
- Disabled state when no new items

**Prerequisites:** Story 3.2 (Catch-Up view), Story 3.1 (Backend)

**FR Mapping:** FR47 (Mark individual queries as reviewed)

**Definition of Done:**
- ✅ Button marks query as reviewed
- ✅ `last_visited_at` updated to NOW
- ✅ New count updates to 0 immediately (optimistic)
- ✅ Items removed from Catch-Up view
- ✅ Toast notification shows
- ✅ Sidebar badge updates
- ✅ Action completes <200ms

---

## Story 3.4: Sidebar New Item Badges

**As a** user
**I want** to see badge counts on sidebar queries
**So that** I know which queries have new items without entering Catch-Up Mode

**Acceptance Criteria:**
- Given I'm viewing any page with the sidebar visible
- When a query has new items
- Then I see a badge with the count next to the query name
- And the badge has olive background (#9DAA5F)
- And the badge updates when I mark a query as reviewed
- And queries with 0 new items show no badge

**Frontend:**
- Modify: `src/components/queries/QuerySidebar.tsx` (from Story 2.8)
- Fetch new counts for all queries
- Display badge component next to query name
- Update on mark-reviewed action

**Technical Notes:**
```typescript
const QuerySidebar = () => {
  const { data: queries } = trpc.queries.list.useQuery();

  return (
    <nav className="sidebar">
      {queries?.map((query, index) => (
        <Link
          key={query.id}
          href={`/queries/${query.id}`}
          className="query-item"
        >
          <span className="query-name">{query.name}</span>
          <span className="shortcut-hint">{index + 1}</span>
          <NewItemsBadge queryId={query.id} />
        </Link>
      ))}
    </nav>
  );
};

const NewItemsBadge = ({ queryId }: { queryId: string }) => {
  const { data } = trpc.queries.getNewItems.useQuery({ queryId });

  if (!data || data.newCount === 0) return null;

  return (
    <span className="badge bg-olive-500 text-white px-2 py-0.5 rounded-full text-xs">
      {data.newCount}
    </span>
  );
};
```

Badge styling:
- Background: #9DAA5F (olive)
- Text: White
- Border radius: Full (pill shape)
- Font size: 11px
- Positioned right side of query name

**Prerequisites:** Story 3.1 (New items backend), Story 2.8 (Sidebar)

**FR Mapping:** FR51 (Sidebar badges show new counts), FR49 (Badge shows total new count)

**Definition of Done:**
- ✅ Badges visible on sidebar queries
- ✅ Correct new count displayed
- ✅ Badge hidden when count is 0
- ✅ Olive background color used
- ✅ Updates in real-time after mark-reviewed
- ✅ Accessible (screen reader announces count)

---

## Story 3.5: Inngest Background Polling Job

**As a** developer
**I want** a scheduled background job that polls GitLab API
**So that** events are automatically fetched every 5-15 minutes

**Acceptance Criteria:**
- Given the Inngest background job is deployed
- When the scheduled time arrives (every 10 minutes by default)
- Then the job fetches new events from GitLab API for all monitored projects
- And events are stored in the database (upsert pattern)
- And the job completes in <10 seconds for typical project sizes
- And the job logs success/failure to Inngest dashboard
- And if the job fails, it retries with exponential backoff (up to 3 times)

**Backend:**
- Path: `src/inngest/api-polling.ts`
- Path: `src/app/api/inngest/route.ts` (webhook endpoint)
- Install Inngest SDK: `npm install inngest`
- Create scheduled function with cron trigger
- Reuse GitLab API client from Story 1.5

**Technical Notes:**
```typescript
// src/inngest/client.ts
import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'gitlab-insights',
  name: 'GitLab Insights'
});

// src/inngest/api-polling.ts
import { inngest } from './client';
import { fetchAndStoreEvents } from '@/lib/gitlab/api-client';

export const apiPollingJob = inngest.createFunction(
  {
    id: "gitlab-api-polling",
    name: "GitLab API Polling",
    retries: 3,
  },
  { cron: "*/10 * * * *" }, // Every 10 minutes
  async ({ event, step }) => {
    console.log('Starting GitLab API polling...');

    // Get all users and their monitored projects
    const users = await step.run('fetch-users', async () => {
      return prisma.user.findMany({
        include: { monitoredProjects: true }
      });
    });

    // Fetch events for each user's projects
    for (const user of users) {
      await step.run(`fetch-events-user-${user.id}`, async () => {
        // Reuse logic from Story 1.5
        return fetchAndStoreEvents(user.id, user.monitoredProjects);
      });
    }

    return { success: true, usersProcessed: users.length };
  }
);

// src/app/api/inngest/route.ts
import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { apiPollingJob } from '@/inngest/api-polling';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [apiPollingJob],
});
```

**Environment Variables:**
```
INNGEST_EVENT_KEY=your_event_key
INNGEST_SIGNING_KEY=your_signing_key
```

**Deployment:**
- Deploy to Inngest Cloud (free tier)
- Register function via Inngest dashboard
- Monitor execution via Inngest dashboard

**Prerequisites:** Story 1.5 (GitLab API client), Story 1.2 (Database schema)

**FR Mapping:** FR4 (Schedule background polling), FR70 (>95% success rate)

**Definition of Done:**
- ✅ Inngest SDK installed and configured
- ✅ Scheduled job runs every 10 minutes
- ✅ Events fetched and stored successfully
- ✅ Job completes <10s for typical workload
- ✅ Retry logic works (3 attempts with backoff)
- ✅ Success/failure logged to Inngest dashboard
- ✅ Monitored for 24 hours, >95% success rate

---

## Story 3.6: Last Sync Indicator

**As a** user
**I want** to see when data was last refreshed
**So that** I know if I'm viewing current information

**Acceptance Criteria:**
- Given I'm on any page
- When I look at the header
- Then I see "Last synced: X minutes ago"
- And the timestamp updates after background polling completes
- And the timestamp shows relative time (e.g., "2 minutes ago", "1 hour ago")
- And if sync is currently running, I see "Syncing..." with spinner
- And if last sync failed, I see "Sync failed - trying again" with retry time

**Frontend:**
- Component: `src/components/sync/SyncIndicator.tsx`
- Placement: Header, right side (near user avatar)
- Use `date-fns` `formatDistance` for relative time
- Poll for updates every 30 seconds
- Subscribe to sync completion events

**Backend:**
- Add `last_synced_at` timestamp to global app state
- Update after Inngest job completes
- Expose via tRPC query: `sync.getStatus()`

**Technical Notes:**
```typescript
const SyncIndicator = () => {
  const { data: syncStatus } = trpc.sync.getStatus.useQuery(
    undefined,
    { refetchInterval: 30000 } // Poll every 30s
  );

  if (!syncStatus) return null;

  const { lastSyncedAt, status, nextSyncAt } = syncStatus;

  if (status === 'syncing') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Spinner size="sm" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 text-sm text-red-400">
        <AlertIcon />
        <span>Sync failed - retrying in {formatDistance(nextSyncAt, new Date())}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <CheckIcon className="text-olive-500" />
      <span>Last synced: {formatDistanceToNow(lastSyncedAt, { addSuffix: true })}</span>
    </div>
  );
};
```

**Prerequisites:** Story 3.5 (Background polling job)

**FR Mapping:** FR7 (Display last sync timestamp), FR34 (Last sync time)

**Definition of Done:**
- ✅ Sync indicator visible in header
- ✅ Shows relative time ("2 minutes ago")
- ✅ Updates every 30 seconds
- ✅ Shows "Syncing..." during active sync
- ✅ Shows error state if sync fails
- ✅ Timestamp accurate (within 1 minute)

---

## Story 3.7: Manual Refresh Button with `r` Shortcut

**As a** user
**I want** to manually trigger a refresh
**So that** I can get the latest data immediately without waiting for scheduled sync

**Acceptance Criteria:**
- Given I'm on the dashboard
- When I press `r` key OR click the refresh button
- Then a manual sync is triggered immediately
- And I see a loading indicator during the refresh
- And after completion (<3 seconds), I see a toast: "Refreshed! X new items found"
- And the last sync indicator updates to "just now"
- And the dashboard updates with new events

**Frontend:**
- Component: `src/components/sync/RefreshButton.tsx` (enhance from Story 1.5)
- Keyboard shortcut `r` (add to Story 2.1's ShortcutHandler)
- Loading state during refresh
- Toast notification on completion

**Backend:**
- tRPC mutation: `sync.triggerManualRefresh()`
- Calls Inngest API to trigger immediate job execution
- Returns count of new events found

**Technical Notes:**
```typescript
const RefreshButton = () => {
  const utils = trpc.useUtils();
  const { mutate: refresh, isLoading } = trpc.sync.triggerManualRefresh.useMutation({
    onSuccess: (data) => {
      toast.success(`Refreshed! ${data.newItemsCount} new items found`);
      // Invalidate queries to refetch
      utils.events.invalidate();
      utils.queries.getNewItems.invalidate();
    },
    onError: () => {
      toast.error('Refresh failed. Please try again.');
    },
  });

  return (
    <Button
      onPress={() => refresh()}
      isDisabled={isLoading}
      className="flex items-center gap-2"
    >
      {isLoading ? <Spinner /> : <RefreshIcon />}
      <span>Refresh (r)</span>
    </Button>
  );
};

// In ShortcutHandler (Story 2.1):
case 'r':
  if (!isTyping) {
    triggerManualRefresh();
  }
  break;

// Backend - trigger Inngest job immediately
triggerManualRefresh: protectedProcedure
  .mutation(async ({ ctx }) => {
    // Send event to Inngest to trigger immediate execution
    await inngest.send({
      name: 'gitlab/manual-refresh',
      data: { userId: ctx.session.user.id }
    });

    // Or call the polling logic directly for immediate response
    const result = await fetchAndStoreEvents(
      ctx.session.user.id,
      userMonitoredProjects
    );

    return {
      success: true,
      newItemsCount: result.newEvents,
    };
  }),
```

Button placement:
- Header, next to sync indicator
- Icon: Refresh/reload circular arrow
- Keyboard hint visible on hover

**Prerequisites:** Story 3.5 (Background polling), Story 2.1 (Keyboard shortcuts)

**FR Mapping:** FR5 (Manual refresh), FR60 (`r` shortcut), FR73 (<3s manual refresh)

**Definition of Done:**
- ✅ `r` key triggers manual refresh
- ✅ Button triggers manual refresh
- ✅ Loading state visible during refresh
- ✅ Refresh completes <3 seconds
- ✅ Toast shows new item count
- ✅ Dashboard updates with new events
- ✅ Last sync indicator updates to "just now"
- ✅ Error handling if refresh fails

---

**Epic 3 Summary:**
- **7 stories** delivering Catch-Up Mode and background automation
- **Timeline:** 4-5 days (solo developer, some parallel work)
- **Demo-able:** "Inbox zero" workflow - users see what's new, mark as reviewed, automated updates
- **Value:** Primary user workflow complete - automated monitoring with catch-up

**Epic 3 Definition of Done:**
✅ All 7 stories complete
✅ End-to-end Catch-Up workflow test passes (manual refresh → Catch-Up → mark reviewed → verify)
✅ Background job monitored for 24 hours, >95% success rate
✅ Performance: <500ms Catch-Up view load, <200ms mark-reviewed action
✅ Keyboard shortcuts: `c` toggle Catch-Up Mode, `r` manual refresh
✅ No race conditions between mark-reviewed and background polling
✅ Empty states work: "No queries", "All caught up"
✅ Sync indicator accurate (within 1 minute)
✅ No regression: Epic 1-2 functionality still works

---
