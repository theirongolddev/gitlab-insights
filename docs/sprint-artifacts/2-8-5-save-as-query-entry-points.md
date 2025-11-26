# Story 2.8.5: Save as Query Entry Points

Status: ready-for-dev

## Story

As a **user exploring events through search**,
I want **to save my current search keywords via a proper modal dialog**,
so that **I can easily persist useful search patterns as saved queries for future use**.

## Acceptance Criteria

| AC ID | Criterion |
|-------|-----------|
| 2.8.5.1 | "Save" button in SearchBar enabled when keywords are active |
| 2.8.5.2 | Button disabled (visually distinct) when no keywords active |
| 2.8.5.3 | Clicking opens CreateQueryModal with keywords pre-filled |
| 2.8.5.4 | `s` keyboard shortcut triggers save modal (when not typing in input field) |

## Tasks / Subtasks

- [ ] Task 1: Create CreateQueryModal Component (AC: 2.8.5.3)
  - [ ] 1.1 Create `src/components/queries/CreateQueryModal.tsx` component
  - [ ] 1.2 Use React Aria `Dialog`, `Modal`, `ModalOverlay` components
  - [ ] 1.3 Props: `isOpen: boolean`, `onClose: () => void`, `keywords: string[]`
  - [ ] 1.4 Include query name text input with auto-focus on open
  - [ ] 1.5 Display keywords as read-only tag pills (reuse olive pill styling from SearchBar)
  - [ ] 1.6 Add Save and Cancel buttons (olive accent `bg-[#9DAA5F]` for Save)
  - [ ] 1.7 Call `api.queries.create.useMutation()` on Save with `{ name, filters: { keywords } }`
  - [ ] 1.8 On success: close modal, invalidate `queries.list`, show success feedback
  - [ ] 1.9 On error: display error message in modal
  - [ ] 1.10 Modal closes on Cancel click or Esc key (React Aria default)

- [ ] Task 2: Replace prompt() with Modal in Header.tsx (AC: 2.8.5.1, 2.8.5.2, 2.8.5.3)
  - [ ] 2.1 Add `isModalOpen` state to Header component
  - [ ] 2.2 Replace `handleSaveQuery` prompt() logic with `setIsModalOpen(true)`
  - [ ] 2.3 Render `CreateQueryModal` with `isOpen={isModalOpen}` and `onClose={() => setIsModalOpen(false)}`
  - [ ] 2.4 Pass `keywords` from SearchContext to modal
  - [ ] 2.5 Remove the existing `createQuery` mutation from Header (moved to modal)
  - [ ] 2.6 Verify existing SearchBar Save button still works (it calls `onSave` prop)

- [ ] Task 3: Add `s` Keyboard Shortcut (AC: 2.8.5.4)
  - [ ] 3.1 Add `setOpenSaveModal` setter and `openSaveModal` invoker to ShortcutContext.tsx
  - [ ] 3.2 Add `openSaveModalRef` useRef in ShortcutProvider
  - [ ] 3.3 Add `s` key case to ShortcutHandler.tsx switch statement
  - [ ] 3.4 Handler calls `openSaveModal()` (no isTyping check needed - already handled)
  - [ ] 3.5 In Header.tsx, register handler: `setOpenSaveModal(() => { if (keywords.length > 0) setIsModalOpen(true) })`
  - [ ] 3.6 Handler should check `keywords.length > 0` before opening (no-op if no keywords)

- [ ] Task 4: Testing and Validation (AC: All)
  - [ ] 4.1 Run `npm run build` to verify no compilation errors
  - [ ] 4.2 Run `npm run lint` to verify no linting errors
  - [ ] 4.3 Run `npm run typecheck` to verify no type errors
  - [ ] 4.4 Manual test: Add keywords, verify Save button in SearchBar is enabled
  - [ ] 4.5 Manual test: Clear all keywords, verify Save button is disabled
  - [ ] 4.6 Manual test: Click Save button, verify modal opens with keywords shown
  - [ ] 4.7 Manual test: Enter name, click Save, verify query appears in sidebar
  - [ ] 4.8 Manual test: Press `s` with active keywords, verify modal opens
  - [ ] 4.9 Manual test: Press `s` while typing in input, verify nothing happens
  - [ ] 4.10 Manual test: Press `s` with no keywords, verify nothing happens
  - [ ] 4.11 Manual test: Press Esc in modal, verify modal closes

## Dev Notes

### Architecture Correction (Party Mode 2025-11-26)

**IMPORTANT: Story 2.6 Architecture Change**

Story 2.6 redesigned the filter UI from a separate FilterBar component to an integrated tag-pill pattern within SearchBar. Key changes:

- **DELETED**: `src/components/filters/FilterBar.tsx`
- **DELETED**: `src/components/queries/SaveQueryButton.tsx`
- **INTEGRATED**: Save button now lives inside `SearchBar.tsx:282-299`
- **CHANGED**: From singular `keyword: string` to `keywords: string[]` array

The current save flow uses `prompt()` in `Header.tsx:34-43`. This story replaces that with a proper accessible modal.

