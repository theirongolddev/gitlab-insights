# gitlab-insights - Product Requirements Document

**Author:** BMad
**Date:** 2025-11-21
**Version:** 1.1

---

## Executive Summary

In PM-less engineering organizations, talented engineers become accidentally siloed - not from lack of collaboration desire, but from lack of visibility into where their knowledge and skills are needed. GitLab Insights transforms this organizational blindness into deliberate professional agency by converting GitLab's pull-based "search for everything" model into push-based "discover what matters" ambient awareness.

The platform ingests GitLab webhook events and applies intelligent filtering to surface relevant conversations, prevent duplicate work, and reveal contribution opportunities - enabling engineers to leverage their expertise deliberately across the organization without leadership needing to add coordination overhead.

### What Makes This Special

**GitLab Insights solves the architectural mismatch** between GitLab's participatory workflows (work on assigned items) and ambient awareness workflows (discover relevant work across org). It surfaces "unknown unknowns" - conversations you didn't know were happening but should care about - through intelligent, personalized discovery that builds on existing work artifacts without requiring new communication overhead.

The core insight: You can't search for conversations you're unaware are happening. This tool transforms pull-based searching into push-based discovery.

---

## Project Classification

**Technical Type:** web_app
**Domain:** general
**Complexity:** low

This is an internal web application focused on productivity and collaboration within PM-less engineering organizations. It's a SPA-style dashboard with API polling, periodic data synchronization, and personalized filtering. The domain is general software engineering with standard security and performance requirements.

The architecture is polling-based with scheduled GitLab API fetching, background processing, and aggressive caching for sub-500ms performance. The product prioritizes speed over features, reliability over completeness, and simplicity over cleverness.

---

## Success Criteria

Success is defined by **catching things early** - discovering duplicate work BEFORE building, contributing to discussions DURING debate (not after decisions made), and finding interesting connections through browsing.

**Primary Success Indicators:**

1. **Engagement proves value**: 3+ daily active users by week 4 using it without abandoning
2. **Relevance tuning works**: Daily digest has 5-15 items per user (not 0, not 100) with 40%+ click-through to GitLab
3. **Early discovery delivers value**: Users catch 1-3 duplicate work instances per month before investing effort
4. **Knowledge sharing happens**: Users contribute expertise to 2-5 discussions per week they wouldn't have discovered manually
5. **Time efficiency achieved**: Users spend 10-15 min/day staying informed (down from 30-45 min manual searching)

**Technical Performance Targets:**

- Page load <500ms (attention is precious)
- Search results <1s (speed is essential)
- Webhook capture >99% (missing events = trust failure)
- Notification relevance >80% (measured by click-through and user feedback)

**Failure Signals (Red Flags):**

- Users stop opening digests after week 2 (relevance failure)
- DAU drops below 50% by week 4 (product-market fit failure)
- Digest has 0 items regularly (filters too narrow) or 50+ items regularly (filters too broad)

### Business Metrics

**Organizational Impact Goals:**

- Reduce engineering effectiveness loss from 25-40% to <10% through better coordination
- Cut tech lead coordination overhead from 20-40% to <10% of their time
- Accelerate new hire productivity from 40-60 days to 20-30 days
- Prevent 10-20 hours/month of duplicate work per engineer

**Strategic Outcome:** Prove that PM-less organizations can achieve effective coordination through better information architecture rather than adding coordination roles - validating the "tooling over headcount" approach.

---

## Product Scope

### MVP - Minimum Viable Product

**The MVP is a relevance-filtered event stream.** Without these capabilities, the product doesn't work:

**1. Event Capture & Storage**
- GitLab API polling for issues, MRs, and comments (create, update, close events)
- Scheduled background sync: Poll GitLab API every 5-15 minutes (configurable)
- Manual refresh: User-triggered API fetch for immediate updates
- Event storage with essential metadata: title, body, author, project, labels, timestamp
- API polling keeps data fresh: periodic sync updates existing records (prevents staleness)
- Direct URL linking back to GitLab
- API rate limit handling: respect GitLab API limits with backoff and user notification

**2. Flexible Filtering System**
- Per-user filter creation: keywords, labels, authors, projects
- Named filters (e.g., "Auth work", "API changes")
- Simple query interface (UI or query language)
- Conservative defaults to prevent noise

**3. Fast Event Retrieval & Historical Research**
- Search across all stored events: webhook-captured + bulk-imported history (<1s response time)
- Query local database (fast, no GitLab API rate limits)
- Time-based organization (recent first)
- Historical research: Pre-work checks can find past discussions (2-4 weeks of history in MVP)
- Results page with direct GitLab links
- Performance budget: <500ms page loads

**4. Catch-Up Mode**
- Catch-Up Mode shows "what's new since last visit" grouped by saved queries
- 5-15 items per query (not 0, not 100)
- Mark queries as reviewed, "Mark All as Reviewed" to reset baseline
- Badge count shows total new items

