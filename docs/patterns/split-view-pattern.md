# Split View Pattern - Implementation Guide

**Last Updated:** 2025-12-08
**Epic:** 4 - Split View & Detail Navigation
**Stories:** 4.1, 4.2, 4.3

---

## Overview

The Split View pattern provides a consistent way to display list and detail views across the application. On desktop/tablet, it shows a split pane layout with details on the right. On mobile, it navigates to a full-screen detail page.

## Quick Start

### 1. Import the Hook

```typescript
import { useEventDetailPane } from "~/hooks/useEventDetailPane";
```

### 2. Configure the Hook

```typescript
const { selectedEventId, handleRowClick } = useEventDetailPane({
  baseUrl: '/your-page',           // Required: Base URL for routing
  persistenceKey: 'your-key',      // Optional: localStorage key
  preserveParams: ['param1'],      // Optional: URL params to preserve
});
```

### 3. Wire Up Components

```typescript
<SplitView
  listContent={
    <EventTable
      events={events}
      selectedEventId={selectedEventId}
      onRowClick={handleRowClick}
    />
  }
  detailContent={<EventDetail eventId={selectedEventId} />}
  selectedEventId={selectedEventId}
/>
```

---

## Real-World Examples

### Example 1: Dashboard Page

**File:** `src/components/dashboard/DashboardClient.tsx`

**Requirements:**
- Show all events from all queries
- Preserve `?mode=catchup` parameter when switching events
- No localStorage persistence (events change frequently)

**Implementation:**
```typescript
const { selectedEventId, handleRowClick } = useEventDetailPane({
  baseUrl: '/dashboard',
  preserveParams: ['mode'], // Keep ?mode=catchup when clicking rows
});
```

**Behavior:**
- Desktop: Click row → Split pane opens with event details
- URL: `/dashboard?mode=catchup&detail=event-123`
- Mobile: Click row → Navigate to `/events/event-123`

### Example 2: Query Page

**File:** `src/components/queries/QueryDetailClient.tsx`

**Requirements:**
- Show events for a specific query
- Remember last viewed event when returning to query
- No other URL params to preserve

**Implementation:**
```typescript
const { selectedEventId, handleRowClick } = useEventDetailPane({
  baseUrl: `/queries/${queryId}`,
  persistenceKey: `query-${queryId}`, // Remember last event per query
});
```

**Behavior:**
- Desktop: Click row → Split pane opens with event details
- URL: `/queries/abc-123?detail=event-456`
- Return to query later → Last viewed event auto-selected (if pane was open)
- Mobile: Click row → Navigate to `/events/event-456`

### Example 3: Hypothetical Catch-Up Mode Page

**Requirements:**
- Show only new/unread events
- Preserve both `mode` and `filter` params
- Track last viewed new item

**Implementation:**
```typescript
const { selectedEventId, handleRowClick } = useEventDetailPane({
  baseUrl: '/dashboard',
  preserveParams: ['mode', 'filter'],
  persistenceKey: 'catchup-mode',
});
```

**Behavior:**
- URL: `/dashboard?mode=catchup&filter=unread&detail=event-789`
- All params preserved when switching events
- Last viewed new item restored on return

---

## Hook API Reference

### `useEventDetailPane(options)`

**Parameters:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `baseUrl` | `string` | ✅ Yes | Base URL path for the page (e.g., "/dashboard" or "/queries/:id") |
| `persistenceKey` | `string` | ❌ No | localStorage key prefix for persisting last selected event. If provided, creates key like `gitlab-insights-last-event-${persistenceKey}` |
| `preserveParams` | `string[]` | ❌ No | Array of URL params to preserve when updating detail param. Example: `['mode', 'filter']` |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `selectedEventId` | `string \| null` | Currently selected event ID (or null if none selected) |
| `handleRowClick` | `(event: DashboardEvent) => void` | Handler to call when a row is clicked. Handles mobile vs desktop logic automatically |
| `isDetailPaneOpen` | `boolean` | Whether detail pane is currently open (from DetailPaneContext) |
| `isMobile` | `boolean` | Whether current viewport is mobile (<768px) |

---

## How It Works

### Initialization (Mount)

1. **Check URL params:** Look for `?detail=` parameter
2. **Check localStorage:** If persistenceKey provided and pane was open, restore last selected event
3. **Priority:** URL param > localStorage > null

### Row Click (Desktop/Tablet)

1. User clicks row → `handleRowClick(event)` called
2. Check `isMobile` → If false (desktop/tablet):
   - Update `selectedEventId` state
   - Open detail pane via `DetailPaneContext`
   - Save to localStorage (if persistenceKey provided)
   - Update URL: `${baseUrl}?${preservedParams}&detail=${eventId}`

### Row Click (Mobile)

1. User clicks row → `handleRowClick(event)` called
2. Check `isMobile` → If true:
   - Navigate to `/events/${eventId}` (full-screen page)
   - No state updates needed

