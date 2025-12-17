# Work Item Grouping - User Guide

## Overview

The Catch-Up view groups related GitLab activity around top-level work items (Issues and Merge Requests), letting you quickly triage what needs your attention.

## Accessing the Catch-Up View

Navigate to `/catch-up` or click the catch-up icon in the header to see your grouped work items.

## Understanding Work Items

### Card Layout

Each work item card displays:
- **Type badge**: Green "I" for Issues, purple "MR" for Merge Requests
- **Title**: The issue or MR title
- **Description preview**: First few lines of the body
- **Repository**: Which project this belongs to
- **Labels**: GitLab labels like `bug`, `priority::low`
- **Author**: Who created the work item
- **Timestamp**: When it was created or last updated
- **NEW badge**: Indicates unread items with new activity

### Read/Unread Status

Items are highlighted with a green left border when unread. Read items appear faded.

## Three Ways to Mark Items as Read

### 1. Click the Card
Clicking anywhere on a card opens the detail pane and marks the item as read.

### 2. Hover the NEW Badge (Desktop)
On desktop, hover over the "NEW" badge - it transforms into a "Mark Read" button. Click to mark read without opening details.

### 3. Mark All as Read
Click the "Mark all as read" button above the list to mark all visible items in the current tab as read.

## Using Tabs

Switch between **Issues** and **Merge Requests** tabs to filter by type. Each tab shows:
- Total count of items
- Count of new/unread items

## Expanding Cards

Click the expand arrow (v) on any card to see the activity timeline inline without opening the side panel. This shows:
- Recent comments and system notes
- New activity since your last view
- Participant avatars

## Detail Pane

Click a card to open the side panel showing:
- Full work item details
- Complete activity timeline
- Related work items (MRs that close this issue, issues closed by this MR)
- "Open in GitLab" link

## Mobile Tips

On mobile devices (<768px):
- **Touch targets**: Buttons are larger (44px minimum) for easy tapping
- **Full-screen panel**: Detail view opens as a full-screen overlay with slide-up animation
- **Scroll-to-read**: Items are automatically marked as read after being visible for 2 seconds while scrolling

## Keyboard Shortcuts

- `j` / `k`: Move selection down/up
- `Enter`: Open selected item in detail pane
- `d`: Toggle detail pane
- `/`: Focus search
- `r`: Refresh data
