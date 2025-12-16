# React 19 Patterns

## Description
Best practices for React 19 development including controlled components, derived state, useEffectEvent, and common ESLint violations to avoid.

## When to use
- When building React components
- When encountering ESLint violations related to hooks
- When deciding between controlled vs semi-controlled components
- When managing component state and side effects
- When optimizing component performance

## Instructions

### Core Principles

1. **Controlled Components > Semi-Controlled Components**
   - Default to controlled components (parent owns state, child stateless)
   - Only use semi-controlled when child has complex internal state parent doesn't need

2. **Derived State with useMemo > useState + useEffect**
   - Prefer deriving state from props over synchronizing props to state
   - Prevents stale data and unnecessary re-renders

3. **useEffectEvent for Stable Callbacks (React 19)**
   - Use React 19's useEffectEvent for event handlers needing latest state
   - Eliminates stale closure bugs without re-registration

4. **No Synchronous setState in useEffect**
   - ESLint rule `react-hooks/set-state-in-effect` prevents race conditions
   - Only use async setState in effects (e.g., after network calls)

### Pattern: Controlled Component

**✅ CORRECT:**
```typescript
// Parent owns state
function ParentComponent({ data }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  return (
    <ChildComponent
      selectedId={selectedId}
      onSelect={setSelectedId}
      items={data}
    />
  );
}

// Child is stateless
function ChildComponent({ selectedId, onSelect, items }: Props) {
  // No useState - receives state from parent
  return (
    <div>
      {items.map(item => (
        <Item
          key={item.id}
          selected={item.id === selectedId}
          onClick={() => onSelect(item.id)}
        />
      ))}
    </div>
  );
}
```

**❌ WRONG - Semi-Controlled:**
```typescript
function ChildComponent({ defaultSelectedId, items }: Props) {
  const [selectedId, setSelectedId] = useState(defaultSelectedId);
  
  // ❌ ANTI-PATTERN: Synchronizing prop to state
  useEffect(() => {
    setSelectedId(defaultSelectedId);
  }, [defaultSelectedId]); // ESLint violation + race conditions
  
  // Two sources of truth = bugs
}
```

### Pattern: Derived State with useMemo

**✅ CORRECT:**
```typescript
function Component({ events, selectedEventId }: Props) {
  // Derive state from props
  const selectedEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId) ?? null;
  }, [events, selectedEventId]);
  
  const isDetailPaneOpen = useMemo(() => {
    return selectedEventId !== null;
  }, [selectedEventId]);
  
  // No useState, no useEffect - state derived from props
  return (
    <div>
      <Table selectedId={selectedEventId} />
      {isDetailPaneOpen && <DetailPane event={selectedEvent} />}
    </div>
  );
}
```

**❌ WRONG - Syncing Props to State:**
```typescript
function Component({ selectedEventId, events }: Props) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // ❌ ANTI-PATTERN: One render behind, unnecessary re-renders
  useEffect(() => {
    const event = events.find(e => e.id === selectedEventId);
    setSelectedEvent(event ?? null);
  }, [events, selectedEventId]);
}
```

### Pattern: useEffectEvent for Stable Callbacks

**✅ CORRECT:**
```typescript
import { useEffect, useEffectEvent } from 'react';

function useShortcutHandler(name: string, handler: () => void) {
  const { registerHandler } = useContext();
  
  // useEffectEvent creates stable reference with latest handler
  const stableHandler = useEffectEvent(handler);
  
  useEffect(() => {
    return registerHandler(name, stableHandler);
  }, [name, registerHandler]); // handler NOT in deps!
}

// Usage - no useCallback needed!
function MyComponent() {
  const [count, setCount] = useState(0);
  
  // ✅ Handler always has latest count
  useShortcutHandler('increment', () => {
    console.log('Current count:', count); // Always latest!
    setCount(prev => prev + 1);
  });
}
```

**❌ WRONG - Stale Closure:**
```typescript
function MyComponent() {
  const [count, setCount] = useState(0);
  
  // ❌ Empty deps = stale closure
  const handleShortcut = useCallback(() => {
    console.log('Stale count:', count); // BUG: always 0!
  }, []);
}
```

