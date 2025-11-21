# Epic 2: User-Controlled Queries
**Timeline:** Week 1-2 (5-7 days)

**Goal:** Enable users to create and manage personalized queries with search and filtering

**Value Statement:** Users can define, save, and navigate custom queries with full search and filter capabilities (mouse-driven for MVP)

**Scope:**
- React Aria Components setup (Table, Dialog, Button, Combobox) - mouse interaction only
- Create/save/delete queries UI and backend (FR19-26)
- Sidebar navigation with query list (FR20-21)
- Search bar (mouse/click to focus)
- Filter UI with temporary filters (FR14-18)
- PostgreSQL full-text search with GIN indexes (FR9-13)
- Keyword highlighting (FR12)
- Query effectiveness metrics (FR24)
- "Save as Query" button when search/filters active
- **Performance DoD:** <500ms page loads, <1s search results

**FRs Covered:** FR19-26 (Query Management), FR14-18 (Filtering), FR9-13 (Search), FR67-69 (Performance baseline)

**Phase 2 Note:** Keyboard shortcuts (`/`, `j/k`, `o`, `s`, etc.) will be added in Phase 2 by layering event handlers onto existing click handlers.

**Rationale:** Delivers core user value (personalized monitoring) with mouse-driven UI for faster MVP validation. React Aria foundation enables easy keyboard layer addition later.

---