[Source: docs/sprint-artifacts/2-6-filter-ui-logic.md#Architecture-Alignment]

### Current Codebase Reality

**Existing Save Flow:**
```
SearchBar.tsx (Save button)
  → calls onSave prop
  → Header.tsx handleSaveQuery()
  → prompt() for name
  → api.queries.create.mutate()
```

**New Save Flow (This Story):**
```
SearchBar.tsx (Save button)
  → calls onSave prop
  → Header.tsx setIsModalOpen(true)
  → CreateQueryModal renders
  → User enters name
  → Modal calls api.queries.create.mutate()
  → Modal closes, queries.list invalidated
```

### Learnings from Previous Stories

**From Story 2-6-filter-ui-logic (Status: done)**
- SearchContext uses `keywords: string[]` array (not singular keyword)
- Save button in SearchBar uses `data-[disabled]:opacity-50` for disabled state
- React Aria data attributes: `data-[focus-visible]`, `data-[hovered]`, `data-[pressed]`

**From Story 2-8-sidebar-navigation (Status: done)**
- ShortcutContext setter/invoker pattern: `setNavigateToQuery`/`navigateToQuery`
- Invalidate `queries.list` after create to update sidebar

**From Story 2-7a-create-query-backend (Status: done)**
- `queries.create` mutation accepts `{ name: string, filters: { keywords: string[] } }`
- Returns created query object with id

### Files to Create

| File | Description |
|------|-------------|
| `src/components/queries/CreateQueryModal.tsx` | Modal dialog for naming and saving query |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/Header.tsx` | Add modal state, replace prompt() with modal |
| `src/components/keyboard/ShortcutContext.tsx` | Add `setOpenSaveModal`/`openSaveModal` |
| `src/components/keyboard/ShortcutHandler.tsx` | Add `s` key handler |

### React Aria Modal Pattern

```typescript
import { Dialog, Modal, ModalOverlay, Heading } from 'react-aria-components';

<ModalOverlay
  isOpen={isOpen}
  onOpenChange={onClose}
  className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
>
  <Modal className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
    <Dialog className="outline-none">
      {({ close }) => (
        <>
          <Heading slot="title">Save Query</Heading>
          {/* Form content */}
        </>
      )}
    </Dialog>
  </Modal>
</ModalOverlay>
```

### Keyboard Shortcut Pattern

Follow existing pattern from `setNavigateToQuery`:

```typescript
// ShortcutContext.tsx - add to interface
setOpenSaveModal: (handler: () => void) => void;
openSaveModal: () => void;

// ShortcutContext.tsx - add ref and functions
const openSaveModalRef = useRef<(() => void) | null>(null);

const setOpenSaveModal = useCallback((handler: () => void) => {
  openSaveModalRef.current = handler;
}, []);

const openSaveModal = useCallback(() => {
  openSaveModalRef.current?.();
}, []);

// ShortcutHandler.tsx - add case
case 's':
  openSaveModal();
  break;
```

### Security Considerations

- Modal creates query via authenticated tRPC mutation (protectedProcedure)
- No XSS risk - query name is stored as text, not rendered as HTML
- Input validation: Query name validated by Zod schema (1-100 chars)

### Testing Standards

Per ADR-006 (Minimal Testing for MVP):
- Build, lint, typecheck validation (automated)
- Manual testing for UI interactions
- No unit tests required for MVP

### Story Dependencies

**Required Before This Story:**
- Story 2.4 (Search Bar UI) - SearchContext with keywords ✓
- Story 2.6 (Filter UI) - SearchBar with Save button ✓
- Story 2.7a (Create query backend) - queries.create mutation ✓
- Story 2.8 (Sidebar Navigation) - sidebar displays queries ✓

**Stories That Depend on This:**
- Story 2.9 (Create Query Modal) - MERGED into this story
- Story 2.10 (Edit/Delete Query Actions) - extends query management

### References

- [Story 2.6 - Filter UI (architecture source)](docs/sprint-artifacts/2-6-filter-ui-logic.md)
- [Story 2.7a - Create Query Backend](docs/sprint-artifacts/2-7a-create-query-backend.md)
- [Story 2.8 - Sidebar Navigation](docs/sprint-artifacts/2-8-sidebar-navigation.md)
- [React Aria Dialog](https://react-spectrum.adobe.com/react-aria/Dialog.html)
- [React Aria Modal](https://react-spectrum.adobe.com/react-aria/Modal.html)
- [Existing SearchBar](src/components/search/SearchBar.tsx)
- [Existing Header](src/components/layout/Header.tsx)
- [Existing ShortcutContext](src/components/keyboard/ShortcutContext.tsx)

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/2-8-5-save-as-query-entry-points.context.xml` - Regenerate after story update

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

**2025-11-26** - PARTY MODE REVIEW: Major story revision. Removed Task 1 (SaveQueryButton - already exists in SearchBar), removed Task 3 (FilterBar integration - FilterBar was deleted in Story 2.6). Updated all references from singular `keyword` to `keywords[]` array. Revised task list from 6 tasks to 4 tasks. Updated Dev Notes with correct architecture from Story 2.6. Reviewed by: Bob (SM), Winston (Architect), Amelia (Dev), John (PM), Mary (Analyst), Sally (UX). Status: ready-for-dev.

**2025-11-26** - Story created by create-story workflow. Status: drafted. Story 2.8.5 implements the "Save as Query" button and modal, enabling users to persist search patterns as saved queries. Builds on Story 2.8 sidebar navigation and Story 2.7a create query backend.
