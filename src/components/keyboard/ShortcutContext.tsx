"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";

/**
 * Configuration for a registered shortcut handler
 */
export interface ShortcutConfig {
  key: string;
  handler: () => void;
  description?: string;
}

/**
 * Map of scopeId to handler function
 * Key of `null` represents the global (unscoped) handler
 */
type ScopedHandlerMap = Map<string | null, () => void>;

/**
 * Context value interface for keyboard shortcut system
 *
 * Story 3.2: Added scoped handler support for j/k/Ctrl+d/Ctrl+u
 * - Scoped handlers are invoked only when their scopeId matches activeScope
 * - Global handlers (no scopeId) are used as fallback
 */
interface ShortcutContextValue {
  // Global-only handler setters
  setFocusSearch: (handler: () => void) => void;
  setClearFocusAndModals: (handler: () => void) => void;
  setNavigateToQuery: (handler: (index: number) => void) => void;
  setOpenSaveModal: (handler: () => void) => void;
  setToggleCatchUpMode: (handler: () => void) => void;

  // Scoped handler setters - optional scopeId for section-specific handlers
  setMoveSelectionDown: (handler: () => void, scopeId?: string) => void;
  setMoveSelectionUp: (handler: () => void, scopeId?: string) => void;
  setJumpHalfPageDown: (handler: () => void, scopeId?: string) => void;
  setJumpHalfPageUp: (handler: () => void, scopeId?: string) => void;

  // Unregister scoped handlers (for cleanup on unmount)
  unregisterMoveSelectionDown: (scopeId: string) => void;
  unregisterMoveSelectionUp: (scopeId: string) => void;
  unregisterJumpHalfPageDown: (scopeId: string) => void;
  unregisterJumpHalfPageUp: (scopeId: string) => void;

  // Scope management for Catch-Up Mode sections
  setActiveScope: (scopeId: string) => void;
  clearActiveScope: (scopeId: string) => void;

