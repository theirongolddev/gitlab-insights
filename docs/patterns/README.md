# Implementation Patterns

This directory contains detailed implementation guides for common patterns used in the GitLab Insights application.

## Available Patterns

### [Split View Pattern](./split-view-pattern.md)
**Epic 4 | Stories 4.1, 4.2, 4.3**

Implementation guide for the split pane layout pattern that displays list and detail views. Includes the `useEventDetailPane` custom hook for reusable split view functionality.

**Use this pattern when:**
- You need to show a list of items with detail view
- You want consistent mobile/desktop behavior
- You need URL synchronization and deep linking
- You want to persist last selected item

**Key Components:**
- `useEventDetailPane` hook
- `SplitView` component
- `DetailPaneContext`
- `EventDetail` component

---

## Pattern Categories

### State Management Patterns
- Split View Pattern (custom hook)

### UI Component Patterns
- Two-Line Row Layout (see architecture.md)
- Progressive Disclosure (see architecture.md)

### Data Flow Patterns
- See [architecture.md](../architecture.md) for data flow patterns

---

## Adding New Patterns

When you create a new reusable pattern:

1. **Create a detailed guide** in this directory
2. **Update this README** with a link and description
3. **Update architecture.md** if it's an architectural pattern
4. **Reference from relevant stories** in sprint artifacts

### Pattern Guide Template

```markdown
# Pattern Name - Implementation Guide

**Last Updated:** YYYY-MM-DD
**Epic/Story:** Reference
**Component/Hook:** Path to code

## Overview
Brief description of what the pattern solves

## Quick Start
Minimal example to get started

## Real-World Examples
2-3 examples from the codebase

## API Reference
Detailed API documentation

## How It Works
Technical explanation

## Testing Checklist
What to test when using the pattern

## Common Pitfalls
What not to do

## Related Documentation
Links to related docs
```

---

## Pattern Review Process

Before adding a pattern to this directory, ensure:

- [ ] Pattern is used in 2+ places in the codebase
- [ ] Pattern has been validated through code review
- [ ] Pattern has clear benefits over alternatives
- [ ] Pattern includes working examples
- [ ] Pattern includes testing guidance
- [ ] Pattern is documented with proper TypeScript types

---

**Maintained by:** BMad Method v6
**Last Updated:** 2025-12-08