**5. Dashboard with Catch-Up Mode**
- **Catch-Up Mode:** Primary interface showing new items since last login, grouped by queries
- **Manual refresh:** User-triggered refresh button to fetch latest data from GitLab API
- **Auto-refresh indicator:** Shows last refresh timestamp and next scheduled sync time
- **View recent events:** See all stored events matching your filters (refreshed periodically)
- Click through to GitLab seamlessly
- Keyboard-driven navigation (j/k, /, o/Enter, m for mark-as-reviewed)
- Dense table view by default with progressive disclosure (expand for details)

**Critical MVP Requirements:**
- API polling reliability with proper error handling (missing events breaks trust)
- <500ms page loads, <1s search (attention is precious)
- Per-user personalization (not one-size-fits-all)
- Privacy: no productivity metrics, no surveillance features

### Growth Features (Post-MVP)

**Post-MVP Validation Phase** - Ship basic first, validate through dogfooding, then enhance:

**Real-Time Infrastructure:**
- Webhook-based event capture (replace polling with push-based events from GitLab)
- Live Mode dashboard with real-time UI updates (<5s latency via WebSocket/polling)
- Browser notifications for high-priority filters
- Automatic event appearance without manual refresh
- Real-time sidebar badges showing live counts

**Enhanced Discovery:**
- Unified discovery bar with smart auto-complete (search/filter/query in single interface)
- Visual filter builder (click labels/authors/projects from items to build filters)
- File-level activity tracking (monitor specific files for changes, discussions, references)
- Pattern detection across team work ("3 people working on auth")
- Topic clustering (grouped vs chronological presentation)
- Dynamic grouping modes (by project, by author, by recency, by relevance score)
- Browsing mode for undirected exploration
- "Your expertise might be relevant" suggestions

**Alternative Notification Methods:**
- Browser extension with push notifications and badge counts
- Desktop notifications with configurable priority levels
- Mobile companion app for on-the-go awareness

**Intelligence Features:**
- Smart relevance scoring or ML-based filtering
- Historical context surfacing
- Reading list / bookmarks
- Role-based dashboards (IC vs Tech Lead vs Manager)

**Expanded Scope:**
- Multi-team / multi-project support
- Advanced pattern detection
- Institutional memory features
- Onboarding-specific views

### Vision (Future)

**Intelligence Layer:**
Pattern detection revealing cross-cutting themes, bottlenecks, and coordination opportunities that humans can't see scanning linearly.

**Knowledge Graph:**
"Who knows what" mapping, historical decision context, and institutional memory preservation for onboarding and decision-making.

**Proactive Suggestions:**
"Your expertise in auth might be relevant to this discussion" - surfacing contribution opportunities based on past activity and knowledge graph.

**Multi-Team Coordination:**
Expand beyond single team to enable cross-team discovery and collaboration across the entire organization.

**Integration Ecosystem:**
- Microsoft Teams integration for notifications and digest delivery
- Analytics and trend visualization
- Advanced pattern detection and anomaly identification
- Institutional knowledge preservation and searchable history

---

## Innovation & Novel Patterns

**Core Innovation: Attention-Efficient Discovery**

GitLab Insights solves the problem: **How do you maximize relevant discoveries within a 10-15 minute daily attention budget?**

The fundamental insight is that the constraint is not information scarcity (GitLab has all the data) - it's **attention scarcity**. Engineers currently spend 30-45 minutes/day frustrated searching, missing 60-80% of relevant discussions, and suffering anxiety/guilt cycles.

The innovation reframes "pull vs push" as an implementation detail serving the real goal: **attention-efficient discovery of unknown unknowns**.

**What makes this different from existing feeds:**
- **Most activity feeds are chronological firehoses** → GitLab Insights respects attention budget (5-15 items/day, not 100)
- **Most notifications require pre-subscription** → GitLab Insights discovers based on transparent, user-controlled filters
- **Most tools add communication overhead** → GitLab Insights surfaces existing work artifacts already in GitLab
- **Most smart feeds are black boxes** → GitLab Insights shows exactly why something matched (transparent filtering)

### Fundamental Truths (First Principles)

These truths MUST hold for the innovation to work:

**Truth 1: Attention is the Constraint**
- Reality: Engineers have ~10-15 min/day for discovery (not unlimited attention)
- Implication: Any solution exceeding this attention budget will be abandoned
- Design requirement: Hard limit on digest size (5-15 items, not 0, not 100)

**Truth 2: Relevance is Contextual and Dynamic**
- Reality: What's relevant changes based on current work, expertise, learning goals, team dynamics
- Implication: Static filters decay in relevance over time without adaptation
- Design requirement: Manual filter tuning in MVP, implicit learning (click signals) post-MVP

**Truth 3: Discovery Has Minimum Viable Latency**
- Reality: Different use cases have different latency needs
  - Duplicate work prevention: Hours/days latency acceptable
  - Active discussions: Daily latency needed
  - Learning/browsing: Weekly latency acceptable
- Implication: One-size-fits-all delivery cadence will fail some use cases
- Design requirement: Configurable review cadence per filter

