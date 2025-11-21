# Functional Requirements Inventory

## Event Capture & Storage
- **FR1:** System can poll GitLab API for issues, merge requests, and comments (create, update, close, reopen events)
- **FR2:** System can store API-fetched events with essential metadata: title, body, author, project, labels, timestamp, event type, GitLab URL
- **FR3:** System can update existing stored events when API polling detects changes (keeps data fresh, prevents staleness)
- **FR4:** System can schedule background polling every 5-15 minutes (configurable interval)
- **FR5:** System can handle manual refresh requests to fetch latest data immediately
- **FR6:** System can respect GitLab API rate limits with exponential backoff and user notification
- **FR7:** System can display last successful sync timestamp to user
- **FR8:** System can continue operating with stored data when GitLab API temporarily unavailable

## Search & Retrieval
- **FR9:** Users can search across all stored events with <1 second response time
- **FR10:** Users can search by keywords, labels, authors, projects, date ranges
- **FR11:** Search results can show matching items across all event types (Issues, MRs, Comments)
- **FR12:** Users can see which search terms matched in results (keyword highlighting, transparent relevance)
- **FR13:** Users can view event details and click through to GitLab to see full discussion

## Filtering System
- **FR14:** Users can apply temporary filters to current view (keyword, label, author, project, event type, date range)
- **FR15:** Filters can persist across sections when scrolling (apply "keyword: auth" → all sections show only matching items)
- **FR16:** Users can clear filters to return to unfiltered view
- **FR17:** Users can see which filters are currently active
- **FR18:** Users can combine multiple filters (AND/OR logic)

## Query Management
- **FR19:** Users can save filter combinations as persistent queries with custom names
- **FR20:** Saved queries can appear in sidebar navigation
- **FR21:** Users can click a saved query to navigate to its dedicated page
- **FR22:** Users can edit query filters after creation (modify keywords, labels, scope)
- **FR23:** Users can delete queries that are no longer useful
- **FR24:** System can show query effectiveness metrics (match count, items since last viewed)
- **FR25:** Users can create queries from search results ("Save this search as query")
- **FR26:** Users can create queries from active filters on dashboard ("Save current filters as query")

## Dashboard View
- **FR27:** Users can view main dashboard with sectioned layout: Issues section, Merge Requests section, Comments section
- **FR28:** Users can scroll through sections to see recent events of each type
- **FR29:** Users can jump between sections using keyboard shortcuts (absolute: 1/2/3, relative: Ctrl+d/Ctrl+u)
- **FR30:** Dashboard can show unfiltered events by default (all recent activity)
- **FR31:** Dashboard scroll position can persist when navigating away and returning
- **FR32:** Users can toggle digest cards on dashboard to show/hide highlights from saved queries
- **FR33:** Users can trigger manual refresh to fetch latest data from GitLab API
- **FR34:** Dashboard displays last sync timestamp and next scheduled refresh time

## Query Page View
- **FR35:** Each saved query can have dedicated page with same sectioned layout (Issues, MRs, Comments)
- **FR36:** Query pages can show only events matching the query's filters
- **FR37:** Query page sections can display item counts (e.g., "Issues (5)", "MRs (3)")
- **FR38:** Users can edit query filters on query pages with save prompt before navigating away

## View Toggle
- **FR39:** Users can toggle between Card view and Table view for event display
- **FR40:** Card view can show title, snippet, metadata, labels, author avatar
- **FR41:** Table view can show title and key metadata in compact columnar format
- **FR42:** View preference can persist per page (dashboard, individual query pages)
- **FR43:** View toggle applies to all sections on current page

## Catch-Up Mode
- **FR44:** Dashboard can display Catch-Up Mode showing items new since last user login/review
- **FR45:** Catch-Up Mode can group items by saved queries (not base dashboard)
- **FR46:** Each Catch-Up section can show query name, item counts by type, and new items
- **FR47:** Users can mark individual queries as reviewed in Catch-Up Mode
- **FR48:** Users can "Mark All as Reviewed" to reset baseline
- **FR49:** Catch-Up Mode badge can show total count of new items across all queries
- **FR50:** Catch-Up Mode can respect 5-15 items per query target (not 0, not 100)
- **FR51:** Sidebar query badges show count of new items since last viewed for each query

