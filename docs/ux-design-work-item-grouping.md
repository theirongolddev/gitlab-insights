---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments:
  - docs/prd-work-item-grouping.md
  - docs/product-brief-gitlab-insights-2025-11-19.md
  - docs/ux-design-specification.md
workflowType: 'ux-design'
lastStep: 14
workflowComplete: true
project_name: 'gitlab-insights'
user_name: 'Taylor'
date: '2025-12-12'
completionDate: '2025-12-15'
---

# UX Design Specification - Work Item Grouping

**Author:** Taylor
**Date:** 2025-12-12

______________________________________________________________________

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

1. **Three-Way Read Tracking System**

   - **Expand in-place** → Marks as read immediately (investigating activity timeline)
   - **Open side panel** → Marks as read immediately (deep dive into full context)
   - **Mark Read button** → Quick dismiss without opening (evaluated, not relevant)
   - NEW badge transforms to Mark Read button on hover (space-efficient interaction)

1. **Three-Level Progressive Disclosure**

   - **Collapsed:** One-line summary with title, status, context signals (repo, component, keywords), NEW badge
   - **Expanded (in-place):** Shows all new activity within card (no hiding, user can scroll)
   - **Detail pane (side panel):** Click card header opens side panel with full context, scrolled to newest content automatically

1. **Organizational Intelligence Signals**

   - Visual hierarchy emphasizes context relevance, not personal assignment
   - Show: Which repo? Which component? What keywords matched?
   - De-emphasize: "Is this assigned to me?" (GitLab already handles that)
   - Support discovery of unknown relevance

1. **Interruption-Stable State**

   - App state persists across micro-sessions (check, code, check again)
   - Visual design supports low cognitive load for sustained monitoring
   - New items arriving during session appear at top (no special notification)

### Design Opportunities

1. **Visual Language for Read State**

   - Unread cards: Bold, higher contrast, NEW badge
   - NEW badge → Mark Read button on hover (elegant state transition)
   - Read cards: Reduced opacity/contrast, no badge
   - Unread count indicator: Prominent when >0, green/zero when all caught up

1. **Smart Activity Summaries**

   - Context signals: Repo, component, matched keywords
   - Usernames as distinct text (no @mention noise)
   - GitLab avatars if available (visual scanning aid)
   - Participant count + latest comment preview

1. **Auto-Scroll Intelligence**

   - Side panel opens scrolled to newest content (zero wasted time)
   - Saves 3-5 seconds per card × 20 cards = 60-100 seconds per triage session

1. **Mobile-Optimized Monitoring**

   - Intersection observer for scroll-into-view read marking
   - Detail pane as full-screen overlay on mobile
   - Touch-friendly expand/collapse interactions

______________________________________________________________________

## Core User Experience

### 2.1 Defining Experience

The core experience centers on **scan-to-decision** - enabling users to determine relevance of organizational activity in 3-5 seconds per work item without forced interaction.

**The Core Interaction:**
"Discover conversations about my domains that I wasn't tagged in, and determine if my expertise is needed - all within 3-5 seconds of scanning the collapsed card."

**Primary User Loop:**

1. Scan collapsed card one-liner (what changed + why it might matter)
1. Make relevance decision (relevant to my expertise/domain?)
1. Act on decision:
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
1. **Determine relevance instantly** - "Does this affect my domain?" (3-5 second assessment)
1. **Control read state explicitly** - "I decide when it's read, not the system"
1. **Investigate at own depth** - "Quick scan or deep dive, my choice"
1. **Discover proactively** - "Show me things I should know about, not just things I'm assigned"

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
1. **Relevance Assessment is Fast** - 3-5 seconds per work item to determine "does this matter to me?"
1. **Context is Sufficient** - Collapsed one-liner has enough information to make relevance decision
1. **Control is Maintained** - Full agency over what gets marked read, when, and how
1. **Completion is Clear** - Unread count shows progress, green/zero state signals "all caught up"

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
1. **No wasted time** - Auto-scroll to newest content, no hunting
1. **Predictable behavior** - State transitions are consistent and expected
1. **Flexible investigation** - Can go shallow or deep based on relevance
1. **Clear completion** - Unread count → zero feels satisfying

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
1. Hover over NEW badge → transforms to Mark Read button (visual discovery)
1. Expand card → activity timeline appears (familiar accordion pattern)
1. Click card header → side panel opens (familiar list + detail pattern)
1. Notice side panel is scrolled to newest content → "oh, it jumped to what's new!" (automatic behavior, no teaching needed)

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
1. NEW badge transforms to "Mark Read" button (200ms fade-in)
1. User clicks Mark Read button
1. Card immediately transitions to read state (opacity reduction, border change, weight change)
1. Unread count decrements by 1
1. User continues to next card

**Path B: In-Place Investigation (Expand to Scan Activity)**

1. User clicks anywhere on collapsed card (except Mark Read button area)
1. Card expands with 200ms ease-out animation
1. Activity timeline appears showing all new events within work item
1. Card is immediately marked as read (no debounce)
1. Card visual state updates (NEW badge disappears, read styling applies)
1. Unread count decrements by 1
1. User scans activity timeline, then collapses or moves to next card

**Path C: Deep Investigation (Side Panel for Full Context)**

1. User clicks card header (work item title)
1. Side panel slides in from right (200ms animation)
1. Side panel auto-scrolls to newest content within work item
1. Card immediately marked as read (user has committed to investigation)
1. Card visual state updates in list view
1. Unread count decrements by 1
1. User reads full context in side panel
1. User closes side panel (or opens next work item)

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
- Expand: 200ms ease-out animation, activity timeline appears, immediate mark-as-read
- Side panel: 200ms slide-in, auto-scroll to newest content, immediate mark-as-read
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

- Card is marked as read immediately on expand
- Mitigation: Can still read content, just marked as read
- Future: Undo functionality (post-MVP)

**Opened Side Panel for Wrong Work Item:**

- Immediate mark as read
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

______________________________________________________________________

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

1. **Control Builds Confidence**

   - Users with agency over read state trust the system more
   - Flexibility (three marking options) reduces anxiety
   - Predictable behavior prevents distrust

1. **Clarity Prevents Anxiety**

   - Instant visual distinction (read/unread, new/old)
   - Context signals answer "why might this matter?" upfront
   - No hidden logic or surprise behaviors

1. **Progress Enables Satisfaction**

   - Visible unread count shows triage progress
   - Clear completion state (green/zero) creates closure
   - Quick wins (Mark Read button) maintain momentum

1. **Trust Through Transparency**

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

______________________________________________________________________

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
1. **Follow spacing grid** - All spacing uses 8px increments
1. **Match typography scale** - No new font sizes or weights
1. **Maintain accessibility** - All new components meet WCAG AA standards
1. **Dark mode native** - Design for both modes simultaneously
1. **Animation consistency** - 200ms ease-out for all transitions

**Benefits of Extending Existing System:**

- ✅ **Zero ramp-up time** - Development team already familiar with HeroUI
- ✅ **Visual consistency** - Work item grouping feels like part of same app
- ✅ **Accessibility guaranteed** - Inherits React Aria foundation
- ✅ **Dark mode free** - Already implemented, just follow patterns
- ✅ **Faster development** - Reuse existing components, no new system to build
- ✅ **Maintenance aligned** - Updates to design system benefit both features

______________________________________________________________________

## Visual Foundation

### 3.1 Foundation Reference

**Work Item Grouping uses the existing GitLab Insights visual foundation** documented in Section 6 (Design System Integration) above. This section documents Work Item Grouping-specific visual treatments and extensions.

**Inherited Foundation:**

