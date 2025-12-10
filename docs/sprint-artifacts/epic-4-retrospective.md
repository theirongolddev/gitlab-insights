# Epic 4 Retrospective: Split View & Detail Navigation

**Date:** December 9, 2025  
**Epic:** 4 - Split View & Detail Navigation  
**Duration:** ~4-5 days (Nov 28 - Dec 9, 2025)  
**Facilitator:** Bob (Scrum Master)  
**Participants:** Alice (PO), Charlie (Senior Dev), Dana (QA), Elena (Junior Dev), Taylor (Project Lead)

---

## Executive Summary

Epic 4 delivered 100% of scoped stories (7/7) with zero production incidents, implementing split pane exploration with full context preservation. Quality-first development caught 47 issues pre-merge, including critical React 19 violations and race conditions. Key achievements: `useEventDetailPane` hook extraction (85+ lines DRY), debounced visual state pattern (10-20x perf improvement), and app-wide smart retry logic improvement.

**Key Challenges:** PostgreSQL ts_headline() content truncation required client-side workaround, React 19 ESLint strictness exposed knowledge gaps, keyboard handler bug fixes (9 files) lacked documentation for Epic 5 handoff.

**Top Actions:** Document keyboard handler architecture (Epic 5 blocker), create React 19 best practices guide, update story template with architecture checklist.

---

## Delivery Metrics

### Scope & Completion
- **Total Stories:** 7/7 (100% complete)
- **Story Points:** ~15 estimated, ~15 actual (velocity: ~3 pts/day)
- **Stories Delivered:**
  - 4.1: Split Pane Component with Toggle Button ✅
  - 4.2: Detail Pane Content Rendering ✅
  - 4.3: Auto-Update Detail on Row Click ✅
  - 4.4: Keyword Highlighting in Detail View ✅
  - 4.5: Section Navigation with Clickable Headers ✅
  - 4.6: Query Metadata Page ✅
  - 4.7: Scroll Position Persistence ✅

### Quality Metrics
- **Code Reviews:** 7/7 (100% coverage)
- **Re-reviews Required:** 3 stories (4.1, 4.2, 4.3)
- **Total Issues Found:** 47 across all stories
  - HIGH priority: 21 issues
  - MEDIUM priority: 18 issues
  - LOW priority: 8 issues
- **Critical Bugs Caught:** ESLint violations (React 19), memory leaks, race conditions, AC violations
- **Production Incidents:** 0
- **Build Success Rate:** 100% (TypeScript + ESLint passing)

### Technical Debt
- **Incurred:** 3 items
  1. Story 2.6 inherited bug: plainto_tsquery multi-keyword AND logic limitation
  2. Story 4.4 workaround: Client-side highlighting less performant than backend
  3. Missing automated test coverage (all manual testing)
- **Resolved:** LoadingSpinner duplication (still pending from Epic 2)

### Business Outcomes
- **Goals Achieved:** 4/4 (split pane, detail rendering, keyword highlighting, scroll persistence)
- **Functional Requirements:** FR31-40 implemented (100%)
- **User Value:** Zero-tab event exploration with full context preservation
- **Performance:** All stories met <500ms targets, Story 4.3 achieved 10-20x improvement

---

## What Went Well

### 1. Quality-First Development Culture
**Evidence:**
- 100% code review coverage with 47 issues caught pre-merge
- Story 4.7: 13 findings (memory leaks, race conditions) all fixed before approval
- Zero production incidents across 7 stories

**Impact:**
- Critical React 19 `setState` violations caught early (Story 4.1, 4.3)
- Race conditions identified in scroll restoration (Story 4.7)
- AC violations prevented (Story 4.7 AC4 scroll reset not implemented initially)

**Team Sentiment:**
- Dana (QA): "47 issues caught before production - that's the system working, not failing"
- Alice (PO): "Zero production incidents is testament to our code review rigor"

### 2. Opportunistic Refactoring Success
**Evidence:**
- Story 4.3: Extracted `useEventDetailPane` hook, eliminated 85+ lines of duplication
- Story 4.5: Fixed 9 keyboard handler bugs discovered during section navigation testing
- Story 4.6: Implemented smart retry logic (app-wide improvement, not scoped)

