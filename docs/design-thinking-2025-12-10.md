# Design Thinking Session: GitLab Insights Intelligence Platform

**Date:** 2025-12-10
**Facilitator:** Taylor
**Design Challenge:** Transform GitLab data into actionable intelligence that enables organizational brokerage

---

## Design Challenge

In a highly siloed engineering organization where knowledge is fragmented and "highly-tagged insiders" accumulate all domain knowledge, engineers work isolated - unable to find experts, discover duplicate work, or learn from adjacent discussions.

**The Opportunity:** GitLab Insights will solve this through personalized awareness intelligence, transforming you into the organizational connective tissue who sees patterns, makes introductions, and prevents waste.

**Core Design Question:** How might we design 4 intelligence features (Expertise Discovery, Decision Archaeology, Code Territory Radar, Activity Summaries) that transform raw GitLab data into actionable insights enabling high-value organizational interventions?

**Primary User:** Taylor (as organizational intelligence broker)

**Key Constraints:**
- Build for exclusive personal use first (stealth intelligence hub approach)
- No ML initially - clever GitLab API queries + smart presentation
- AI-assisted development for rapid iteration
- Features must enable specific intervention types: connecting people, preventing duplicates, surfacing decisions, unblocking stalled work

**Success Criteria:**
- 5+ high-value interventions per week
- Colleagues asking "How did you know about that?"
- 200+ hours cumulative time saved by Week 16
- Organic demand emerges (3-5 unsolicited access requests)

---

## EMPATHIZE: Understanding Users

### User Insights

**Primary User:** Taylor - aspiring organizational intelligence broker in a highly siloed engineering org

**Critical Context:** The organization has no formal teams - just individuals assigned work independently. This creates pure atomization with zero organic awareness or coordination points. Everyone is an island.

**Jobs to be Done Analysis (4 Features):**

| Feature | Surface Job | Deeper Job |
|---------|-------------|------------|
| **Expertise Discovery** | Find who knows about X | Self-serve answers from extracted context; avoid needing experts entirely when possible |
| **Decision Archaeology** | Search past decisions | Context finds me with zero effort (current tools exist but too high-friction to be worth using) |
| **Code Territory Radar** | Avoid code collisions | Enable coordination + stewardship; proactive surfacing when starting work; volunteer to help on "my" code |
| **Activity Summaries** | See what's happening | Become the organizational intelligence hub; make better-informed development and planning decisions |

### Key Observations

**Expertise Discovery Triggers:**
- Getting stuck on an issue after trying to solve alone
- Need to find the right person but don't know who
- When person is unavailable, work stalls
- Physical disruption (walking to another building area) breaks flow
- Async communication is painfully slow

**Decision Archaeology Triggers:**
- Researching issue/bug before starting work
- Finding confusing code before refactoring
- Current approach: GitLab search (not worth effort), git blame (tedious), or give up
- Existing tools have such high friction they've become "not worth the effort"

**Code Territory Radar Triggers:**
- Suspicion that a solution might already exist elsewhere
- Starting work on an issue (moving to 'in-progress')
- Seeing others potentially duplicating your work
- **Critical Pain:** "We currently don't discover overlapping work. The code is full of copies of similar but different bespoke solutions to the same general problem. This is one of the main problems in the org right now."

**Activity Summaries Triggers:**
- Downtime + curious mood
- Wanting PM-style finger-in-the-wind awareness
- Growing broader understanding of org context
- Currently: Complete blind spot - no visibility whatsoever
- Missed opportunities to volunteer knowledge and help others

### Empathy Map Summary

**SAYS:**
- "Does anyone know who worked on this?"
- "Has this been done before?"
- "Who should I ask about X?"
- "This probably exists somewhere..."

**THINKS:**
- "It's not worth the effort to search for this"
- "I'm making decisions without full context"
- "There's so much happening I don't know about"
- "I could help if I knew someone needed it"

**DOES:**
- Works in isolation despite being part of an org
- Guesses who to ask (or gives up)
- Duplicates existing solutions unknowingly
- Abandons searches due to friction
- Misses opportunities to volunteer expertise

**FEELS:**
- Frustrated by friction and wasted effort
- Isolated despite being surrounded by engineers
- Uncertain about decisions made without context
- Curious but blocked from satisfying that curiosity
- Powerless to prevent duplicate work happening around them

---

## DEFINE: Frame the Problem

### Point of View Statement