- ✅ HeroUI component library with React Aria accessibility
- ✅ Olive/moss green accent color (dark: #9DAA5F, light: #5e6b24)
- ✅ Typography scale (11px-18px, Linear-inspired)
- ✅ Spacing system (8px grid)
- ✅ Dark mode support (native, both modes designed simultaneously)
- ✅ Semantic colors (success, warning, error, info)

### 3.2 Work Item Grouping-Specific Visual Treatments

#### Collapsed Card Visual States

**Unread Card (Has NEW Activity):**

```css
/* Card Container */
background: var(--bg-dark);           /* hsl(0, 2%, 18%) - #2d2e2e */
border: 2px solid hsl(68, 36%, 52%);  /* Olive accent - #9DAA5F */
border-radius: 8px;
padding: 16px;                         /* spacing-4 */
box-shadow: 0 1px 3px rgba(0,0,0,0.1);

/* Work Item Title */
font-size: 14px;                       /* text-base */
font-weight: 600;                      /* Semibold - unread emphasis */
color: hsl(0, 0%, 95%);               /* gray-50 - high contrast */
line-height: 24px;

/* One-Liner Summary */
font-size: 13px;                       /* text-sm */
font-weight: 400;                      /* Regular */
color: hsl(0, 0%, 85%);               /* gray-200 - readable */
line-height: 20px;
margin-top: 8px;                       /* spacing-2 */

/* NEW Badge */
background: hsl(68, 36%, 52%);        /* Olive accent */
color: hsl(0, 2%, 18%);               /* Dark text on olive */
font-size: 11px;                       /* text-xs */
font-weight: 500;                      /* Medium */
padding: 2px 8px;                      /* Compact badge */
border-radius: 4px;
text-transform: uppercase;
letter-spacing: 0.5px;

/* NEW Badge → Mark Read Button (Hover State) */
/* Same dimensions, smooth 200ms transition */
background: hsl(68, 36%, 52%);        /* Olive accent */
color: hsl(0, 2%, 18%);               /* Dark text */
padding: 4px 12px;                     /* Slightly larger for button */
border-radius: 4px;
cursor: pointer;
transition: all 200ms ease-out;

/* Mark Read Button Hover */
background: hsl(68, 36%, 60%);        /* Lighter olive on hover */
```

**Read Card (Marked as Read):**

```css
/* Card Container */
background: var(--bg-dark);           /* Same background */
border: 1px solid hsl(0, 0%, 30%);   /* Subtle gray border - #4d4d4d */
border-radius: 8px;
padding: 16px;                         /* spacing-4 */
opacity: 0.7;                          /* Reduced prominence */

/* Work Item Title */
font-size: 14px;                       /* text-base */
font-weight: 400;                      /* Regular - read state */
color: hsl(0, 0%, 70%);               /* gray-300 - lower contrast */
line-height: 24px;

/* One-Liner Summary */
font-size: 13px;                       /* text-sm */
font-weight: 400;                      /* Regular */
color: hsl(0, 0%, 60%);               /* gray-400 - subdued */
line-height: 20px;
margin-top: 8px;                       /* spacing-2 */

/* No Badge (read state) */
```

#### Expanded Card Visual Treatment

**Activity Timeline (Within Expanded Card):**

```css
/* Timeline Container */
padding: 16px 0;                       /* spacing-4 vertical */
margin-top: 12px;                      /* spacing-3 */
border-top: 1px solid hsl(0, 0%, 25%); /* Subtle separator */

/* Timeline Item */
display: flex;
gap: 12px;                             /* spacing-3 */
margin-bottom: 12px;                   /* spacing-3 between items */
position: relative;

/* Timeline Connector Line */
position: absolute;
left: 16px;                            /* Aligned to event type icon */
top: 28px;
bottom: -12px;
width: 2px;
background: hsl(0, 0%, 35%);          /* gray-600 */

/* Event Type Icon */
width: 32px;                           /* Fixed width for alignment */
height: 32px;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
background: hsl(280, 67%, 55%);       /* Purple for issues */
/* OR */
background: hsl(199, 92%, 60%);       /* Blue for MRs */
/* OR */
background: hsl(0, 0%, 50%);          /* Gray for comments */

/* Event Text */
font-size: 13px;                       /* text-sm */
font-weight: 400;                      /* Regular */
color: hsl(0, 0%, 85%);               /* gray-200 */
line-height: 20px;
flex: 1;

/* Timestamp */
font-size: 11px;                       /* text-xs */
font-weight: 400;                      /* Regular */
color: hsl(0, 0%, 55%);               /* gray-400 - metadata */
margin-top: 4px;                       /* spacing-1 */
```

#### Unread Count Indicator

**Count Badge (Top of List):**

```css
/* Container */
display: flex;
align-items: center;
gap: 8px;                              /* spacing-2 */
padding: 12px 16px;                    /* spacing-3, spacing-4 */
background: hsl(0, 2%, 16%);          /* Slightly darker than cards */
border-radius: 8px;
margin-bottom: 16px;                   /* spacing-4 */

/* Count Badge (Unread > 0) */
background: hsl(68, 36%, 52%);        /* Olive accent */
color: hsl(0, 2%, 18%);               /* Dark text */
font-size: 13px;                       /* text-sm */
font-weight: 600;                      /* Semibold - prominent */
padding: 4px 12px;
border-radius: 12px;                   /* Pill shape */
min-width: 32px;
text-align: center;

/* Count Badge (Zero State - Caught Up) */
background: hsl(142, 71%, 45%);       /* Success green - #22C55E */
color: hsl(0, 0%, 100%);              /* White text */
font-size: 13px;                       /* text-sm */
font-weight: 600;                      /* Semibold */
padding: 4px 12px;
border-radius: 12px;                   /* Pill shape */

/* Label Text */
font-size: 14px;                       /* text-base */
font-weight: 500;                      /* Medium */
color: hsl(0, 0%, 85%);               /* gray-200 */
```

#### Side Panel Visual Treatment

**Side Panel Container:**

```css
/* Panel */
position: fixed;
right: 0;
top: 0;
bottom: 0;
width: 600px;                          /* Desktop width */
background: hsl(0, 2%, 18%);          /* --bg-dark */
border-left: 1px solid hsl(0, 0%, 25%); /* Subtle separator */
box-shadow: -4px 0 16px rgba(0,0,0,0.3); /* Depth shadow */
z-index: 1000;
animation: slideIn 200ms ease-out;

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* Panel Header */
padding: 20px 24px;                    /* spacing-5, spacing-6 */
border-bottom: 1px solid hsl(0, 0%, 25%);
display: flex;
justify-content: space-between;
align-items: center;

/* Work Item Title in Panel */
font-size: 16px;                       /* text-lg */
font-weight: 600;                      /* Semibold */
color: hsl(0, 0%, 95%);               /* gray-50 */
line-height: 24px;

/* Close Button */
width: 32px;
height: 32px;
border-radius: 4px;
display: flex;
align-items: center;
justify-content: center;
background: transparent;
border: none;
color: hsl(0, 0%, 70%);               /* gray-300 */
cursor: pointer;
transition: background 200ms ease-out;

/* Close Button Hover */
background: hsl(0, 0%, 25%);          /* Subtle background */
color: hsl(0, 0%, 95%);               /* Lighter text */

/* Panel Content */
padding: 24px;                         /* spacing-6 */
overflow-y: auto;
height: calc(100vh - 72px);            /* Full height minus header */

/* Auto-scroll behavior: JavaScript scrolls to newest content on open */
```

#### Context Signals (Repo, Component, Keywords)

**Signal Badges in Collapsed Card:**

```css
/* Signal Container */
display: flex;
gap: 8px;                              /* spacing-2 */
flex-wrap: wrap;
margin-top: 8px;                       /* spacing-2 */

/* Signal Badge */
background: hsl(0, 0%, 25%);          /* gray-700 - subtle */
color: hsl(0, 0%, 75%);               /* gray-300 - readable */
font-size: 11px;                       /* text-xs */
font-weight: 500;                      /* Medium */
padding: 2px 8px;
border-radius: 4px;
display: flex;
align-items: center;
gap: 4px;                              /* spacing-1 for icon */

/* Signal Icon (if used) */
width: 12px;
height: 12px;
opacity: 0.8;

/* Repo Signal (first-class) */
background: hsl(199, 50%, 30%);       /* Blue tint - repository */
color: hsl(199, 92%, 80%);            /* Light blue text */

/* Component Signal (first-class) */
background: hsl(280, 50%, 30%);       /* Purple tint - component */
color: hsl(280, 67%, 80%);            /* Light purple text */

/* Keyword Signal (contextual) */
background: hsl(0, 0%, 25%);          /* Gray - less prominent */
color: hsl(0, 0%, 75%);               /* Gray text */
```

### 3.3 Animation & Transition Specifications

**All animations use 200ms ease-out for consistency with existing GitLab Insights patterns.**

```css
/* Card Expand/Collapse - Grid-based (NOT max-height) */
.card-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms ease-out;
}

.card-content.expanded {
  grid-template-rows: 1fr;
}

.card-content > div {
  overflow: hidden;
}

/* NEW Badge → Mark Read Button */
transition: all 200ms ease-out;

/* Side Panel Slide-In */
animation: slideIn 200ms ease-out;

/* Hover States (buttons, cards) */
transition: background 200ms ease-out, color 200ms ease-out;

/* Opacity Changes (read state transitions) */
transition: opacity 200ms ease-out, border 200ms ease-out, font-weight 0ms;
/* Note: font-weight has 0ms to prevent blurry animation */
```

### 3.4 Responsive Adaptations

**Mobile (<768px) Adaptations:**

```css
/* Side Panel becomes Full-Screen Overlay */
width: 100vw;
animation: slideUp 200ms ease-out;

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* Collapsed Card Padding Reduction */
padding: 12px;                         /* spacing-3 - tighter on mobile */

/* Font Size Adjustments */
/* Keep same sizes - mobile users can handle desktop density */

/* Touch Targets */
/* Mark Read button: min 44px height for touch accessibility */
min-height: 44px;
padding: 12px 16px;                    /* Larger touch target */

/* Mobile spacing: 12px dead zone between NEW badge and card body */
/* Prevents accidental taps on Mark Read when aiming for expand */
margin-bottom: 12px;                   /* spacing-3 */
```

**Tablet (768px - 1279px) Adaptations:**

```css
/* Side Panel Width Reduction */
width: 480px;                          /* Narrower on tablets */

/* Card Grid (if multiple columns in future) */
/* Single column maintained for MVP */
```

**Desktop (≥1280px) - Default:**

```css
/* Side Panel Standard Width */
width: 600px;

/* List View Maximum Width for Readability */
max-width: 1200px;                     /* Prevent excessive line length */
margin: 0 auto;                        /* Center content */
```

### 3.5 AI Mockup Generation Prompts

**These prompts are designed for AI image generation tools (Midjourney, DALL-E, Stable Diffusion) to create professional UI mockups matching our theme.**

______________________________________________________________________

#### Prompt 1: Collapsed Cards List View (Unread Items)

```
Create a professional desktop web application UI mockup for a work item management interface in dark mode. Show a vertical list of 4-5 collapsible cards representing GitLab issues and merge requests. Design specifications:

THEME & COLORS:
- Dark background: #2d2e2e (dark charcoal)
- Accent color: #9DAA5F (olive/moss green)
- Text: High contrast white/light gray
- Modern, clean aesthetic inspired by Linear and Datadog

CARD DESIGN (Unread State):
- Each card has 2px olive green border (#9DAA5F)
- Bold work item title (14px, white text)
- One-line summary below title (13px, light gray)
- Small "NEW" badge in top-right corner (olive background, dark text, uppercase)
- Context badges showing repository name and component (small pills, subtle colors)
- 8px spacing between elements, 16px internal padding
- Subtle shadow for depth
- Rounded corners (8px border-radius)

TOP SECTION:
- Unread count indicator showing "8 NEW ITEMS" in prominent olive badge
- Clean, minimal header

LAYOUT:
- Consistent 24px spacing between cards
- List is left-aligned with breathing room
- Professional spacing and typography hierarchy

STYLE:
- Modern SaaS application aesthetic
- Dense information display (engineer-focused)
- Gmail-inspired read/unread distinction
- Datadog-inspired status indicators
- Clean, not cluttered
- Professional desktop application feel
- High contrast for readability
- 16:9 desktop viewport
```

______________________________________________________________________

#### Prompt 2: Collapsed Cards with Hover State (Mark Read Button)

```
Create a professional desktop web application UI mockup showing a work item card in hover state. Design specifications:

THEME & COLORS:
- Dark background: #2d2e2e (dark charcoal)
- Accent color: #9DAA5F (olive/moss green)
- Modern, clean aesthetic inspired by Linear and Datadog

CARD DESIGN:
- Single large card in focus (unread state)
- 2px olive green border (#9DAA5F)
- Bold work item title: "Add authentication middleware to API gateway"
- One-line summary: "Discussion about implementing JWT vs OAuth2 for microservices authentication"
- Context badges: "backend-api" (repository), "authentication" (component)

HOVER STATE:
- NEW badge has transformed into "MARK READ" button (same position, size, olive background)
- Button has subtle hover glow/highlight effect
- Card has slight scale or highlight to show interactivity
- Cursor pointer visible over button

LAYOUT:
- Show card with ample padding
- Clear visual focus on hover interaction
- Professional button styling (not flat, has subtle depth)

STYLE:
- Modern SaaS application
- Smooth, professional interaction design
- Clean typography
- High contrast for readability
- Desktop viewport, close-up view of single card
```

______________________________________________________________________

#### Prompt 3: Expanded Card with Activity Timeline

```
Create a professional desktop web application UI mockup showing an expanded work item card with activity timeline. Design specifications:

THEME & COLORS:
- Dark background: #2d2e2e (dark charcoal)
- Accent colors: Purple (#B794F4) for issues, Blue (#38BDF8) for MRs, Gray for comments
- Text: High contrast white/light gray
- Modern, clean aesthetic

EXPANDED CARD DESIGN:
- Large card showing work item "Update authentication service to use OAuth2"
- Card header with title (now marked as read - normal weight text, subtle gray border)
- Expanded section below title showing activity timeline

ACTIVITY TIMELINE:
- Vertical timeline with left-side colored dots/icons
- Connecting line between events (subtle gray)
- 4-5 timeline events showing:
  - Issue created (purple dot)
  - Comment added (gray dot)
  - Merge request linked (blue dot)
  - Status changed (gray dot)
- Each event has: icon, event description, timestamp (small gray text)
- 12px spacing between timeline items
- Clean, readable event descriptions (13px)

VISUAL HIERARCHY:
- Timeline events are clearly grouped
- Subtle top border separating timeline from header
- Proper spacing and alignment
- Professional list design

STYLE:
- Modern SaaS application
- Engineering tool aesthetic (dense but organized)
- Clean typography and spacing
- High contrast for readability
- Desktop viewport, single expanded card in focus
```

______________________________________________________________________

#### Prompt 4: Side Panel Detail View (Auto-Scrolled to New Content)

```
Create a professional desktop web application UI mockup showing a split-screen layout with side panel detail view on the right of the page. Design specifications:

THEME & COLORS:
- Dark background: #2d2e2e (dark charcoal)
- Accent color: #9DAA5F (olive/moss green)
- Modern, clean aesthetic inspired by Gmail's reading pane

LAYOUT:
- LEFT SIDE (40% width): Work item list with 3-4 collapsed cards (some read, some unread)
- RIGHT SIDE (60% width): Detail panel showing full work item context

DETAIL PANEL DESIGN:
- Header with work item title "Implement rate limiting for public API endpoints"
- Close button (X) in top-right corner
- Content area with full issue/MR details
- Activity feed showing comments, status changes, related MRs
- VISUAL INDICATOR: Highlight or subtle background on newest content (auto-scrolled position)
- Scrollbar visible showing position in content

PANEL STYLING:
- Subtle left border separating panel from list
- Deep shadow for layering depth
- Clean header with proper spacing
- Content area with 24px padding
- Professional scrollbar design

LEFT SIDE (List):
- Cards remain visible (not obscured by panel)
- One card highlighted/selected (corresponds to panel content)
- Clean, compact card design

STYLE:
- Modern SaaS application
- Gmail-inspired split view pattern
- Professional information hierarchy
- High contrast for readability
- Desktop viewport (1920x1080 or similar)
- Clean, spacious layout with proper breathing room
```

______________________________________________________________________

#### Prompt 5: Mobile View (Touch-Optimized)

```
Create a professional mobile web application UI mockup for work item management interface. Design specifications:

THEME & COLORS:
- Dark background: #2d2e2e (dark charcoal)
- Accent color: #9DAA5F (olive/moss green)
- Mobile-optimized dark theme

MOBILE LAYOUT (375px width typical):
- Top: Unread count badge "5 NEW ITEMS" (olive, prominent)
- Below: Vertical list of 3 cards (mobile viewport shows limited items)

MOBILE CARD DESIGN:
- Slightly tighter padding (12px instead of 16px)
- Bold work item title (14px, same as desktop)
- One-line summary (13px)
- NEW badge in top-right (same styling as desktop)
- Context badges below (stacked if needed for narrow viewport)
- Touch-optimized: minimum 44px touch targets for interactive elements

MARK READ BUTTON (Touch):
- Larger button size for touch (minimum 44px height)
- Clear tap target
- No hover state (touch interface)

STYLE:
- Mobile-first responsive design
- Touch-friendly spacing and targets
- Clean, modern mobile UI
- High contrast for outdoor readability
- Professional mobile application aesthetic
- Portrait orientation (9:16 aspect ratio)
- iOS or Android modern design language
```

______________________________________________________________________

#### Prompt 6: Zero State / All Caught Up

```
Create a professional desktop web application UI mockup showing "all caught up" success state. Design specifications:

THEME & COLORS:
- Dark background: #2d2e2e (dark charcoal)
- Success color: #22C55E (green)
- Modern, calm aesthetic

ZERO STATE DESIGN:
- Top: Large success indicator showing "0 NEW ITEMS" with green badge/checkmark
- Text below: "All caught up! You're up to date with your work items."
- Below: List of 4-5 read cards (all showing read state)

READ CARD STYLING:
- 1px subtle gray border (not olive)
- Normal weight titles (not bold)
- Reduced opacity (0.7)
- No NEW badges
- Calm, subdued appearance

SUCCESS INDICATOR:
- Prominent green badge or checkmark icon
- Celebratory but professional (not playful)
- Clear "caught up" messaging
- Subtle positive reinforcement

STYLE:
- Modern SaaS application
- Calm, success-oriented design
- Professional positive feedback
- High contrast for readability
- Desktop viewport
- Clean, spacious layout with breathing room
```

______________________________________________________________________

#### Prompt 7: Wireframe / Low-Fidelity Blueprint

```
Create a clean wireframe/blueprint mockup for work item grouping interface. Design specifications:

STYLE:
- Low-fidelity wireframe aesthetic
- White/light gray background
- Black lines and shapes
- Minimal shading
- Blueprint or sketch style
- Annotations with arrows and labels

LAYOUT ELEMENTS TO SHOW:
- Overall page structure with header, sidebar (if any), main content area
- Collapsed card wireframe showing: title box, summary box, badge position, context signal positions
- Expanded card wireframe showing: title, timeline structure, event items
- Side panel wireframe showing: header, content area, close button position
- Spacing annotations (8px, 16px, 24px grid)
- Touch target sizing annotations (44px minimum)

ANNOTATIONS:
- Label key measurements
- Show component hierarchy
- Indicate interactive elements
- Mark spacing and padding
- Show responsive breakpoints

STYLE:
- Professional UX wireframe
- Clean, technical drawing aesthetic
- Clear hierarchy and structure
- Desktop viewport with optional mobile variant side-by-side
```

______________________________________________________________________

### 3.6 Design Validation Checklist

Before implementation, validate that mockups meet these criteria:

**Visual Consistency:**

- ✅ Olive accent color (#9DAA5F in dark mode) used consistently
- ✅ Typography follows 11px-18px scale with proper font weights
- ✅ Spacing follows 8px grid (4px, 8px, 12px, 16px, 24px, 32px)
- ✅ Border-radius consistent (4px for small elements, 8px for cards)
- ✅ Dark mode background (#2d2e2e) matches existing app

**Interaction Design:**

- ✅ NEW badge → Mark Read button transformation visible in hover mockup
- ✅ Three-level progressive disclosure represented (collapsed, expanded, side panel)
- ✅ Read/unread distinction is immediately clear
- ✅ Touch targets meet 44px minimum for mobile

**Accessibility:**

- ✅ High contrast text (WCAG AA minimum)
- ✅ Color not sole indicator (text + weight + border changes for read state)
- ✅ Interactive elements clearly indicated
- ✅ Focus states designed (for keyboard navigation)

**Information Hierarchy:**

- ✅ Work item title most prominent
- ✅ Context signals (repo, component) visible but not distracting
- ✅ Timestamps and metadata subdued
- ✅ NEW badge/unread count draws appropriate attention

**Professional Polish:**

- ✅ Modern SaaS application aesthetic
- ✅ Dense but not cluttered
- ✅ Engineering tool feel (not consumer app)
- ✅ Subtle shadows and depth where appropriate
- ✅ Clean, consistent spacing throughout

______________________________________________________________________

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

______________________________________________________________________

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

______________________________________________________________________

**Common Success Patterns:**

Both Gmail and Datadog excel at:

1. **Scan-first design** - List view optimized for rapid scanning
1. **Progressive disclosure** - Collapsed summary → Expanded detail
1. **Read/unread state** - Clear visual distinction
1. **Side panel pattern** - List stays visible while viewing details
1. **Search-driven** - Finding specific items is fast and powerful
1. **Explicit control** - Users control state (mark read, acknowledge, archive)

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

______________________________________________________________________

## Design Direction Decision

### 4.1 Mockup Exploration Summary

**Mockups Generated:** 4 HTML prototypes created via AI image generation prompts

**Location:** `docs/work-item-grouping-mockups/`
- work_item_list_-_dark_mode_1: Collapsed cards list view
- work_item_list_-_dark_mode_2: Expanded card with activity timeline
- work_item_list_-_dark_mode_3: Hover state with Mark Read button
- work_item_list_-_dark_mode_4: Split-screen with side panel

**Mockup Quality Assessment:**

**What Works Well:**
- ✅ Olive accent color (#9DAA5F) applied correctly to NEW badges and borders
- ✅ Dark mode charcoal background (#2d2e2e) matches specification
- ✅ Collapsible card pattern with clear visual hierarchy
- ✅ Activity timeline with vertical connector line and event icons
- ✅ Split-screen side panel with list remaining visible
- ✅ NEW → Mark Read button transformation on hover (with visual indicator)
- ✅ Read/unread distinction through opacity and border changes
- ✅ Proper use of context signals (repo names visible in collapsed state)

**Discrepancies Requiring Correction:**

**1. Header/Branding Issues:**
- ❌ App name shows "DevQueue" instead of "GitLab Insights"
- ❌ Primary color is yellow (#f9f506) instead of olive (#9DAA5F)
- ❌ Navigation shows generic "Issues, Pull Requests, Milestones" instead of GitLab Insights navigation
- ❌ "New Issue" button doesn't fit organizational intelligence use case
- **Fix:** Update header to reflect GitLab Insights branding and navigation structure

**2. Sidebar Navigation Mismatch:**
- ❌ Shows generic workspace navigation (Inbox, My Issues, Assigned to me)
- ❌ Projects section (Frontend Core, API Gateway) doesn't match app structure
- **Fix:** Replace with GitLab Insights navigation: Catch Up (main view), Events (flat chronological), Filters, Settings

**3. Content/Messaging Issues:**
- ❌ Page title "Work Item Queue" and subtitle "Manage your assigned tasks" contradicts organizational intelligence focus
- **Fix:** Update to "Catch Up" or "Work Items" with subtitle emphasizing organizational awareness: "Discover activity across your GitLab projects - including conversations you weren't tagged in"

**4. Context Signals Incomplete:**
- ❌ Only shows repository name, missing component and keyword badges
- **Fix:** Add component badges (e.g., "authentication", "api-gateway") and keyword highlights as specified in visual foundation

**5. Minor Visual Refinements:**
- Border-radius inconsistency (mockups use 16px, specification calls for 8px on cards)
- Font family uses Spline Sans (correct choice for modern SaaS feel)
- Spacing mostly follows 8px grid but some inconsistencies in card padding

### 4.2 Chosen Design Direction

**Selected Approach:** Refined version of existing mockups with corrections applied

**Core Visual Direction:**
- **Dense, information-rich cards** inspired by Linear and Datadog
- **Gmail-style read/unread distinction** (bold/normal weight, opacity differences)
- **Olive accent color** (#9DAA5F dark mode, #5e6b24 light mode) for NEW badges and active states
- **Charcoal background** (#2d2e2e) with high-contrast text for dark mode
- **Minimal border-radius** (8px on cards, 4px on badges) for professional, engineering-tool aesthetic
- **Context signals as first-class information** (repo, component, keywords visible in collapsed state)

**Interaction Patterns:**
- **Three-level progressive disclosure:** Collapsed → Expanded in-place → Side panel
- **NEW badge → Mark Read button transformation** on hover (smooth 200ms transition)
- **Auto-scroll behavior** in side panel (jumps to newest content automatically)
- **Split-screen pattern** (list stays visible when side panel open)

**Layout Strategy:**
- **Max-width container** (1000-1200px) to prevent excessive line length
- **Vertical card stacking** with consistent 16px spacing between cards
- **Sticky header** with unread count indicator always visible
- **Responsive breakpoints:** Desktop (≥1280px), Tablet (768-1279px), Mobile (<768px)

### 4.3 Design Rationale

**Why This Direction Works:**

**1. Familiar Yet Unique**
- Uses proven patterns (Gmail list+panel, Datadog status indicators) that engineers already know
- Adds unique twists (three-way read marking, context signals as first-class, auto-scroll) that solve specific organizational intelligence needs
- Engineers don't need training - they recognize the patterns immediately

**2. Dense Without Clutter**
- Information-rich cards show repo, component, keywords, participants, timestamps in collapsed state
- Visual hierarchy prevents cognitive overload (bold titles, subdued metadata, olive accents for new items)
- Supports 3-5 second scan-to-decision goal through clear information prioritization

**3. Calm, Professional Aesthetic**
- Dark mode with charcoal background reduces visual fatigue for all-day monitoring
- Olive accent (not bright yellow, not aggressive red) provides emphasis without anxiety
- Reduced opacity for read items creates visual calm without hiding content
- Professional engineering tool feel (not consumer app, not playful)

**4. Organizational Intelligence Focus**
- Context signals (repo, component, keywords) answer "why might this matter to me?" immediately
- Three-way read marking supports different investigation depths (quick dismiss, scan, deep dive)
- Unread count provides progress feedback without creating urgency/anxiety
- Zero state uses green/success color (not red/warning) - "all caught up" feels satisfying, not alarming

**5. Scalability & Maintainability**
- Built on HeroUI component library (React Aria) - accessibility guaranteed
- Uses existing design tokens (olive accent, typography scale, spacing grid)
- Mockups validate that patterns work at realistic data volumes (4-8 cards visible)
- Responsive approach proven across desktop/tablet/mobile

**6. Supports Core User Loop**
- Collapsed cards enable rapid scanning (3-5 seconds per item)
- Hover interaction (NEW → Mark Read) requires zero clicks for quick dismissal
- Expanded timeline shows activity context without leaving list view
- Side panel provides deep investigation without losing place in list

### 4.4 Mockup Refinement Requirements

**Before Development Begins:**

**Required Fixes:**
1. ✅ Update header branding to "GitLab Insights"
2. ✅ Replace yellow primary with olive accent throughout
3. ✅ Update navigation to GitLab Insights structure (Catch Up, Events, Filters, Settings)
4. ✅ Add component badges and keyword highlights to collapsed cards
5. ✅ Update page title/subtitle to emphasize organizational intelligence
6. ✅ Standardize border-radius to 8px on cards, 4px on badges
7. ✅ Ensure consistent spacing (8px grid) throughout

**Design Enhancements to Consider (Create Beads):**

**Enhancement 1: Rich Context Signal Badges**
- **Current:** Only repo name shown as plain text
- **Proposed:** Add styled badges for component (purple tint) and keywords (gray tint) in collapsed card
- **Value:** Improves scan-to-decision by surfacing relevance signals immediately
- **Priority:** HIGH - directly supports core value proposition
- **Create Bead:** Yes - "Add component and keyword badges to collapsed card context signals"

**Enhancement 2: Participant Avatar Stack in Collapsed State**
- **Current:** Avatars only visible in expanded state
- **Proposed:** Show 2-3 participant avatars (overlapping stack) in collapsed card footer
- **Value:** Quick visual scan of "who's involved" without expanding
- **Priority:** MEDIUM - nice-to-have, adds visual density
- **Create Bead:** Maybe - needs user testing to validate value vs. density tradeoff
- **Concern:** May clutter collapsed state, conflicts with "scan-to-decision in 3-5 seconds" goal

**Enhancement 3: Sticky Unread Count Indicator**
- **Current:** Unread count in page title area (scrolls away)
- **Proposed:** Sticky floating badge or header-pinned indicator that remains visible during scroll
- **Value:** Always know progress toward zero/completion
- **Priority:** LOW - nice-to-have, not critical for MVP
- **Create Bead:** No - post-MVP enhancement

**Enhancement 4: Keyboard Shortcut Indicators**
- **Current:** No visible keyboard shortcuts (post-MVP feature)
- **Proposed:** Subtle key hints (j/k navigation, x mark read, enter open) visible on hover
- **Value:** Power user efficiency
- **Priority:** LOW - keyboard shortcuts are post-MVP
- **Create Bead:** No - wait for keyboard shortcut implementation

### 4.5 Implementation Approach

**Development Sequence:**

**Phase 1: Static Layout (No Interactions)**
1. Header with GitLab Insights branding and navigation
2. Sidebar with proper navigation structure
3. Main content area with collapsed cards
4. Card components with proper visual hierarchy (title, summary, context signals, metadata)
5. Unread count indicator
6. Responsive breakpoints (desktop, tablet, mobile)

**Phase 2: Card Interactions**
1. Hover states (NEW → Mark Read transformation)
2. Click to expand card in-place (200ms animation)
3. Activity timeline rendering in expanded state
4. Collapse interaction

**Phase 3: Side Panel**
1. Click card title to open side panel (200ms slide-in)
2. Auto-scroll to newest content
3. Close button and click-outside-to-close
4. List remains visible (split-screen pattern)

**Phase 4: Read State Management**
1. Three-way read marking (Mark Read button, expand, side panel)
2. Visual state transitions (opacity, border, weight, badge removal)
3. Unread count decrement
4. Database persistence

**Phase 5: Data Integration**
1. Connect to backend API for work item data
2. Real-time updates for new items
3. Filtering and sorting
4. Pagination/infinite scroll

**Component Reuse Strategy:**
- **HeroUI Button** - Mark Read button, filter/sort buttons
- **HeroUI Tooltip** - Context signal explanations (repo, component, keywords)
- **HeroUI Modal** - Confirmation dialogs (if needed)
- **Custom Collapsible Card** - New component extending React Aria disclosure
- **Custom Split Pane** - Reuse existing pattern from main app
- **Custom Badge** - Extend existing badge component with NEW variant and context signal variants

**Visual Foundation Reference:**
- All colors, typography, spacing, and animations specified in Section 3 (Visual Foundation)
- CSS specifications provided for all states (unread, read, hover, expanded, side panel)
- Responsive adaptations defined for mobile, tablet, desktop

**Quality Gates:**
- ✅ Accessibility: WCAG AA contrast ratios verified
- ✅ Keyboard navigation: All interactions keyboard-accessible
- ✅ Dark mode: All states tested in dark mode
- ✅ Performance: Smooth 200ms animations, no jank

______________________________________________________________________

## Component Strategy

### Design System Components

**Foundation: HeroUI (React Aria-based Component Library)**

GitLab Insights uses HeroUI as its component foundation, providing accessibility-first components built on React Aria. Work Item Grouping extends this existing system rather than introducing new dependencies.

**Available Components from HeroUI:**

| Component | Work Item Grouping Usage | Adaptation Required |
|-----------|--------------------------|---------------------|
| **Button** | Mark Read button, filter/sort controls, close button | Olive variant for primary actions |
| **Tooltip** | Context signal explanations (repo, component, keyword badges) | No changes needed |
| **Modal** | Future confirmation dialogs (not MVP) | No changes needed |
| **Table** | Not used in Work Item Grouping | N/A |
| **Autocomplete** | Not used in Work Item Grouping | N/A |
| **Checkbox** | Future bulk selection (not MVP) | N/A |

**Existing Custom Components (Reusable):**

| Component | Source | Work Item Grouping Usage |
|-----------|--------|--------------------------|
| **Badge** | GitLab Insights custom | Extend with NEW badge variant and context signal variants (repo, component, keyword) |
| **Split Pane** | GitLab Insights custom | Reuse for side panel detail view (list + detail pattern) |

**Design Token System:**

Work Item Grouping inherits the complete design token system:
- **Colors:** Olive accent (#9DAA5F dark, #5e6b24 light), semantic colors, backgrounds
- **Typography:** 11px-18px scale, font weights (400/500/600)
- **Spacing:** 8px grid (4px, 8px, 12px, 16px, 24px, 32px)
- **Animation:** 200ms ease-out standard timing
- **Borders:** 1px subtle, 2px accent, 8px/4px border-radius

### Custom Components

**Gap Analysis - Custom Components Needed:**

Work Item Grouping requires 3 new custom components not available in HeroUI or existing GitLab Insights:

1. **Collapsible Work Item Card** - Core component for list view
2. **Activity Timeline** - Event list within expanded cards
3. **Unread Count Indicator** - Progress indicator at list top

---

#### 1. Collapsible Work Item Card

**Purpose:** Display work item summary with progressive disclosure from collapsed → expanded states.

**Content:**
- **Collapsed state:** Work item title, one-line activity summary, context signals (repo/component/keywords), NEW badge, metadata (timestamp, participant count)
- **Expanded state:** All collapsed content PLUS activity timeline showing all events within work item

**Actions:**
- Click card body (anywhere except Mark Read button) → Toggle expand/collapse
- Hover over NEW badge → Transforms to Mark Read button
- Click Mark Read button → Mark as read without expanding
- Click card header/title → Open side panel (when implemented)

**States:**

| State | Visual Treatment | Interaction |
|-------|------------------|-------------|
| **Collapsed - Unread** | Bold title (600 weight), 2px olive border, NEW badge, high contrast text | Hoverable, clickable |
| **Collapsed - Read** | Normal weight title (400), 1px gray border, no badge, 0.7 opacity | Hoverable, clickable |
| **Expanded - Unread** | Same as collapsed unread PLUS activity timeline visible below | Collapsible, timeline scrollable |
| **Expanded - Read** | Same as collapsed read PLUS activity timeline visible below | Collapsible, timeline scrollable |
| **Hover (Unread)** | NEW badge → Mark Read button (200ms fade transition) | Mark Read button clickable |
| **Expanding** | 200ms ease-out grid animation | Non-interactive during animation |
| **Collapsing** | 200ms ease-out grid animation | Non-interactive during animation |

**Variants:**
- **Default:** Standard card with full metadata
- **Compact (future):** Reduced padding for higher density (post-MVP)

**Accessibility:**
- `role="article"` on card container
- `aria-expanded="true/false"` on collapsible region
- `aria-label` on Mark Read button: "Mark [work item title] as read"
- Keyboard navigation: Enter/Space to toggle expand, Tab to Mark Read button
- Focus indicator: 2px olive outline on keyboard focus

**Content Guidelines:**
- **Title:** 60-80 characters max for readability
- **Summary:** Single line (120 characters max), truncate with ellipsis if needed
- **Context signals:** Show up to 3 badges (1 repo + 1-2 components/keywords), +N indicator if more
- **Timestamp:** Relative time (e.g., "2h ago", "3 days ago")

**Interaction Behavior:**
- **Click detection zones:**
  - Card body (excluding Mark Read button area) → Toggle expand/collapse
  - Mark Read button area → Mark as read
  - Card header/title → Open side panel (future enhancement)
- **Mark-as-read timing:** Immediate on expand (no debounce)
- **Animation:** 200ms ease-out for expand/collapse, grid-based height transition

**Component Anatomy:**
```
┌─────────────────────────────────────────────────┐
│ [Title: Bold/Normal]               [NEW/Button] │ ← Header
│ [One-line summary]                              │ ← Summary
│ [Repo] [Component] [Keyword]          [2h ago] │ ← Context + Metadata
├─────────────────────────────────────────────────┤ ← Separator (when expanded)
│ [Activity Timeline - only visible when expanded]│ ← Expandable content
│ • Event 1                                       │
│ • Event 2                                       │
│ • Event 3                                       │
└─────────────────────────────────────────────────┘
```

**Implementation Notes:**
- Built using React Aria `useDisclosure` hook for accessible expand/collapse
- Grid-based animation via `grid-template-rows: 0fr` → `1fr` transition
- Mark Read button uses same dimensions as NEW badge for seamless transformation
- Context signal badges reuse existing Badge component with color variants
- **Immediate mark-as-read on expand** (no debounce logic)

---

#### 2. Activity Timeline

**Purpose:** Display chronological list of events within a work item (comments, status changes, MR links).

**Content:**
- Event type icon (purple for issues, blue for MRs, gray for comments)
- Event description text (e.g., "Alice commented", "Status changed to In Progress")
- Timestamp (relative time)
- Optional: Comment preview or change details

**Actions:**
- Click event → Future: Navigate to specific event in side panel (post-MVP)
- Scroll → Natural vertical scrolling within expanded card

**States:**

| State | Visual Treatment |
|-------|------------------|
| **Default** | Vertical list with connecting line, event icons, descriptions |
| **Hover (future)** | Subtle background highlight on event item |
| **Loading** | Skeleton placeholders for event items (if async load) |

**Variants:**
- **Default:** Full timeline with all events
- **Truncated (future):** Show last N events with "Show more" link (if performance concerns)

**Accessibility:**
- `role="list"` on timeline container
- `role="listitem"` on each event
- `aria-label` on timeline: "Activity timeline for [work item title]"
- Keyboard navigation: Timeline scrollable via keyboard (arrow keys, Page Up/Down)
- Screen reader: Event descriptions are semantic ("Alice commented 2 hours ago")

**Content Guidelines:**
- **Event descriptions:** Action + actor + context (e.g., "Bob merged MR #123", "Alice changed status to In Progress")
- **Timestamps:** Relative time for recent events (<7 days), absolute date for older
- **Maximum events:** Show all (no artificial limit) - user scrolls if needed
- **Event ordering:** Chronological (oldest at top, newest at bottom) - matches GitLab convention

**Interaction Behavior:**
- Scrollable within expanded card (if timeline exceeds card height)
- Events are read-only in MVP (click interactions post-MVP)
- Timeline appears/disappears with 200ms fade when card expands/collapses

**Component Anatomy:**
```
Timeline Container
├─ Timeline Item (Event 1)
│  ├─ Event Icon (purple/blue/gray circle)
│  ├─ Connector Line (vertical gray line to next event)
│  ├─ Event Description Text
│  └─ Timestamp
├─ Timeline Item (Event 2)
│  └─ ...
└─ Timeline Item (Event N)
```

**Visual Specification:**
```css
/* Timeline Container */
padding: 16px 0;
margin-top: 12px;
border-top: 1px solid hsl(0, 0%, 25%);

/* Timeline Item */
display: flex;
gap: 12px;
margin-bottom: 12px;
position: relative;

/* Connector Line */
position: absolute;
left: 16px;  /* Aligned to center of event icon */
top: 28px;   /* Below event icon */
bottom: -12px;
width: 2px;
background: hsl(0, 0%, 35%);

/* Event Icon */
width: 32px;
height: 32px;
border-radius: 50%;
background: [purple/blue/gray based on event type];
display: flex;
align-items: center;
justify-content: center;
z-index: 1;  /* Above connector line */

/* Event Text */
font-size: 13px;
color: hsl(0, 0%, 85%);
line-height: 20px;

/* Timestamp */
font-size: 11px;
color: hsl(0, 0%, 55%);
margin-top: 4px;
```

**Implementation Notes:**
- Use existing event type colors from GitLab Insights (already defined)
- Connector line stops at last event (no line below final item)
- Timeline renders within expanded card's collapsible region
- Events loaded from backend API, rendered as list items

---

#### 3. Unread Count Indicator

**Purpose:** Show progress toward triage completion at top of work item list.

**Content:**
- Count badge showing number of unread items
- Label text: "NEW ITEMS" or "All caught up!" based on count

**Actions:**
- Visual indicator only (not interactive in MVP)
- Future: Click to scroll to first unread item (post-MVP enhancement)

**States:**

| State | Visual Treatment |
|-------|------------------|
| **Has Unread (>0)** | Olive badge with count, "NEW ITEMS" label |
| **Zero State** | Green badge with "0" or checkmark, "All caught up!" label |
| **Updating** | Smooth count decrement animation when items marked as read |

**Variants:**
- **Default:** Badge + label horizontal layout
- **Compact (mobile):** Smaller badge, shortened label

**Accessibility:**
- `role="status"` for live region announcement
- `aria-live="polite"` so count changes are announced to screen readers
- `aria-label`: "8 new items" or "All caught up, zero new items"

**Content Guidelines:**
- **Count display:** Show exact number up to 99, then "99+" for larger counts
- **Zero state messaging:** Positive reinforcement ("All caught up!"), not neutral
- **Update timing:** Count decrements immediately when mark-as-read action completes

**Interaction Behavior:**
- Count decrements smoothly (100ms fade out old number, fade in new number)
- Badge color transitions when reaching zero (olive → green, 200ms transition)
- Label text changes when reaching zero ("NEW ITEMS" → "All caught up!")
- Future: Clicking badge scrolls to first unread card (post-MVP)

**Component Anatomy:**
```
┌────────────────────────────────┐
│ [8] NEW ITEMS                  │  ← Badge + Label (unread state)
└────────────────────────────────┘

┌────────────────────────────────┐
│ [✓] All caught up!             │  ← Badge + Label (zero state)
└────────────────────────────────┘
```

**Visual Specification:**
```css
/* Container */
display: flex;
align-items: center;
gap: 8px;
padding: 12px 16px;
background: hsl(0, 2%, 16%);  /* Slightly darker than cards */
border-radius: 8px;
margin-bottom: 16px;

/* Count Badge (Unread > 0) */
background: hsl(68, 36%, 52%);  /* Olive accent */
color: hsl(0, 2%, 18%);  /* Dark text */
font-size: 13px;
font-weight: 600;
padding: 4px 12px;
border-radius: 12px;  /* Pill shape */
min-width: 32px;
text-align: center;

/* Count Badge (Zero State) */
background: hsl(142, 71%, 45%);  /* Success green */
color: hsl(0, 0%, 100%);  /* White text */
/* Other properties same as unread badge */

/* Label Text */
font-size: 14px;
font-weight: 500;
color: hsl(0, 0%, 85%);
```

**Implementation Notes:**
- Count value sourced from work item list state (total unread)
- Updates reactively when mark-as-read actions complete
- Zero state uses success color to create positive emotional response
- Badge number animates on change (fade out/in, not counter animation)

---

### Component Implementation Strategy

**Build Approach:**

**1. Composition Over Inheritance**
- Build custom components by composing HeroUI primitives (Button, Tooltip) with React Aria hooks
- Collapsible Card uses `useDisclosure` (React Aria) + HeroUI Button for Mark Read
- Activity Timeline uses semantic HTML (`<ul>`, `<li>`) with custom styling
- Unread Count uses React Aria `live region` + custom badge styling

**2. Design Token Integration**
- All custom components consume existing design tokens via CSS variables
- No hardcoded colors - reference `--olive-accent-dark`, `--bg-dark`, `--text-high-contrast`
- Spacing uses existing scale (spacing-1 through spacing-8)
- Typography uses existing text-xs through text-xl classes

**3. TypeScript Interface Contracts**

All components must define explicit TypeScript interfaces before implementation:

```typescript
// src/components/work-items/types.ts

interface WorkItemCardProps {
  workItem: WorkItem;
  isExpanded: boolean;
  isRead: boolean;
  onToggleExpand: () => void;
  onMarkRead: () => void;
  onOpenDetail?: () => void;  // Optional - future enhancement
}

interface ActivityTimelineProps {
  events: WorkItemEvent[];
  maxHeight?: number;
  onEventClick?: (event: WorkItemEvent) => void;  // Future
}

interface UnreadCountProps {
  count: number;
  variant: 'unread' | 'zero';
  onClick?: () => void;  // Future - scroll to first unread
}
```

**4. Animation Performance**

Use GPU-accelerated animations to prevent layout thrashing:

```css
/* Card expand/collapse - Grid-based (NOT max-height) */
.card-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms ease-out;
}

.card-content.expanded {
  grid-template-rows: 1fr;
}

.card-content > div {
  overflow: hidden;
}

/* Side panel slide-in */
.side-panel {
  transform: translateX(100%);
  transition: transform 200ms ease-out;
  will-change: transform;
}

.side-panel.open {
  transform: translateX(0);
}
```

**Why grid-based collapse?** Animating `max-height` causes layout recalculation every frame. Grid-based collapse uses GPU, achieving smooth 60fps performance.

**5. Responsive Strategy**
- Mobile-first CSS (base styles for mobile, media queries for desktop)
- Touch targets minimum 44px on mobile (Mark Read button)
- **Mobile spacing:** 12px dead zone between NEW badge and card body to prevent accidental taps
- Side panel becomes full-screen overlay on mobile (<768px)
- Context signal badges wrap gracefully on narrow viewports

**Component Dependencies:**

```
Collapsible Work Item Card
├─ HeroUI Button (Mark Read button)
├─ Custom Badge (NEW badge, context signals)
├─ Activity Timeline (embedded when expanded)
└─ React Aria useDisclosure (expand/collapse)

Activity Timeline
└─ Semantic HTML list (no external dependencies)

Unread Count Indicator
├─ Custom Badge (count badge)
└─ React Aria live region (accessibility)
```

**State Management - Zustand with Persistence:**

```typescript
// src/store/workItemStore.ts
interface WorkItemState {
  items: Map<string, WorkItem>;           // Keyed by work item ID
  readStatus: Map<string, ReadMetadata>;  // Separate read tracking
  unreadCount: number;                    // Derived, but cached
  
  // Actions
  markAsRead: (id: string) => Promise<void>;
  expandItem: (id: string) => void;
  collapseItem: (id: string) => void;
}

// Use Zustand with persist middleware
const useWorkItemStore = create<WorkItemState>()(
  persist(
    (set, get) => ({
      items: new Map(),
      readStatus: new Map(),
      unreadCount: 0,
      
      markAsRead: async (id: string) => {
        // Optimistic update
        set(state => ({
          readStatus: new Map(state.readStatus).set(id, { read: true, timestamp: Date.now() }),
          unreadCount: state.unreadCount - 1
        }));
        
        try {
          await api.markAsRead(id);
        } catch (error) {
          // Rollback on failure
          set(state => ({
            readStatus: new Map(state.readStatus).set(id, { read: false }),
            unreadCount: state.unreadCount + 1
          }));
          throw error;
        }
      },
      // ... other actions
    }),
    { name: 'work-item-storage' }
  )
);
```

**Why Zustand over Context?**
- **Performance:** Subscriptions prevent unnecessary re-renders (Context re-renders entire subtree)
- **Persistence:** Built-in middleware for localStorage/IndexedDB
- **DevTools:** Redux DevTools integration for debugging mark-as-read timing
- **Server sync:** API calls fit naturally into Zustand actions

**Component-level state:**
- Card expand/collapse: Local component state (only visual, not persisted)
- Read/unread status: Zustand global state (persisted, synced to backend)
- Unread count: Zustand global state (derived from readStatus Map)
- Side panel open/close: Local state (future: global for keyboard shortcuts)

**Testing Strategy:**

**Unit Test Coverage Targets:**
- **Collapsible Card:** 90% coverage minimum
  - All states (collapsed/expanded × read/unread)
  - Hover transformation (NEW → Mark Read)
  - Click zones (expand vs mark-read)
  - **Test end states only** - no mid-animation testing
  - **Immediate mark-as-read on expand** (no debounce timing tests needed)
- **Activity Timeline:** 85% coverage
  - Event rendering (purple/blue/gray icons)
  - Connector line logic (last item has no line)
  - Scrollable overflow behavior
- **Unread Count:** 95% coverage
  - Count display logic (1-99 vs "99+")
  - Zero state transition
  - Animation triggers (count decrement)

**Testing Approach:**
- Unit tests only at this stage (no integration tests, no E2E)
- Test end states, not animation frames
- Mock API calls for mark-as-read actions
- Verify optimistic updates with rollback scenarios

**Deferred Testing:**
- Integration tests (defer until feature complete and user testing begins)
- Visual regression tests (defer until design finalized)
- E2E tests (defer until launch preparation)

### Implementation Roadmap

**Unified Development - No Phased Rollout**

Since there are no active users and the feature will ship as a complete unit, development is organized by technical dependency, not user-facing rollout phases.

**Component Implementation Order:**

**Week 1-2: Foundation Components**
1. **Unread Count Indicator** (simplest, no dependencies)
2. **Activity Timeline** (standalone, can be tested in isolation)
3. **Collapsible Card - Collapsed State** (visual foundation)

**Week 2-3: Core Interactions**
4. **Card Expand/Collapse** (grid-based animation, immediate mark-as-read)
5. **NEW Badge → Mark Read Button** (hover transformation, click handler)
6. **Mark-as-Read Integration** (Zustand actions, optimistic updates)

**Week 3-4: Side Panel & State Management**
7. **Side Panel Component** (reuse existing Split Pane pattern)
8. **Auto-scroll to Newest** (JavaScript scroll logic)
9. **Backend Persistence** (API integration, sync logic)

**Week 4-5: Polish & Complete Feature**
10. **Responsive Adaptations** (mobile/tablet breakpoints)
11. **Context Signal Badges** (repo/component/keyword styling)
12. **Zero State** (green badge, completion messaging)

**Week 5-6: Testing & Refinement**
13. **Unit Test Suite** (90%/85%/95% coverage targets)
14. **Performance Optimization** (animation smoothness, render efficiency)
15. **Final Integration** (connect all components, end-to-end validation)

**Key Technical Dependencies:**
- Zustand store must exist before mark-as-read interactions
- Activity Timeline must work before card expand interactions
- Side panel requires mark-as-read integration to work correctly

**No User-Facing Phases:**
All components ship together when feature is complete. No partial rollout, no incremental user exposure.

______________________________________________________________________

______________________________________________________________________

## UX Consistency Patterns

### Button Hierarchy

**Primary Actions:**
- **Mark Read Button** (transformed from NEW badge on hover)
  - **Visual:** Olive background (#9DAA5F), dark text, 200ms fade-in on hover
  - **Usage:** Quick dismissal without investigation
  - **Size:** Minimum 44px height on mobile for touch targets
  - **State:** Disabled state not needed (always actionable when visible)

**Secondary Actions:**
- **Close Button** (side panel)
  - **Visual:** Icon-only, 32×32px, transparent background, gray icon
  - **Hover:** Subtle gray background (#262626), lighter icon
  - **Position:** Top-right of side panel header
  - **Alternative:** Click outside panel to close

**Tertiary Actions:**
- **Expand/Collapse** (entire card body)
  - **Visual:** No explicit button - entire card is clickable
  - **Affordance:** Cursor changes to pointer on hover
  - **Exclusion:** Mark Read button area is excluded from expand click zone

**Button Hierarchy Rules:**
1. One primary action per card (Mark Read button)
2. Secondary actions use icon-only buttons (minimize visual weight)
3. Tertiary actions use implicit affordances (cursor, hover states)
4. No destructive actions in Work Item Grouping (no delete, no archive)

**Accessibility:**
- All buttons keyboard accessible (Tab, Enter/Space)
- `aria-label` on icon-only buttons
- Focus indicators: 2px olive outline
- Screen reader announcements for state changes

**Mobile Considerations:**
- Mark Read button: 44px minimum height (increased padding: 12px 16px)
- 12px dead zone between NEW badge and card body (prevents accidental Mark Read taps)
- Close button: 44px minimum touch target
- No hover states (touch interface)

---

### Feedback Patterns

**Success Feedback:**
- **Zero State (All Caught Up)**
  - **Visual:** Green badge (#22C55E), checkmark icon, "All caught up!" text
  - **Trigger:** Unread count reaches 0
  - **Timing:** 200ms color transition (olive → green)
  - **Emotion:** Positive reinforcement, satisfying closure
  - **Persistence:** Remains until new items arrive

**State Change Feedback:**
- **Mark as Read Transition**
  - **Visual Changes:**
    - NEW badge disappears (instant)
    - Title weight: 600 → 400 (instant, no animation to prevent blur)
    - Border: 2px olive → 1px gray (200ms transition)
    - Opacity: 1.0 → 0.7 (200ms transition)
  - **Timing:** Immediate visual feedback (no lag)
  - **Unread count:** Decrements by 1 (100ms fade animation)
  - **Sound:** None (silent app for sustained attention)

**Progress Feedback:**
- **Unread Count Indicator**
  - **Visual:** Badge shows exact count (1-99, then "99+")
  - **Updates:** Real-time decrement on each mark-as-read action
  - **Animation:** 100ms fade-out old number, fade-in new number
  - **Position:** Sticky at top of list (always visible)
  - **Emotional arc:** Olive (unread) → Green (zero/complete)

**Optimistic Updates:**
- **Mark as Read** updates UI immediately, rolls back on API failure
- **Visual rollback:** Reverse all state changes (border, opacity, badge reappears)
- **Error handling:** Silent rollback (no error toast unless repeated failures)

**Error Patterns (Deferred):**
- No error toasts in MVP
- API failures handled via optimistic update rollback
- Network errors: Future enhancement (retry logic, offline mode)

**Accessibility:**
- State changes announced via `aria-live="polite"` regions
- Screen reader: "Marked as read" after action
- Focus management: Focus returns to next unread item after mark-as-read

**Mobile Considerations:**
- Same feedback patterns (visual changes are device-agnostic)
- Touch feedback: Native browser touch highlighting on buttons
- No additional haptic feedback (not critical for this use case)

---

### State Transition Patterns

**Card Expand/Collapse:**
- **Animation:** 200ms ease-out grid-based transition
  - Collapsed: `grid-template-rows: 0fr`
  - Expanded: `grid-template-rows: 1fr`
- **Trigger:** Click anywhere on card body (except Mark Read button area)
- **Mark-as-read:** Immediate on expand (no debounce)
- **Visual:** Timeline fades in as card expands
- **Reversible:** Click card header to collapse
- **During animation:** Non-interactive (prevents rapid click spam)

**NEW Badge → Mark Read Button Transformation:**
- **Trigger:** Mouse hover over card with NEW badge
- **Animation:** 200ms fade transition
  - NEW badge fades out
  - Mark Read button fades in (same position, same dimensions)
- **Timing:** Smooth crossfade (no gap between states)
- **Reversal:** Mouse leave returns to NEW badge
- **Touch devices:** No hover state - NEW badge visible, tapping it marks as read

**Side Panel Open/Close:**
- **Open animation:** 200ms slide-in from right (`translateX(100%) → 0`)
- **Close animation:** 200ms slide-out to right (`translateX(0) → 100%`)
- **Auto-scroll:** Scrolls to newest content after slide-in completes
- **List visibility:** List remains visible (split-screen pattern)
- **Mark-as-read:** Immediate on panel open
- **Close triggers:** Close button (X), click outside panel, Escape key (future)

**Unread Count Transitions:**
- **Decrement:** 100ms fade-out old number, 100ms fade-in new number
- **Zero state:** 200ms color transition (olive → green), text change ("NEW ITEMS" → "All caught up!")
- **Increment:** Same animation when new items arrive (green → olive if leaving zero state)

**Consistency Rules:**
1. All animations use 200ms ease-out timing
2. State changes provide immediate visual feedback (no lag)
3. Optimistic updates for perceived performance
4. GPU-accelerated animations (transform, opacity) - no layout properties

**Accessibility:**
- Animations respect `prefers-reduced-motion` (instant transitions if preferred)
- State changes announced to screen readers
- Focus management: Focus follows user intent (stays on action trigger or moves to next logical element)

**Mobile Considerations:**
- Side panel becomes full-screen overlay (slide-up animation from bottom)
- Same animation timing (200ms feels responsive on mobile)
- No hover states for NEW → Mark Read (button always visible on mobile)

---

### Empty States & Zero States

**Zero State (All Caught Up):**
- **Visual:**
  - Green badge (#22C55E) with "0" or checkmark icon
  - "All caught up!" text (14px, medium weight)
  - List of read cards below (normal opacity, gray borders)
- **Trigger:** Last unread item marked as read
- **Emotion:** Positive reinforcement, satisfying completion
- **Messaging:** Celebratory but professional (not playful)
- **Action:** None (passive state, no CTA needed)
- **Persistence:** Remains until new items arrive

**First-Time Empty State (No Work Items):**
- **Visual:**
  - Centered message: "No work items to display"
  - Subtitle: "New items will appear here when activity occurs"
  - Optional: Illustration or icon (low priority)
- **Trigger:** User has no work items (first time setup)
- **Action:** None (passive waiting state)

**Filtered Empty State:**
- **Visual:**
  - "No items match your filters"
  - Link to "Clear filters" (future: when filtering implemented)
- **Trigger:** Active filters return no results
- **Action:** Clear filters link

**Loading States (Minimal):**
- **Initial Load:**
  - Skeleton placeholders for 3-4 cards (subtle gray shimmer)
  - Unread count shows "—" placeholder
- **Timeline Load (within expanded card):**
  - 2-3 skeleton event items (icon + text placeholders)
  - No blocking spinner (content appears incrementally)

**Consistency Rules:**
1. Empty states are calm and reassuring (never alarming)
2. Zero state uses success color (green) for positive emotional response
3. Empty states provide context (why is it empty?) and optional actions
4. Loading states are subtle (skeleton UI, not spinners)

**Accessibility:**
- Empty states have clear semantic structure (`role="status"`)
- Screen reader announces state ("All caught up, zero new items")
- Keyboard navigation: No interactive elements in passive empty states

**Mobile Considerations:**
- Same visual treatment (empty states are device-agnostic)
- Text sizing remains consistent (14px readable on mobile)

---

### Loading States

**Initial Page Load:**
- **Visual:** Skeleton placeholders (not spinners)
  - 3-4 card skeletons with animated shimmer (subtle gray pulse)
  - Unread count shows "—" placeholder
  - Header and navigation load immediately (static content)
- **Duration:** Expected <500ms (optimistic for fast networks)
- **Fallback:** If >2 seconds, show "Loading..." text (rare case)

**Card Expand (Timeline Load):**
- **Visual:** 2-3 event skeleton items appear immediately
- **Animation:** Shimmer effect during load (subtle, not distracting)
- **Incremental:** Events appear as they load (not all-or-nothing)
- **No blocking:** User can collapse card during timeline load

**Side Panel Load:**
- **Visual:** Panel slides in immediately (200ms), content loads within
- **Skeleton:** Full issue/MR skeleton (title, metadata, comment placeholders)
- **Auto-scroll:** Happens after content loads, not during skeleton state

**Unread Count Load:**
- **Visual:** "—" placeholder during initial count calculation
- **Transition:** Fade-in when count available (100ms)
- **Updates:** Real-time updates after initial load (no re-loading state)

**Consistency Rules:**
1. Prefer skeleton UI over spinners (shows structure, less jarring)
2. Incremental loading > all-or-nothing (progressive enhancement)
3. No blocking interactions (user can navigate away during loads)
4. Optimistic UI: Assume fast networks, degrade gracefully if slow

**Accessibility:**
- Loading states announced via `aria-live="polite"` regions
- Screen reader: "Loading work items" during initial load
- Skeleton UI has semantic structure (not just visual divs)

**Mobile Considerations:**
- Same skeleton UI patterns (mobile users expect instant feedback)
- Network-aware: Could detect slow connections and show text fallbacks (future)

---

### Interaction Patterns

**Click Detection Zones:**
- **Card Body (Expand/Collapse):**
  - Entire card is clickable except exclusion zones
  - Exclusion: Mark Read button area
  - Cursor: Changes to pointer on hover
  - Visual feedback: Subtle hover highlight (future enhancement)

- **Mark Read Button:**
  - Precise click target (same dimensions as NEW badge)
  - Mobile: 44px minimum height with padding
  - Desktop: Hover shows button, click marks as read
  - Mobile: Tap badge area marks as read (no hover)

- **Card Title (Open Side Panel):**
  - Future enhancement (not MVP)
  - Will open side panel on click
  - Cursor: Changes to pointer
  - Visual: Underline on hover

**Hover States:**
- **Card Hover:**
  - Subtle background highlight (future, not MVP)
  - NEW → Mark Read transformation (200ms)
  - Cursor changes to pointer (expand affordance)

- **Button Hover:**
  - Mark Read: Lighter olive background (#9DAA5F → #a5b675)
  - Close (side panel): Gray background (#262626), lighter icon

- **Mobile (No Hover):**
  - No hover states on touch devices
  - Tap feedback via native browser highlighting

**Focus States:**
- **Keyboard Focus:**
  - 2px olive outline (#9DAA5F)
  - Offset: 2px outside element
  - Border-radius matches element
  - Visible on all interactive elements

- **Focus Order:**
  - Unread count → Card 1 → Mark Read → Card 2 → Mark Read → ... → Side panel (if open)
  - Logical tab order (top to bottom)
  - Focus trap in side panel (Tab cycles within panel)

**Scroll Behavior:**
- **List Scroll:**
  - Native browser scrolling (smooth on modern browsers)
  - No infinite scroll in MVP (pagination future)
  - Scroll position preserved on navigation back

- **Side Panel Auto-Scroll:**
  - JavaScript scrolls to newest content after panel opens
  - Smooth scroll animation (200ms)
  - User can override by scrolling during animation

**Consistency Rules:**
1. Click zones are large and forgiving (minimize precision requirements)
2. Hover states are subtle (not distracting during scan)
3. Focus indicators are always visible (keyboard accessibility)
4. Scroll behavior is predictable (native, standard)

**Accessibility:**
- All interactive elements keyboard accessible
- Focus indicators meet WCAG 2.1 (2px minimum, 3:1 contrast)
- Click zones meet touch target minimum (44px on mobile)
- Screen reader navigation follows logical order

**Mobile Considerations:**
- Touch targets minimum 44px (prevent fat-finger errors)
- 12px dead zone between NEW badge and expand zone
- No hover states (touch paradigm)
- Native touch feedback (browser highlighting)


______________________________________________________________________

## Responsive Design & Accessibility

### Responsive Strategy

**Desktop Strategy (≥1280px):**

**Screen Real Estate Usage:**
- Split-screen pattern: Work item list (40%) + side panel (60% at 600px width)
- Maximum content width: 1200px (prevents excessive line length)
- Centered layout with breathing room
- Dense information display (target users: mid-senior engineers comfortable with information-rich interfaces)

**Desktop-Specific Features:**
- Hover states: NEW → Mark Read button transformation, card hover highlights
- Side panel remains visible while list scrollable (parallel browsing)
- Keyboard shortcuts foundation (j/k navigation, x mark read - future enhancement)
- Multi-card visibility: 4-8 cards visible without scrolling

**Tablet Strategy (768px-1279px):**

**Layout Adaptations:**
- Side panel width reduced: 480px (narrower for tablet viewport)
- Single-column card list (maintains simplicity)
- Touch-optimized interactions: 44px minimum touch targets
- Hybrid input: Support both touch and mouse/trackpad

**Information Density:**
- Same density as desktop (target users prefer information-rich interfaces)
- Context signals remain visible in collapsed cards
- No functionality reduction (full feature parity with desktop)

**Gestures:**
- Native browser scrolling (no custom gestures in MVP)
- Tap to expand cards
- Tap NEW badge area to mark as read (no hover required)
- Swipe gestures: Future enhancement for mark-as-read actions

**Mobile Strategy (<768px):**

**Navigation Pattern:**
- Header with app branding (GitLab Insights)
- Navigation: Future enhancement (hamburger menu or bottom nav)
- MVP: Single view (Catch Up/Work Items list)

**Layout Collapse:**
- Side panel becomes full-screen overlay (slide-up from bottom, 200ms animation)
- Card padding reduced: 12px (tighter spacing for narrow viewport)
- Context signal badges wrap to multiple lines if needed
- Unread count indicator remains at top (sticky position)

**Critical Information (Mobile-First):**
- Work item title (bold if unread, normal if read)
- One-line activity summary
- Context signals: Repo, component (keywords may wrap or truncate)
- NEW badge / Mark Read button
- Unread count (always visible at top)

**Mobile-Specific Optimizations:**
- 12px dead zone between NEW badge and card body (prevents accidental Mark Read taps)
- Touch targets: 44px minimum (Mark Read button, Close button)
- Full-screen side panel (maximizes reading area)
- Native browser scroll momentum
- No hover states (touch paradigm)

**Progressive Enhancement:**
- Core functionality works on all devices (read marking, expand, side panel)
- Desktop enhancements layer on top (hover states, keyboard shortcuts)
- Mobile optimizations don't reduce feature set (full parity)

---

### Breakpoint Strategy

**Breakpoint Definitions:**

```css
/* Mobile First - Base Styles */
/* 320px - 767px: Mobile */
/* Default styles apply to mobile */

/* Tablet */
@media (min-width: 768px) {
  /* Side panel: 480px width */
  /* Touch targets remain 44px */
  /* Hybrid input support */
}

/* Desktop */
@media (min-width: 1280px) {
  /* Side panel: 600px width */
  /* Max content width: 1200px */
  /* Hover states enabled */
}

/* Large Desktop (optional) */
@media (min-width: 1680px) {
  /* Side panel: 600px (no change) */
  /* List max-width: 1200px (no change) */
  /* Prevents excessive spread on ultra-wide monitors */
}
```

**Breakpoint Strategy Decisions:**

**Mobile-First Approach:**
- Base styles written for mobile (320px viewport)
- Media queries progressively enhance for larger screens
- Ensures core functionality works on smallest devices first
- Aligns with target user behavior (desktop-primary, but mobile for quick checks)

**Standard vs. Custom Breakpoints:**
- Using standard breakpoints (768px, 1280px) for broad device compatibility
- Aligns with HeroUI/React Aria defaults (consistent with design system)
- Tested breakpoints (common across industry)

**Key Breakpoint Behaviors:**

| Breakpoint | Side Panel | Touch Targets | Hover States | Card Padding |
|------------|------------|---------------|--------------|--------------|
| Mobile (<768px) | Full-screen overlay | 44px minimum | None | 12px |
| Tablet (768-1279px) | 480px width | 44px minimum | Optional | 16px |
| Desktop (≥1280px) | 600px width | Standard | Yes | 16px |

**Responsive Component Behavior:**

**Collapsible Card:**
- Mobile: Reduced padding (12px), badges wrap, 12px dead zone
- Tablet: Standard padding (16px), badges inline if space
- Desktop: Standard padding (16px), hover states enabled

**Unread Count Indicator:**
- Mobile: Sticky at top, compact badge, shortened label if needed
- Tablet: Standard badge + label
- Desktop: Standard badge + label

**Activity Timeline:**
- Mobile: Full width within expanded card, scrollable
- Tablet: Same as mobile (no changes needed)
- Desktop: Same as mobile (consistent across devices)

**Side Panel:**
- Mobile: Full-screen overlay, slide-up from bottom
- Tablet: 480px width, slide-in from right
- Desktop: 600px width, slide-in from right

---

### Accessibility Strategy

**WCAG Compliance Level: Deferred**

Based on Taylor's guidance: "Don't worry about WCAG compliance, accessibility is not a concern at this point."

**Current Accessibility Status:**

Work Item Grouping inherits React Aria accessibility foundation from HeroUI, which provides:
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Focus management

**Deferred Accessibility Testing:**
- WCAG AA contrast ratio verification: Deferred
- Screen reader testing (VoiceOver, NVDA): Deferred
- Keyboard-only navigation testing: Deferred
- Automated accessibility scans (axe-core): Deferred

**Accessibility Considerations (Built-In, Not Tested):**

The following accessibility features are designed into components but not validated:

**Keyboard Navigation:**
- Tab order: Unread count → Cards → Mark Read buttons → Side panel (if open)
- Enter/Space: Toggle card expand, activate Mark Read button
- Escape: Close side panel (future)
- Focus indicators: 2px olive outline (#9DAA5F)

**Screen Reader Support:**
- ARIA labels on icon-only buttons (`aria-label="Close"`)
- ARIA live regions for state changes (`aria-live="polite"`)
- Semantic HTML: `<article>` for cards, `<ul>` for timeline
- Role attributes: `role="status"` for unread count, `role="list"` for timeline

**Touch Targets:**
- Mobile: 44px minimum (Mark Read button, Close button)
- Desktop: Standard sizes (sufficient for mouse precision)
- Dead zones: 12px between NEW badge and card body on mobile

**Color Contrast (Not Verified):**
- Unread cards: High contrast text (gray-50 on #2d2e2e background)
- Read cards: Reduced contrast (gray-300 on #2d2e2e background)
- Olive accent: #9DAA5F (not verified against WCAG standards)

**Focus Management:**
- Focus returns to next unread item after mark-as-read action
- Focus trap in side panel (Tab cycles within panel when open)
- Focus visible on all interactive elements

**Accessibility Launch Strategy:**

Pre-launch (when accessibility becomes a priority):
1. Run automated accessibility scans (axe-core in CI)
2. Manual keyboard navigation testing
3. Screen reader testing (VoiceOver minimum)
4. Contrast ratio verification and fixes
5. User testing with assistive technology users

---

### Testing Strategy

**Responsive Testing (Current Priority: Low)**

**Device Testing:**
- Desktop: Chrome, Firefox, Safari, Edge (macOS and Windows)
- Mobile: iOS Safari, Chrome Mobile (iPhone 12+, Android flagship)
- Tablet: iPad (Safari), Android tablet (Chrome)

**Testing Approach:**
- Browser DevTools responsive mode for rapid iteration
- Real device testing before launch (borrowed devices or device lab)
- Network throttling: Test on 3G/4G connections (mobile performance)

**Visual Regression Testing:**
- Deferred until design finalized
- Storybook snapshots for all component states when implemented

**Accessibility Testing (Deferred):**
- Automated: axe-core integration in CI pipeline (pre-launch)
- Manual: Keyboard navigation, screen reader testing (pre-launch)
- User testing: Include users with disabilities (pre-launch)

**Testing Priority:**
- Unit tests: Current priority (90%/85%/95% coverage targets defined)
- Responsive testing: Low priority (test during development as needed)
- Accessibility testing: Deferred until launch preparation
- Visual regression: Deferred until design finalized

---

### Implementation Guidelines

**Responsive Development:**

**CSS Approach:**
```css
/* Mobile-first base styles */
.work-item-card {
  padding: 12px;
  /* Mobile defaults */
}

/* Tablet and above */
@media (min-width: 768px) {
  .work-item-card {
    padding: 16px;
  }
}

/* Desktop hover states */
@media (min-width: 1280px) and (hover: hover) {
  .work-item-card:hover {
    /* Hover enhancements */
  }
}
```

**Relative Units:**
- Typography: Use rem (root em) for font sizes
- Spacing: Use existing spacing-* CSS variables (8px grid)
- Widths: Use max-width with px for content constraints, % for responsive containers
- Heights: Use auto or min-height (not fixed heights)

**Touch Target Guidelines:**
```css
/* Mobile touch targets */
@media (max-width: 767px) {
  .mark-read-button {
    min-height: 44px;
    padding: 12px 16px;
  }
  
  .close-button {
    min-width: 44px;
    min-height: 44px;
  }
}
```

**Image Optimization:**
- Not applicable (Work Item Grouping uses minimal images)
- Avatar images (future): Lazy load, srcset for retina displays

**Accessibility Development (Built-In, Not Validated):**

**Semantic HTML:**
```html
<article role="article" aria-label="Work item: [title]">
  <header>
    <h3>[Title]</h3>
    <button aria-label="Mark [title] as read">Mark Read</button>
  </header>
  <div class="timeline" role="list" aria-label="Activity timeline">
    <div role="listitem">[Event]</div>
  </div>
</article>
```

**ARIA Labels:**
- Icon-only buttons: `aria-label="Close"`, `aria-label="Mark [title] as read"`
- Live regions: `aria-live="polite"` for unread count, state changes
- Expanded state: `aria-expanded="true/false"` on collapsible cards

**Keyboard Navigation:**
```typescript
// React Aria useDisclosure handles expand/collapse keyboard events
const { isExpanded, toggleExpanded } = useDisclosure();

// Custom keyboard handlers for future enhancements
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    toggleExpanded();
  }
};
```

**Focus Management:**
```typescript
// Focus returns to next unread item after mark-as-read
const markAsReadAndFocus = (id: string) => {
  markAsRead(id);
  const nextUnread = findNextUnreadCard();
  if (nextUnread) {
    nextUnread.focus();
  }
};
```

**Performance Considerations:**

**Animation Performance:**
- Use GPU-accelerated properties: `transform`, `opacity`
- Avoid animating: `width`, `height`, `top`, `left`
- Grid-based collapse: `grid-template-rows: 0fr → 1fr`
- Will-change sparingly: `will-change: transform` on side panel only

**Mobile Performance:**
- Lazy load timeline events if >20 events (future optimization)
- Virtualization: Future enhancement if card list exceeds 100 items
- Debounce scroll handlers (if scroll-based features added)

**Network Performance:**
- Optimistic updates: UI responds immediately, syncs to backend
- Offline support: Future enhancement (service worker, local storage)
- Bundle size: Code splitting for side panel component (future)