**Impact:**
- Reusable hook pattern for detail pane integration across pages
- Keyboard handler fragility addressed proactively
- App-wide UX improvement: Error pages now show in ~100-500ms vs 6-10 seconds

**Team Sentiment:**
- Charlie (Senior Dev): "The `useEventDetailPane` hook was a breakthrough - exactly the opportunistic refactoring we committed to in Epic 2"
- Taylor (Project Lead): "Story 4.6's smart retry logic wasn't scoped, but the team recognized a UX issue and fixed it"

### 3. Breakthrough Performance Solutions
**Evidence:**
- Story 4.3: Debounced visual state pattern eliminated 300-500ms lag
- Story 4.7: requestAnimationFrame prevented scroll restoration flicker
- Story 4.4: Client-side highlighting shows full content (vs truncated ts_headline)

**Impact:**
- 10-20x performance improvement from rethinking state updates
- Smooth UX with no visible jank or lag
- User value prioritized over backend optimization

**Team Sentiment:**
- Elena (Junior Dev): "The debounced visual state pattern was brilliant - instant responsiveness from just rethinking state updates"

### 4. Comprehensive Story Documentation
**Evidence:**
- Average 850 lines per story (6,513 total across 7 stories)
- Dev Notes included implementation patterns, architecture compliance, previous learnings
- Code review findings documented in story files

**Impact:**
- Clear handoff context for Epic 5 (keyboard shortcuts build on Epic 4 infrastructure)
- Retrospective synthesis easier with rich story records
- Future developers have complete implementation rationale

---

## What Could Be Improved

### 1. PostgreSQL FTS Function Validation Gaps
**Issue:**
- Story 4.4: ts_headline() truncates long event bodies to ~200 chars (designed for snippets, not full document highlighting)
- Discovered during implementation, required client-side workaround
- Story 2.6 inherited bug: plainto_tsquery doesn't handle multi-keyword AND logic properly

**Root Cause:**
- Testing gap: Didn't validate FTS functions with production-like data (long bodies, multi-keyword searches)
- Knowledge gap: Assumed PostgreSQL FTS functions would handle all use cases without reading documentation

**Impact:**
- Implementation rework mid-story (backend highlighting → client-side regex)
- Performance trade-off accepted without measurement
- Search accuracy degraded for multi-keyword queries

**Team Sentiment:**
- Charlie (Senior Dev): "We should've validated PostgreSQL FTS functions earlier - maybe during Epic 2 when we first adopted FTS"

### 2. React 19 Pattern Knowledge Gaps
**Issue:**
- Story 4.1: ESLint `react-hooks/set-state-in-effect` violation required useMediaQuery refactoring (2 re-reviews)
- Story 4.3: Semi-controlled component pattern flagged, required complete refactoring to controlled component
- Multiple stories hit synchronous setState in useEffect issues

**Root Cause:**
- Documentation gap: React 19 best practices not documented
- Knowledge transfer gap: ESLint rule reasoning not shared proactively
- Story template gap: Doesn't guide architectural patterns (controlled vs semi-controlled)

**Impact:**
- Implementation rework during code review (not during planning)
- 2-3 re-review cycles for architectural issues
- Developer frustration with "surprise" refactoring

**Team Sentiment:**
- Elena (Junior Dev): "I didn't know about the `react-hooks/set-state-in-effect` pattern until the reviewer flagged it"

### 3. Missing Automated Test Coverage
**Issue:**
- All 7 stories manually tested (no E2E or integration tests)
- 47 code review issues suggests upfront validation gaps
- Regression risk for Epic 5 (keyboard shortcuts interact with Epic 4 components)

**Root Cause:**
- Tooling gap: No automated test infrastructure (Playwright, Cypress, etc.)
- Priority gap: Testing tools deferred to Phase 2
- Knowledge gap: Team unfamiliar with E2E testing patterns

