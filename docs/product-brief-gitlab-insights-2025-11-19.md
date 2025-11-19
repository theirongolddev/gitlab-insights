# Product Brief: gitlab-insights

**Date:** 2025-11-19
**Author:** BMad
**Context:** Internal empowerment tool for PM-less engineering organizations

---

## Executive Summary

In PM-less engineering organizations, talented engineers become accidentally siloed - not from lack of collaboration desire, but from lack of visibility into where their knowledge and skills are needed. GitLab Insights transforms this organizational blindness into deliberate professional agency by converting GitLab's pull-based "search for everything" model into push-based "discover what matters" ambient awareness.

The platform ingests GitLab webhook events and applies intelligent filtering to surface relevant conversations, prevent duplicate work, and reveal contribution opportunities - enabling engineers to leverage their expertise deliberately across the organization without leadership needing to add coordination overhead.

---

## Core Vision

### Problem Statement

Engineers in PM-less organizations face a **multi-layered visibility crisis** that causes work duplication and missed collaboration opportunities. This crisis stems from:

- **Organizational structure:** No PM coordination role to synthesize and broadcast work status
- **Tool limitations:** GitLab's pull-based design optimized for participatory workflows (work on assigned items), not ambient awareness workflows (discover relevant work)
- **Information architecture:** Discussions happen in isolated contexts with no cross-cutting pattern visibility
- **Human behavior:** Signal-to-noise overwhelm leads engineers to opt-out of monitoring
- **Process gaps:** No mechanism for status broadcasting or proactive discovery

The root cause is an **architectural mismatch**: you can't search for conversations you're unaware are happening (the "unknown unknowns" problem). Valuable knowledge exists in individuals' heads, but without visibility into ongoing discussions, opportunities for knowledge sharing are lost and decisions get made without all available information.

### Problem Impact

The visibility crisis impacts every engineering role differently:

**Individual Contributors (ICs)** waste 10-20 hours/month on duplicate work, miss 60-80% of relevant discussions, and experience anxiety/isolation cycles from information overwhelm. They spend 30-45 min/day manually checking GitLab, get overwhelmed, and opt-out - creating a guilt cycle of "should check more often."

**Technical Leads** (highest-value stakeholder) spend 20-40% of their time on manual coordination overhead that should be automated, discover conflicts reactively instead of proactively, and lack the visibility needed to effectively lead PM-less teams - reducing team velocity by 15-25%. Without this tool, tech leads resort to 5-10 hours/week in manual sync meetings.

**Engineering Managers** spend 5-8 hours/week gathering context that should be ambient, miss proactive coaching opportunities, and struggle with risk visibility. They discover team issues after they've compounded rather than catching them early.

**New Hires** take 40-60 days to reach full productivity (could be 20-30 days with visibility), struggling to build mental maps of team context, fearing duplicate work, and feeling isolated during the critical onboarding period.

**Cumulative organizational cost:** 25-40% reduction in engineering effectiveness due to coordination overhead, duplication, and lost knowledge sharing - all solvable with better information architecture.

### Why Existing Solutions Fall Short

**GitLab's native activity feed:** Chronological firehose of all events - overwhelming, no contextual grouping or intelligent filtering.

**GitLab notifications:** Require either subscribing to specific issues/MRs (chicken-and-egg: must know they exist first) or enabling project-wide notifications (drowns in noise). No "show me things semantically related to my interests/expertise" capability.

**Label-based filtering:** Requires consistent labeling discipline across the organization, which rarely happens in PM-less teams.

**Communication tools (Slack, etc.):** Ephemeral, unsearchable long-term, and create overhead people skip when busy. The work is already documented in GitLab - it just needs better surfacing.

**Root cause:** GitLab designed for **participatory workflows** (work on assigned items), not **ambient awareness workflows** (discover work across org). You need a discovery and intelligence layer on top of GitLab, not a replacement.

### Proposed Solution