## Keyboard Navigation
- **FR52:** Users can focus search bar with `/` keyboard shortcut
- **FR53:** Users can navigate items within sections with j/k keys (vim-style)
- **FR54:** Users can open selected item in GitLab with o or Enter key
- **FR55:** Users can mark current item as reviewed with `m` keyboard shortcut
- **FR56:** Users can toggle Card/Table view with `v` keyboard shortcut
- **FR57:** Users can view keyboard shortcut help with `?` key
- **FR58:** All interactive elements can be accessible via keyboard (tab navigation)
- **FR59:** Keyboard focus indicators can be visible for all interactive elements
- **FR60:** Users can trigger manual refresh with keyboard shortcut (r)

## User Settings & Preferences
- **FR61:** Users can configure filter preferences (default filters, favorite queries)
- **FR62:** Users can configure Catch-Up Mode preferences (review timing)
- **FR63:** Users can configure view preferences (default to card or table view)
- **FR64:** Users can configure polling interval (5-15 minute range)
- **FR65:** Users can manage GitLab connection (authentication, API token)
- **FR66:** User preferences can persist across sessions

## Performance & Reliability
- **FR67:** Page loads can complete in <500ms
- **FR68:** Search queries can return results in <1 second
- **FR69:** Filter application can complete in <200ms
- **FR70:** API polling can maintain >95% success rate with proper error handling
- **FR71:** System can handle 4 weeks of rolling historical event storage without performance degradation
- **FR72:** Dashboard refresh can complete in <200ms
- **FR73:** Manual refresh can complete in <3 seconds for typical project sizes

## Data Integrity
- **FR74:** System can prevent duplicate events from being stored
- **FR75:** System can handle API response pagination correctly
- **FR76:** Stored events can maintain referential integrity with GitLab (URLs remain valid)
- **FR77:** Query filters can be validated before saving (prevent invalid regex, syntax errors)

## User & Access Management
- **FR78:** Users can register/login with GitLab OAuth
- **FR79:** Each user has isolated query preferences and settings
- **FR80:** User sessions persist with secure token-based authentication
- **FR81:** System supports 3-10 concurrent users (beta scope)

## GitLab Project Scoping
- **FR82:** Users must select GitLab projects to monitor on first login (onboarding requirement)
- **FR83:** Users can add/remove monitored projects from settings after onboarding
- **FR84:** Event capture (API polling) scoped to user's selected projects only
- **FR85:** Users can monitor entire GitLab groups (all projects within a group)
- **FR86:** Filters can include project/group as a filter dimension

## Error Handling & User Feedback
- **FR87:** Users can see clear error messages when operations fail, displayed contextually (search errors in search area, filter errors near filter UI)
- **FR88:** System can gracefully handle GitLab API rate limits with toast notification and retry with backoff
- **FR89:** Users can see API sync status in unobtrusive but visible location (header/footer indicator)
- **FR90:** System can show fallback UI when API temporarily unavailable (toast notification + continue with cached data)
- **FR91:** Users can see system health indicators (API polling success rate, last successful sync) in settings or status page

## Keyboard Navigation (Extended)
- **FR92:** Users can navigate sidebar queries with vim-style keyboard navigation
- **FR93:** Users can activate selected sidebar query with keyboard
- **FR94:** Users can create new query with keyboard shortcut
- **FR95:** Users can edit/delete queries with keyboard shortcuts
- **FR96:** Users can manage filters (apply/remove/clear) with keyboard navigation
- **FR97:** All interactive elements accessible via keyboard without mouse requirement

## Onboarding & First-Run Experience
- **FR98:** System guides users through first-login flow (GitLab OAuth → Project selection)
- **FR99:** Users can see helpful empty states when no queries exist yet

---

**Total:** 99 Functional Requirements

---
