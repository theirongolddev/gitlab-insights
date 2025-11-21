# Epic 5: Keyboard Foundation
**Timeline:** 2-3 days (post Phase 1 validation)

**Goal:** Layer vim-style keyboard shortcuts onto existing mouse-driven UI

**Value Statement:** Power users can navigate the entire app without touching the mouse

**Scope:**
- Global keyboard event handler with typing detection
- Wire shortcuts to existing click handlers:
  - `/` focus search
  - `j/k` table navigation
  - `o` open in GitLab
  - `d` toggle detail pane
  - `s` save query
  - `c` navigate to catch-up
  - `r` manual refresh
  - `1/2/3` section navigation
- Help modal (`?` key) with categorized shortcut reference (FR57)
- Visual keyboard indicators (shortcut hints on buttons)
- **No refactoring needed** - just add event listeners

**FRs Covered:** FR52-60 (Keyboard Navigation Core)

**Rationale:** Keyboard layer adds power-user appeal after core value validated. 2-3 days to implement because foundation was architected correctly in Phase 1.

---