GitLab Insights is a **discovery and intelligence layer** built on top of GitLab that transforms pull-based participatory workflows into push-based ambient awareness.

The platform captures GitLab webhook events (issues, MRs, comments) and applies intelligent, personalized filtering to surface:
- **Relevant conversations** you should know about (based on your expertise, interests, current work)
- **Duplicate work prevention** through proactive discovery before you start building
- **Pattern detection** across team activities (e.g., "three people working on auth challenges")
- **Contribution opportunities** where your knowledge could add value to ongoing discussions

Instead of requiring engineers to manually search GitLab (pull model), GitLab Insights provides:
- **Catch-Up Mode** - in-app digest showing what's new since last visit (replaces email)
- **Live Mode** - real-time feed with webhook updates
- **Customizable saved queries** for different workflows
- **Browsing mode** for undirected exploration and serendipitous discovery
- **Direct linking** back to GitLab for seamless contribution

The core function: **Relevance-filtered event stream** that solves the "unknown unknowns" problem by discovering conversations you didn't know were happening but should care about.

### Key Differentiators

**Solves the architectural mismatch:** GitLab optimized for participatory workflows (work on assigned items); GitLab Insights enables ambient awareness workflows (discover relevant work across org).

**Builds on existing work artifacts:** Doesn't require new communication overhead - surfaces the work already documented in GitLab with better intelligence.

**Personalized relevance:** Not a one-size-fits-all feed - filters based on your expertise, interests, and current context to maintain high signal-to-noise ratio.

**Role-based value:** Serves different stakeholder needs - ICs get duplicate prevention, Tech Leads get coordination visibility, Managers get team health insights, New Hires get accelerated onboarding.

**Discovery over surveillance:** Designed for knowledge sharing and collaboration, explicitly avoiding productivity metrics or "Big Brother" use cases.

---

## Target Users

### Primary Users

**Mid to Senior Engineers in PM-less Organizations**

These engineers have valuable expertise and knowledge but lack visibility into where it's needed. They're not junior developers waiting for assignments - they're autonomous contributors who want to deliberately leverage their skills across the organization but are accidentally siloed by information architecture.

**Current behavior:**
- Spend 30-45 min/day manually checking GitLab activity feeds
- Get overwhelmed by noise and opt-out, creating guilt cycles
- Discover duplicate work after it's done (too late)
- Carry context in their heads with no proactive sharing mechanism
- Feel isolated and anxious about missing important discussions

**What they need:**
- Effortless awareness of team activity without manual searching
- Early discovery of duplicate work (before building, not after)
- Serendipitous connection to discussions where their expertise matters
- Ability to browse without guilt ("am I wasting time?")
- Reduced anxiety through confidence: "I haven't missed anything critical"

**Success looks like:**
- Catching duplicate work 1-3x per month before investing effort
- Contributing expertise to 2-5 discussions per week they wouldn't have discovered
- Spending 10-15 min/day staying informed (down from 45 min of frustrated searching)
- Feeling connected to team instead of isolated

### Secondary Users

**Technical Leads in PM-less Organizations** (Actually highest-value stakeholder)

Tech leads desperately need coordination visibility but lack PM tools. They're trying to lead through influence and technical guidance but are flying blind on "what is the team working on."

**Current pain:**
- 5-10 hours/week in manual sync meetings gathering context
- Reactive discovery of conflicts and bottlenecks (too late to prevent)
- Can't effectively mentor or unblock without constant check-ins
- Team velocity reduced 15-25% due to invisible coordination issues

**What they need:**
- Coordination view: "What is the team working on right now?"
- Pattern detection: "Are three people solving the same problem?"
- Bottleneck visibility: "Who's blocked and on what?"
- Proactive conflict prevention instead of reactive firefighting

**Engineering Managers**

Need team health visibility and risk awareness without creating "Big Brother" perception.

**New Hires**

Need accelerated onboarding through ambient learning - building mental maps of team context, priorities, and "who knows what" in 20-30 days instead of 40-60 days.