**Truth 4: Trust Requires Transparency and Control**
- Reality: Engineers will not trust a "black box" deciding what's important
- Implication: Loss of agency creates resistance and abandonment
- Design requirement: User creates filters, sees why items matched, can disable without friction

**Truth 5: Value Must Exceed Friction Within First Week**
- Reality: Dogfooding must prove value in days, not weeks (comparison: 45min/day frustrated searching)
- Implication: If first week doesn't save time AND reduce frustration, user abandons
- Design requirement: Success = ONE high-value discovery (saves >1hr) within 2 weeks

### Validation Approach (First Principles-Based)

**Core Validation Hypothesis:**

"Attention-efficient discovery (10-15min/day) with transparent, user-controlled filtering will enable engineers to catch duplicate work and find relevant discussions that justify the attention investment within the first week of dogfooding."

**Week 1: Attention Budget Validation**
- **Measure:** Daily time spent on GitLab Insights
- **Success:** <15 minutes/day average
- **Failure signal:** >20 minutes/day (not attention-efficient)
- **Learn:** What causes time bloat? Too many items? Slow performance? Unclear relevance?

**Week 1-2: Value Threshold Validation**
- **Measure:** ONE discovery that saves >1 hour of work (duplicate prevention OR early contribution)
- **Success:** Happens within 2 weeks
- **Failure signal:** Zero high-value discoveries by day 14
- **Learn:** Are filters too narrow? Too broad? Wrong event types?

**Week 2-4: Relevance Adaptation Validation**
- **Measure:** Click-through rate trends upward as filters tune
- **Success:** Week 4 click-through >40% (up from Week 1 baseline)
- **Failure signal:** Click-through stays <20% or trends downward
- **Learn:** Can users effectively tune filters? Do they understand why things match?

**Week 4+: Generalization Validation**
- **Measure:** 2-3 peer engineers adopt and use beyond week 2
- **Success:** 50%+ of beta users are daily active by week 4
- **Failure signal:** Beta users abandon within 2 weeks
- **Learn:** Does it generalize beyond creator's use case?

**Technical Validation (Continuous):**
- **Performance targets:** <500ms pages, <1s search, >99% webhook capture
- **Measured from day 1** with observability built-in
- **Hard requirements** - missing these = product doesn't work regardless of feature quality

**Fallback Strategy (First Principles-Based):**

If validation fails, retreat to fundamental truths to diagnose:

- **If Truth 1 breaks (attention budget exceeded):** Reduce digest size aggressively, improve performance, simplify UI
- **If Truth 2 breaks (relevance decays):** Add filter tuning guidance, show filter effectiveness metrics, prompt for review
- **If Truth 3 breaks (latency mismatch):** Offer real-time notifications for urgent items, weekly digests for learning
- **If Truth 4 breaks (trust/control failure):** Make filtering more transparent, add "why did this match?" explanations
- **If Truth 5 breaks (no first-week value):** Pivot to narrower scope (duplicate prevention only) or accept product-market fit failure

**Ultimate Fallback:**
- **Retreat to manual curation:** User explicitly subscribes to specific issues/MRs (GitLab native behavior)
- **Pivot to team broadcast:** Tech leads manually flag important items instead of automated filtering
- **Accept narrower scope:** Build for ONE use case (duplicate prevention) instead of ambient awareness

---

## web_app Specific Requirements

### Application Architecture

**Single Page Application (SPA)**
- Fluid, responsive interface without page reloads
- Client-side routing for dashboard, filters, search, and settings
- Periodic data refresh via GitLab API polling with manual refresh capability
- Optimized for speed and interactivity

### Browser Support

**Target Browsers:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Approach:** Modern evergreen browsers with no legacy constraints. Use modern JavaScript (ES6+), CSS Grid/Flexbox, and Web APIs without polyfills for older browsers.

### Performance Targets

**Page Load Performance:**
- Initial page load: <500ms (hard requirement from success criteria)
- Search results: <1s (hard requirement)
- Dashboard refresh: <200ms
- Filter application: <100ms

**Performance Budget:**
- JavaScript bundle: <300KB gzipped
- CSS: <50KB gzipped
- Initial render: <500ms on 4G connection
- Time to Interactive (TTI): <1s

### Data Synchronization

**GitLab API Polling:**
- Background job polls GitLab API every 5-15 minutes (configurable)
- Manual refresh button triggers immediate API fetch
- API requests respect rate limits with exponential backoff
- Events stored in database after successful fetch
- Last refresh timestamp displayed to user

**MVP Sync Capabilities:**
- **Periodic sync**: Scheduled background polling keeps data fresh
- **Manual refresh**: User-triggered immediate update
- **Offline tolerance**: Dashboard shows stored data even if API temporarily unavailable

### Accessibility

**Keyboard Navigation (Priority Requirement):**
- All interactive elements keyboard accessible (tab navigation)
- Keyboard shortcuts for common actions:
  - `/` - Focus search
  - `?` - Show keyboard shortcuts
  - `j/k` - Navigate items (vim-style)
  - `o/Enter` - Open selected item in GitLab
  - `f` - Focus filter dropdown