**POV 1: Expertise Discovery**
> **Taylor** (engineer in atomized org) **needs** to quickly access both expert identification AND the context those experts have **because** flow-breaking interruptions and async delays kill productivity, and often the answer exists in the data without needing the expert at all.

**POV 2: Decision Archaeology**
> **Taylor** (engineer starting work on unfamiliar code) **needs** relevant historical context to surface automatically with zero effort **because** existing search tools have such high friction that they've been abandoned as "not worth it" - the job isn't better search, it's eliminating the need to search.

**POV 3: Code Territory Radar**
> **Taylor** (engineer in org with rampant duplication) **needs** proactive visibility into who's working where AND the ability to volunteer stewardship **because** there's no discovery mechanism, duplicate work is a main org problem, and code is full of bespoke copies of the same solutions.

**POV 4: Activity Summaries**
> **Taylor** (aspiring intelligence hub) **needs** ambient awareness of org-wide engineering activity **because** pure atomization means zero organic visibility, leading to missed opportunities to help and decisions made without context.

### How Might We Questions

**Expertise Discovery:**
- How might we help Taylor answer his own question from GitLab data before needing an expert?
- How might we reduce the cost of asking so flow isn't broken?
- How might we surface who AND what they know in one view?

**Decision Archaeology:**
- How might we make historical context find the user instead of requiring search?
- How might we make past decisions visible at the moment they're relevant?
- How might we reduce friction to zero so search becomes worthwhile again?

**Code Territory Radar:**
- How might we detect duplicate work before it's even started (at issue creation)?
- How might we trigger awareness when work starts (moved to in-progress)?
- How might we enable code stewardship - helping people touching "my" code?
- How might we surface overlap between planned, in-progress, AND completed work?

**Activity Summaries:**
- How might we make Taylor the most informed person about engineering trends?
- How might we surface opportunities to volunteer knowledge?
- How might we create ambient awareness in an atomized org?

### Key Insights

**1. Zero-friction or abandoned**
If a feature requires effort, it won't be used. Context must FIND the user, not require searching.

**2. Self-serve > routing**
The best expert query is one where you don't need the expert. Surface the context, not just the person.

**3. Intervene as early as possible**
Hierarchy of intervention points (earlier = more value):
- Issue created - flag duplicates before any work
- Moved to in-progress - surface context as work begins
- Code being written - detect territory overlaps in MRs
- Merge time - too late, but better than nothing

**4. Stewardship, not just collision avoidance**
Users want to HELP people touching their code, not just avoid conflicts. Enable volunteering.

**5. Intelligence hub is the goal**
This isn't productivity tooling, it's positional strategy. Success = "most knowledgeable person in org."

**6. Context engine > feature collection** *(First Principles)*
The 4 features may actually be 4 views into ONE unified intelligence layer, not separate tools. The fundamental need is **relevant context at decision moments**:
- Stuck on code → Who touched this + what they discussed (Expertise + Archaeology)
- Starting work → What exists similar + who's nearby (Territory + Archaeology)
- Curious/downtime → What's happening I should know (filtered Summaries)
- Issue created → Does this already exist? Who cares? (Territory + Expertise)

Design for unified context delivery, not isolated feature silos.

**7. Assumptions to validate** *(First Principles)*
Critical assumptions that could undermine success:
- Commit count correlates with expertise (high commits ≠ skill; low commits could be senior architect)
- Past decisions are documented in GitLab (critical decisions may live in Slack/meetings)
- File-level overlap = meaningful collision (same file ≠ same code area)
- GitLab activity = actual work (real work happens in IDE; GitLab is artifact)

