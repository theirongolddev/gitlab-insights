# Keyboard Handler Architecture

**Created:** December 9, 2025  
**Author:** Charlie (Senior Dev)  
**Epic:** Epic 4 - Split View & Detail Navigation  
**Related Stories:** Story 2.1 (Foundation), Story 4.5 (Bug Fixes)  
**Status:** Current (Epic 5 Ready)

---

## Overview

The keyboard handler system provides a centralized, context-aware architecture for registering and invoking keyboard shortcuts across the application. It consists of three main components:

1. **ShortcutContext** - Global state management for shortcut handlers
2. **ShortcutHandler** - Document-level key event listener and router
3. **useShortcutHandler** - Modern hook for component-level shortcut registration

**Key Features:**
- Context-aware (suppresses shortcuts when typing in input fields)
- Scoped handlers (Catch-Up Mode sections can override global handlers)
- Modern API using React 19's `useEffectEvent` for stable handler references
- Escape key always fires (even when typing)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Document Root                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              ShortcutProvider                           │ │
│  │  (Global state via ShortcutContext)                    │ │
│  │                                                         │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  ShortcutHandler (document.addEventListener)      │ │ │
│  │  │  - Listens for keydown at document level         │ │ │
│  │  │  - Routes keys to registered handlers            │ │ │
│  │  │  - Suppresses shortcuts when typing              │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                         │ │
│  │  Components register handlers via useShortcutHandler:  │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐   │ │
│  │  │   Header   │  │  Sidebar   │  │  EventTable    │   │ │
│  │  │  (/, Esc)  │  │  (1-9)     │  │  (j, k, d)     │   │ │
│  │  └────────────┘  └────────────┘  └────────────────┘   │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Active Keyboard Shortcuts

### Global Shortcuts (Registered in Epic 1-4)

| Key | Handler Name | Description | Registered By | Epic |
|-----|-------------|-------------|---------------|------|
| `/` | `focusSearch` | Focus search input | Header | 2 |
| `Esc` | `clearFocusAndModals` | Clear focus and close modals | Header | 2 |
| `j` | `moveSelectionDown` | Move selection down (global fallback) | EventTable | 2 |
| `k` | `moveSelectionUp` | Move selection up (global fallback) | EventTable | 2 |
| `Ctrl+d` | `jumpHalfPageDown` | Jump half page down (global fallback) | EventTable | 2 |
| `Ctrl+u` | `jumpHalfPageUp` | Jump half page up (global fallback) | EventTable | 2 |
| `1-9` | `navigateToQuery` | Navigate to query by sidebar position | QuerySidebar | 2 |
| `s` | `openSaveModal` | Open save query modal | Header | 2 |
| `c` | `toggleCatchUpMode` | Toggle catch-up mode | DashboardClient | 3 |
| `r` | `triggerManualRefresh` | Trigger manual refresh | (Future) | 3 |
| `d` | `toggleDetailPane` | Toggle detail pane (plain `d` key) | Header | 4 |

### Scoped Shortcuts (Catch-Up Mode)

**Scope IDs:**
- `catch-up-new-section` - New items section in Catch-Up Mode
- `catch-up-reviewed-section` - Reviewed items section in Catch-Up Mode
- `null` (default) - Global fallback when no scope active

**Scoped Handlers:**
- `j/k` within active Catch-Up Mode section → scoped table
- `j/k` outside Catch-Up Mode → global EventTable

**Scope Management:**
- `setActiveScope(scopeId)` - Sets active scope (called on section focus)
- `clearActiveScope(scopeId)` - Clears active scope if it matches current

---

## Epic 5 Integration Points

Epic 5 (Keyboard Foundation) will layer additional shortcuts onto the existing infrastructure. **No refactoring needed** - just register new handlers.

### Existing Infrastructure Epic 5 Can Use

✅ **`d` key already routed to `toggleDetailPane`** (ShortcutHandler.tsx:84)  
- Registered by Header component (Header.tsx)
- Calls DetailPaneContext's toggle function
- Ready for Epic 5 to use immediately

✅ **Section navigation functions ready** (Story 4.5)  
- `scrollToSection('title')`, `scrollToSection('body')`, `scrollToSection('metadata')`
- Defined in EventDetail.tsx:45-66
- Epic 5 can register `1`, `2`, `3` keys to call these functions

✅ **ShortcutContext supports parameterized handlers**  
- `navigateToQuery(index)` already uses this pattern
- Epic 5's `1/2/3` section navigation can follow same pattern

### Recommended Epic 5 Shortcuts

Based on Epic 5 spec and existing infrastructure:

