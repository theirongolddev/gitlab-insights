---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
lastStep: 11
inputDocuments:
  - docs/work-item-grouping-plan.md
  - docs/product-brief-gitlab-insights-2025-11-19.md
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 1
workflowType: 'prd'
lastStep: 0
project_name: 'gitlab-insights'
user_name: 'Taylor'
date: '2025-12-12'
---

# Product Requirements Document - gitlab-insights

**Author:** Taylor
**Date:** 2025-12-12

---

## Executive Summary

GitLab Insights currently provides a flat event feed where issues, MRs, and comments are displayed as independent chronological items. While this serves basic awareness, it creates a mental model mismatch - engineers think in terms of work items and their activity, not timelines. Users cannot easily answer questions like "show me all comments on Issue #123" or "which MR closed this issue?"

This PRD defines an evolution that transforms the flat feed into a hierarchical, work-item-centric view. The core change is capturing relationships at data ingest time (parent links, closes patterns, participants) and surfacing them through collapsible work item cards that group related activity under parent issues and MRs.

The result is a triage-optimized dashboard where engineers can scan work items with new activity, expand cards to see activity logs, and drill into the detail pane for full content - all while the system automatically tracks what's been reviewed without explicit marking overhead.

### What Makes This Special

**Relationship-first data model:** Unlike simple UI changes, this captures parent/child links, "closes #123" patterns, and cross-references during GitLab API sync. Relationships are stored, not computed on display.

**Noise reduction through hierarchy:** Comments grouped under parent work items, collapsed by default. Cards show activity summaries; detail pane shows full content. System notes visually distinguished from user comments.

**Zero-friction read tracking:** Viewing a work item marks it as read. No "mark as reviewed" buttons. New activity on previously-read items makes them unread again, floating to top.

**Triage-optimized defaults:** Dashboard shows open items only. Unread items sorted first. Closed/merged items accessible via search for historical research.

---

## Project Classification

**Technical Type:** web_app
**Domain:** general
**Complexity:** low
**Project Context:** Brownfield - extending existing gitlab-insights system

This is an internal web application evolution focused on improving the core dashboard experience. The existing polling-based architecture (Next.js, tRPC, Prisma, PostgreSQL) remains unchanged. The evolution adds relationship fields to the Event model, new tRPC endpoints for grouped queries, and new React components for work item cards and activity timelines.

The domain is general software engineering with standard security and performance requirements. No regulatory compliance, specialized protocols, or external integrations beyond the existing GitLab API.

---

## Success Criteria

Success is measured by users being able to triage work items without leaving the app, with clear visual hierarchy that makes relationships and read state immediately obvious.

### User Success

- **Primary measure:** Users can answer "what's happening with this work item?" in under 10 seconds without expanding or clicking
- **Triage autonomy:** Users can complete their daily triage without visiting GitLab directly - all necessary context is surfaced in the app
- **Read state clarity:** Users always know what they've seen vs what's new - no uncertainty about "did I already look at this?"
- **Visual hierarchy:** Users can instantly distinguish work items from activity, unread from read, and user comments from system notes

### Technical Success

- **Relationship accuracy:** 100% of parent/child relationships captured during sync match GitLab API responses (verifiable)
- **Read tracking correctness:** ReadEvent state machine works - viewing creates record, new activity clears it (binary pass/fail)
- **Performance baseline:** Grouped query response time does not regress more than 50% from current flat query baseline

---

## Product Scope

### MVP - Minimum Viable Product

**Phase 1: Data Model & Re-fetch**
- Update Prisma schema with relationship fields (parentEventId, closesIssueIds, participants, etc.)
- Clean slate migration - wipe Event data, apply new schema, refetch from GitLab
- Transformer captures relationships during import

**Phase 2: Enhanced Data Layer**
- New tRPC endpoints: getWorkItemsGrouped, getWorkItemWithActivity
- Queries return work items with activity summaries and unread counts

**Phase 3: New UI Components**
- WorkItemCard: Collapsible card with clear visual hierarchy
- WorkItemList: Grouped sections (Issues, MRs) with unread indicators
- ActivityTimeline: Full content in detail pane
- Visual distinction: work items vs activity, read vs unread, user vs system

**Phase 4: Read Tracking**
- ReadEvent model tracks what users have seen
- Unread items float to top
- Viewing marks as read, new activity marks as unread

### Growth Features (Post-MVP)

- Keyboard navigation (j/k)
- User preference toggle between grouped and flat views
- Virtual scrolling for 500+ items

### Vision (Future)

- Real-time updates via webhooks
- Cross-project relationship tracking
- Advanced filtering by relationship type

---

## User Journeys

### Journey 1: Morning Triage with the Grouped View