- Visible focus indicators for all interactive elements
- No mouse required for core workflows (discovery, filtering, navigation)

**Basic Accessibility Standards:**
- Semantic HTML5 elements (nav, main, article, section)
- Proper heading hierarchy (h1-h6)
- ARIA labels where needed for clarity
- Sufficient color contrast for readability

**Out of Scope for MVP:**
- Screen reader optimization
- WCAG AA/AAA compliance
- Assistive technology testing
- High contrast mode

### SEO Strategy

**Not Applicable:**
- Internal tool requiring authentication
- No public discovery needed
- No search engine indexing required
- Can use `robots.txt` to block crawlers

---

## User Experience Principles

**Design Philosophy: Developer-Focused Minimal**

The interface prioritizes **information density, keyboard efficiency, and speed** over visual polish. Engineers want signal, not decoration. The vibe is more "vim" than "Notion" - functional, fast, and respectful of attention.

**Core UX Values:**

1. **Speed is Non-Negotiable**
   - <500ms page loads, <1s search, <200ms filter application
   - No loading spinners for common actions
   - Instant feedback on all interactions
   - Performance is a feature, not an afterthought

2. **Keyboard-First, Mouse Optional**
   - All core workflows accessible via keyboard
   - Vim-style navigation (j/k, /, o)
   - Shortcuts discoverable but not required
   - Mouse usage should feel like a convenience, not a necessity

3. **Calm, Not Anxious**
   - Reduce information overwhelm through filtering, not visual complexity
   - Clear signals: "You haven't missed anything critical"
   - No aggressive notifications, no urgency manipulation
   - Trust through transparency: show why things matched

4. **Information Density Without Clutter**
   - Dense information layout (developers scan efficiently)
   - Minimal chrome, maximum content
   - Readable but compact (more items visible = better scanning)
   - Progressive disclosure: details on demand, not upfront

5. **Friction-Free Filter Discovery**
   - The ultimate value is in identifying useful filter keywords and creating persistent queries
   - Make it trivially easy to:
     - Spot a keyword in results → Click to add as filter
     - See filter effectiveness → Tune or delete quickly
     - Save useful queries → Reuse without rebuilding
   - Filter creation should feel like exploration, not configuration

### Key Interactions

**Primary Interaction Model: Sectioned Dashboard + Query Pages with View Toggle (MVP)**

**Architecture Overview:**

**Main Dashboard (`/dashboard`) - No Tabs, Sectioned Scrollable Page:**
- **Issues Section** (top): Recent issues, scrollable
- **Merge Requests Section** (middle): Recent MRs, scrollable
- **Comments Section** (bottom): Recent comments, scrollable
- **No tab switching:** Just scroll down the page to see each event type
- **Temporary filters:** Applied to all sections simultaneously
- **Example:** Apply "keyword: auth" filter → All sections show only matching items
- **Manual refresh:** Refresh button fetches latest data from GitLab API
- **Auto-refresh indicator:** Shows last sync time and next scheduled refresh
- **Optional digest cards:** Summary cards above sections showing highlights from saved queries

**Query Pages (Sidebar, separate routes `/queries/:name`):**
- **Separate pages** accessible via sidebar navigation
- **Same sectioned structure:** Issues section + MRs section + Comments section (all visible, scroll to see each)
- **Query filters applied to all sections:** "Auth Work" query filters apply to all event types
- **Example "Auth Work" page:**
  ```
  Auth Work Query

  ───────────────────────
  Issues (5)
  [filtered issue results]

  ───────────────────────
  Merge Requests (3)
  [filtered MR results]

  ───────────────────────
  Comments (12)
  [filtered comment results]
  ```

**Filter vs Query Distinction:**

**Filters (Temporary):**
- Applied to current view (dashboard or query page)
- Affect all sections simultaneously
- Ephemeral unless explicitly saved as query
- Used for exploration and experimentation
- Example: "keyword: authentication", "label: security", "author: @user"

**Queries (Persistent):**
- Saved filter combinations with names
- Each appears as item in sidebar
- Each has own page/route with same sectioned structure
- Each has section in Catch-Up Mode
- Persists across sessions
- Example: "Auth Work" = permanent query with filters "keyword: auth|authentication|oauth"

**Filter → Query Workflow:**
1. Start on dashboard (see all sections: Issues, MRs, Comments)
2. Apply temporary filters: keyword "auth", label "security"
3. All sections update to show only matching items
4. Scroll through sections, evaluate: Is this useful?
5. Click "Save as Query" → Name it "Auth & Security"
6. New sidebar item appears, navigates to `/queries/auth-security`
7. Next session → Query persists in sidebar + Catch-Up Mode

**View Toggle (Card vs Table):**
- **Card View**: Visual richness, more context per item
  - Shows: title, snippet, metadata, labels, author avatar
  - Good for: Browsing, discovering context, slower scanning with more detail