### URL Synchronization

- Listens to `searchParams` changes (browser back/forward)
- If `?detail` param changes → Opens detail pane automatically
- Shallow routing used (`{ scroll: false }`) to avoid page reloads

### localStorage Persistence

**Key Format:** `gitlab-insights-last-event-${persistenceKey}`

**Example Keys:**
- `gitlab-insights-last-event-query-abc-123`
- `gitlab-insights-last-event-catchup-mode`

**Restoration Logic:**
1. Only restore if detail pane was open (check `gitlab-insights-split-view-open`)
2. Only restore if no URL param present (URL takes priority)
3. Graceful degradation if localStorage unavailable

---

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│ Page Component (Dashboard/QueryDetail)     │
│                                             │
│  useEventDetailPane({                       │
│    baseUrl: '/page',                        │
│    persistenceKey: 'key',                   │
│    preserveParams: ['mode']                 │
│  })                                         │
│      ↓                                      │
│  { selectedEventId, handleRowClick }       │
└─────────────────┬───────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼────┐     ┌─────▼──────┐
    │ EventTa │     │ EventDetai │
    │ ble     │     │ l          │
    │         │     │            │
    │ Props:  │     │ Props:     │
    │ - event │     │ - eventId  │
    │   s     │     │            │
    │ - selec │     │ Fetches:   │
    │   tedEv │     │ - Full     │
    │   entId │     │   event    │
    │ - onRow │     │   data     │
    │   Click │     │ - Renders  │
    └─────────┘     │   detail   │
                    └────────────┘
```

---

## Testing Checklist

When implementing split view on a new page:

### Desktop/Tablet Testing
- [ ] Click row → Detail pane opens
- [ ] Click different row → Detail pane updates (no close/reopen)
- [ ] URL updates with `?detail=` param
- [ ] Browser back button → Detail pane closes
- [ ] Browser forward button → Detail pane reopens
- [ ] Deep link with `?detail=` → Auto-opens detail pane
- [ ] Selected row shows visual highlight (olive color)

### Mobile Testing
- [ ] Click row → Navigate to `/events/:id`
- [ ] Back button → Return to list view
- [ ] No split pane visible
- [ ] Full-screen detail page renders correctly

### URL Param Preservation
- [ ] preserveParams list maintained when switching events
- [ ] Params not in list are removed
- [ ] Special chars in params handled correctly

### localStorage Persistence (if enabled)
- [ ] Last selected event restored on return
- [ ] Only restores if pane was open
- [ ] URL param takes priority over localStorage
- [ ] Works in private browsing (graceful degradation)

---

## Common Pitfalls

### ❌ Don't: Manage selectedEventId locally

```typescript
// BAD - defeats the purpose of the hook
const [localSelectedId, setLocalSelectedId] = useState(null);
const { handleRowClick } = useEventDetailPane({...});
```

### ✅ Do: Use the hook's selectedEventId

```typescript
// GOOD - hook manages state
const { selectedEventId, handleRowClick } = useEventDetailPane({...});
```

### ❌ Don't: Call handleRowClick without the full event object

```typescript
// BAD - hook needs the full event
handleRowClick(eventId); // Type error
```

### ✅ Do: Pass the full event object

```typescript
// GOOD - hook extracts what it needs
handleRowClick(event);
```

### ❌ Don't: Forget to pass selectedEventId to EventTable

```typescript
// BAD - no visual highlighting
<EventTable events={events} onRowClick={handleRowClick} />
```

### ✅ Do: Pass selectedEventId for highlighting

```typescript
// GOOD - selected row is highlighted
<EventTable
  events={events}
  selectedEventId={selectedEventId}
  onRowClick={handleRowClick}
/>
```

---

## Related Documentation

- **Architecture:** [docs/architecture.md](../architecture.md) - Split Pane Pattern section
- **Story 4.1:** [docs/sprint-artifacts/4-1-split-pane-component-with-toggle-button.md](../sprint-artifacts/4-1-split-pane-component-with-toggle-button.md)
- **Story 4.2:** [docs/sprint-artifacts/4-2-detail-pane-content-rendering.md](../sprint-artifacts/4-2-detail-pane-content-rendering.md)
- **Story 4.3:** [docs/sprint-artifacts/4-3-auto-update-detail-on-row-click.md](../sprint-artifacts/4-3-auto-update-detail-on-row-click.md)
- **Hook Source:** [src/hooks/useEventDetailPane.ts](../../src/hooks/useEventDetailPane.ts)

---

## Maintenance Notes

**Last Refactored:** 2025-12-08 (Story 4.3)
**Code Reduction:** 85+ lines eliminated by extracting common logic
**Current Usage:** Dashboard, Query Detail pages
**Breaking Changes:** None expected - hook API is stable