Taylor is a senior engineer who monitors several GitLab projects. Every morning, they open gitlab-insights to see what happened overnight. With the old flat view, this meant scrolling through 40+ events trying to mentally piece together which comments belonged to which issues - often missing important threads buried in the noise.

Now, Taylor opens the dashboard and sees 12 work items instead of 40 events. The Issues section shows 8 open issues, 3 marked with "NEW" badges. They scan the collapsed cards - each shows the issue title, status, and a one-liner: "3 new comments - Latest: Bob asked about the API timeout." Without clicking anything, Taylor knows Issue #123 needs attention.

They expand the card and see the activity log: Bob's question, Alice's response, a system note showing the status changed to "In Progress." The full picture in 5 seconds. Taylor clicks through to the detail pane for the complete comment text, then decides to jump to GitLab to respond. The item is now marked as read - tomorrow it won't have a NEW badge unless there's fresh activity.

Fifteen minutes later, Taylor has triaged all 12 work items and knows exactly what needs their attention today.

### Journey 2: Returning After a Long Weekend

Taylor took Friday off and comes back Monday to a backlog. With the old flat view, this was anxiety-inducing - 100+ events with no way to know what mattered.

Now, the dashboard shows 18 work items with activity. The unread items float to the top, sorted by most recent activity. Taylor works through them methodically - expand, scan activity log, decide if action needed, move on. Items they've seen sink to the bottom.

Three issues have been closed while Taylor was away. They don't clutter the main dashboard - Taylor can find them via search if needed. One MR that Taylor had been reviewing shows "merged" status with a green indicator. The "Closes: #145, #147" link shows which issues were resolved.

In 25 minutes, Taylor is fully caught up on 3 days of activity without the usual Monday morning dread.

### Journey 3: Investigating a Specific Issue

A teammate mentions in Slack: "Did you see the discussion on Issue #203? There's a debate about the caching approach." Taylor hasn't been following that issue.

Taylor searches for "#203" and the work item card appears. Even though it has 15 comments spanning two weeks, the grouped view makes it digestible. Taylor expands the card and sees the full activity log - the initial discussion, Alice's proposal, Bob's counterargument, the system notes showing label changes as the debate evolved.

Taylor clicks into the detail pane to read the full comment threads. The "Related Work" section shows MR !512 is linked - someone already started implementation. Taylor clicks the MR link, the detail pane updates with breadcrumb navigation showing "Issue #203 → MR !512", and they can see the proposed code changes.

In 3 minutes, Taylor has full context on a discussion they'd never seen before and can contribute meaningfully.

### Journey Requirements Summary

These journeys reveal the following capability requirements:

**From Journey 1 (Daily Triage):**
- Grouped work item cards with collapsed summaries
- NEW badges for unread activity
- Activity log within expanded cards
- Detail pane for full content
- Automatic read tracking on view

**From Journey 2 (Catch-up After Absence):**
- Unread items sorted to top
- Status indicators (open/closed/merged)
- Closed items excluded from main dashboard
- Relationship display ("Closes: #145, #147")
- Search for archived/closed items

**From Journey 3 (Deep Investigation):**
- Search that returns work item cards
- Full activity timeline in detail pane
- Related work section showing linked MRs/issues
- Breadcrumb navigation between related items
- Cross-reference display

---

## Web App Specific Requirements

### Project-Type Overview

This is a brownfield evolution of an existing Next.js single-page application. The core architecture (Next.js, tRPC, Prisma, PostgreSQL) remains unchanged. This section documents web app requirements specific to the work item grouping feature.

### Browser Support

- Chrome, Firefox, Safari, Edge (latest versions)
- No IE11 support required
- Internal tool - can require modern browser features

### Responsive Design

Mobile-responsive design required. The grouped card view must work across:
- Desktop (primary use case)
- Tablet (landscape and portrait)
- Mobile (for quick triage on the go)

Card components should collapse/expand gracefully at all breakpoints. Detail pane may convert to full-screen overlay on mobile.

### Performance Targets

Existing performance budget applies to new components:
- Page load: <500ms
- Search: <1s
- Card expand/collapse: immediate (<100ms perceived)
- Grouped queries: no more than 50% regression from flat queries

### Component Architecture

Follow modern React best practices:
- Functional components with hooks
- Server components where beneficial (Next.js App Router)
- Client components for interactive elements (cards, expand/collapse)
- Consistent with existing codebase patterns

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP - solve the core problem (flat view is unparsable) with the minimum features needed to make triage efficient.

**Resource Requirements:** Solo developer, brownfield project extending existing codebase.

**Scope Assessment:** Simple MVP with 4 sequential phases, each building on the previous.

### MVP Feature Set (All 4 Phases Required)

