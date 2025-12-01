# Story 2.9: Create Query Modal

Status: done

## Story

As a **user**,
I want **a modal to name and save my query**,
so that **I can create persistent queries from my search patterns**.

## Acceptance Criteria

**NOTE:** This story was merged into Story 2.8.5 during implementation.

The following acceptance criteria were implemented in Story 2.8.5:

1. Modal opens from "Save as query" button ✅
2. Query name input auto-focused on open ✅
3. Keyword filters displayed as read-only pills ✅
4. Save button creates query and closes modal ✅
5. Cancel/Esc closes modal without saving ✅
6. Success feedback displayed on save ✅
7. New query appears in sidebar immediately ✅

## Tasks / Subtasks

All tasks were completed as part of Story 2.8.5 - See [2-8-5-save-as-query-entry-points.md](./2-8-5-save-as-query-entry-points.md)

- [x] Task 1: Create CreateQueryModal Component (AC: All) - Completed in Story 2.8.5
  - [x] Created `src/components/queries/CreateQueryModal.tsx`
  - [x] Implemented React Aria Dialog/Modal/ModalOverlay pattern
  - [x] Added auto-focus name input
  - [x] Added keyword pills display
  - [x] Integrated Save/Cancel buttons
  - [x] Connected to queries.create mutation
  - [x] Added validation and error handling

- [x] Task 2: Integrate Modal into Header (AC: All) - Completed in Story 2.8.5
  - [x] Replaced prompt() with modal state management
  - [x] Added modal rendering in Header component
  - [x] Configured keyboard shortcut integration

## Dev Notes

### HeroUI Migration (Story 1.5.4 - 2025-12-01)

**CreateQueryModal migrated to HeroUI Button components**

**Migration Details:**
- Migrated Cancel button to HeroUI Button: `color="default"` `variant="flat"`
- Migrated Save button to HeroUI Button: `color="primary"` `isLoading={createQuery.isPending}`
- Updated all text and input colors to use design tokens
- Input focus ring uses olive theme: `ring-olive-light`
- Keyword pills use design tokens: `bg-olive-light/15`, `border-olive-light/50`, `text-olive`
- Preserved React Aria Modal/Dialog/ModalOverlay for accessibility and keyboard handling

**Technical Approach:**
- Hybrid pattern: HeroUI Buttons for actions + React Aria Modal/Dialog for structure
- React Aria provides focus trap, Esc handling, click-outside dismiss
- HeroUI Buttons provide consistent styling and loading states
- Validation error states use design tokens: `border-red-500`, `ring-red-500`

**Files Modified:**
- `src/components/queries/CreateQueryModal.tsx` - Migrated to HeroUI Button

**Validation:**
- ✅ TypeScript: No errors
- ✅ Build: Production build succeeds
- ✅ Keyboard: Tab navigation, Enter submits, Esc closes
- ✅ Visual: Olive focus rings and button colors render correctly
- ✅ Accessibility: WCAG 2.1 AA maintained

### Story Merge Decision

**Date:** 2025-11-26
**Reason:** Story 2.9 (Create Query Modal) was merged into Story 2.8.5 (Save as Query Entry Points) because the two stories are tightly coupled and implementing them separately would have created artificial dependencies.

**Rationale:**
- Story 2.8.5 creates the "Save as query" button that triggers the modal
- Story 2.9 was solely about implementing the modal that 2.8.5 calls
- Splitting these into separate stories would require 2.8.5 to use a temporary `prompt()` (which was the original approach before Party Mode review)
- Implementing together resulted in cleaner code and better user experience
- No additional scope was added - all work maps directly to original AC from both stories

### Implementation Summary

The CreateQueryModal component was fully implemented in Story 2.8.5 with the following features:

**Component Location:** `src/components/queries/CreateQueryModal.tsx`

**Key Features:**
- React Aria Dialog/Modal/ModalOverlay for accessibility
- Auto-focus on query name input
- Read-only keyword pills matching SearchBar styling
- Required field validation with error states
- Duplicate name detection
- Integration with queries.create mutation
- Automatic sidebar refresh on success
- Comprehensive error handling

**Architecture Pattern:**
```
SearchBar (Save button)
  → Header.tsx (modal state)
  → CreateQueryModal (Dialog component)
  → api.queries.create.mutate()
  → queries.list invalidation
  → Sidebar updates
```

### Files Created (in Story 2.8.5)

| File | Description |
|------|-------------|
| `src/components/queries/CreateQueryModal.tsx` | Full modal implementation with validation and error handling |

### Files Modified (in Story 2.8.5)

| File | Changes |
|------|---------|
| `src/components/layout/Header.tsx` | Added modal state and integration |
| `src/components/keyboard/ShortcutContext.tsx` | Added `s` keyboard shortcut support |
| `src/components/keyboard/ShortcutHandler.tsx` | Added `s` key handler routing |

### References

- **Primary Implementation:** [Story 2.8.5 - Save as Query Entry Points](./2-8-5-save-as-query-entry-points.md)
- **Epic Spec:** [Epic 2 Technical Specification](./tech-spec-epic-2.md)
- **Epic Story Breakdown:** [Epic 2 Story Breakdown](../epics/epic-2-user-controlled-queries-with-keyboard-foundation-story-breakdown.md#story-29-create-query-modal)
- **React Aria Dialog Documentation:** https://react-spectrum.adobe.com/react-aria/Dialog.html
- **React Aria Modal Documentation:** https://react-spectrum.adobe.com/react-aria/Modal.html

## Dev Agent Record

### Context Reference

N/A - Story merged into Story 2.8.5

### Agent Model Used

N/A - Documented as merged story

### Debug Log References

See Story 2.8.5 Dev Agent Record for full implementation details.

### Completion Notes List

- Story 2.9 was merged into Story 2.8.5 during implementation
- All acceptance criteria from Story 2.9 were fulfilled in Story 2.8.5
- CreateQueryModal component fully implemented and tested
- No additional work required for this story
- Sprint status should be updated to reflect merge

### File List

All files listed in Story 2.8.5 Dev Agent Record.

## Code Review

**Status:** ✅ APPROVED (as part of Story 2.8.5)

See Story 2.8.5 for complete code review.

## Change Log

**2025-11-26** - Story documented as merged into Story 2.8.5. All AC from original Story 2.9 specification were implemented and tested in Story 2.8.5. CreateQueryModal component created with full React Aria accessibility, validation, error handling, and keyboard shortcut integration. Status: done (merged).