- **Table View**: Information density, scanning efficiency
  - Shows: title, key metadata in columns, compact rows
  - Good for: Rapid scanning, finding specific items, power users

- Toggle button in header (keyboard shortcut: `v`)
- User preference persists per view (dashboard, individual queries)
- Both views support same interactions (click to open, keyboard nav, filtering)
- Applied to all sections (Issues, MRs, Comments all use same view type)

**Sidebar Navigation:**
- **Queries section:** List of saved queries (e.g., "Auth Work", "API Changes", "My Team")
- Click query → Navigate to query page (same sectioned structure as dashboard)
- Drag to reorder (optional)
- Right-click → Edit/Delete query
- Badge counts on queries showing new items since last viewed

**Catch-Up Mode Structure:**
- **Only saved queries appear** (no base dashboard in Catch-Up Mode)
- Each query gets its own section with item counts
- Example display:
  ```
  Catch-Up Mode - New Since Last Review

  Auth Work (8 new items: 5 issues, 3 MRs)
  [top items from Auth Work query]

  API Changes (3 new items: 1 issue, 2 MRs)
  [top items from API Changes query]

  My Team (7 new items: 4 issues, 2 MRs, 1 comment)
  [top items from My Team query]
  ```

**Section Navigation:**
- **Keyboard shortcuts:** Jump between sections without scrolling
  - `1` - Jump to Issues section (absolute)
  - `2` - Jump to MRs section (absolute)
  - `3` - Jump to Comments section (absolute)
  - `Ctrl+d` - Jump down one section (vim-style)
  - `Ctrl+u` - Jump up one section (vim-style)
- **Scroll position:** Persists when navigating away and returning to dashboard

**Critical User Flows:**

**1. Morning Sync (5 min) - Passive Awareness**
- User journey: Open dashboard → Scroll through Issues section → Scroll to MRs section → Scroll to Comments section → Spot 2-3 relevant items → Feel oriented
- UX optimization: Immediate load, all sections visible without clicking, card view for context, keyboard shortcuts to jump sections
- Success metric: User feels "in control" and hasn't missed anything critical

**2. Pre-Work Check & Research (3 min) - Active Discovery**
- User journey: Before starting work → Search keywords ("authentication oauth") → Results shown in all sections with filters active → Scroll through sections → Discover related past work → "Save as Query" if useful pattern
- UX optimization: Fast search (<1s), filters update all sections simultaneously, table view for rapid scanning, one-click save as query
- Success metric: Find relevant past work in <1 minute, create useful persistent query

**3. Periodic Check-In (Throughout Day) - Background Awareness**
- User journey: Dashboard open → Click refresh to see latest → New items appear at top of sections → Scroll/jump between sections → Click through when relevant → OR → Click saved query in sidebar → Review filtered results
- UX optimization: Easy manual refresh, last sync indicator shows freshness, sidebar query badges show new counts since last viewed
- Success metric: Stay aware of critical queries without distraction

**4. Query Discovery & Tuning (Ongoing) - Relevance Refinement**
- User journey: Experiment with filters on dashboard → See results across all sections → Find useful pattern → Save as query → Monitor in Catch-Up Mode → Click query in sidebar → Tune query filters if too broad/narrow → OR delete if not useful
- UX optimization: One-click "Save as Query", inline query editing from sidebar, effectiveness metrics (match count, click-through rate)
- Success metric: Users actively create, tune, and refine queries over time

**Interaction Principles:**

- **Scan → Identify → Act**: Optimize for rapid scanning, clear relevance signals, instant action
- **Filter → Query Pipeline**: Make it trivial to experiment with filters and save useful patterns as queries
- **Transparent Matching**: Always show WHY an item matched (which query, which filters)
- **View Flexibility**: Card vs table toggle available on both dashboard and query pages
- **Sidebar Efficiency**: Quick access to saved queries without cluttering main dashboard
- **Section Jumping**: Keyboard shortcuts to navigate between sections without scrolling

---

## Functional Requirements

**Coverage:** These functional requirements represent the complete capability contract for gitlab-insights. Every capability discussed in vision, scope, domain, project-type, innovation, and UX sections is represented here.

**Phasing Strategy:** Requirements are organized into Phase 1 (MVP - Mouse-First) and Phase 2 (Power User - Keyboard Layer) to enable fast validation before investing in advanced features. Phase 1 delivers complete user value with mouse-driven UI. Phase 2 layers vim-style keyboard shortcuts onto the existing foundation (~2-3 days implementation).

- **Phase 1 (MVP):** FR1-51 (minus keyboard shortcuts) - 3-4 weeks
- **Phase 2 (Power User):** FR52-60, FR92-97 (keyboard shortcuts) + reliability + production polish - 2-3 weeks

---

### Phase 1: MVP (Mouse-First Core Workflows)

#### Event Capture & Storage

**FR1:** System can poll GitLab API for issues, merge requests, and comments (create, update, close, reopen events)

**FR2:** System can store API-fetched events with essential metadata: title, body, author, project, labels, timestamp, event type, GitLab URL

