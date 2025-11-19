# Discovery Insights: GitLab Insights Platform

**Generated:** 2025-11-19
**Project:** gitlab-insights
**Type:** Greenfield, Internal Tool

This document captures insights from the discovery phase using multiple analytical frameworks (Five Whys, Journey Mapping, Stakeholder Analysis, Pre-mortem, Empathy Mapping, First Principles).

---

## Project Vision

Building a GitLab webhook integration platform that transforms **pull-based participatory visibility** into **push-based ambient awareness** through intelligent filtering and pattern detection, enabling proactive knowledge sharing and preventing duplicate work in PM-less teams.

### Core Problem Statement

Engineers are duplicating work and missing collaboration opportunities due to lack of visibility into team activities. GitLab's native interface requires active searching (pull system) when teams need push-based ambient awareness.

---

## Root Cause Analysis (Five Whys)

### Why #1: Why is there duplicated work?
→ Engineers don't know what others are working on, so they independently start solving the same problems

### Why #2: Why don't engineers know what others are working on?
→ No central system for tracking work, and without a PM, there's no coordination or status sharing

### Why #3: Why isn't GitLab itself providing this visibility?
→ GitLab is a pull system requiring active searching. You can't see patterns across issues/MRs unless explicitly subscribed. Need push-based awareness.

### Why #4: Why can't you just subscribe to everything?
→ Signal-to-noise ratio would be overwhelming. Need *filtered, relevant* information, not a firehose. Plus, you don't know what you don't know - can't search for conversations you're unaware are happening.

### Why #5: Why is seeing untagged conversations important?
→ Valuable institutional knowledge exists in individuals' heads. When discussions happen without you, opportunities for knowledge sharing are lost, and decisions get made without all available information.

**Root Causes:**
1. **Information architecture problem:** GitLab designed for participatory visibility (opt-in) not ambient awareness
2. **Knowledge discovery gap:** No way to surface "I didn't know this discussion was happening, but I have relevant context"
3. **Pattern blindness:** No way to see cross-cutting patterns (e.g., "three people working on auth")
4. **Absence of coordination role:** No PM means no human synthesizing and broadcasting work status

---

## Why Existing Tools Fail (Second Five Whys)

### Why #1: Why can't GitLab's native activity feed solve this?
→ Chronological firehose of all events - overwhelming, no contextual grouping or filtering

### Why #2: Why doesn't GitLab provide better filtering?
→ GitLab designed for **participatory workflows** (work on assigned items), not **ambient awareness workflows** (discover work across org)

### Why #3: Why can't you configure GitLab notifications?
→ Notifications require either:
- Subscribe to specific issues/MRs (chicken/egg - must know they exist first)
- Enable project-wide (drowns in noise)
- Label-based (requires consistent labeling discipline)

No "show me things semantically related to my interests/expertise" capability.

### Why #4: Why is semantic/topic-based discovery important?
→ Valuable knowledge sharing happens through **serendipitous discovery** ("I didn't know that discussion was happening, but I have relevant experience"). Subscription models assume you know what you need to know. Most valuable insights come from **unknown unknowns**.

### Why #5: Why can't better communication practices solve this?
→ Because:
- Synchronous communication doesn't scale for detailed technical work
- Slack conversations ephemeral and unsearchable long-term
- Manual communication creates overhead people skip when busy
- **The work is already documented in GitLab** - just needs better surfacing

**Key Insight:** You're building a **discovery and intelligence layer** on top of GitLab, not replacing its core functionality.

---

## User Journey Map

### Stage 1: Morning Sync (Daily - 9:00 AM)
**Actions:**
- Open dashboard with coffee
- Scan "what happened since yesterday"
- Review filtered view for relevant domains

**Emotions:** 😌 Calm, oriented, in-control
**Opportunities:**
- Smart morning digest: "3 new issues in auth, 2 MRs touching API layer"
- Trend alerts: "Search mentioned in 4 different issues this week"

### Stage 2: Pre-Work Check (Before Starting New Task)
**Actions:**
- Query tool before starting new feature
- Discover related work already in progress
- Avoid duplicate effort

**Emotions:** 😅 Relieved (caught it!), 🙌 Empowered
**Opportunities:**
- Duplicate work prevention with proactive notifications
- Full context discovery

### Stage 3: Active Monitoring (Throughout Day)
**Actions:**
- Periodic checks during breaks
- Custom filters running in background
- Smart notifications for truly relevant items

