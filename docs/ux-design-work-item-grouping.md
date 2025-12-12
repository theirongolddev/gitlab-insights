---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7]
inputDocuments:
  - docs/prd-work-item-grouping.md
  - docs/product-brief-gitlab-insights-2025-11-19.md
  - docs/ux-design-specification.md
workflowType: 'ux-design'
lastStep: 7
project_name: 'gitlab-insights'
user_name: 'Taylor'
date: '2025-12-12'
---

# UX Design Specification - Work Item Grouping

**Author:** Taylor
**Date:** 2025-12-12

---

## Executive Summary

### Project Vision

The Work Item Grouping feature transforms gitlab-insights from a flat chronological event feed into a hierarchical, work-item-centric view. This evolution solves the mental model mismatch where engineers think in terms of work items (issues, MRs) and their activity - not timelines.

**Core Value Proposition:**

This is **organizational intelligence, not task management.** GitLab already notifies users about assigned work and @mentions. This app surfaces unknown unknowns - discovering conversations you weren't tagged in but should know about based on your expertise, domain ownership, or downstream dependencies.

**The Innovation:**

Capturing relationships at data ingest time (parent links, closes patterns, participants) and surfacing them through collapsible work item cards that group related activity. The system enables ambient awareness throughout the workday, where engineers can monitor organizational activity beyond their direct assignments and discover contexts where their expertise or awareness matters.

**Key User Impact:**
- Discover discussions about components you own (not assigned, not tagged)
- Identify decisions that will affect your work before they're finalized
- Provide context others don't have by joining conversations early
- Maintain organizational awareness without manual monitoring overhead

### Target Users

**Primary: Mid-Senior Engineers**
- Monitor multiple GitLab projects for organizational awareness
- Own domains/components but aren't always tagged in related discussions
- Experience cognitive overload with flat event feeds (40+ events to mentally parse)
- Value efficiency over hand-holding (tech-savvy, prefer dense information)
- Desktop-primary workflow with throughout-the-day monitoring pattern

**Secondary: Tech Leads**
- Need coordination visibility across teams beyond assigned work
- Identify cross-team decisions and dependencies
- Currently spend 5-10 hrs/week on manual sync and context-building

**User Capabilities:**
- Comfortable with dense, information-rich interfaces
- Prefer scan efficiency over progressive onboarding
- Desktop-primary with mobile for quick monitoring on the go
- Sustained attention patterns (app open throughout workday)

**Usage Pattern:**
Throughout-the-day ambient monitoring with interruption-based interactions:
- Quick check-ins (30 seconds while waiting for build)
- Morning triage (15 min deep review)
- Periodic monitoring (glance while in another window)
- Post-absence catch-up (Monday morning after time away)

### Target User Experience

**Emotional Goals:**
- **Control:** Full agency over what gets marked as read, when, and how
- **Confidence:** Trust that relevant activity is surfaced, nothing important missed

**Core 'Aha' Moment:**
Immediate understanding of new activity context - seeing at a glance:
- What changed in this work item
- Why it might matter to me (keywords, components, participants)
- Whether I should investigate further

**Success Metric:**
Time to correctly triage - not just speed, not just accuracy, but both. Users can quickly and accurately determine:
- Is this relevant to my expertise/domain?
- Do I have context others don't?
- Should I contribute to this conversation?

### Key Design Challenges

1. **Scan Efficiency Through Context Surfacing**
   - Collapsed cards must surface ALL new content in summary form
   - One-line summaries show: what changed + why it might matter
   - Visual hierarchy for instant read/unread distinction
   - Support sustained attention (low visual fatigue for all-day usage)

2. **Three-Way Read Tracking System**
   - **Expand in-place** → Marks as read (investigating activity timeline)
   - **Open side panel** → Marks as read (deep dive into full context)
   - **Mark Read button** → Quick dismiss without opening (evaluated, not relevant)
   - NEW badge transforms to Mark Read button on hover (space-efficient interaction)
   - Debounce timing: ~1 second (fine-tune during development)

3. **Three-Level Progressive Disclosure**
   - **Collapsed:** One-line summary with title, status, context signals (repo, component, keywords), NEW badge
   - **Expanded (in-place):** Shows all new activity within card (no hiding, user can scroll)
   - **Detail pane (side panel):** Click card header opens side panel with full context, scrolled to newest content automatically

4. **Organizational Intelligence Signals**
   - Visual hierarchy emphasizes context relevance, not personal assignment
   - Show: Which repo? Which component? What keywords matched?
   - De-emphasize: "Is this assigned to me?" (GitLab already handles that)
   - Support discovery of unknown relevance

5. **Interruption-Stable State**
   - App state persists across micro-sessions (check, code, check again)
   - Visual design supports low cognitive load for sustained monitoring
   - New items arriving during session appear at top (no special notification)

### Design Opportunities

1. **Visual Language for Read State**
   - Unread cards: Bold, higher contrast, NEW badge
   - NEW badge → Mark Read button on hover (elegant state transition)
   - Read cards: Reduced opacity/contrast, no badge
   - Unread count indicator: Prominent when >0, green/zero when all caught up