**Core User Journeys Supported:**
- Morning triage with grouped view
- Returning after absence (catch-up)
- Investigating specific issue (deep dive)

**Phase 1: Data Model & Re-fetch**
- Update Prisma schema with relationship fields
- Clean slate migration, refetch from GitLab
- Transformer captures relationships during import

**Phase 2: Enhanced Data Layer**
- getWorkItemsGrouped endpoint
- getWorkItemWithActivity endpoint
- Activity summaries and unread counts

**Phase 3: New UI Components**
- WorkItemCard with expand/collapse
- WorkItemList with grouped sections
- ActivityTimeline in detail pane
- Visual hierarchy (read/unread, user/system)

**Phase 4: Read Tracking**
- ReadEvent model
- Unread items float to top
- Viewing marks as read

### Post-MVP Features

**Growth (Post-MVP):**
- Keyboard navigation (j/k)
- User preference toggle (grouped vs flat)
- Virtual scrolling for 500+ items

**Vision (Future):**
- Real-time updates via webhooks
- Cross-project relationship tracking
- Advanced filtering by relationship type

### Risk Mitigation Strategy

**Technical Risks:**
- Grouped queries may be slower than flat queries. Mitigation: Performance baseline (50% max regression), index optimization.
- Relationship parsing may miss edge cases. Mitigation: 100% accuracy target with GitLab API comparison tests.

**Resource Risks:**
- Solo developer bandwidth. Mitigation: Sequential phases allow shipping incrementally if needed. Phases 1-2 could ship as backend-only milestone.

---

## Functional Requirements

### Data Model & Relationships

- FR1: System can store parent/child relationships between events (comments linked to parent issue/MR)
- FR2: System can store "closes" relationships between MRs and issues
- FR3: System can store cross-reference relationships between cards
- FR4: System can capture relationships during GitLab API sync
- FR5: System can store participant information for each card

### Card Display

- FR6: Users can view cards as collapsible elements
- FR7: Users can see card title, status, and activity summary without expanding
- FR8: Users can expand a card to see the activity log
- FR9: Users can see status indicators (open/closed/merged) on cards
- FR10: Users can see "Closes: #X, #Y" relationship links on MR cards
- FR11: Users can click through to GitLab from any card
- FR12: Users can see labels displayed on cards

### Activity Grouping

- FR13: Users can see comments grouped under their parent card
- FR14: Users can see activity logs showing chronological events within a card
- FR15: Users can distinguish user comments from system notes visually
- FR16: System can generate activity summaries showing: new comment count, participant count, and latest comment with author preview

### Read Tracking

- FR17: System can track which cards a user has viewed
- FR18: Users can see unread indicators (NEW badges) on cards with new activity
- FR19: System can mark cards as read when user hovers over them
- FR20: System can mark previously-read cards as unread when new activity occurs
- FR21: Users can see cards sorted by most recent activity, with cards containing unread content at the top
- FR22: Users can see unread indicators on both the card AND on individual activity rows within the expanded card
- FR23: Users can mark all cards in a section as reviewed via a button in the section header

### Navigation & Search

- FR24: Users can view cards grouped by type (Issues section, MRs section)
- FR25: Users can search for cards by number, title, or content
- FR26: Users can access closed/merged items via search
- FR27: Users can click relationship links in the detail pane to navigate to related cards
- FR28: When navigating to a related card, the detail pane content replaces with the linked card's content
- FR29: Detail pane header displays breadcrumb navigation tracking the user's navigation path
- FR30: Users can navigate back through breadcrumb to previously viewed cards
- FR31: Users can collapse/expand entire sections (Issues, MRs)

### Detail View

- FR32: Users can view full content of a card in a detail pane
- FR33: Users can see the complete activity timeline in the detail pane
- FR34: Users can see a "Related Work" section showing linked MRs/issues
- FR35: Detail pane can update to show different cards without full page reload
- FR36: Users can see loading feedback when the detail pane is loading content
- FR37: Users can navigate back from detail view to list view on mobile

### Dashboard Defaults

- FR38: Dashboard can show only open cards by default
- FR39: Dashboard can exclude closed/merged items from the main view
- FR40: Dashboard can be responsive across desktop, tablet, and mobile
- FR41: Users can toggle the dashboard to show closed/merged issues and MRs

### Empty States

- FR42: Users can see an empty state when no cards exist
- FR43: Users can see an empty state when all cards have been read
- FR44: Users can see an empty state when search returns no results
- FR45: Users can see an empty state when a card has no activity

### Data Processing

- FR46: System can process relationships when new data is synced from GitLab

---

## Non-Functional Requirements

Performance, responsiveness, and technical quality targets are defined in the Technical Success and Web App Specific Requirements sections above. No additional NFRs required for this brownfield evolution.