**FR3:** System can update existing stored events when API polling detects changes (keeps data fresh, prevents staleness)

**FR4:** System can schedule background polling every 5-15 minutes (configurable interval)

**FR5:** System can handle manual refresh requests to fetch latest data immediately

**FR6:** System can respect GitLab API rate limits with exponential backoff and user notification

**FR7:** System can display last successful sync timestamp to user

**FR8:** System can continue operating with stored data when GitLab API temporarily unavailable

### Search & Retrieval

**FR9:** Users can search across all stored events with <1 second response time

**FR10:** Users can search by keywords, labels, authors, projects, date ranges

**FR11:** Search results can show matching items across all event types (Issues, MRs, Comments)

**FR12:** Users can see which search terms matched in results (keyword highlighting, transparent relevance)

**FR13:** Users can view event details and click through to GitLab to see full discussion

### Filtering System

**FR14:** Users can apply temporary filters to current view (keyword, label, author, project, event type, date range)

**FR15:** Filters can persist across sections when scrolling (apply "keyword: auth" → all sections show only matching items)

**FR16:** Users can clear filters to return to unfiltered view

**FR17:** Users can see which filters are currently active

**FR18:** Users can combine multiple filters (AND/OR logic)

### Query Management

**FR19:** Users can save filter combinations as persistent queries with custom names

**FR20:** Saved queries can appear in sidebar navigation

**FR21:** Users can click a saved query to navigate to its dedicated page

**FR22:** Users can edit query filters after creation (modify keywords, labels, scope)

**FR23:** Users can delete queries that are no longer useful

**FR24:** System can show query effectiveness metrics (match count, items since last viewed)

**FR25:** Users can create queries from search results ("Save this search as query")

**FR26:** Users can create queries from active filters on dashboard ("Save current filters as query")

### Dashboard View

**FR27:** Users can view main dashboard with sectioned layout: Issues section, Merge Requests section, Comments section

**FR28:** Users can scroll through sections to see recent events of each type

**FR29:** Users can jump between sections using keyboard shortcuts (absolute: 1/2/3, relative: Ctrl+d/Ctrl+u)

**FR30:** Dashboard can show unfiltered events by default (all recent activity)

**FR31:** Dashboard scroll position can persist when navigating away and returning

**FR32:** Users can toggle digest cards on dashboard to show/hide highlights from saved queries

**FR33:** Users can trigger manual refresh to fetch latest data from GitLab API

**FR34:** Dashboard displays last sync timestamp and next scheduled refresh time

### Query Page View

**FR35:** Each saved query can have dedicated page with same sectioned layout (Issues, MRs, Comments)

**FR36:** Query pages can show only events matching the query's filters

**FR37:** Query page sections can display item counts (e.g., "Issues (5)", "MRs (3)")

**FR38:** Users can edit query filters on query pages with save prompt before navigating away

### View Toggle

**FR39:** Users can toggle between Card view and Table view for event display

**FR40:** Card view can show title, snippet, metadata, labels, author avatar

**FR41:** Table view can show title and key metadata in compact columnar format

**FR42:** View preference can persist per page (dashboard, individual query pages)

**FR43:** View toggle applies to all sections on current page

### Catch-Up Mode

**FR44:** Dashboard can display Catch-Up Mode showing items new since last user login/review

**FR45:** Catch-Up Mode can group items by saved queries (not base dashboard)

**FR46:** Each Catch-Up section can show query name, item counts by type, and new items

**FR47:** Users can mark individual queries as reviewed in Catch-Up Mode

**FR48:** Users can "Mark All as Reviewed" to reset baseline

**FR49:** Catch-Up Mode badge can show total count of new items across all queries

**FR50:** Catch-Up Mode can respect 5-15 items per query target (not 0, not 100)

**FR51:** Sidebar query badges show count of new items since last viewed for each query

---

### Phase 2: Power User Experience (Keyboard Layer)

**Note:** These requirements add vim-style keyboard shortcuts to the mouse-driven MVP. Implementation is ~2-3 days because the architecture was designed for progressive enhancement (keyboard handlers call existing click handlers).

#### Keyboard Navigation

**FR52:** Users can focus search bar with `/` keyboard shortcut

**FR53:** Users can navigate items within sections with j/k keys (vim-style)

**FR54:** Users can open selected item in GitLab with o or Enter key

**FR55:** Users can mark current item as reviewed with `m` keyboard shortcut

**FR56:** Users can toggle Card/Table view with `v` keyboard shortcut

**FR57:** Users can view keyboard shortcut help with `?` key

**FR58:** All interactive elements can be accessible via keyboard (tab navigation)

**FR59:** Keyboard focus indicators can be visible for all interactive elements

**FR60:** Users can trigger manual refresh with keyboard shortcut (r)

#### Keyboard Navigation (Extended)

**FR92:** Users can navigate sidebar queries with vim-style keyboard navigation

**FR93:** Users can activate selected sidebar query with keyboard

**FR94:** Users can create new query with keyboard shortcut