| Key | Suggested Handler | Implementation |
|-----|------------------|----------------|
| `d` | Toggle detail pane | ✅ **Already implemented** (Story 4.1) |
| `1` | Jump to Title section | Register `scrollToSection('title')` |
| `2` | Jump to Body section | Register `scrollToSection('body')` |
| `3` | Jump to Details section | Register `scrollToSection('metadata')` |
| `o` | Open in GitLab | Register handler for external link navigation |
| `?` | Show help modal | New modal component needed |

### Integration Example for Epic 5

```typescript
// In EventDetail component (or wherever section navigation should work)
import { useShortcutHandler } from '~/hooks/useShortcutHandler';

// Register section navigation shortcuts
useShortcutHandler('jumpToTitle', () => scrollToSection('title'));
useShortcutHandler('jumpToBody', () => scrollToSection('body'));
useShortcutHandler('jumpToDetails', () => scrollToSection('metadata'));

// In ShortcutHandler.tsx, add key routing:
case '1':
  if (!isTyping) jumpToTitle();
  break;
case '2':
  if (!isTyping) jumpToBody();
  break;
case '3':
  if (!isTyping) jumpToDetails();
  break;
```

---

## Component Integration Patterns

### Modern Pattern (Recommended) - useShortcutHandler Hook

**Story 4.5** introduced `useShortcutHandler` hook to eliminate boilerplate and prevent closure bugs.

```typescript
import { useShortcutHandler } from '~/hooks/useShortcutHandler';

function MyComponent() {
  const [count, setCount] = useState(0);
  
  // ✅ CORRECT - useShortcutHandler handles stable references automatically
  useShortcutHandler('myAction', () => {
    // Always has access to latest count - no stale closures!
    console.log('Current count:', count);
    setCount(prev => prev + 1);
  });
  
  // No useEffect, no useCallback needed!
}
```

**Benefits:**
- Uses React 19's `useEffectEvent` for stable handler references
- Automatically cleans up on unmount
- No dependency array management
- Always has access to latest props/state

### Legacy Pattern (Deprecated) - Manual Registration

```typescript
import { useShortcuts } from '~/components/keyboard/ShortcutContext';

function MyComponent() {
  const { setMyAction } = useShortcuts();
  const [count, setCount] = useState(0);
  
  // ❌ ANTI-PATTERN - Manual useEffect + useCallback
  const handleAction = useCallback(() => {
    console.log('Stale count:', count); // BUG: count is stale!
    setCount(prev => prev + 1);
  }, []); // Empty deps = stale closure
  
  useEffect(() => {
    setMyAction(handleAction);
  }, [setMyAction, handleAction]); // Complex dependency management
}
```

**Why Deprecated:**
- Requires manual `useEffect` and `useCallback`
- Easy to introduce stale closure bugs
- Complex dependency array management
- More boilerplate code

---

## Story 4.5 Bug Fixes (9 Files Modified)

During Story 4.5 implementation, testing revealed 9 keyboard handler bugs across the codebase. These were fixed opportunistically to ensure keyboard foundation stability for Epic 5.

### Bug Fixes Applied

**1. Created useShortcutHandler Hook**
- **File:** `src/hooks/useShortcutHandler.ts` (NEW)
- **Issue:** Every component manually implementing `useEffect` + `useCallback` with stale closure bugs
- **Fix:** Centralized hook using React 19's `useEffectEvent` for stable references

**2. Migrated Components to useShortcutHandler**
- **Files Modified:**
  - `src/components/layout/Header.tsx`
  - `src/components/queries/QuerySidebar.tsx`
  - `src/components/dashboard/EventTable.tsx`
  - `src/components/dashboard/DashboardClient.tsx`
- **Issue:** Manual handler registration with complex dependency arrays
- **Fix:** Replaced manual `useEffect` + `useCallback` with `useShortcutHandler` hook

**3. Fixed ShortcutContext Handler Registration**
- **File:** `src/components/keyboard/ShortcutContext.tsx`
- **Issue:** `registerHandler` function didn't support modern name-based registration
- **Fix:** Added switch statement to map handler names to refs (lines 140-180)

**4. Added Detail Pane Toggle Support**
- **File:** `src/components/keyboard/ShortcutContext.tsx`
- **Issue:** `d` key not routed to detail pane toggle
- **Fix:** Added `toggleDetailPane` handler registration and invocation

**5. Updated ShortcutHandler Key Routing**
- **File:** `src/components/keyboard/ShortcutHandler.tsx`
- **Issue:** `d` key only handled `Ctrl+d` (half page down), not plain `d`
- **Fix:** Added plain `d` key case to route to `toggleDetailPane` (line 84)