2. **Smart Activity Summaries**
   - Context signals: Repo, component, matched keywords
   - Usernames as distinct text (no @mention noise)
   - GitLab avatars if available (visual scanning aid)
   - Participant count + latest comment preview

3. **Auto-Scroll Intelligence**
   - Side panel opens scrolled to newest content (zero wasted time)
   - Saves 3-5 seconds per card × 20 cards = 60-100 seconds per triage session

4. **Mobile-Optimized Monitoring**
   - Intersection observer for scroll-into-view read marking
   - Detail pane as full-screen overlay on mobile
   - Touch-friendly expand/collapse interactions

---

## Core User Experience

### 2.1 Defining Experience

The core experience centers on **scan-to-decision** - enabling users to determine relevance of organizational activity in 3-5 seconds per work item without forced interaction.

**The Core Interaction:**
"Discover conversations about my domains that I wasn't tagged in, and determine if my expertise is needed - all within 3-5 seconds of scanning the collapsed card."

**Primary User Loop:**
1. Scan collapsed card one-liner (what changed + why it might matter)
2. Make relevance decision (relevant to my expertise/domain?)
3. Act on decision:
   - **Not relevant:** Click Mark Read button (quick dismissal)
   - **Might be relevant:** Expand in-place to scan activity timeline
   - **Definitely relevant:** Open side panel for full context investigation

**What Makes This the Defining Experience:**

This is **organizational intelligence, not task management.** The collapsed card one-liner is where organizational intelligence becomes actionable. If users can accurately assess relevance from the summary alone, they can discover conversations they weren't tagged in but should know about. If the one-liner fails to surface relevance, organizational intelligence becomes organizational noise.

**How Users Will Describe This to Friends:**
"It shows me GitLab conversations about my components that I wasn't tagged in. I can scan a one-liner and know instantly if I need to be part of the discussion."

**Success Definition:**
Users can discover conversations about their domains that they weren't tagged in, determine if their expertise or awareness is needed, and join discussions early enough to provide valuable context or prevent wrong decisions.

### 2.2 User Mental Model

**How Users Currently Solve This Problem:**

**Existing Solutions:**
- **GitLab notifications:** Only shows assigned work or @mentions (reactive, not proactive)
- **Manual monitoring:** Check projects/MRs/issues manually throughout day (5-10 hrs/week overhead)
- **Slack channels:** Conversation context scattered, no work item structure
- **Email filters:** Noisy, can't distinguish relevance vs. assignment

**Current Mental Model:**
Users think in terms of **work items and their activity**, not timelines. When they ask "What's happening with authentication?", they're asking about an issue/MR and its conversation thread, not chronological events.

**User Expectations:**

**What Users Love About Gmail:**
- Bold vs. normal weight instantly shows read/unread
- List stays visible while reading email in side panel
- Can mark read without opening (archive/delete shortcuts)
- Keyboard shortcuts for power users (post-MVP for us)

**What Users Love About Datadog:**
- Alert severity is instant (color + badge)
- Grouped alerts prevent repetition
- Can silence/acknowledge explicitly (control over state)
- Context on hover (minimal interaction for common actions)

**What Users Hate About Current Solutions:**
- **GitLab notifications:** Only reactive (@mentions), miss proactive discovery
- **Manual monitoring:** Time-consuming, unsustainable overhead
- **Email/Slack:** Conversation scattered, no work item structure
- **Feed-based tools:** Cognitive overhead parsing 40+ flat events

**Mental Model Expectations:**

Users expect to:
1. **See work items, not events** - "Show me issues and MRs, not individual comments"
2. **Determine relevance instantly** - "Does this affect my domain?" (3-5 second assessment)
3. **Control read state explicitly** - "I decide when it's read, not the system"
4. **Investigate at own depth** - "Quick scan or deep dive, my choice"
5. **Discover proactively** - "Show me things I should know about, not just things I'm assigned"

**Where Users Get Confused:**

**Potential Confusion Points:**
- **NEW badge vs. Mark Read button** - Hover transforms badge to button (requires discovery)
- **Three-way read marking** - Multiple paths to mark as read (button, expand, side panel)
- **Unread count behavior** - How it decrements based on different actions

**Our Mitigation Strategy:**
- Clear visual feedback on hover (NEW → Mark Read transformation)
- Consistent behavior across all marking methods
- Predictable state transitions (no surprise auto-marking)

### 2.3 Success Criteria

**Core Experience Success Criteria:**

**Users Feel Successful When:**

1. **Discovery Works** - They find conversations about their domains that they weren't tagged in
2. **Relevance Assessment is Fast** - 3-5 seconds per work item to determine "does this matter to me?"
3. **Context is Sufficient** - Collapsed one-liner has enough information to make relevance decision
4. **Control is Maintained** - Full agency over what gets marked read, when, and how
5. **Completion is Clear** - Unread count shows progress, green/zero state signals "all caught up"

**Success Indicators:**

