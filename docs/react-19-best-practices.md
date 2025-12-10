# React 19 Best Practices Guide

**Created:** December 9, 2025  
**Author:** Elena (Junior Dev)  
**Epic:** Epic 4 - Split View & Detail Navigation  
**Purpose:** Prevent ESLint rework and share React 19 patterns across team  
**Status:** Living Document

---

## Overview

This guide documents React 19 patterns and ESLint rules encountered during Epic 4 implementation. These patterns prevent common bugs like stale closures, race conditions, and unnecessary re-renders.

**Key Principles:**
1. **Controlled Components > Semi-Controlled Components**
2. **Derived State (useMemo) > useState + useEffect Synchronization**
3. **useEffectEvent for Stable Callbacks (React 19)**
4. **No Synchronous setState in useEffect**

---

## Table of Contents

1. [Controlled vs Semi-Controlled Components](#controlled-vs-semi-controlled-components)
2. [Derived State with useMemo](#derived-state-with-usememo)
3. [useEffectEvent for Stable Callbacks](#useeffectevent-for-stable-callbacks)
4. [Common ESLint Violations and Fixes](#common-eslint-violations-and-fixes)
5. [Performance Patterns](#performance-patterns)

---

## Controlled vs Semi-Controlled Components

### When to Use Each

**Controlled Component (Recommended Default):**
- Parent owns all state
- Child is stateless (only receives props)
- No useState in child component
- Use when: Parent needs to control child behavior

**Semi-Controlled Component (Use Sparingly):**
- Child owns some internal state
- Receives initial value from props, then manages it independently
- Requires `useEffect` to sync prop changes
- Use when: Child has complex internal state parent doesn't need to know about

### Pattern: Controlled Component (From Story 4.3)

**✅ CORRECT - Controlled Component Pattern:**

```typescript
// Parent component owns state
function QueryDetailClient({ queryId }: Props) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  return (
    <EventTable
      selectedEventId={selectedEventId}
      onRowClick={(id) => setSelectedEventId(id)}
      events={events}
    />
  );
}

// Child component is stateless
function EventTable({ selectedEventId, onRowClick, events }: TableProps) {
  // No useState - receives state from parent
  const handleRowClick = (id: string) => {
    onRowClick(id); // Notify parent
  };
  
  // Use selectedEventId directly from props
  return (
    <Table>
      {events.map(event => (
        <Row
          key={event.id}
          selected={event.id === selectedEventId}
          onClick={() => handleRowClick(event.id)}
        />
      ))}
    </Table>
  );
}
```

**Benefits:**
- Single source of truth (parent state)
- No synchronization needed
- Easy to reason about data flow
- No ESLint violations

---

### Anti-Pattern: Semi-Controlled Component

**❌ WRONG - Semi-Controlled Component (Story 4.3 Initial Implementation):**

```typescript
// Child manages its own state AND receives prop
function EventTable({ defaultSelectedId, events }: TableProps) {
  const [selectedId, setSelectedId] = useState(defaultSelectedId);
  
  // ❌ ANTI-PATTERN: Synchronizing prop to state
  useEffect(() => {
    setSelectedId(defaultSelectedId);
  }, [defaultSelectedId]); // ESLint violation: react-hooks/set-state-in-effect
  
  // Now we have two sources of truth:
  // 1. defaultSelectedId (prop)
  // 2. selectedId (state)
  // Which one is correct?
}
```

**Problems:**
1. **ESLint Violation:** `react-hooks/set-state-in-effect` (synchronous setState in effect)
2. **Race Conditions:** Prop update and state update can conflict
3. **Stale State:** selectedId might be out of sync with defaultSelectedId
4. **Complexity:** Two sources of truth for same data

---

### When Semi-Controlled is Acceptable

**Use Case:** Complex internal state parent doesn't need

```typescript
// Accordion component with internal expanded state
function Accordion({ children }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Parent doesn't care about expanded state - child manages it
  const toggleSection = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  // This is acceptable - parent doesn't need to know about expanded state
}
```

**Rule of Thumb:** If parent needs to know about state, use controlled component.

---

## Derived State with useMemo

### Pattern: Derived State (From Story 4.3)

Instead of syncing props to state, **derive state from props**.

**✅ CORRECT - Derived State with useMemo:**

```typescript
function EventTable({ events, selectedEventId, onRowClick }: Props) {
  // Derive current selected event from props
  const selectedEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId) ?? null;
  }, [events, selectedEventId]);
  
  // Derive if detail pane should be open
  const isDetailPaneOpen = useMemo(() => {
    return selectedEventId !== null;
  }, [selectedEventId]);
  
  // No useState, no useEffect - state is derived from props
  return (
    <div>
      <Table selectedId={selectedEventId} onRowClick={onRowClick} />
      {isDetailPaneOpen && <DetailPane event={selectedEvent} />}
    </div>
  );
}
```

**Benefits:**
- No synchronization bugs
- State always up-to-date with props
- useMemo prevents unnecessary recalculations
- No ESLint violations

---

### Anti-Pattern: useState + useEffect Synchronization

**❌ WRONG - Syncing Props to State:**

```typescript
function EventTable({ selectedEventId, events }: Props) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // ❌ ANTI-PATTERN: Synchronizing derived state
  useEffect(() => {
    const event = events.find(e => e.id === selectedEventId);
    setSelectedEvent(event ?? null);
  }, [events, selectedEventId]); // Race condition risk
  
  // selectedEvent is now one render behind selectedEventId
  // This causes flickering and stale data bugs
}
```

**Problems:**
1. **Stale Data:** selectedEvent is always one render behind
2. **Unnecessary Renders:** setState triggers extra render
3. **Race Conditions:** Multiple effects can conflict
4. **Complexity:** Hard to reason about state flow

---

## useEffectEvent for Stable Callbacks

React 19 introduces `useEffectEvent` to create stable callback references that always have access to latest props/state.

### Pattern: useEffectEvent (From Story 4.5)

**✅ CORRECT - useEffectEvent for Stable References:**

```typescript
import { useEffect, useEffectEvent } from 'react';

function useShortcutHandler(name: string, handler: () => void) {
  const { registerHandler } = useShortcuts();
  
  // useEffectEvent creates stable reference that always calls latest handler
  const stableHandler = useEffectEvent(handler);
  
  useEffect(() => {
    return registerHandler(name, stableHandler);
  }, [name, registerHandler]); // handler NOT in dependency array!
  
  // stableHandler always has access to latest props/state
  // No stale closures!
}

// Usage - no useCallback needed!
function MyComponent() {
  const [count, setCount] = useState(0);
  
  // ✅ This works perfectly - handler always has latest count
  useShortcutHandler('increment', () => {
    console.log('Current count:', count); // Always latest count!
    setCount(prev => prev + 1);
  });
}
```

**Benefits:**
- No stale closure bugs
- No useCallback needed
- Handler not in dependency array
- Always accesses latest props/state

---

### Anti-Pattern: useCallback with Stale Closures

**❌ WRONG - useCallback with Empty Deps:**

```typescript
function MyComponent() {
  const [count, setCount] = useState(0);
  const { registerHandler } = useShortcuts();
  
  // ❌ ANTI-PATTERN: Empty dependency array = stale closure
  const handleShortcut = useCallback(() => {
    console.log('Stale count:', count); // BUG: count is always 0!
    setCount(prev => prev + 1);
  }, []); // Empty deps = handler captures initial count (0)
  
  useEffect(() => {
    registerHandler('myShortcut', handleShortcut);
  }, [registerHandler, handleShortcut]);
  
  // handleShortcut is frozen with count=0
  // It will NEVER see updated count values
}
```

**❌ ALSO WRONG - useCallback with Full Deps:**

```typescript
// ❌ ANTI-PATTERN: Including count in deps causes re-registration
const handleShortcut = useCallback(() => {
  console.log('Current count:', count); // Now it's correct...
  setCount(prev => prev + 1);
}, [count]); // But handler re-registers on EVERY count change!

useEffect(() => {
  return registerHandler('myShortcut', handleShortcut);
}, [registerHandler, handleShortcut]); // Effect runs every time count changes

// This causes unnecessary event listener churn
// Handler unregisters and re-registers on every state update
```

**✅ CORRECT - useEffectEvent Avoids Both Problems:**

```typescript
import { useEffectEvent } from 'react';

const stableHandler = useEffectEvent(() => {
  console.log('Current count:', count); // Always latest count
  setCount(prev => prev + 1);
});

useEffect(() => {
  return registerHandler('myShortcut', stableHandler);
}, [registerHandler]); // Registers once, handler always has latest state

// Perfect: Registers once, always has latest state, no re-registration
```

---

## Common ESLint Violations and Fixes

### 1. react-hooks/set-state-in-effect

**❌ VIOLATION:**

```typescript
useEffect(() => {
  setState(someValue); // Synchronous setState in effect
}, [someValue]);
```

**✅ FIX 1 - Use Derived State:**

```typescript
// Don't use useEffect at all - derive state
const derivedValue = useMemo(() => computeValue(props), [props]);
```

**✅ FIX 2 - Use Asynchronous Side Effect:**

```typescript
useEffect(() => {
  // Only acceptable for async side effects
  fetchData().then(data => setState(data));
}, []);
```

**When This Violation Occurred (Epic 4):**
- Story 4.1: useMediaQuery hook syncing MediaQueryList changes to state
- Story 4.3: EventTable syncing selectedEventId prop to state

**Fixes Applied:**
- Story 4.1: Refactored useMediaQuery to use event listener without setState in effect
- Story 4.3: Removed useState entirely, used controlled component pattern

---

### 2. react-hooks/exhaustive-deps

**❌ VIOLATION:**

```typescript
useEffect(() => {
  doSomething(value);
}, []); // Missing 'value' in dependency array
```

**✅ FIX 1 - Add Missing Dependencies:**

```typescript
useEffect(() => {
  doSomething(value);
}, [value]); // Now effect re-runs when value changes
```

**✅ FIX 2 - Use useEffectEvent (React 19):**

```typescript
const handleEffect = useEffectEvent(() => {
  doSomething(value); // Always has latest value
});

useEffect(() => {
  handleEffect();
}, []); // Empty deps OK - useEffectEvent captures latest value
```

---

### 3. react/no-unstable-nested-components

**❌ VIOLATION:**

```typescript
function Parent() {
  // ❌ Component defined inside render function
  function Child() {
    return <div>I get recreated every render!</div>;
  }
  
  return <Child />;
}
```

**✅ FIX - Define Component Outside:**

```typescript
// ✅ Component defined outside render function
function Child() {
  return <div>I'm stable across renders</div>;
}

function Parent() {
  return <Child />;
}
```

---

### 4. Unsafe setState in Cleanup Function

**❌ VIOLATION:**

```typescript
useEffect(() => {
  return () => {
    setState(false); // setState in cleanup = memory leak
  };
}, []);
```

**✅ FIX - Use Ref for Cleanup:**

```typescript
const isMountedRef = useRef(true);

useEffect(() => {
  fetchData().then(data => {
    if (isMountedRef.current) {
      setState(data);
    }
  });
  
  return () => {
    isMountedRef.current = false; // Just flag, no setState
  };
}, []);
```

---

## Performance Patterns

### 1. Debounced Visual State Pattern (Story 4.3)

**Problem:** Network calls on every keypress = lag

**Solution:** Instant visual updates, debounced side effects

```typescript
function SearchInput() {
  const [localValue, setLocalValue] = useState('');
  const debouncedValueRef = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const handleChange = (value: string) => {
    // 1. Instant visual update (no debounce)
    setLocalValue(value);
    
    // 2. Debounced side effect (network call)
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      debouncedValueRef.current = value;
      performSearch(value); // Only after 300ms idle
    }, 300);
  };
  
  // User sees instant feedback
  // Network calls only after typing stops
}
```

**Results (Story 4.3):**
- Before: 300-500ms lag on j/k navigation
- After: Instant visual updates, 10-20x performance improvement

---

### 2. useMemo for Expensive Calculations

**Use useMemo when:**
- Computation is expensive (>5ms)
- Result used in render or as dependency
- Inputs change infrequently

**✅ CORRECT Usage:**

```typescript
const filteredEvents = useMemo(() => {
  return events.filter(e => matchesKeywords(e, keywords));
}, [events, keywords]); // Only recompute when events or keywords change
```

**❌ DON'T Overuse:**

```typescript
// ❌ Unnecessary - this is fast enough without memoization
const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);

// ✅ Just do it inline
const fullName = `${firstName} ${lastName}`;
```

---

### 3. useCallback for Event Handlers

**Use useCallback when:**
- Function passed to child component as prop
- Child component is memoized (React.memo)
- Function used in useEffect dependency array

**✅ CORRECT Usage:**

```typescript
const handleClick = useCallback((id: string) => {
  performAction(id);
}, []); // No dependencies = stable reference

return <MemoizedChild onClick={handleClick} />;
```

**❌ DON'T Overuse:**

```typescript
// ❌ Unnecessary if child not memoized
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);

return <RegularChild onClick={handleClick} />; // Child not memoized = no benefit
```

---

## Quick Reference Checklist

### Before Writing Component

- [ ] Is this controlled or semi-controlled? (Default: controlled)
- [ ] Can state be derived instead of stored? (Use useMemo)
- [ ] Do I need useEffect? (Often you don't!)

### Code Review Checklist

- [ ] No synchronous setState in useEffect
- [ ] No prop-to-state synchronization (use controlled component)
- [ ] All useEffect dependencies included (or use useEffectEvent)
- [ ] No components defined inside render functions
- [ ] useMemo/useCallback only where needed (don't overuse)

### When ESLint Complains

1. **Read the error message carefully** (it usually explains the problem)
2. **Check this guide** for pattern examples
3. **Ask yourself:** "Can I avoid this useEffect entirely?"
4. **Consider:** Derived state, controlled component, or useEffectEvent

---

## Examples from Epic 4 Stories

### Story 4.1: useMediaQuery Hook Refactoring

**Problem:** ESLint violation `react-hooks/set-state-in-effect`

**Before:**

```typescript
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches); // ❌ Synchronous setState in effect
    
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };
    
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, [query]);
  
  return matches;
}
```

**After:**

```typescript
function useMediaQuery(query: string) {
  const getMatches = () => window.matchMedia(query).matches;
  const [matches, setMatches] = useState(getMatches);
  
  useEffect(() => {
    const mql = window.matchMedia(query);
    
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches); // ✅ Only async setState (event handler)
    };
    
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, [query]);
  
  return matches;
}
```

---

### Story 4.3: Controlled Component Refactoring

**Problem:** Semi-controlled component with prop-to-state sync

**Before:**

```typescript
function EventTable({ defaultSelectedId }: Props) {
  const [selectedId, setSelectedId] = useState(defaultSelectedId);
  
  useEffect(() => {
    setSelectedId(defaultSelectedId); // ❌ Syncing prop to state
  }, [defaultSelectedId]);
}
```

**After:**

```typescript
// Parent owns state
function QueryDetailClient({ queryId }: Props) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  return (
    <EventTable
      selectedEventId={selectedEventId} // ✅ Controlled
      onRowClick={setSelectedEventId}
    />
  );
}

// Child is stateless
function EventTable({ selectedEventId, onRowClick }: Props) {
  // No useState, no useEffect - just uses prop directly
  return <Table selectedId={selectedEventId} onClick={onRowClick} />;
}
```

---

## Additional Resources

**Official React Docs:**
- [React 19 Release Notes](https://react.dev/blog/2024/12/05/react-19)
- [useEffectEvent RFC](https://github.com/reactjs/rfcs/blob/main/text/0000-useevent.md)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

**Epic 4 Retrospective:**
- Action Item 2: React 19 Best Practices Guide (this document)
- Learnings: Controlled components > semi-controlled, useMemo for derived state

**Related Architecture Docs:**
- `docs/architecture.md` - ADR-008 (HeroUI Components), ADR-001 (Design Tokens)
- `docs/keyboard-handler-architecture.md` - useEffectEvent pattern in practice

---

**Document Status:** Complete ✅  
**Last Updated:** December 9, 2025  
**Next Review:** After Epic 5 (capture new React 19 patterns)