**Emotions:** 🧘 Present but not distracted, 👀 Aware
**Opportunities:**
- Smart notifications with urgency levels
- "FYI" vs "You should probably chime in"

### Stage 4: Exploratory Learning (Bi-weekly - 30-60 min)
**Actions:**
- Dedicated browsing time
- Review recent issues created
- Read merged MRs and discussions
- Follow contextual rabbit holes

**Emotions:** 🎓 Learning, 🔍 Curious, 🌐 Connected
**Opportunities:**
- Browsing modes: "Show me interesting things from last 3 days"
- Topic clustering (grouped, not chronological)
- Serendipity features
- Reading list / bookmarks
- Summary views: "Here's what happened in project X"

**Critical:** Need both **directed search** and **undirected browsing** modes

### Stage 5: Knowledge Contribution (Ad-Hoc)
**Actions:**
- Spot relevant discussion
- Realize you have relevant experience
- Jump in with context and lessons learned

**Emotions:** 🦸 Heroic, 🤝 Connected
**Opportunities:**
- "Your expertise might be relevant" suggestions
- Historical context surfacing

### Stage 6: Pattern Recognition (Weekly Review)
**Actions:**
- Friday review of the week
- Aggregate views of themes
- Identify systemic issues

**Emotions:** 🧠 Strategic, 📊 Big-picture clarity
**Opportunities:**
- Automated pattern detection
- Insight generation
- Team coordination suggestions

### Stage 7: New Team Member Onboarding (Occasional)
**Actions:**
- Help new engineer understand history
- Reconstruct context for technical decisions
- Show who knows what

**Emotions:** 😎 Knowledgeable mentor, ⏱️ Time-saving
**Opportunities:**
- Institutional memory
- Context reconstruction
- People/expertise mapping

---

## Stakeholder Analysis

### Primary: You (Senior/Mid Engineer)
**Interest:** High | **Influence:** High
**Needs:**
- Ambient awareness of team activity
- Prevent duplicate work
- Discover contribution opportunities
- Browse without guilt

**Engagement:** Dogfood the tool, iterate on your needs first

### Secondary: Peer Engineers
**Interest:** High | **Influence:** Medium
**Needs:**
- Same visibility needs
- "Is anyone blocked on X?"
- "Who can help with Y?"

**Engagement:** Beta testing once MVP works, gather feedback

### High-Interest: Technical Leads
**Interest:** VERY High | **Influence:** High
**Needs:**
- Coordination view: "What is team working on?"
- Bottleneck detection
- Resource allocation insights
- Knowledge gaps identification

**Value Prop:** Game-changer for tech leads in PM-less orgs
**Engagement:** Demo early, they could become champions

### Medium-High: Engineering Managers
**Interest:** Medium-High | **Influence:** Very High
**Needs:**
- Team health visibility
- Productivity insights (non-surveillance)
- Risk visibility
- Onboarding improvements

**Concerns:** Avoid "Big Brother" perception
**Engagement:** Frame as team empowerment, not monitoring

### High-Value: New Hires
**Interest:** Very High | **Influence:** Low
**Needs:**
- Historical context
- Current priorities
- People mapping
- Learning through exploration

**Value Prop:** Dramatically improve onboarding
**Engagement:** Use explicitly during onboarding

### Future: Other Engineering Teams
**Interest:** Medium | **Influence:** Medium
**Needs:**
- Same visibility problems
- Cross-team coordination

**Engagement:** Start with your team, prove value, scale

**Product Implications:**
- Role-based views (IC vs Tech Lead vs Manager)
- Onboarding use case = killer feature
- Multi-team support architected from start
- Privacy controls

---

## Pre-mortem: Failure Scenarios

### Failure #1: "Built It, Nobody Uses It"
**Root Cause:** Too much friction, no immediate value, didn't solve their pain
**Warning Signs:** DAU drops week 2, only you using it by week 4
**Prevention:**
- Integrate into workflow (browser extension, Slack)
- Nail first 30 seconds
- Co-design with peers
- Make it addictive
- Measure engagement

### Failure #2: "Death by Alert Fatigue"
**Root Cause:** Too many notifications, too much noise
**Warning Signs:** Users complaining "too noisy", >50% unsubscribe
**Prevention:**
- Conservative defaults
- Relevance scoring
- Granular notification controls
- Daily digest over real-time
- Learn from behavior