**Cognitive Success:**
- "I understand what changed without expanding" - Collapsed card communicates clearly
- "I know if this matters to me" - Context signals (repo, component, keywords) surface relevance
- "I trust I'm not missing anything" - Transparent filtering, predictable behavior

**Emotional Success:**
- "I feel in control" - Three-way read marking gives flexibility
- "I feel confident" - Trust that relevant activity is surfaced
- "I feel calm" - Low visual fatigue, no anxiety-inducing styling

**Behavioral Success:**
- Users complete triage quickly (scanning 20 cards in 60-100 seconds)
- Users discover at least one conversation they weren't tagged in per week
- Users join discussions early enough to influence outcomes

**System Feedback Success:**
- Auto-scroll to newest content saves 3-5 seconds per card
- NEW → Mark Read button transformation on hover is discovered within first 5 uses
- Unread count updates immediately after marking actions

**Speed Metrics:**
- 3-5 seconds per collapsed card scan (relevance decision)
- <200ms for expand/collapse animation (feels instant)
- <500ms for side panel open + auto-scroll (fast enough to maintain flow)

**Accuracy Metrics:**
- Users can determine relevance from collapsed card >90% of time (without expanding)
- False positives <10% (marked as read without investigation, but should have investigated)
- False negatives <5% (expanded but wasn't relevant)

**What Makes Users Say "This Just Works":**

1. **Instant relevance assessment** - Context signals answer "why might this matter to me?"
2. **No wasted time** - Auto-scroll to newest content, no hunting
3. **Predictable behavior** - State transitions are consistent and expected
4. **Flexible investigation** - Can go shallow or deep based on relevance
5. **Clear completion** - Unread count → zero feels satisfying

**Automatic Behaviors:**
- Side panel auto-scrolls to newest content (zero manual scrolling)
- New items appear silently at top (no jarring notifications)
- Read tracking infers from natural investigation actions
- Unread count updates immediately (no lag or confusion)

### 2.4 Novel UX Patterns

**Pattern Classification:**

The Work Item Grouping experience **combines familiar patterns in innovative ways** rather than requiring completely novel interaction design.

**Established Patterns We Use:**

**From Gmail:**
- ✅ Bold/normal weight for read/unread (proven, intuitive)
- ✅ List + side panel layout (familiar to email users)
- ✅ Batch operations (mark all as read in sections)
- ✅ Auto-scroll to content (Gmail scrolls to unread in threads)

**From Datadog:**
- ✅ Status color coding (green/gray/blue for merged/closed/open)
- ✅ Badge indicators (small, unobtrusive NEW badge)
- ✅ Grouped clustering (Issues and MRs in separate sections)
- ✅ Explicit acknowledge pattern (Mark Read button)

**From Modern Web Apps:**
- ✅ Collapsible cards/accordions (familiar expand/collapse pattern)
- ✅ Hover state enhancements (additional controls appear on hover)
- ✅ Progressive disclosure (collapsed → expanded → detail)

**Novel Innovations (Unique Twists):**

**1. Three-Way Read Marking**
- **Novel aspect:** Three distinct paths to mark as read, each signaling different investigation depth
- **Familiar metaphor:** Gmail's archive/delete options, but adapted for investigation depth
- **User education strategy:** Visual feedback on hover, consistent state transitions
- **Why novel:** Most apps have one-way (open = read) or two-way (mark read button + open). We have three paths that preserve investigation intent.

**2. NEW Badge → Mark Read Button Transformation**
- **Novel aspect:** Hover transforms informational badge into actionable button
- **Familiar metaphor:** Hover menus in modern web apps (Gmail's archive/snooze on hover)
- **User education strategy:** Clear hover state, button appears smoothly (200ms fade-in)
- **Why novel:** Badge and button occupy same visual space, reducing UI density while maintaining discoverability

**3. Context Signals as First-Class Information**
- **Novel aspect:** Repo, component, keywords shown upfront in collapsed state (not just title + timestamp)
- **Familiar metaphor:** Email headers showing sender/subject/snippet
- **User education strategy:** Visual hierarchy makes signals obvious, no explanation needed
- **Why novel:** Most work item tools show assignment or status. We show domain relevance signals to support proactive discovery.

**4. Auto-Scroll to Newest Content in Side Panel**
- **Novel aspect:** Side panel opens scrolled to newest activity automatically
- **Familiar metaphor:** Gmail's scroll-to-unread in threads, Slack's jump-to-latest
- **User education strategy:** Happens automatically, zero learning curve
- **Why novel:** Most detail views start at top. We save 3-5 seconds per card by jumping to newest content.

**Pattern Innovation Strategy:**

**How We Innovate Within Familiar Patterns:**

**Proven Pattern:** List + side panel (Gmail)
**Our Innovation:** Work item list stays visible, side panel auto-scrolls to newest content, three-way read marking

**Proven Pattern:** Badge indicators (Datadog, email apps)
**Our Innovation:** NEW badge transforms to Mark Read button on hover (space-efficient, dual-purpose)

**Proven Pattern:** Collapsible cards (many apps)
**Our Innovation:** Three-level progressive disclosure with context signals in collapsed state

**Proven Pattern:** Read/unread distinction (email, notifications)
**Our Innovation:** Three paths to mark as read, each signaling different investigation depth

**Teaching Strategy for Novel Patterns:**

**No Onboarding Tutorial Needed:**
- Familiar patterns provide scaffolding (users recognize list + side panel from Gmail)
- Novel aspects use visual feedback (hover shows Mark Read button, no explanation needed)
- Progressive disclosure means users can explore at own pace

**First-Time Discovery Path:**
1. See collapsed cards with NEW badges (familiar notification pattern)
2. Hover over NEW badge → transforms to Mark Read button (visual discovery)
3. Expand card → activity timeline appears (familiar accordion pattern)
4. Click card header → side panel opens (familiar list + detail pattern)
5. Notice side panel is scrolled to newest content → "oh, it jumped to what's new!" (automatic behavior, no teaching needed)

**Visual Cues for Novel Behaviors:**
- Hover state shows Mark Read button (discovers transformation pattern)
- Click affordance on card header (cursor changes, hover highlight)
- Auto-scroll happens automatically (zero teaching needed, just works)

### 2.5 Experience Mechanics

**Core Experience Mechanics:**

Let's design the step-by-step flow for the **scan-to-decision core interaction**:

#### 1. Initiation

**How Users Start:**
- User opens GitLab Insights app (desktop browser or mobile)
- Work item list view loads with collapsed cards
- Unread count indicator shows number of NEW items at top

**What Triggers/Invites Action:**
- NEW badge on collapsed cards (visual signal of unread activity)
- Unread count at top of list (motivates triage)
- Olive accent border on unread cards (draws attention)

**Visual State:**
- Unread cards: Bold title, olive border, NEW badge, higher contrast text
- Read cards: Normal weight, gray border, reduced opacity
- List sorted: Unread items float to top, then by most recent activity

#### 2. Interaction

**What User Does:**

**Path A: Quick Dismissal (Mark Read Without Investigation)**
1. User hovers over collapsed card with NEW badge
2. NEW badge transforms to "Mark Read" button (200ms fade-in)
3. User clicks Mark Read button
4. Card immediately transitions to read state (opacity reduction, border change, weight change)
5. Unread count decrements by 1
6. User continues to next card

**Path B: In-Place Investigation (Expand to Scan Activity)**
1. User clicks anywhere on collapsed card (except Mark Read button area)
2. Card expands with 200ms ease-out animation
3. Activity timeline appears showing all new events within work item
4. After ~1 second (debounce), card is automatically marked as read
5. Card visual state updates (NEW badge disappears, read styling applies)
6. Unread count decrements by 1
7. User scans activity timeline, then collapses or moves to next card

**Path C: Deep Investigation (Side Panel for Full Context)**
1. User clicks card header (work item title)
2. Side panel slides in from right (200ms animation)
3. Side panel auto-scrolls to newest content within work item
4. Card immediately marked as read (user has committed to investigation)
5. Card visual state updates in list view
6. Unread count decrements by 1
7. User reads full context in side panel
8. User closes side panel (or opens next work item)

**Controls/Inputs:**
- Mouse hover (triggers NEW → Mark Read transformation)
- Click Mark Read button (Path A)
- Click card body (Path B - expand in-place)
- Click card header/title (Path C - side panel)
- Collapse expanded card (click card header when expanded)
- Close side panel (X button or click outside)

**System Response:**

**Visual Feedback:**
- Hover: NEW badge → Mark Read button (200ms fade-in)
- Click Mark Read: Immediate visual state change (opacity, border, weight, badge removal)
- Expand: 200ms ease-out animation, activity timeline appears
- Side panel: 200ms slide-in, auto-scroll to newest content
- Unread count: Immediate decrement after each marking action

**State Updates:**
- Read status persists to database
- Unread count updates in real-time
- Visual state changes are immediate (no lag)

#### 3. Feedback

**What Tells Users They're Succeeding:**

**Visual Feedback:**
- Card transitions to read state (opacity reduction, gray border, normal weight)
- NEW badge disappears
- Unread count decrements (progress toward zero)
- Green/zero state when all caught up (success indicator)

**Behavioral Feedback:**
- Auto-scroll to newest content saves time (3-5 seconds per card)
- Collapsed one-liner has sufficient context for decision (90%+ accuracy)
- Three-way marking options match different investigation depths

**How They Know It's Working:**
- Discover at least one conversation they weren't tagged in (validates organizational intelligence)
- Complete triage in 60-100 seconds for 20 cards (efficiency goal)
- Trust they haven't missed important activity (confidence)

**If They Make a Mistake:**

**Accidental Mark Read:**
- No undo in MVP (out of scope)
- Mitigation: Can still open card and view activity (marking doesn't hide content)
- Future: Undo toast notification (post-MVP)

**Expanded Wrong Card:**
- Card is marked as read after ~1 second debounce
- Mitigation: 1 second gives time to collapse if wrong card
- Future: Adjust debounce timing based on user testing

**Opened Side Panel for Wrong Work Item:**
- Immediate mark as read (no debounce for side panel)
- Mitigation: List stays visible, can open correct card
- Future: Undo functionality (post-MVP)

#### 4. Completion

**How Users Know They're Done:**

**Visual Completion Signals:**
- Unread count reaches zero
- Green/zero state indicator at top ("All caught up!")
- All cards show read styling (normal weight, gray border, reduced opacity)
- No NEW badges visible in list

**Successful Outcome:**
- User has assessed relevance of all new activity
- Discovered conversations about their domains (organizational intelligence validated)
- Joined relevant discussions or marked irrelevant items as read
- Confident they haven't missed important activity

**What's Next:**

**After Triage Completion:**
- Return to coding/work (app remains open for periodic monitoring)
- Throughout-the-day pattern: check again when switching context
- New items arrive silently at top of list (no jarring notifications)
- Unread count increments as new activity appears

**Ongoing Pattern:**
- Morning deep triage (15 min review after absence)
- Throughout-day quick checks (30 second glances)
- Post-absence catch-up (Monday morning pattern)
- Periodic monitoring while coding (glance while in another window)



---

## Desired Emotional Response

### Primary Emotional Goals

**Calm, Confident Organizational Awareness**

The core emotional goal is creating a state of calm, confident organizational awareness. Users feel strategically informed without anxiety or overwhelm, maintaining full control over their attention while trusting they're not missing critical conversations.

**Key Emotional States:**
- **Control:** Full agency over what gets marked as read, when, and how
- **Confidence:** Trust that relevant activity is surfaced, nothing important missed
- **Calm awareness:** Monitoring organizational activity without stress or anxiety
- **Professional competence:** Contributing valuable context early, preventing wrong decisions
- **Efficient satisfaction:** Quick triage completion, back to productive work

**Differentiation:**
This creates **proactive discovery** feelings vs. GitLab's **reactive notification** model. Users feel strategically aware (found something that matters before anyone tagged them) rather than merely responsive (someone tagged you, now respond).

### Emotional Journey Mapping

**First Discovery:**
- Curious and hopeful - "Could this solve my organizational awareness problem?"

**First Use (Initial Triage):**
- Skeptical → Validated - "This actually surfaced a discussion I care about that I wasn't tagged in. This works."

**During Core Experience (Scanning Cards):**
- Focused and efficient - In flow state, making rapid relevance decisions
- Calm control - Not overwhelmed, not anxious, methodically working through cards

**After Completing Triage:**
- Satisfied confidence - "I know what's happening. I can go back to coding."
- Professional competence - "I'm strategically aware, not just reactively responsive"

**If Something Goes Wrong:**
- Momentary confusion → Quick recovery - System makes it easy to get unstuck
- Trust maintained - One confusing card doesn't undermine confidence in whole system

**When Returning Throughout Day:**
- Habitual trust - App becomes reliable part of workflow
- No friction - Opening the app feels natural, not like a chore

### Micro-Emotions

**Confidence vs. Confusion:**
Users instantly understand what each card means. Clear visual hierarchy, consistent patterns, context signals as first-class information.

**Trust vs. Skepticism:**
Users trust the system shows everything relevant. Transparent filtering, no hidden algorithms, predictable behavior.

**Accomplishment vs. Frustration:**
Quick triage completion feels satisfying, not draining. Progress indicators (unread count), clear completion state (green/zero).

**Control vs. Helplessness:**
Users choose when/how things get marked read. Three-way read marking flexibility, no forced auto-marking.

**Calm vs. Anxiety:**
Monitoring organizational activity doesn't create stress. Low visual fatigue, silent updates, no notification noise.

### Design Implications

**Emotion-Design Connections:**

**Control** → Three-way read marking options
- Mark Read button (quick dismissal without investigation)
- Expand in-place (scan activity timeline)
- Side panel (deep dive into full context)
- Users choose investigation depth, system doesn't force interaction

**Confidence** → Context signals visible in collapsed state
- Repo, component, keywords shown upfront
- No hidden relevance logic
- Predictable behavior and consistent visual language

**Calm Awareness** → Low-stimulation design
- Visual design supports sustained attention (8+ hours)
- Silent updates when new items arrive
- No aggressive badge counts or notifications
- Reduced opacity for read items (visual calm)

**Efficient Competence** → Speed optimizations
- Auto-scroll to newest content (saves 3-5 seconds per card)
- 3-5 second scan-to-decision target
- Unread count shows progress toward completion

**Trust** → Transparent state management
- Clear visual feedback when state changes (hover → Mark Read button)
- Predictable read tracking triggers
- Consistent interaction patterns

### Emotional Design Principles

1. **Design for Calm, Not Excitement**
   - This is an ambient awareness tool, not a notification center
   - Low visual fatigue over flashy interactions
   - Silent updates over attention-grabbing alerts

2. **Control Builds Confidence**
   - Users with agency over read state trust the system more
   - Flexibility (three marking options) reduces anxiety
   - Predictable behavior prevents distrust

3. **Clarity Prevents Anxiety**
   - Instant visual distinction (read/unread, new/old)
   - Context signals answer "why might this matter?" upfront
   - No hidden logic or surprise behaviors

4. **Progress Enables Satisfaction**
   - Visible unread count shows triage progress
   - Clear completion state (green/zero) creates closure
   - Quick wins (Mark Read button) maintain momentum

5. **Trust Through Transparency**
   - No hidden algorithms or mystery scoring
   - Predictable state transitions
   - Honest about what's being shown and why

### Emotions to Actively Avoid

**Design Choices That Create Negative Emotions:**
- Aggressive auto-marking → Helplessness
- Hidden relevance logic → Distrust
- Overwhelming notifications → Anxiety
- Forced interaction patterns → Frustration
- Unclear visual states → Confusion
- Time pressure or urgency signals → Stress

---

## Design System Integration

### Leveraging Existing GitLab Insights Design Foundation

**Context:** Work Item Grouping is a feature within the existing GitLab Insights application, which already has a comprehensive design system in place. Rather than creating a new design system, we extend and adapt the existing foundation to support work item grouping interactions.

**Existing Design System:** HeroUI (React Aria-based component library)

**Why This Works:**
- **Accessibility foundation:** React Aria ensures WCAG AA+ compliance and exceptional keyboard navigation
- **Component library:** Pre-built Table, Tooltip, Modal, Button, Autocomplete, Checkbox components
- **Theme system:** CSS variables and theme tokens enable systematic customization
- **Dark mode native:** Theme system supports light/dark modes (already implemented in Story 1.5.6)
- **Progressive enhancement ready:** Mouse interactions work immediately; keyboard shortcuts layer on without refactoring

**GitLab Insights Color System (Already Defined):**

```css
/* Olive/Moss Green Accent */
Dark mode:  hsl(68, 36%, 52%)  /* #9DAA5F - Lightened olive */
Light mode: hsl(68, 49%, 28%)  /* #5e6b24 - Original olive */

/* Backgrounds */
--bg-dark: hsl(0, 2%, 18%)     /* #2d2e2e */
--bg-light: hsl(120, 100%, 99%) /* #FDFFFC */

/* Semantic Colors */
Success (dark):  hsl(142, 71%, 45%)  /* #22C55E */
Success (light): hsl(142, 71%, 37%)  /* #16A34A */
Warning (dark):  hsl(54, 97%, 63%)   /* #FDE047 */
Warning (light): hsl(38, 92%, 50%)   /* #F59E0B */
Error (dark):    hsl(0, 72%, 51%)    /* #DC2626 */
Error (light):   hsl(0, 72%, 42%)    /* #B91C1C */
Info (dark):     hsl(199, 92%, 60%)  /* #38BDF8 */
Info (light):    hsl(199, 97%, 39%)  /* #0284C7 */
```

**GitLab Insights Typography System:**

```css
/* Type Scale (Linear-inspired) */
text-xs:   11px / 16px   /* Metadata, timestamps */
text-sm:   13px / 20px   /* Body text, table rows */
text-base: 14px / 24px   /* Default body */
text-lg:   16px / 24px   /* Section headers */
text-xl:   18px / 28px   /* Page titles */

/* Font Weights */
Regular:   400   /* Body text */
Medium:    500   /* Emphasis, buttons, active states */
Semibold:  600   /* Headings, section titles */
```

**GitLab Insights Spacing System (8px Grid):**

```css
1:  4px    /* Tight spacing, icon gaps */
2:  8px    /* Base unit - item padding */
3:  12px   /* Comfortable padding */
4:  16px   /* Section padding */
6:  24px   /* Section margins */
8:  32px   /* Large section spacing */
```

### Work Item Grouping Extensions

**What We Inherit:**
- ✅ HeroUI component library (Table, Modal, Button, etc.)
- ✅ Olive/moss green accent color system
- ✅ Dark mode support (already implemented)
- ✅ Typography scale and spacing grid
- ✅ Semantic colors (success, warning, error, info)
- ✅ Accessibility foundation (React Aria)

**What We Extend for Work Item Grouping:**

**1. Collapsible Card Component (New)**
- **Base:** HeroUI Accordion or custom composition using React Aria disclosure
- **Visual treatment:** Olive border when has NEW items, subtle gray when read
- **States:** Collapsed (default), Expanding (animation), Expanded, Collapsing
- **Interaction:** Click header to toggle, hover shows Mark Read button
- **Animation:** 200ms ease-out (consistent with existing split pane pattern)

**2. NEW Badge Treatment**
- **Style:** Small olive badge (existing accent color)
- **Behavior:** Transforms to "Mark Read" button on hover (space-efficient)
- **Typography:** text-xs (11px), medium weight (500)
- **Color:** Uses existing olive accent (dark: #9DAA5F, light: #5e6b24)

**3. Unread Count Indicator**
- **Style:** Prominent badge when >0, green success color when zero/caught up
- **Color:** Olive for unread count, green (#22C55E dark, #16A34A light) for zero state
- **Typography:** text-sm (13px), semibold weight (600)
- **Location:** Top of work item list, always visible

**4. Read/Unread Visual States**
- **Unread cards:**
  - Bold title (weight: 600)
  - Higher contrast text (gray-50 in dark mode, gray-900 in light mode)
  - NEW badge visible
  - Olive accent border (2px)
- **Read cards:**
  - Normal weight title (weight: 400)
  - Reduced opacity (0.7) or lower contrast text (gray-300 in dark, gray-500 in light)
  - No badge
  - Subtle gray border (1px)

**5. Activity Timeline Within Expanded Card**
- **Layout:** Vertical timeline with events
- **Event items:** Uses existing event type colors (purple for issues, blue for MRs, gray for comments)
- **Typography:** text-sm for event text, text-xs for timestamps
- **Spacing:** 12px (spacing-3) between timeline items
- **Visual:** Left border line connects events (gray-600 in dark, gray-200 in light)

**6. Side Panel for Detail View**
- **Pattern:** Similar to existing split pane pattern in main app
- **Animation:** 200ms slide-in from right (consistent with existing pattern)
- **Auto-scroll:** Scrolls to newest content automatically (existing pattern from main UX spec)
- **Width:** 600px on desktop (≥1680px), full-screen overlay on mobile

**Component Reuse from Existing System:**

| Component | Source | Adaptation for Work Item Grouping |
|-----------|--------|-----------------------------------|
| **Table** | HeroUI | No changes - existing dense table pattern works |
| **Modal** | HeroUI | Reuse for confirmation dialogs |
| **Button** | HeroUI | Primary (olive), secondary (gray), icon variants |
| **Tooltip** | HeroUI | Add for context signals (repo, component, keywords) |
| **Badge** | Custom (existing) | Extend with NEW badge variant |
| **Split Pane** | Custom (existing) | Reuse side panel pattern for detail view |

**Design System Consistency Rules:**

1. **Use existing color system** - No new colors, only new applications of olive accent
2. **Follow spacing grid** - All spacing uses 8px increments
3. **Match typography scale** - No new font sizes or weights
4. **Maintain accessibility** - All new components meet WCAG AA standards
5. **Dark mode native** - Design for both modes simultaneously
6. **Animation consistency** - 200ms ease-out for all transitions

**Benefits of Extending Existing System:**

- ✅ **Zero ramp-up time** - Development team already familiar with HeroUI
- ✅ **Visual consistency** - Work item grouping feels like part of same app
- ✅ **Accessibility guaranteed** - Inherits React Aria foundation
- ✅ **Dark mode free** - Already implemented, just follow patterns
- ✅ **Faster development** - Reuse existing components, no new system to build
- ✅ **Maintenance aligned** - Updates to design system benefit both features

---

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**Gmail - Email Triage at Scale**

**Core Problem Solved:**
Inbox triage at scale - distinguishing important from noise without reading everything.

**UX Strengths:**
- **Read/unread visual language:** Clear, instant distinction (bold vs. normal weight)
- **Triage views:** Primary/Social/Promotions tabs pre-sort by relevance
- **Side panel pattern:** Email list stays visible while reading details
- **Keyboard shortcuts:** Power users can triage without mouse (archive, mark read, navigate)
- **Search-driven:** Can find anything fast, search is first-class
- **Batch operations:** Select multiple, mark all as read, bulk actions

**Information Hierarchy:**
- Collapsed: Sender, subject, timestamp, snippet
- Expanded: Full email in side panel
- List remains visible during reading

**Why Users Return:**
Reliable, predictable, fast. The muscle memory of inbox zero.

---

**Datadog - Infrastructure Monitoring at Scale**

**Core Problem Solved:**
Monitoring infrastructure at scale - surface critical alerts without drowning in noise.

**UX Strengths:**
- **Alert prioritization:** Clear severity levels (critical/warning/info)
- **Smart grouping:** Related alerts clustered, not repeated
- **Search and filtering:** Powerful query language for finding specific signals
- **Visual hierarchy:** Color coding for severity, status indicators
- **Context on demand:** Expand to see full details, related metrics, timeline
- **Silence/acknowledge:** Explicit control over alert lifecycle

**Information Hierarchy:**
- Dashboard: High-level status, grouped alerts
- Alert list: Summary with severity, timestamp, affected services
- Detail view: Full context, metrics, timeline, related alerts

**Why Users Return:**
Trust that critical issues won't be missed, ability to quickly assess "is this urgent?"

---

**Common Success Patterns:**

Both Gmail and Datadog excel at:
1. **Scan-first design** - List view optimized for rapid scanning
2. **Progressive disclosure** - Collapsed summary → Expanded detail
3. **Read/unread state** - Clear visual distinction
4. **Side panel pattern** - List stays visible while viewing details
5. **Search-driven** - Finding specific items is fast and powerful
6. **Explicit control** - Users control state (mark read, acknowledge, archive)

### Transferable UX Patterns

**Navigation & Hierarchy:**

**From Gmail:**
- **List + Side Panel** - Work item list stays visible while detail pane shows full context
- **Bold/Normal weight distinction** - Unread items bold, read items normal (instant scan)
- **Snippet preview** - One-line activity summary in collapsed card (like subject + snippet)
- **Keyboard-driven flow** - j/k navigation, shortcuts for mark read (post-MVP)

**From Datadog:**
- **Severity/Priority visual language** - Adapt for unread priority and activity level
- **Grouped clustering** - Issues and MRs in separate sections
- **Status indicators** - Open/closed/merged badges with clear color coding
- **Silence/Acknowledge pattern** - Mark Read button (explicit dismissal)

**Interaction Patterns:**

**From Both:**
- **Scan-first list view** - Collapsed cards optimized for rapid scanning (3-5 seconds per item)
- **Progressive disclosure** - Collapsed → Expanded → Detail pane (three levels)
- **Predictable state management** - Clear visual feedback when state changes
- **Search as first-class** - Powerful filtering to find specific work items

**From Gmail:**
- **Batch operations** - "Mark all as read" for sections
- **Auto-scroll to content** - Scroll to newest activity in detail pane
- **Persistent list visibility** - Reading detail doesn't hide the list

**From Datadog:**
- **Context on hover** - Hover shows additional options (NEW → Mark Read transformation)
- **Time-based sorting with priority override** - Recent first, but unread items float to top

**Visual Design:**

**From Gmail:**
- **Minimal color usage** - Rely on typography weight, not color overload
- **Density control** - Let content determine density, not arbitrary limits
- **Consistent spacing rhythm** - Predictable visual scanning pattern

**From Datadog:**
- **Color for meaning** - Status colors (open/merged/closed)
- **Badge indicators** - Small, unobtrusive badges for NEW status
- **Reduced opacity for dismissed** - De-emphasize read items without hiding them

### Anti-Patterns to Avoid

**From Email Clients (Gmail):**

- **Aggressive auto-archiving/categorization** - Users feel loss of control
  - *Our approach:* Only explicit expand/open actions mark as read, no time-based auto-marking

- **Hidden folder/filter complexity** - Users lose trust when they can't find things
  - *Our approach:* Transparent filtering, no mystery algorithms

- **Notification overload** - Badge counts creating anxiety
  - *Our approach:* Unread count is informational, not anxiety-inducing. Green/zero when caught up

- **Forced threading** - No alternative views
  - *Our approach:* Grouped view is primary, but search enables flat exploration

**From Monitoring Dashboards (Datadog):**

- **Alert fatigue** - Too many low-priority alerts desensitize users
  - *Our approach:* User's query/filter setup controls relevance, we don't add noise

- **Complexity creep** - Too many features, overwhelming UI
  - *Our approach:* MVP stays focused: scan, mark read, expand, side panel

- **Red everywhere** - Overuse of urgent styling
  - *Our approach:* Use color sparingly and meaningfully. NEW badge is informational, not alarming

- **Hidden context** - Too many clicks to understand the issue
  - *Our approach:* Collapsed one-liner has enough context for decision-making

**From Both Categories:**

- **Unclear state transitions** - Users don't know if action succeeded
  - *Our approach:* Clear visual feedback (hover → Mark Read button, read/unread styling)

- **No escape hatch** - Forced into workflows
  - *Our approach:* Mark Read button is the escape hatch (skip without investigation)

- **Mobile-as-afterthought** - Desktop features that break on mobile
  - *Our approach:* Scroll-into-view for mobile, full-screen overlay for detail pane

### Design Inspiration Strategy

**Adopt (Use Directly):**

**From Gmail:**
- Bold/normal weight for read/unread distinction
- List + side panel layout (keep work items visible during detail view)
- Auto-scroll to newest content in side panel
- Batch section operations ("Mark all as read" in section headers)

**From Datadog:**
- Status color coding (green=merged, gray=closed, blue=open)
- Badge indicators (small, unobtrusive NEW badge)
- Severity-style grouping (Issues and MRs in separate sections)
- Search-first mentality (powerful filtering as first-class feature)

**Adapt (Modify for Our Needs):**

**From Gmail:**
- Keyboard shortcuts (post-MVP, but plan architecture to support)
- Density control (let content determine density, no arbitrary limits)

**From Datadog:**
- Hover context pattern → NEW badge transforms to Mark Read button
- Time + priority sorting → Recent first, but unread items float to top regardless

**Avoid (Anti-patterns):**

**From Email:**
- No auto-marking based on time/scrolling (desktop - mobile uses scroll-into-view)
- No hidden filtering or mystery algorithms
- No anxiety-inducing notification styling
- No forced workflows without escape hatches

**From Monitoring:**
- No alert fatigue patterns (red everywhere, urgent styling overuse)
- No complexity creep (stick to MVP scope)
- No hidden context (collapsed card sufficient for decision)

**Unique to Work Item Grouping:**

We're creating an **organizational intelligence** tool that combines proven patterns with unique value:
- Three-way read marking (more flexible than Gmail or Datadog)
- Context signals as first-class (repo, component, keywords)
- Proactive discovery vs. reactive notification
- Throughout-the-day ambient awareness (not inbox-zero or incident response)

This strategy grounds us in proven UX patterns while maintaining our unique value proposition of discovering conversations users weren't tagged in but should know about.

---