  // Direct invocation (for ShortcutHandler)
  focusSearch: () => void;
  moveSelectionDown: () => void;
  moveSelectionUp: () => void;
  jumpHalfPageDown: () => void;
  jumpHalfPageUp: () => void;
  clearFocusAndModals: () => void;
  navigateToQuery: (index: number) => void;
  openSaveModal: () => void;
  toggleCatchUpMode: () => void;
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

interface ShortcutProviderProps {
  children: ReactNode;
}

/**
 * Provider for the keyboard shortcut system.
 * Components can register handlers via setters and ShortcutHandler invokes them.
 */
export function ShortcutProvider({ children }: ShortcutProviderProps) {
  // Global-only handler refs
  const focusSearchRef = useRef<(() => void) | null>(null);
  const clearFocusAndModalsRef = useRef<(() => void) | null>(null);
  const navigateToQueryRef = useRef<((index: number) => void) | null>(null);
  const openSaveModalRef = useRef<(() => void) | null>(null);
  const toggleCatchUpModeRef = useRef<(() => void) | null>(null);

  // Scoped handler refs - Map of scopeId to handler (null key = global)
  const moveSelectionDownRef = useRef<ScopedHandlerMap>(new Map());
  const moveSelectionUpRef = useRef<ScopedHandlerMap>(new Map());
  const jumpHalfPageDownRef = useRef<ScopedHandlerMap>(new Map());
  const jumpHalfPageUpRef = useRef<ScopedHandlerMap>(new Map());

  // Active scope for scoped handlers (Story 3.2: Catch-Up Mode sections)
  const activeScopeRef = useRef<string | null>(null);

  // Global-only setter functions
  const setFocusSearch = useCallback((handler: () => void) => {
    focusSearchRef.current = handler;
  }, []);

  const setClearFocusAndModals = useCallback((handler: () => void) => {
    clearFocusAndModalsRef.current = handler;
  }, []);

  const setNavigateToQuery = useCallback((handler: (index: number) => void) => {
    navigateToQueryRef.current = handler;
  }, []);

  const setOpenSaveModal = useCallback((handler: () => void) => {
    openSaveModalRef.current = handler;
  }, []);

  const setToggleCatchUpMode = useCallback((handler: () => void) => {
    toggleCatchUpModeRef.current = handler;
  }, []);

  // Scoped setter functions - register handler with optional scopeId
  const setMoveSelectionDown = useCallback((handler: () => void, scopeId?: string) => {
    moveSelectionDownRef.current.set(scopeId ?? null, handler);
  }, []);

  const setMoveSelectionUp = useCallback((handler: () => void, scopeId?: string) => {
    moveSelectionUpRef.current.set(scopeId ?? null, handler);
  }, []);

  const setJumpHalfPageDown = useCallback((handler: () => void, scopeId?: string) => {
    jumpHalfPageDownRef.current.set(scopeId ?? null, handler);
  }, []);

  const setJumpHalfPageUp = useCallback((handler: () => void, scopeId?: string) => {
    jumpHalfPageUpRef.current.set(scopeId ?? null, handler);
  }, []);

  // Unregister scoped handlers (for cleanup on unmount)
  const unregisterMoveSelectionDown = useCallback((scopeId: string) => {
    moveSelectionDownRef.current.delete(scopeId);
  }, []);

  const unregisterMoveSelectionUp = useCallback((scopeId: string) => {
    moveSelectionUpRef.current.delete(scopeId);
  }, []);

  const unregisterJumpHalfPageDown = useCallback((scopeId: string) => {
    jumpHalfPageDownRef.current.delete(scopeId);
  }, []);

  const unregisterJumpHalfPageUp = useCallback((scopeId: string) => {
    jumpHalfPageUpRef.current.delete(scopeId);
  }, []);

  // Scope management for Catch-Up Mode sections
  const setActiveScope = useCallback((scopeId: string) => {
    activeScopeRef.current = scopeId;
  }, []);

  const clearActiveScope = useCallback((scopeId: string) => {
    if (activeScopeRef.current === scopeId) {
      activeScopeRef.current = null;
    }
  }, []);

  // Invocation functions that call the registered handlers
  const focusSearch = useCallback(() => {
    if (focusSearchRef.current) {
      focusSearchRef.current();
    } else if (process.env.NODE_ENV === "development") {
      console.debug("[Shortcuts] focusSearch() called - no handler registered");
    }
  }, []);

  // Scoped invokers - check activeScope first, fall back to global
  const moveSelectionDown = useCallback(() => {
    const handlers = moveSelectionDownRef.current;
    const scope = activeScopeRef.current;

    if (scope && handlers.has(scope)) {
      handlers.get(scope)!();
      return;
    }
    if (handlers.has(null)) {
      handlers.get(null)!();
      return;
    }
    if (process.env.NODE_ENV === "development") {
      console.debug("[Shortcuts] moveSelectionDown() - no handler registered (j key)");
    }
  }, []);

  const moveSelectionUp = useCallback(() => {
    const handlers = moveSelectionUpRef.current;
    const scope = activeScopeRef.current;

    if (scope && handlers.has(scope)) {
      handlers.get(scope)!();
      return;
    }
    if (handlers.has(null)) {
      handlers.get(null)!();
      return;
    }
    if (process.env.NODE_ENV === "development") {
      console.debug("[Shortcuts] moveSelectionUp() - no handler registered (k key)");
    }
  }, []);

  const jumpHalfPageDown = useCallback(() => {
    const handlers = jumpHalfPageDownRef.current;
    const scope = activeScopeRef.current;

    if (scope && handlers.has(scope)) {
      handlers.get(scope)!();
      return;
    }
    if (handlers.has(null)) {
      handlers.get(null)!();
      return;
    }
    if (process.env.NODE_ENV === "development") {
      console.debug("[Shortcuts] jumpHalfPageDown() - no handler registered (Ctrl+d)");
    }
  }, []);

  const jumpHalfPageUp = useCallback(() => {
    const handlers = jumpHalfPageUpRef.current;
    const scope = activeScopeRef.current;

    if (scope && handlers.has(scope)) {
      handlers.get(scope)!();
      return;
    }
    if (handlers.has(null)) {
      handlers.get(null)!();
      return;
    }
    if (process.env.NODE_ENV === "development") {
      console.debug("[Shortcuts] jumpHalfPageUp() - no handler registered (Ctrl+u)");
    }
  }, []);

  const clearFocusAndModals = useCallback(() => {
    if (clearFocusAndModalsRef.current) {
      clearFocusAndModalsRef.current();
    } else if (process.env.NODE_ENV === "development") {
      console.debug(
        "[Shortcuts] clearFocusAndModals() called - no handler registered",
      );
    }
  }, []);

  // Story 2.8: Invoke query navigation handler (AC 2.8.4)
  const navigateToQuery = useCallback((index: number) => {
    if (navigateToQueryRef.current) {
      navigateToQueryRef.current(index);
    } else if (process.env.NODE_ENV === "development") {
      console.debug(
        `[Shortcuts] navigateToQuery(${index}) called - no handler registered`,
      );
    }
  }, []);

  // Story 2.8.5: Invoke save modal handler (AC 2.8.5.4)
  const openSaveModal = useCallback(() => {
    if (openSaveModalRef.current) {
      openSaveModalRef.current();
    } else if (process.env.NODE_ENV === "development") {
      console.debug(
        "[Shortcuts] openSaveModal() called - no handler registered (s key)",
      );
    }
  }, []);

  // Story 3.2: Invoke Catch-Up Mode toggle handler (AC 3.2.1, 3.2.4)
  const toggleCatchUpMode = useCallback(() => {
    if (toggleCatchUpModeRef.current) {
      toggleCatchUpModeRef.current();
    } else if (process.env.NODE_ENV === "development") {
      console.debug(
        "[Shortcuts] toggleCatchUpMode() called - no handler registered (c key)",
      );
    }
  }, []);

  const value: ShortcutContextValue = {
    // Global-only setters
    setFocusSearch,
    setClearFocusAndModals,
    setNavigateToQuery,
    setOpenSaveModal,
    setToggleCatchUpMode,
    // Scoped setters
    setMoveSelectionDown,
    setMoveSelectionUp,
    setJumpHalfPageDown,
    setJumpHalfPageUp,
    // Scoped unregister functions
    unregisterMoveSelectionDown,
    unregisterMoveSelectionUp,
    unregisterJumpHalfPageDown,
    unregisterJumpHalfPageUp,
    // Scope management
    setActiveScope,
    clearActiveScope,
    // Invokers
    focusSearch,
    moveSelectionDown,
    moveSelectionUp,
    jumpHalfPageDown,
    jumpHalfPageUp,
    clearFocusAndModals,
    navigateToQuery,
    openSaveModal,
    toggleCatchUpMode,
  };

  return (
    <ShortcutContext.Provider value={value}>
      {children}
    </ShortcutContext.Provider>
  );
}

/**
 * Hook for components to access the shortcut system.
 * Use setters to register handlers, invocation functions are for ShortcutHandler.
 */
export function useShortcuts(): ShortcutContextValue {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error("useShortcuts must be used within a ShortcutProvider");
  }
  return context;
}