### User Journey

**Daily Morning Sync (9:00 AM - 5 min):**
- Open dashboard with coffee
- Switch to Catch-Up Mode: "3 new issues in auth, 2 MRs touching API layer"
- Feel calm, oriented, in-control instead of anxious about what was missed

**Pre-Work Check (Before Starting New Feature - 3 min):**
- Query tool before starting new task
- Discover related work already in progress
- Avoid duplicate effort - feel relieved and empowered

**Active Monitoring (Throughout Day - Passive):**
- Smart notifications for truly relevant items with urgency levels
- "FYI" vs "You should probably chime in"
- Stay aware without distraction

**Exploratory Learning (Bi-weekly - 30-60 min):**
- Dedicated browsing time without guilt
- Topic clustering (grouped, not chronological)
- Serendipitous discovery: "I didn't know that was happening, but I have relevant context"
- Feel curious, connected, learning

**Knowledge Contribution (Ad-Hoc):**
- Spot relevant discussion through discovery
- Jump in with expertise and lessons learned
- Feel heroic and connected instead of invisible

---

## Success Metrics

Success is defined by **catching things early** - discovering duplicate work BEFORE building, contributing to discussions DURING debate (not after decisions made), and finding interesting connections through browsing.

### Key Performance Indicators

**Engagement Metrics (Product Health):**
- 3+ daily active users by week 4 of MVP
- Catch-Up Mode shows 5-15 items per query (not 0, not 100) - proves relevance tuning
- Users click through to GitLab 40%+ of the time (proves relevance)
- Discovery happens 1-3x per week minimum per user

**Value Delivery Metrics:**
- Duplicate work prevented: 1-3 instances caught per user per month
- Knowledge contributions: 2-5 discussions per week where user adds expertise they wouldn't have discovered
- Time saved: User self-reports spending 10-15 min/day staying informed (down from 30-45 min manual searching)

**Technical Performance:**
- Page load <500ms (attention is precious)
- Search results <1s (speed is essential)
- Webhook capture >99% (missing events = trust failure)
- Notification relevance >80% (measured by click-through and user feedback)

**Failure Signals (Red Flags):**
- Catch-Up Mode has 0 items regularly (filters too narrow)
- Catch-Up Mode has 50+ items regularly (filters too broad)
- Users stop checking Catch-Up Mode after week 2 (relevance failure)
- DAU drops below 50% by week 4 (product-market fit failure)

### Business Objectives

**Primary:** Enable deliberate professional agency in PM-less organizations by transforming accidental silos into connected knowledge networks.

**Organizational Impact:**
- Reduce engineering effectiveness loss from 25-40% to <10% through better coordination
- Cut tech lead coordination overhead from 20-40% to <10% of their time
- Accelerate new hire productivity from 40-60 days to 20-30 days
- Prevent 10-20 hours/month of duplicate work per engineer

**Strategic Outcome:** Prove that PM-less organizations can achieve effective coordination through better information architecture rather than adding coordination roles - validating the "tooling over headcount" approach.

---

## MVP Scope

### Core Features

**The MVP is a relevance-filtered event stream.** Without these capabilities, the product doesn't work:

1. **Event Capture & Storage**
   - GitLab webhook receiver for issues, MRs, and comments
   - Event storage with essential metadata: title, body, author, project, labels, timestamp
   - Direct URL linking back to GitLab
   - Webhook reliability: retry logic, dead-letter queue, health monitoring

2. **Flexible Filtering System**
   - Per-user filter creation: keywords, labels, authors, projects
   - Named filters (e.g., "Auth work", "API changes")
   - Simple query interface (UI or query language)
   - Conservative defaults to prevent noise

3. **Fast Event Retrieval**
   - Search across captured events (<1s response time)
   - Time-based organization (recent first)
   - Results page with direct GitLab links
   - Performance budget: <500ms page loads