**Impact:**
- Manual testing bottleneck (QA bandwidth constraint)
- Code review catches issues that automated tests would prevent
- Confidence gap for refactoring (fear of breaking existing functionality)

**Team Sentiment:**
- Dana (QA): "We're still manually testing everything. 47 review issues suggest we need better upfront validation"

### 4. Keyboard Handler Documentation Debt
**Issue:**
- Story 4.5: Fixed 9 keyboard handler bugs (14 files modified total including docs)
- No architecture document explaining changes or active shortcuts
- Epic 5 needs this context to avoid conflicts/regressions

**Root Cause:**
- Process gap: Adjacent bug fixes documented in git commits but not in architecture docs
- Scope creep handling gap: Discovered bugs fixed but not documented as tech debt

**Impact:**
- Epic 5 handoff missing critical context
- Risk of keyboard shortcut conflicts (unknown which shortcuts are active)
- Knowledge locked in git history (not accessible architecture documentation)

**Team Sentiment:**
- Taylor (Project Lead): "The keyboard handler changes should have been documented. I'm not aware of any other gaps though"
- Charlie (Senior Dev): "If someone asks me next week what we changed, I'd have to dig through git history"

### 5. Unmeasured Performance Trade-offs
**Issue:**
- Story 4.4: Client-side highlighting accepted as "less performant than backend" without measurement
- No performance monitoring or benchmarks
- Unknown actual impact on page load times or runtime performance

**Root Cause:**
- Metrics gap: No performance monitoring infrastructure (Lighthouse CI, Web Vitals)
- Process gap: Acceptance criteria don't include performance budgets

**Impact:**
- Unknown whether client-side highlighting causes user-facing lag
- No data-driven decision making for performance trade-offs
- Risk of cumulative performance degradation over time

**Team Sentiment:**
- Elena (Junior Dev): "We accepted a performance trade-off without measuring the impact"

---

## Root Cause Analysis

### Testing Gaps
- **Symptom:** ts_headline() truncation, plainto_tsquery multi-keyword bug
- **Cause:** No validation with production-like data (long text, edge cases)
- **Solution:** PostgreSQL FTS function test suite with edge cases

### Knowledge Gaps
- **Symptom:** React 19 ESLint violations, controlled component refactoring
- **Cause:** React 19 patterns not documented, story templates don't guide architecture
- **Solution:** React 19 best practices guide, update story template with architecture checklist

### Tooling Gaps
- **Symptom:** 47 code review issues, manual testing bottleneck
- **Cause:** No automated tests, no performance monitoring
- **Solution:** E2E test foundation (Playwright), Lighthouse CI or Web Vitals

### Process Gaps
- **Symptom:** Keyboard handler changes undocumented, mid-story refactoring
- **Cause:** Adjacent bug fixes not documented, story planning doesn't catch architectural choices
- **Solution:** Document adjacent fixes, update story template

### Documentation Gaps
- **Symptom:** Epic 5 missing keyboard handler context
- **Cause:** Architecture docs not updated when fixing discovered bugs
- **Solution:** Keyboard handler architecture document

### Metrics Gaps
- **Symptom:** Performance trade-offs unmeasured
- **Cause:** No performance monitoring infrastructure
- **Solution:** Performance monitoring (Phase 2)

---

## Key Learnings & Insights

### 1. React 19 Strictness is a Feature, Not a Bug
**Learning:**
ESLint rules like `react-hooks/set-state-in-effect` caught real bugs early (race conditions, stale closures). The "friction" of stricter linting prevented production issues.