**FR95:** Users can edit/delete queries with keyboard shortcuts

**FR96:** Users can manage filters (apply/remove/clear) with keyboard navigation

**FR97:** All interactive elements accessible via keyboard without mouse requirement

---

### Phase 1 Continued: Supporting Requirements

#### User Settings & Preferences

**FR61:** Users can configure filter preferences (default filters, favorite queries)

**FR62:** Users can configure Catch-Up Mode preferences (review timing)

**FR63:** Users can configure view preferences (default to card or table view)

**FR64:** Users can configure polling interval (5-15 minute range)

**FR65:** Users can manage GitLab connection (authentication, API token)

**FR66:** User preferences can persist across sessions

### Performance & Reliability

**FR67:** Page loads can complete in <500ms

**FR68:** Search queries can return results in <1 second

**FR69:** Filter application can complete in <200ms

**FR70:** API polling can maintain >95% success rate with proper error handling

**FR71:** System can handle 4 weeks of rolling historical event storage without performance degradation

**FR72:** Dashboard refresh can complete in <200ms

**FR73:** Manual refresh can complete in <3 seconds for typical project sizes

### Data Integrity

**FR74:** System can prevent duplicate events from being stored

**FR75:** System can handle API response pagination correctly

**FR76:** Stored events can maintain referential integrity with GitLab (URLs remain valid)

**FR77:** Query filters can be validated before saving (prevent invalid regex, syntax errors)

### User & Access Management

**FR78:** Users can register/login with GitLab OAuth

**FR79:** Each user has isolated query preferences and settings

**FR80:** User sessions persist with secure token-based authentication

**FR81:** System supports 3-10 concurrent users (beta scope)

### GitLab Project Scoping

**FR82:** Users must select GitLab projects to monitor on first login (onboarding requirement)

**FR83:** Users can add/remove monitored projects from settings after onboarding

**FR84:** Event capture (API polling) scoped to user's selected projects only

**FR85:** Users can monitor entire GitLab groups (all projects within a group)

**FR86:** Filters can include project/group as a filter dimension

### Error Handling & User Feedback

**FR87:** Users can see clear error messages when operations fail, displayed contextually (search errors in search area, filter errors near filter UI)

**FR88:** System can gracefully handle GitLab API rate limits with toast notification and retry with backoff

**FR89:** Users can see API sync status in unobtrusive but visible location (header/footer indicator)

**FR90:** System can show fallback UI when API temporarily unavailable (toast notification + continue with cached data)

**FR91:** Users can see system health indicators (API polling success rate, last successful sync) in settings or status page

#### Onboarding & First-Run Experience

**FR98:** System guides users through first-login flow (GitLab OAuth → Project selection)

**FR99:** Users can see helpful empty states when no queries exist yet

---

## Non-Functional Requirements

**Scope:** These NFRs address quality attributes critical for gitlab-insights. Categories irrelevant to this internal tool (formal accessibility compliance, regulatory requirements) are intentionally omitted.

### Performance

**Context:** Performance is a core value proposition - "attention is precious" means the tool must be fast enough to feel effortless.

**NFR-P1:** Page load performance meets <500ms target (FR67) under normal load (3-10 concurrent users)

**NFR-P2:** Search performance meets <1 second target (FR68) for queries against 4 weeks of historical data

**NFR-P3:** Manual refresh completes within 3 seconds (FR73) for typical project sizes

**NFR-P4:** System maintains performance targets as event volume grows within 4-week retention window

**NFR-P5:** Background processing (API polling, data sync) does not impact UI responsiveness

### Security

**Context:** Handles GitLab OAuth tokens, user sessions, and API data - security is critical despite being internal tool.

**NFR-S1:** User authentication managed exclusively via GitLab OAuth (no local password storage)

**NFR-S2:** User session tokens encrypted and stored securely with configurable expiration

**NFR-S3:** GitLab API credentials (tokens) stored securely and never exposed to client

**NFR-S4:** Sensitive data (OAuth tokens, API tokens, session tokens) encrypted at rest and in transit

**NFR-S5:** User data (queries, preferences) isolated per user with access control enforcement

**NFR-S6:** GitLab API credentials stored securely (environment variables, secrets management)

**NFR-S7:** HTTPS enforced for all external communication (GitLab API, user sessions)

**NFR-S8:** All user input sanitized and validated: search queries limited to keyword matching (no regex), query names max 256 characters alphanumeric + punctuation, filter values validated against allowed types

**NFR-S9:** Rate limiting enforced: login attempts limited to 5 per 15 minutes per IP, search queries limited to 30 per user per minute, API refresh requests limited to prevent abuse

**NFR-S10:** Session timeout set to 24 hours with automatic transparent refresh token rotation for active users

**NFR-S11:** CSRF protection tokens required for all state-changing operations (POST/PUT/DELETE)

**NFR-S12:** Content Security Policy (CSP) configured to ban all inline scripts and styles

### Scalability

**Context:** MVP targets 3-10 beta users, but should have path to growth without architectural rewrites.