4. **Catch-Up Mode (In-App Digest)**
   - Dashboard toggle between Live Mode and Catch-Up Mode
   - Catch-Up Mode shows what's new since last visit grouped by saved queries
   - 5-15 items per query (not 0, not 100)
   - Mark queries as reviewed, return to Live Mode
   - Eliminates email infrastructure while preserving digest mental model

5. **Basic Dashboard**
   - View recent events matching your filters
   - Click through to GitLab seamlessly
   - No complex analytics - just the feed

**Critical Non-Functional Requirements:**
- Webhook capture >99% reliability (missing events breaks trust)
- <500ms page loads, <1s search (attention is precious)
- Per-user personalization (not one-size-fits-all)
- Privacy: no productivity metrics, no surveillance features

### Out of Scope for MVP

**Post-MVP Validation (Ship basic first, validate, then enhance):**
- File-level activity tracking (monitor specific files for changes, discussions, references)
- Pattern detection across team work ("3 people working on auth")
- Smart relevance scoring or ML-based filtering
- Topic clustering (grouped vs chronological)
- Role-based dashboards (IC vs Tech Lead vs Manager)
- "Your expertise might be relevant" suggestions
- Reading list / bookmarks
- Historical context surfacing
- Browsing mode for undirected exploration

**Future Vision (Nice-to-have, not must-have):**
- Multi-team / multi-project support
- Analytics and trend visualization
- Integration with Slack or other tools
- Advanced pattern detection
- Institutional memory features
- Onboarding-specific views

### MVP Success Criteria

**The MVP succeeds if:**
1. You (primary user) use it daily for 4+ weeks without abandoning
2. Catch-Up Mode has 5-15 relevant items per query (proves filter tuning works)
3. You click through to GitLab on 40%+ of items (proves relevance)
4. You catch 1-3 duplicate work instances in first month (proves value)
5. 2-3 peer engineers adopt it and report similar value
6. Technical performance hits targets: <500ms pages, <1s search, >99% webhook capture

**MVP fails if:**
- You stop using it by week 2 (product-market fit failure)
- Catch-Up Mode overwhelms with noise or provides nothing relevant
- Performance is too slow to be useful
- Webhook reliability creates missing events

### Future Vision

**Post-MVP, the platform evolves into:**

**Intelligence Layer:** Pattern detection revealing cross-cutting themes, bottlenecks, and coordination opportunities that humans can't see scanning linearly.

**Knowledge Graph:** "Who knows what" mapping, historical decision context, and institutional memory preservation for onboarding and decision-making.

**Proactive Suggestions:** "Your expertise in auth might be relevant to this discussion" - surfacing contribution opportunities based on past activity.

**Multi-Team Coordination:** Expand beyond single team to enable cross-team discovery and collaboration across the organization.

**Role-Specific Views:** Tailored dashboards for ICs (discovery focus), Tech Leads (coordination focus), Managers (team health focus), and New Hires (learning focus).

---

## Technical Preferences

**Architecture Approach:**
- Event-driven architecture with webhook ingestion
- Background processing for reliability (retry, DLQ)
- Aggressive caching and indexing for performance
- Performance budget: <500ms pages, <1s search from day 1

**Technology Priorities:**
- Speed over features (fast and simple beats slow and sophisticated)
- Reliability over completeness (99%+ webhook capture non-negotiable)
- Simplicity over cleverness (ship basic, iterate based on usage)
- Dogfooding first (build for yourself, validate, then share)

**Data Strategy:**
- Store 2-4 weeks of event history initially (not years of data)
- Index aggressively for search performance
- Monitoring from day 1 (observability prevents data quality death spiral)

## Organizational Context

**PM-less Organization Dynamics:**
- Leadership has no interest in adding PM coordination overhead
- Engineers are autonomous and senior enough to self-coordinate
- Current coordination happens through ad-hoc Slack and manual check-ins
- No formal process for work visibility or status broadcasting

