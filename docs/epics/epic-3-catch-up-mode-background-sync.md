# Epic 3: Catch-Up Mode & Background Sync
**Timeline:** Week 2-3 (4-5 days)

**Goal:** Complete primary user workflow with "inbox zero" experience and automated sync

**Value Statement:** Users can see "what's new since last visit" grouped by queries, with automated background updates

**Scope:**
- Catch-Up Mode navigation (Sidebar link to /catch-up route)
- "New since last visit" logic using `last_visited_at` timestamp (FR44-46)
- Query grouping in Catch-Up Mode (FR45-46)
- Mark query as reviewed button (FR47)
- "Mark All as Reviewed" button (FR48)
- Badge counts on sidebar queries (FR51)
- Badge on Catch-Up nav link showing total new items (FR49)
- Inngest scheduled background polling job (5-15 min) (FR4)
- Manual refresh button in header (FR5)
- Sync indicator: last sync timestamp + next refresh time (FR7, FR34)
- Respect 5-15 items per query target (FR50)
- **Performance DoD:** Background job doesn't impact UI responsiveness, <500ms Catch-Up view load

**FRs Covered:** FR44-51 (Catch-Up Mode), FR4-8 (Background polling), FR33-34 (Manual refresh & sync display)

**Phase 2 Note:** Keyboard shortcuts (`c` toggle Catch-Up, `r` manual refresh) will be added in Phase 2.

**Rationale:** Completes primary workflow by week 3 with mouse-driven UI. Users can validate "catch duplicate work" hypothesis. Automated sync removes friction. Achieves "3+ daily users by week 4" target becomes feasible.

---