**NFR-SC1:** Database schema designed to support 50+ users without major refactoring

**NFR-SC2:** API polling can handle large project event volumes efficiently

**NFR-SC3:** Query execution optimized with appropriate indexes for multi-user load

**NFR-SC4:** User-scoped data queries prevent full-table scans as user count grows

**NFR-SC5:** Background job processing (digests, imports) scales horizontally if needed

### Integration Reliability

**Context:** Depends on GitLab API for data fetching - must handle external service failures gracefully.

**NFR-I1:** GitLab API rate limits handled gracefully with exponential backoff and user notification (FR88)

**NFR-I2:** API polling failures recovered via retry mechanism with >95% eventual success (FR70)

**NFR-I3:** System continues to function with degraded features when GitLab API temporarily unavailable (FR90)

**NFR-I4:** GitLab API calls include appropriate timeouts and error handling

**NFR-I5:** Failed API requests logged with context for debugging

**NFR-I6:** Polling interval automatically increases during GitLab API outages to reduce load

### Observability & Monitoring

**Context:** Critical for dogfooding - must be able to diagnose issues quickly during beta testing.

**NFR-O1:** Application logs captured with appropriate detail levels (info, warn, error)

**NFR-O2:** Key metrics instrumented and accessible: API polling success rate, query performance, API latency, error rates

**NFR-O3:** Error tracking captures stack traces and context for debugging

**NFR-O4:** System health dashboard accessible to admin (API sync status, database health, background job status)

**NFR-O5:** API polling failures logged with request/response details for troubleshooting

**NFR-O6:** Performance metrics tracked over time to identify degradation trends

### Maintainability

**Context:** Solo developer project initially - code must be maintainable for future iterations.

**NFR-M1:** Code structured with clear separation of concerns (data access, business logic, UI)

**NFR-M2:** Database migrations versioned and reversible

**NFR-M3:** Configuration externalized (environment variables, config files) for different environments

**NFR-M4:** README documents setup, deployment, and common troubleshooting

**NFR-M5:** Critical business logic unit-tested for regression prevention

### Availability

**Context:** Internal tool, not mission-critical, but should be reliable during work hours.

**NFR-A1:** Target uptime: 95% during work hours (9am-6pm user timezone)

**NFR-A2:** Planned maintenance scheduled outside work hours when possible

**NFR-A3:** System recovers automatically from transient failures (database connection, API timeouts)

**NFR-A4:** Data backup strategy in place for disaster recovery

**NFR-A5:** Polling schedule resumes correctly after system restarts (no missed sync windows during deployment)

---

## Enhancements (Post-MVP)

### FR-101: Dark Mode Support

**Priority:** Nice-to-have (Post-MVP Enhancement)
**Added:** 2025-12-01 (Epic 1.5 Sprint Change Proposal)
**Status:** Implemented in Epic 1.5

**Description:** Application supports light and dark color schemes with automatic system preference detection and manual user override.

**Requirements:**
- Auto-detect system preference (macOS/Windows dark mode setting)
- Manual toggle in UI (Header area, icon-only button)
- Persist user preference across sessions (localStorage)
- No performance impact (<5KB bundle increase)
- No FOUC (flash of unstyled content) on page load

**Rationale:** Reduces eye strain for engineers spending 10-15 min/day scanning items, improves accessibility for light-sensitive users, and provides professional polish expected in modern applications.

**Implementation:** Epic 1.5, Story 1.5.6 - Dark Mode Toggle & System Preference Detection

---

## PRD Summary

**Project:** gitlab-insights - Attention-efficient discovery platform for PM-less engineering organizations

**Requirements Captured:**
- **99 Functional Requirements** defining complete capability contract
- **44 Non-Functional Requirements** ensuring quality, security, and reliability

**Key Capabilities:**
- GitLab API polling with scheduled sync (5-15 min intervals) and manual refresh
- Historical research (4 weeks of data, keyword search <1s)
- Filter → Query pipeline (temporary exploration, persistent patterns)
- Multi-user support (3-10 beta users, isolated preferences)
- Sectioned dashboard (Issues, MRs, Comments) with keyboard-first navigation
- Catch-Up Mode (query-based, 5-15 items target)
- Project scoping (per-user, required on first login)

**Innovation Validated:**
- Solves "unknown unknowns" via intelligent filtering and discovery
- Respects attention budget (10-15 min/day)
- Transparent filtering (users control relevance)
- Built on First Principles (5 fundamental truths)

**Architecture:**
- Polling-based with scheduled GitLab API fetching
- Simple MVP avoiding webhook infrastructure complexity
- Real-time features moved to post-MVP validation phase

**Next Phase:** UX Design → Architecture → Epic Breakdown → Implementation

---

_This PRD represents the complete product vision and requirements for gitlab-insights MVP._

_Created through collaborative discovery between BMad and AI facilitator on 2025-11-19. Updated 2025-11-21 to simplify MVP architecture (polling-based instead of webhook-based real-time)._