### Failure #3: "Too Slow to Be Useful"
**Root Cause:** Unoptimized queries, no caching
**Warning Signs:** 5-10s load times, complaints about lag
**Prevention:**
- Index aggressively
- Cache heavily
- Background processing
- Performance budget: <500ms pages, <1s search
- Monitor from day 1

### Failure #4: "Feature Creep Paralysis"
**Root Cause:** Tried to solve everything, never shipped MVP
**Warning Signs:** Month 2 still designing, month 6 no deployment
**Prevention:**
- Ruthless MVP scope
- Time-box to 4-6 weeks
- Early dogfooding
- Ship basic, iterate
- Feature freeze discipline

### Failure #5: "Data Quality Death Spiral"
**Root Cause:** Webhook failures, parsing bugs, no monitoring
**Warning Signs:** Missing events, duplicates, stale data
**Prevention:**
- Webhook reliability (retry, DLQ)
- Data validation
- Health checks
- User feedback loop
- Observability

### Failure #6: "Privacy/Security Backlash"
**Root Cause:** Perceived as surveillance
**Warning Signs:** "Big Brother" comments, resistance
**Prevention:**
- Transparent communication
- No vanity metrics
- Privacy controls
- Team-first framing
- Push back on misuse

**Critical Success Criteria:**
- Ship MVP in 4-6 weeks
- 3+ daily actives by week 4
- <500ms page load, <1s search
- >80% notification relevance
- Zero surveillance metrics
- 99%+ webhook capture

---

## Empathy Map

### THINKS 💭
- "I wonder what everyone's working on"
- "Am I duplicating someone's work?"
- "There was a discussion about this, but where?"
- "Someone knows about this, but who?"
- "We're solving same problems in parallel"
- "I should check GitLab more, but it's overwhelming"
- "I feel disconnected from the team"
- "I have knowledge that could help, but they don't know to ask"

### FEELS 😟
- **Isolated** - Working in a bubble
- **Anxious** - Worried about duplicating work
- **Frustrated** - "There must be a better way"
- **FOMO** - Missing conversations/decisions
- **Powerless** - Can't solve organizational problem alone
- **Guilty** - "Should I check in more?"
- **Overwhelmed** - Too much to track
- **Burdened** - Knowledge stuck in my head

### SEES 👀
- Empty standups
- Surprise announcements after the fact
- Duplicate PRs
- Fragmented communication
- Quiet team, heads-down
- New hires struggling
- Endless GitLab activity feed
- Recurring problems

### SAYS 💬
- "Hey, is anyone working on X?"
- "I wish I knew what everyone was up to"
- "We need better visibility"
- "I just found out Sarah did this 3 months ago!"
- "Yeah, coordination could be better" (to manager)

### DOES 🏃
- Ad-hoc Slack asks
- Manual GitLab checks (5 min, gives up)
- Starts work without checking
- Discovers duplication after it's done
- Tab explosion, gets overwhelmed
- DMs instead of discovering via context
- Works in isolation
- Carries context in head

### PAINS 😤
- Time waste on duplicate work
- Missing context for decisions
- Lost contribution opportunities
- Cognitive overload
- Can't see patterns
- Onboarding friction
- Broken knowledge sharing
- Guilt cycles

### GAINS 🎯
- Effortless awareness
- Prevent duplication
- Serendipitous connection
- Pattern visibility
- Reduce anxiety
- Feel connected
- Share knowledge effectively
- Browse without guilt
- Institutional memory
- Effortless coordination

**Emotional Journey Transformation:**
- **From:** Isolated → Anxious → Overwhelmed → Guilty → Give up (cycle)
- **To:** Connected → Informed → Empowered → Contributing → Relaxed

**Jobs to Be Done (Emotional):**
1. Help me feel connected to my team
2. Help me stop worrying about what I'm missing
3. Help me contribute my expertise where it matters
4. Help me learn without it feeling like homework

---

## First Principles Analysis

### Fundamental Truths

**Truth 1: Work produces information**
- Engineers create issues, commits, comments
- Information already exists in GitLab
- Created continuously

**Truth 2: Human attention is finite**
- Cannot process unlimited information
- Attention is scarce resource, not information
- Every piece has opportunity cost

**Truth 3: Relevance is contextual and personal**
- What's relevant to you ≠ relevant to others
- Changes based on current work
- Changes based on expertise
- No universal "important"

**Truth 4: Discovery has asymmetric value**
- Finding duplicate work BEFORE = high value (saves days)
- Finding duplicate work AFTER = low value (too late)
- Contributing DURING debate = high value
- Contributing AFTER decision = low value