### Common ESLint Violations

**1. react-hooks/set-state-in-effect**

```typescript
// ❌ VIOLATION
useEffect(() => {
  setState(someValue); // Synchronous setState in effect
}, [someValue]);

// ✅ FIX - Use derived state
const derivedValue = useMemo(() => computeValue(props), [props]);
```

**2. react-hooks/exhaustive-deps**

```typescript
// ❌ VIOLATION
useEffect(() => {
  doSomething(value);
}, []); // Missing 'value' in deps

// ✅ FIX - Add dependencies OR use useEffectEvent
useEffect(() => {
  doSomething(value);
}, [value]);
```

**3. react/no-unstable-nested-components**

```typescript
// ❌ VIOLATION
function Parent() {
  function Child() { // Recreated every render!
    return <div>Content</div>;
  }
  return <Child />;
}

// ✅ FIX - Define outside
function Child() {
  return <div>Content</div>;
}

function Parent() {
  return <Child />;
}
```

### Performance Patterns

**Debounced Visual State (Instant UI + Delayed Side Effects):**

```typescript
function SearchInput() {
  const [localValue, setLocalValue] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const handleChange = (value: string) => {
    // 1. Instant visual update
    setLocalValue(value);
    
    // 2. Debounced side effect
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      performSearch(value); // Network call after 300ms idle
    }, 300);
  };
}
```

**useMemo for Expensive Calculations:**

```typescript
// ✅ Use when computation is expensive (>5ms)
const filteredData = useMemo(() => {
  return data.filter(item => expensiveCheck(item));
}, [data]);

// ❌ Don't overuse for simple operations
const fullName = useMemo(() => `${first} ${last}`, [first, last]); // Overkill
const fullName = `${first} ${last}`; // Just do it inline
```

**useCallback for Event Handlers:**

```typescript
// ✅ Use when passing to memoized children
const handleClick = useCallback((id: string) => {
  performAction(id);
}, []);

return <MemoizedChild onClick={handleClick} />;

// ❌ Don't use when child isn't memoized
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);

return <RegularChild onClick={handleClick} />; // No benefit
```

### Quick Checklist

**Before Writing Component:**
- [ ] Is this controlled or semi-controlled? (Default: controlled)
- [ ] Can state be derived instead of stored? (Use useMemo)
- [ ] Do I need useEffect? (Often you don't!)

**Code Review:**
- [ ] No synchronous setState in useEffect
- [ ] No prop-to-state synchronization
- [ ] All useEffect dependencies included (or use useEffectEvent)
- [ ] No components defined inside render functions
- [ ] useMemo/useCallback only where needed

**When ESLint Complains:**
1. Read the error message carefully
2. Ask: "Can I avoid this useEffect entirely?"
3. Consider: Derived state, controlled component, or useEffectEvent

## Examples

### Example 1: Refactoring Semi-Controlled to Controlled

**Before (ESLint violation):**
```typescript
function EventTable({ defaultSelectedId }: Props) {
  const [selectedId, setSelectedId] = useState(defaultSelectedId);
  
  useEffect(() => {
    setSelectedId(defaultSelectedId); // ❌
  }, [defaultSelectedId]);
}
```

**After (Controlled component):**
```typescript
// Parent
function QueryPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return <EventTable selectedId={selectedId} onSelect={setSelectedId} />;
}

// Child
function EventTable({ selectedId, onSelect }: Props) {
  return <Table selectedId={selectedId} onClick={onSelect} />;
}
```

### Example 2: useMediaQuery Hook Fix

**Before (ESLint violation):**
```typescript
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches); // ❌ Synchronous setState
    
    const listener = (e) => setMatches(e.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, [query]);
}
```

**After (Fixed):**
```typescript
function useMediaQuery(query: string) {
  const getMatches = () => window.matchMedia(query).matches;
  const [matches, setMatches] = useState(getMatches); // ✅ Initialize with function
  
  useEffect(() => {
    const mql = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches); // ✅ Only async setState
    
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, [query]);
}
```

## Related Skills
- TypeScript patterns
- Component composition
- Performance optimization
- Testing React components

## Tags
react, react-19, hooks, state-management, performance, eslint, best-practices