**Strategic Positioning:**
- This tool validates "tooling over headcount" approach
- Proves coordination problems can be solved architecturally, not organizationally
- If successful, becomes template for other PM-less teams
- Resistance will come from "just hire a PM" camp - need to demonstrate value clearly

**Adoption Strategy:**
- Start with yourself (dogfooding)
- Prove value over 4 weeks
- Invite 2-3 peer engineers as beta testers
- Tech leads will become champions if value is clear
- Frame as team empowerment, never as surveillance

## Risks and Assumptions

**Critical Risks (From Pre-mortem Analysis):**

1. **"Built It, Nobody Uses It" (Adoption Failure)**
   - Risk: Too much friction, no immediate value
   - Mitigation: Dogfood extensively, nail first 30 seconds UX, measure engagement
   - Warning signs: DAU drops week 2, only you using by week 4

2. **"Death by Alert Fatigue" (Noise Overwhelm)**
   - Risk: Too many notifications, users unsubscribe
   - Mitigation: Conservative defaults, granular controls, learn from behavior, daily digest over real-time
   - Warning signs: >50% unsubscribe, complaints about noise

3. **"Too Slow to Be Useful" (Performance Failure)**
   - Risk: Unoptimized queries, no caching, 5-10s load times
   - Mitigation: Performance budget from day 1, index aggressively, cache heavily, monitor latency
   - Warning signs: 5-10s load times, lag complaints

4. **"Feature Creep Paralysis" (Never Ship)**
   - Risk: Try to solve everything, never deploy MVP
   - Mitigation: Ruthless MVP scope, ship basic in 4-6 weeks, early dogfooding, feature freeze discipline
   - Warning signs: Month 2 still designing, month 6 no deployment

5. **"Data Quality Death Spiral" (Reliability Failure)**
   - Risk: Webhook failures, missing events, stale data
   - Mitigation: Webhook retry logic, DLQ, health checks, user feedback loop, monitoring
   - Warning signs: Missing events, duplicates, staleness

6. **"Privacy/Security Backlash" (Surveillance Perception)**
   - Risk: Perceived as "Big Brother"
   - Mitigation: Transparent communication, no vanity metrics, privacy controls, team-first framing
   - Warning signs: "Big Brother" comments, resistance from team

**Key Assumptions:**
- Engineers actually want this visibility (validate through dogfooding)
- GitLab webhooks are reliable enough to build on
- Keyword/label filtering provides sufficient relevance (don't need ML initially)
- Daily digest cadence is appropriate (not too slow, not too fast)
- 2-4 weeks of history is sufficient (don't need years)

**Success Criteria to Mitigate Risks:**
- Ship MVP in 4-6 weeks (prevents feature creep)
- 3+ daily actives by week 4 (proves adoption)
- <500ms page load, <1s search (proves performance)
- >80% notification relevance (prevents fatigue)
- Zero surveillance metrics (prevents backlash)
- 99%+ webhook capture (proves reliability)

## Supporting Materials

**Discovery Documentation:**
- Comprehensive discovery analysis using Five Whys, Journey Mapping, Stakeholder Analysis, Pre-mortem, Empathy Mapping, and First Principles
- Document: `docs/discovery-insights.md`

**Key Insights Incorporated:**
- Root cause analysis identifying architectural mismatch between GitLab's participatory model and ambient awareness needs
- Stakeholder mapping quantifying impact per role (ICs, Tech Leads, Managers, New Hires)
- Pre-mortem analysis identifying 6 critical failure modes with mitigation strategies
- First principles analysis defining minimum viable product as relevance-filtered event stream
- User journey mapping covering daily sync, pre-work checks, active monitoring, exploratory learning, and knowledge contribution patterns

---

_This Product Brief captures the vision and requirements for gitlab-insights._

_It was created through collaborative discovery and reflects the unique needs of this internal empowerment tool project._

_Next: PRD workflow will transform this brief into detailed planning artifacts._