**Pattern to Follow:**
- Embrace ESLint violations as learning opportunities
- Document React 19 patterns proactively (don't wait for violations)
- Update story templates to guide architectural choices upfront

**Evidence:**
- Story 4.1: useMediaQuery refactoring prevented MediaQueryList listener memory leaks
- Story 4.3: Controlled component refactoring eliminated prop-to-state sync bugs

### 2. Controlled Components > Semi-Controlled Components
**Learning:**
Derived state with `useMemo` is cleaner and more predictable than prop-to-state synchronization in `useEffect`. Semi-controlled components create race conditions and stale state bugs.

**Pattern to Follow:**
- Default to controlled components (parent owns state, child is stateless)
- Use derived state (`useMemo`) for computed values
- Avoid `useState` + `useEffect` synchronization patterns

**Evidence:**
- Story 4.3: Refactoring from semi-controlled to controlled eliminated ESLint violations
- `useEventDetailPane` hook encapsulates derived state cleanly

### 3. PostgreSQL FTS Has Sharp Edges
**Learning:**
PostgreSQL FTS functions are optimized for specific use cases:
- `ts_headline()` designed for search result **snippets**, not full document highlighting
- `plainto_tsquery()` uses OR logic, not AND logic for multi-keyword searches

**Pattern to Follow:**
- Read PostgreSQL FTS documentation thoroughly before committing to functions
- Test FTS functions with production-like data (long text, edge cases)
- Consider client-side alternatives when FTS limitations break UX

**Evidence:**
- Story 4.4: ts_headline() truncation broke user experience (200 char limit)
- Story 2.6: plainto_tsquery multi-keyword bug affects search accuracy
- Client-side highlighting workaround preserves full content

### 4. Testing Adjacent Systems Surfaces Bugs
**Learning:**
Story 4.5 section navigation testing discovered 9 keyboard handler bugs across the codebase. Testing one feature often reveals fragility in adjacent systems.

**Pattern to Follow:**
- Manual testing should explore beyond story scope (exploratory testing)
- Document and fix discovered bugs (don't defer or ignore)
- Update architecture docs when fixing systemic issues

**Evidence:**
- Story 4.5: 14 files modified (1 story implementation + 9 bug fixes + 4 docs)
- Created `useShortcutHandler.ts` hook to fix root cause

### 5. App-Wide Improvements Deserve Celebration
**Learning:**
Story 4.6's smart retry logic was discovered during manual testing and fixed immediately - benefiting the entire application. Opportunistic improvements should be encouraged, not discouraged as scope creep.

**Pattern to Follow:**
- Celebrate app-wide improvements discovered during implementation
- Document these improvements in retrospectives (they're wins, not tech debt)
- Balance immediate fixes with deferring to backlog (use judgment)

**Evidence:**
- Story 4.6: Smart retry logic reduced error page load from 6-10s to 100-500ms
- Impact: All tRPC queries across entire app benefit from intelligent retry categorization

### 6. Debounced Visual State Pattern for Performance
**Learning:**
Separating instant visual updates (optimistic state) from debounced side effects (network calls, storage) delivers 10-20x performance improvements without sacrificing UX.

**Pattern to Follow:**
- User-facing state updates: Instant (no debounce)
- Side effects (network, storage): Debounced (100-300ms)
- Use `useMemo` for derived state to prevent re-render storms

**Evidence:**
- Story 4.3: j/k navigation went from 300-500ms lag to instant
- Story 4.7: Scroll position saves debounced to prevent performance issues

### 7. sessionStorage > localStorage for Session-Specific State
**Learning:**
sessionStorage clears on tab close, making it ideal for session-specific state like scroll position. localStorage persists indefinitely, polluting storage and creating stale state bugs.

**Pattern to Follow:**
- Use sessionStorage for: scroll position, form state, session preferences
- Use localStorage for: persistent user preferences, authentication tokens
- Default to sessionStorage unless persistence across sessions is explicitly required

**Evidence:**
- Story 4.7: Scroll position restoration uses sessionStorage
- Epic 4 spec explicitly required sessionStorage (privacy + fresh start in new tabs)

---

## Action Items

### Immediate Actions (Before Epic 5 Kickoff - Due Dec 9, 2025)

#### ACTION 1: Document Keyboard Handler Architecture
- **Owner:** Charlie (Senior Dev)
- **Timeline:** Today (Dec 9)
- **Deliverable:** Architecture doc (`docs/keyboard-handler-architecture.md`) explaining:
  - Story 4.5 keyboard handler changes (9 files modified)
  - Active keyboard shortcuts and their handlers
  - Integration points for Epic 5 keyboard shortcuts
  - Known conflicts or fragility areas
- **Why:** Epic 5 needs this context to avoid conflicts/regressions
- **Acceptance Criteria:**
  - Document lists all active shortcuts (/, j, k, d, s, c, r, 1, 2, 3, etc.)
  - Explains Story 4.5 bug fixes and `useShortcutHandler` hook pattern
  - Identifies integration points for Epic 5 (e.g., `d` key → DetailPaneContext)
  - Epic 5 team can reference without digging through git history

#### ACTION 2: Create React 19 Best Practices Guide
- **Owner:** Elena (Junior Dev)
- **Timeline:** Today (Dec 9)
- **Deliverable:** Documentation file (`docs/react-19-best-practices.md`) covering:
  - Controlled vs semi-controlled components (when to use each)
  - `react-hooks/set-state-in-effect` rule and alternatives
  - Derived state with `useMemo` pattern
  - Common ESLint violations and how to fix them
- **Why:** Prevent ESLint rework in future stories, share knowledge across team
- **Acceptance Criteria:**
  - Examples from Epic 4 stories (4.1 useMediaQuery, 4.3 controlled component)
  - Code snippets showing "before" and "after" patterns
  - Linked from main architecture.md document
  - Junior devs can reference during story implementation

#### ACTION 3: Update Story Template with Architecture Checklist
- **Owner:** Alice (Product Owner)
- **Timeline:** Before Epic 5 kickoff (Dec 9)
- **Deliverable:** Story template (`docs/story-template.md`) includes:
  - Component pattern checklist (controlled vs semi-controlled decision)
  - State management checklist (useState vs derived state with useMemo)
  - Performance consideration prompts (debouncing, optimization)
- **Why:** Catch architectural choices during planning, not mid-implementation
- **Acceptance Criteria:**
  - Template includes decision tree for component patterns
  - Prompts dev to document architectural rationale upfront
  - Used in Epic 5 story creation

---

### Deferred Actions (Post-Epic 5 / Phase 2 Backlog)

#### ACTION 4: Implement E2E Test Foundation
- **Owner:** Dana (QA Engineer) + Charlie (Senior Dev)
- **Timeline:** After Epic 5 (Phase 2)
- **Deliverable:** Playwright setup with 3-5 critical path tests:
  - Login flow
  - Query creation and execution
  - Event exploration (table navigation, detail pane)
  - Keyboard shortcut verification (Epic 5)
- **Why:** Reduce manual testing burden, catch regressions earlier
- **Acceptance Criteria:**
  - Playwright installed and configured
  - CI integration (run on every PR)
  - Documentation on how to add new tests
  - 3-5 tests covering happy paths

#### ACTION 5: Add Performance Monitoring
- **Owner:** Charlie (Senior Dev)
- **Timeline:** Phase 2
- **Deliverable:** Lighthouse CI or Web Vitals monitoring for key pages:
  - Dashboard (/dashboard)
  - Query view (/queries/[id])
  - Event detail (/events/[id])
- **Why:** Measure performance trade-offs objectively, prevent performance regressions
- **Acceptance Criteria:**
  - Automated Lighthouse reports on CI
  - Performance budgets defined (LCP <2.5s, FID <100ms, CLS <0.1)
  - Performance regressions fail CI builds

#### ACTION 6: PostgreSQL FTS Function Validation Suite
- **Owner:** Charlie (Senior Dev)
- **Timeline:** Phase 2 (backlog)
- **Deliverable:** Test suite for PostgreSQL FTS functions:
  - ts_headline() with long text (>1000 chars)
  - plainto_tsquery() with multi-keyword searches
  - ts_rank() scoring validation
  - Edge cases (special characters, empty strings, very long queries)
- **Why:** Prevent future FTS function surprises, validate workarounds
- **Acceptance Criteria:**
  - Integration tests covering FTS edge cases
  - Documentation of FTS function limitations
  - Guidance on when to use client-side alternatives

#### ACTION 7: Create Reusable LoadingSpinner Component
- **Owner:** Elena (Junior Dev)
- **Timeline:** Opportunistic (when touching loading states)
- **Deliverable:** Shared LoadingSpinner component (`src/components/ui/LoadingSpinner.tsx`)
- **Why:** Epic 2 action item still pending, reduces duplication across components
- **Acceptance Criteria:**
  - Single reusable component with size variants (sm, md, lg)
  - HeroUI styling consistent with design system
  - Used in at least 3 locations (replace inline spinners)
  - Documented in ui-component-architecture.md

---

## Epic 5 Readiness Assessment

### Prerequisites Complete ✅
- Detail pane toggle mechanism exists (DetailPaneContext, Story 4.1)
- Section navigation function ready (`scrollToSection()`, Story 4.5)
- EventTable keyboard navigation already working (j/k from Story 2.2)
- Keyboard shortcut foundation exists (ShortcutContext from Story 2.1)

### Preparation Needed ⚠️
- **BLOCKER:** Document keyboard handler architecture (ACTION 1 - due today)
- React 19 best practices guide (ACTION 2 - reduces rework)
- Story template updates (ACTION 3 - improves planning)

### Risk Assessment
**LOW RISK:** Epic 5 builds directly on Epic 4's stable infrastructure
- All Epic 4 stories delivered with zero production incidents
- Code review rigor ensures quality handoff
- 3 immediate actions address knowledge/documentation gaps

**MEDIUM RISK:** Keyboard handler fragility from Story 4.5 bug fixes
- 9 files modified to fix keyboard handler bugs
- Unknown whether fixes introduced new fragility
- **MITIGATION:** ACTION 1 documents changes, Epic 5 team reviews before implementation

**NEGLIGIBLE RISK:** No architectural changes blocking Epic 5
- Epic 5 layers shortcuts on existing UI (no refactoring needed)
- DetailPaneContext and section navigation APIs stable

---

## Continuous Improvement Trends

### Epic 2 → Epic 4 Improvements
**What We Committed To (Epic 2 Retro):**
- Design token system implementation ✅ DONE
- Opportunistic refactoring when touching files ✅ DONE (Story 4.3 hook extraction)
- Quality-First Development Principle ✅ DONE (100% code review, 47 issues caught)

**What We Actually Did:**
- All Epic 2 commitments followed through
- Added app-wide improvements (smart retry logic)
- Proactively fixed adjacent bugs (9 keyboard handler fixes)

**Trend:** Quality-first culture is working. Opportunistic refactoring happening organically.

### Recurring Patterns Across Epics
**Good Patterns:**
- 100% code review coverage (Epic 1, 2, 4)
- Zero production incidents (consistent)
- Opportunistic refactoring (Epic 2 commitment, Epic 4 execution)
- Comprehensive story documentation (averaging 850 lines/story)

**Anti-Patterns:**
- Manual testing bottleneck (Epic 1, 2, 4 - still no automated tests)
- Mid-story refactoring (Epic 2 Story 2.4, Epic 4 Story 4.3 - architectural planning gap)
- Documentation debt (Epic 2 LoadingSpinner, Epic 4 keyboard handler)

**Action:** E2E test foundation and story template updates address recurring anti-patterns.

---

## Team Feedback & Morale

### What Energized the Team
- **Breakthrough moments:** `useEventDetailPane` hook, debounced visual state pattern
- **Quality wins:** Catching 47 issues pre-merge, zero production incidents
- **Autonomy:** Team empowered to fix app-wide issues (smart retry logic)
- **Learning:** React 19 patterns, PostgreSQL FTS limitations (painful but valuable)

### What Frustrated the Team
- **Rework:** ESLint violations requiring 2-3 re-reviews (knowledge gap frustration)
- **Surprises:** ts_headline() truncation, plainto_tsquery multi-keyword bug
- **Manual testing:** Time-consuming, repetitive, feels inefficient
- **Documentation debt:** Keyboard handler changes not documented creates anxiety for Epic 5

### Team Sentiment
**Overall:** Positive. 100% completion with high quality delivery creates confidence.  
**Concerns:** Manual testing bottleneck, knowledge gaps causing rework, documentation debt.  
**Optimism:** 3 immediate actions directly address team frustrations.

---

## Appendix: Story-by-Story Summary

### Story 4.1: Split Pane Component with Toggle Button
- **Key Learning:** React 19 ESLint `set-state-in-effect` rule prevents real bugs
- **Achievement:** Responsive split pane with localStorage persistence, 200ms transitions
- **Issues:** 2 re-reviews for ESLint violations, AC4 localStorage persistence initially missed
- **Pattern:** DetailPaneContext for global state, localStorage for user preferences

### Story 4.2: Detail Pane Content Rendering
- **Key Learning:** EventDetail component structure clean and maintainable
- **Achievement:** Full event metadata rendering, sticky header pattern, dark mode support
- **Issues:** Initial review found loading state gaps
- **Pattern:** HeroUI components, semantic color tokens, accessibility-first

### Story 4.3: Auto-Update Detail on Row Click
- **Key Learning:** Controlled components > semi-controlled components
- **Achievement:** `useEventDetailPane` hook (85+ lines DRY), debounced visual state (10-20x perf)
- **Issues:** Complete refactoring from semi-controlled to controlled component pattern
- **Pattern:** Derived state with `useMemo`, debounced side effects

### Story 4.4: Keyword Highlighting in Detail View
- **Key Learning:** PostgreSQL ts_headline() designed for snippets, not full documents
- **Achievement:** Client-side regex highlighting shows full content with highlights
- **Issues:** Backend highlighting truncated content, required client-side workaround
- **Pattern:** Client-side highlighting when backend limitations break UX

### Story 4.5: Section Navigation with Clickable Headers
- **Key Learning:** Testing one feature often surfaces bugs in adjacent systems
- **Achievement:** Clickable section chips, discovered and fixed 9 keyboard handler bugs
- **Issues:** 14 files modified (1 story + 9 bug fixes + 4 docs), created `useShortcutHandler` hook
- **Pattern:** Native `scrollIntoView()`, HeroUI Button chips, opportunistic bug fixing

### Story 4.6: Query Metadata Page
- **Key Learning:** Manual testing reveals app-wide improvement opportunities
- **Achievement:** Dedicated metadata page, smart retry logic (6-10s → 100-500ms error pages)
- **Issues:** Smart retry logic not scoped but critical UX improvement
- **Pattern:** App-wide improvements celebrated, not discouraged as scope creep

### Story 4.7: Scroll Position Persistence
- **Key Learning:** sessionStorage > localStorage for session-specific state
- **Achievement:** Scroll restoration with sessionStorage, requestAnimationFrame prevents flicker
- **Issues:** 13 code review findings (memory leaks, race conditions, AC violations)
- **Pattern:** sessionStorage for privacy, debounced scroll handler, cleanup useEffect

---

## Retrospective Metadata

**Facilitator:** Bob (Scrum Master)  
**Date:** December 9, 2025  
**Duration:** ~90 minutes  
**Format:** Structured (What Went Well, What Could Be Improved, Root Cause, Actions)  
**Outcome:** 3 immediate actions (Epic 5 blockers), 4 Phase 2 backlog items  
**Follow-up:** Epic 5 kickoff after ACTION 1-3 completion  

**Participants:**
- Bob (Scrum Master) - Facilitation
- Alice (Product Owner) - Product perspective, story template updates
- Charlie (Senior Dev) - Technical leadership, architecture documentation
- Dana (QA Engineer) - Quality perspective, E2E test planning
- Elena (Junior Dev) - Implementation experience, React 19 guide
- Taylor (Project Lead) - Strategic oversight, retrospective sponsorship

**Retrospective Quality:**
- All team members contributed
- Psychological safety maintained (no blame, focus on systems)
- Specific examples used (not generalizations)
- Action items concrete and owned
- Root causes identified (not just symptoms)

---

**Document completed by:** Claude Code (Claude Sonnet 4.5)  
**Workflow:** BMad Method v6 - retrospective workflow  
**Epic Status:** Done (7/7 stories complete, 100% delivery)  
**Next Epic:** Epic 5 - Keyboard Foundation (ready to start after 3 immediate actions)
