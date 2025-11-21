# FR Coverage Map

## Phase 1: MVP (Epics 1-4)

**Epic 1: Walking Skeleton**
- FR1: Poll GitLab API (basic, manual refresh only)
- FR2: Store events with metadata
- FR3: Update existing events
- FR13: Click through to GitLab
- FR27: Sectioned dashboard (Issues/MRs/Comments)
- FR28: Scroll through sections
- FR78: GitLab OAuth login
- FR79: Isolated user preferences (basic setup)
- FR80: Secure session persistence
- FR81: Support 3-10 concurrent users
- FR82: Select projects on first login (onboarding)
- FR83: Add/remove projects (basic UI)

**Epic 2: User-Controlled Queries**
- FR9: Search with <1s response time
- FR10: Search by keywords, labels, authors, projects, dates
- FR11: Show results across all event types
- FR12: Keyword highlighting and transparent relevance
- FR14: Apply temporary filters
- FR15: Filters persist across sections
- FR16: Clear filters
- FR17: Show active filters
- FR18: Combine filters (AND/OR logic)
- FR19: Save filter combinations as named queries
- FR20: Queries appear in sidebar
- FR21: Click query to navigate to dedicated page
- FR22: Edit query filters
- FR23: Delete queries
- FR24: Show query effectiveness metrics
- FR25: Create query from search results
- FR26: Create query from active filters
- FR59: Visible focus indicators
- FR67: <500ms page loads (baseline established)
- FR68: <1s search (baseline established)
- FR69: <200ms filter application

**Epic 3: Catch-Up Mode & Background Sync**
- FR4: Schedule background polling (5-15 min)
- FR5: Handle manual refresh requests (button)
- FR7: Display last sync timestamp
- FR8: Continue with cached data when API unavailable (basic)
- FR33: Manual refresh button
- FR34: Display last sync time and next refresh
- FR44: Catch-Up Mode shows new items since last visit
- FR45: Group by saved queries
- FR46: Show query name, counts, new items
- FR47: Mark individual queries as reviewed
- FR48: "Mark All as Reviewed"
- FR49: Badge shows total new item count
- FR50: Respect 5-15 items per query target
- FR51: Sidebar badges show new counts

**Epic 4: Split View & Detail Navigation**
- FR12: Keyword highlighting (in detail view)
- FR31: Persist scroll position
- FR32: Split pane toggle (button)
- FR33: View event details and click through
- FR34-35: Keyword highlighting in detail view
- FR36-37: Section navigation (clickable chips)
- FR38: Query metadata page
- FR39-40: Scroll position persistence

## Phase 2: Power User Experience (Epics 5-7)

**Epic 5: Keyboard Foundation**
- FR52: `/` focuses search
- FR53: `j/k` navigate items (vim-style)
- FR54: `o/Enter` open in GitLab
- FR55: `m` mark as reviewed
- FR56: `v` toggle Card/Table view
- FR57: `?` show keyboard shortcuts (help modal)
- FR58: All elements keyboard accessible
- FR59: Visible focus indicators
- FR60: `r` manual refresh keyboard shortcut
- FR92: Navigate sidebar with keyboard
- FR93: Activate sidebar query with keyboard
- FR94: Create query with keyboard shortcut
- FR95: Edit/delete queries with keyboard
- FR96: Manage filters with keyboard
- FR97: No mouse required
- FR29: Jump between sections (1/2/3 shortcuts)

**Epic 6: Reliability & Error Handling**
- FR6: Respect API rate limits with backoff
- FR8: Continue with cached data when API unavailable (full implementation)
- FR61: Configure filter preferences
- FR62: Configure Catch-Up Mode preferences
- FR63: Configure view preferences
- FR64: Configure polling interval
- FR65: Manage GitLab connection
- FR66: Preferences persist across sessions
- FR70: >95% polling success rate
- FR73: <3s manual refresh
- FR74: Prevent duplicate events
- FR75: Handle API pagination
- FR76: Maintain GitLab URL integrity
- FR77: Validate filters before saving
- FR84: Event capture scoped to selected projects (enforcement)
- FR85: Monitor GitLab groups
- FR86: Filter by project/group
- FR87: Clear contextual error messages
- FR88: Graceful API rate limit handling
- FR89: API sync status indicator
- FR90: Fallback UI when API unavailable

**Epic 7: Production Readiness & Polish**
- FR67: <500ms page loads (final validation)
- FR68: <1s search (final validation)
- FR71: Handle 4 weeks storage without degradation
- FR72: <200ms dashboard refresh
- FR91: System health indicators
- FR98: First-login flow polish
- FR99: Helpful empty states

---

**FR Coverage Validation:**
- ✅ All 99 FRs mapped across 7 epics (4 in Phase 1, 3 in Phase 2)
- ✅ No unmapped FRs
- ✅ Phase 1 (MVP) delivers complete user value without keyboard shortcuts
- ✅ Phase 2 layers keyboard shortcuts onto existing mouse UI (no refactoring)
- ✅ Performance requirements embedded in every epic (not deferred to polish phase)
- ✅ Catch-Up Mode delivered by week 3 (Epic 3)
- ✅ User value delivery starts in Epic 1 (walking skeleton week 1)
- ✅ Split view in Phase 1 MVP (Epic 4) - not tied to keyboard shortcuts

---