### Files Modified Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/hooks/useShortcutHandler.ts` | **NEW** | Modern hook for shortcut registration |
| `src/components/keyboard/ShortcutContext.tsx` | Modified | Added `registerHandler` name mapping, `toggleDetailPane` support |
| `src/components/keyboard/ShortcutHandler.tsx` | Modified | Added plain `d` key routing to `toggleDetailPane` |
| `src/components/layout/Header.tsx` | Refactored | Migrated to `useShortcutHandler` hook |
| `src/components/queries/QuerySidebar.tsx` | Refactored | Migrated to `useShortcutHandler` hook |
| `src/components/dashboard/EventTable.tsx` | Refactored | Migrated to `useShortcutHandler` hook |
| `src/components/dashboard/DashboardClient.tsx` | Refactored | Migrated to `useShortcutHandler` hook |
| `src/hooks/useEventDetailPane.ts` | Modified | Updated to work with new handler pattern |
| `src/hooks/useManualRefresh.ts` | Modified | Updated to work with new handler pattern |

**Total:** 1 new file + 8 modified files + 4 documentation files updated

---

## Known Conflicts and Fragility

### Potential Conflicts for Epic 5

⚠️ **Number Keys (1-9)**
- Currently used for query navigation (Story 2.8)
- Epic 5 spec mentions `1/2/3` for section navigation
- **Conflict:** Number keys already claimed by QuerySidebar

**Resolution Strategy:**
- Use modifier keys for section navigation (e.g., `Alt+1`, `Alt+2`, `Alt+3`)
- OR scope section navigation to detail pane only (when detail pane has focus)
- OR use different keys for section navigation (e.g., `h/g/m` for header/body/metadata)

⚠️ **`d` Key Dual Purpose**
- Plain `d` → Toggle detail pane (Epic 4)
- `Ctrl+d` → Jump half page down (Epic 2)
- **Risk:** User confusion about `d` key behavior

**Mitigation:**
- Help modal (`?` key in Epic 5) should document both
- Visual keyboard hints should show plain `d` vs `Ctrl+d`

⚠️ **Scoped Handler Fragility**
- Catch-Up Mode uses `setActiveScope` to override global `j/k` handlers
- **Risk:** If scope isn't cleared on unmount, global handlers break

**Mitigation:**
- `useShortcutHandler` automatically cleans up on unmount
- Manual scope management (CatchUpView.tsx) uses `clearActiveScope` in cleanup

### Testing Recommendations for Epic 5

1. **Test all existing shortcuts still work** (/, j, k, 1-9, s, c, r, Esc, d)
2. **Test new shortcuts don't conflict** (verify number key behavior in different contexts)
3. **Test scoped handlers** (Catch-Up Mode `j/k` vs global `j/k`)
4. **Test typing suppression** (shortcuts don't fire when typing in search input)
5. **Test Escape always fires** (even when typing)

---

## Performance Characteristics

**Event Listener:**
- Single `keydown` listener at document level (ShortcutHandler.tsx:124)
- No per-component listeners (reduces memory footprint)
- Cleanup on unmount (no event listener leaks)

**Handler Invocation:**
- O(1) lookup via switch statement (ShortcutHandler.tsx:67-118)
- No array iteration or complex routing logic
- Handler refs updated via React context (no re-renders)

**Typing Detection:**
- `isTypingTarget()` checks tagName in O(1) (ShortcutHandler.tsx:10-26)
- Short-circuits most shortcuts when typing (prevents unnecessary handler calls)

**Memory:**
- Handler refs stored in Map for scoped handlers (efficient for sparse scopes)
- Global handlers use simple useRef (minimal overhead)

---

## Future Improvements (Post-Epic 5)

### Planned Enhancements

1. **Help Modal with Shortcut Reference** (Epic 5 Story)
   - `?` key shows categorized shortcut list
   - Context-aware (shows different shortcuts based on current page)

2. **Visual Keyboard Hints** (Epic 5 Story)
   - Buttons show keyboard shortcuts in tooltips or badges
   - Helps discoverability for new users

3. **Shortcut Customization** (Phase 2)
   - Allow users to rebind keys
   - Store custom bindings in user preferences

4. **Shortcut Recording** (Developer Tools)
   - Dev mode logs all shortcut invocations
   - Helps debugging handler registration issues

---

## References

**Source Files:**
- `src/components/keyboard/ShortcutContext.tsx` - Global state management
- `src/components/keyboard/ShortcutHandler.tsx` - Key event routing
- `src/hooks/useShortcutHandler.ts` - Modern registration hook

**Related Stories:**
- Story 2.1: Keyboard Shortcut System Foundation
- Story 4.5: Section Navigation with Clickable Headers (bug fixes)
- Epic 5: Keyboard Foundation (upcoming)

**Epic 4 Retrospective:**
- Action Item 1: Document keyboard handler architecture (this document)
- Findings: 9 keyboard handler bugs fixed during Story 4.5

---

**Document Status:** Complete ✅  
**Last Updated:** December 9, 2025  
**Next Review:** Epic 5 Kickoff