**8. Duplicate work cost is multiplicative, not additive** *(Devil's Advocate)*
The cost isn't just "twice the hours spent." Duplicate work creates tech debt and liability with multiplicative long-term costs. This compounding effect is what must be avoided - the real danger is the ongoing maintenance burden of parallel solutions, not the initial development time.

**9. Surveillance perception must be actively mitigated** *(Devil's Advocate)*
Building for self first, but plan to open to other engineers. This shared access mitigates "all-seeing eye" concerns. Leadership has high interest in the project. Keep secondary users in mind during design even while validating personal needs first.

**10. Precision threshold has leeway** *(Devil's Advocate)*
The alternative to imperfect suggestions is NO suggestions. This gives significant room to tune and improve. High accuracy matters, but "sometimes useful" beats "never available." Innovation Strategy documents the tuning concept.

**11. UI architecture TBD** *(Devil's Advocate)*
The 4 features cannot be truly "unified" - they will manifest as separate elements in the UI somehow. The underlying intelligence may share data/logic, but user-facing presentation will be distinct. Resolve during UX Design phase.

---

## IDEATE: Generate Solutions

### Selected Methods

**SCAMPER Analysis** applied to the "Related Things" Query Engine concept

### Generated Ideas

**Architectural Reframe (from Party Mode):**
The 4 features are actually 5 views into ONE unified query engine:

```
┌─────────────────────────────────────────┐
│     "Related Things" Query Engine       │
│  (given X, find weighted connections)   │
└─────────────────┬───────────────────────┘
                  │
    ┌─────┬───────┼───────┬───────┐
    ▼     ▼       ▼       ▼       ▼
 Expert Decision Territory Activity Email
  View    View    View     View   Digest
```

**SCAMPER Results:**

**S - Substitute:**
- Expertise scoring = Volume (long-term weight) + Recency (quick falloff since people forget code details fast)
- Semantic similarity in search is a MUST-HAVE (not keyword-only)
- No IM integration (Teams used, not worth the complexity)

**C - Combine:**
- Cross-view queries are powerful: "Expert + their decisions + their current work" in one result
- If query engine is built properly, UI/views can be iterated independently

**A - Adapt (patterns to borrow):**
- Netflix "Because you watched..." → "Because you worked on auth/, you might care about..."
- IDE "Find Usages" → Click any entity → see everywhere it's referenced
- Entity cards: Click "Sarah" → expertise areas, recent activity, open MRs, collaborators
- GitHub Copilot context → IDE sidebar surfacing relevant GitLab context

**M - Modify:**
- Connection depth: Go as deep as possible (2nd degree, 3rd degree connections)
- Reliability falloff coefficient: Deeper connections = lower confidence score
- Tune depth/reliability as patterns emerge from usage

**P - Put to Other Uses:**
- **Onboarding assistant** → New engineer gets instant map of who/what/where
- **MR reviewer suggestion** → Dedicated view for your MR, auto-suggests reviewers based on expertise overlap with your changes
- **Incident response** → Production issue in billing/ → Instant experts, recent changes, related discussions
- **Meeting prep** → Before 1:1, see what they've been working on
- **Knowledge transfer** → Engineer leaving → generate expertise brain dump

**E - Eliminate (keep it simple):**
- Real-time already implemented and is KEY feature
- No ML initially (keyword + path matching first)
- No multi-user architecture initially
- Email digest only (no in-app notifications, no push)
- Focus on recent data (6-12 month window)

**R - Reverse:**
- Search still supported, but PROACTIVE SURFACING is the key differentiator
- Search doubles as CONFIGURATION: User searches for something → option to "alert me about this in the future"
- This turns search into a way to teach the system your evolving interests

### Top Concepts

**1. Unified Query Engine with Weighted Connections**
Core capability: Given any GitLab entity, find related entities with confidence scores
- Expertise: Volume (primary) + Recency (fast decay)
- Connections: Deep as possible with reliability falloff
- Semantic similarity: Must-have for search

**2. Five Views into One Engine**
- Expert View: Who knows about X?
- Decision View: What was decided about X?
- Territory View: Who's working near X?
- Activity View: What's happening in time window?
- Email Digest: Proactive daily briefing

**3. Proactive Surfacing + Search-as-Configuration**
- System pushes context at key moments (issue creation, MR creation, work start)
- Search results include "Watch this" option to configure future alerts
- User teaches system their interests through search behavior

**4. MR Context View (New)**
When you create an MR:
- Auto-detect files touched
- Surface experts in those areas
- Suggest reviewers based on expertise overlap
- Show related discussions/decisions
- Flag potential territory conflicts

**5. Incident Response Mode (New)**
Given a production issue area:
- Instant expert list with recency weighting
- Recent changes to that area
- Related discussions that might explain behavior
- Historical incidents in same area

---

## PROTOTYPE: Make Ideas Tangible

### Prototype Approach

{{prototype_approach}}

### Prototype Description

{{prototype_description}}

### Key Features to Test

{{features_to_test}}

---

## TEST: Validate with Users

### Testing Plan

{{testing_plan}}

### User Feedback

{{user_feedback}}

### Key Learnings

{{key_learnings}}

---

## Next Steps

### Refinements Needed

{{refinements}}

### Action Items

{{action_items}}

### Success Metrics

{{success_metrics}}

---

_Generated using BMAD Creative Intelligence Suite - Design Thinking Workflow_