**Truth 5: Knowledge is distributed**
- Context exists in individuals' heads
- No single person knows everything
- Right person often doesn't know they're needed

**Truth 6: Coordination has overhead**
- Notifications = interruptions
- Check-ins = context switching
- Perfect information isn't free
- Optimize value/cost ratio

### Core Problem (First Principles)

```
Relevance-filtered information discovery has high asymmetric value,
but human attention is too limited to manually filter the continuous
stream of work information to find personally-relevant items before
value window closes.
```

**This is NOT a "more information" problem - it's a "RIGHT information at RIGHT time" problem.**

### MVP Solution (From First Principles)

**Core Function:** Relevance-Filtered Event Stream

**Minimum Viable Product:**
1. Webhook receiver → Store GitLab events in DB
2. Simple filter builder: "Show events matching [keywords/labels/people]"
3. Results page: Chronological list with direct GitLab links
4. Daily email digest: "Here's what matched your filters yesterday"

**That's the core.** Everything else is valuable but not fundamental.

**Fundamental Requirements:**
✅ Event ingestion (webhook → storage)
✅ Flexible filtering (query language or UI)
✅ Fast retrieval (<1s - attention is precious)
✅ Personalization (per-user filters)
✅ Direct linking (to GitLab)
✅ Time-based sorting (recent first)

**NOT Required for MVP:**
❌ Complex analytics/dashboards
❌ Historical data >2-4 weeks
❌ Sophisticated UI
❌ Pattern detection (nice-to-have)
❌ Multi-team support initially

### Minimum Data Model

```
Event {
  id, type (issue/mr/comment),
  title, body,
  author, project,
  labels[],
  url (GitLab link),
  timestamp
}

Filter {
  user_id,
  keywords[], labels[], authors[], projects[],
  name (e.g., "Auth work")
}
```

### Core Flows

**Flow 1: Event Capture**
```
GitLab → Webhook → Validate → Store → Done
```

**Flow 2: Discovery (Pull)**
```
User → Dashboard → Select filter → Query DB → Results → Click → GitLab
```

**Flow 3: Notification (Push)**
```
Daily cron → For each user → Get filters → Query new events → Email digest
```

### Success Metrics (From Fundamentals)

**Success = Catching things early:**
1. "Discovered duplicate work BEFORE building"
2. "Contributed to discussion DURING debate"
3. "Found something interesting during browse"

**Leading Indicators:**
- Daily digest has 5-15 items (not 0, not 100)
- You click through to GitLab (proves relevance)
- Discovery happens 1-3x per week minimum

**Failure Signals:**
- Digest has 0 items regularly (too narrow)
- Digest has 50+ items regularly (too broad)
- You stop opening digests (relevance failure)

---

## Key Capabilities (Prioritized)

### Must Have (MVP)
1. Event capture from GitLab webhooks (issues, MRs, comments)
2. Flexible filtering/query interface
3. Direct linking to GitLab
4. Search across captured events
5. Time-based organization (recent first)

### Should Have (Post-MVP Validation)
6. Customizable views/dashboards
7. Smart notifications (daily digest)
8. Browsing mode (undirected exploration)
9. Topic clustering (grouped, not just chronological)
10. Reading list / bookmarks

### Nice to Have (Future)
11. Pattern detection across team work
12. "Your expertise might be relevant" suggestions
13. Historical context surfacing
14. Multi-team support
15. Role-based views (IC / Tech Lead / Manager)
16. Analytics and trends

---

## Design Principles

1. **Discovery must be delightful, not dutiful** - Browsing should feel interesting, not obligatory
2. **Reduce anxiety through confidence** - "You haven't missed anything critical"
3. **Low friction contribution** - Easy to jump into conversations
4. **Celebrate connections** - Make discoveries feel rewarding
5. **Respect time** - Every visit should feel worthwhile
6. **Conservative defaults** - Start narrow, let users expand
7. **No surveillance** - Zero productivity/vanity metrics
8. **Relevance over volume** - 10 relevant items > 100 items
9. **Speed is essential** - <500ms pages, <1s search
10. **Build for yourself first** - Dogfood before sharing

---

## Next Steps

This discovery work provides foundation for:
1. **Product Brief** - Strategic product vision
2. **PRD** - Detailed functional and non-functional requirements
3. **UX Design** - Interface for browsing, filtering, discovery
4. **Architecture** - Technical design for webhook ingestion, storage, querying

**Immediate Next Action:** Product Brief with analyst agent
