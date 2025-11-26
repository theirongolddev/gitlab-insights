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
 * Context value interface for keyboard shortcut system
 */
interface ShortcutContextValue {
  // Handler setters - called by consuming components to register their handlers
  setFocusSearch: (handler: () => void) => void;
  setMoveSelectionDown: (handler: () => void) => void;
  setMoveSelectionUp: (handler: () => void) => void;
  setJumpHalfPageDown: (handler: () => void) => void;
  setJumpHalfPageUp: (handler: () => void) => void;
  setClearFocusAndModals: (handler: () => void) => void;
  // Story 2.8: Navigate to query by index (1-9 keys)
  setNavigateToQuery: (handler: (index: number) => void) => void;

  // Direct invocation (for ShortcutHandler)
  focusSearch: () => void;
  moveSelectionDown: () => void;
  moveSelectionUp: () => void;
  jumpHalfPageDown: () => void;
  jumpHalfPageUp: () => void;
  clearFocusAndModals: () => void;
  // Story 2.8: Navigate to query by index (AC 2.8.4)
  navigateToQuery: (index: number) => void;
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
  // Use refs for handlers to avoid re-renders when handlers change
  const focusSearchRef = useRef<(() => void) | null>(null);
  const moveSelectionDownRef = useRef<(() => void) | null>(null);
  const moveSelectionUpRef = useRef<(() => void) | null>(null);
  const jumpHalfPageDownRef = useRef<(() => void) | null>(null);
  const jumpHalfPageUpRef = useRef<(() => void) | null>(null);
  const clearFocusAndModalsRef = useRef<(() => void) | null>(null);
  // Story 2.8: Navigate to query by index
  const navigateToQueryRef = useRef<((index: number) => void) | null>(null);

  // Setter functions for components to register their handlers
  const setFocusSearch = useCallback((handler: () => void) => {
    focusSearchRef.current = handler;
  }, []);

  const setMoveSelectionDown = useCallback((handler: () => void) => {
    moveSelectionDownRef.current = handler;
  }, []);

  const setMoveSelectionUp = useCallback((handler: () => void) => {
    moveSelectionUpRef.current = handler;
  }, []);

  const setJumpHalfPageDown = useCallback((handler: () => void) => {
    jumpHalfPageDownRef.current = handler;
  }, []);

  const setJumpHalfPageUp = useCallback((handler: () => void) => {
    jumpHalfPageUpRef.current = handler;
  }, []);

  const setClearFocusAndModals = useCallback((handler: () => void) => {
    clearFocusAndModalsRef.current = handler;
  }, []);

  // Story 2.8: Setter for query navigation handler
  const setNavigateToQuery = useCallback((handler: (index: number) => void) => {
    navigateToQueryRef.current = handler;
  }, []);

  // Invocation functions that call the registered handlers
  const focusSearch = useCallback(() => {
    if (focusSearchRef.current) {
      focusSearchRef.current();
    } else if (process.env.NODE_ENV === "development") {
      console.debug("[Shortcuts] focusSearch() called - no handler registered");
    }
  }, []);

  const moveSelectionDown = useCallback(() => {
    if (moveSelectionDownRef.current) {
      moveSelectionDownRef.current();
    } else if (process.env.NODE_ENV === "development") {
      console.log(
        "[Shortcuts] moveSelectionDown() called - no handler registered (j key)",
      );
    }
  }, []);

  const moveSelectionUp = useCallback(() => {
    if (moveSelectionUpRef.current) {
      moveSelectionUpRef.current();
    } else if (process.env.NODE_ENV === "development") {
      console.debug(
        "[Shortcuts] moveSelectionUp() called - no handler registered (k key)",
      );
    }
  }, []);

  const jumpHalfPageDown = useCallback(() => {
    if (jumpHalfPageDownRef.current) {
      jumpHalfPageDownRef.current();
    } else if (process.env.NODE_ENV === "development") {
      console.debug(
        "[Shortcuts] jumpHalfPageDown() called - no handler registered (Ctrl+d)",
      );
    }
  }, []);

  const jumpHalfPageUp = useCallback(() => {
    if (jumpHalfPageUpRef.current) {
      jumpHalfPageUpRef.current();
    } else if (process.env.NODE_ENV === "development") {
      console.debug(
        "[Shortcuts] jumpHalfPageUp() called - no handler registered (Ctrl+u)",
      );
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

  const value: ShortcutContextValue = {
    setFocusSearch,
    setMoveSelectionDown,
    setMoveSelectionUp,
    setJumpHalfPageDown,
    setJumpHalfPageUp,
    setClearFocusAndModals,
    setNavigateToQuery,
    focusSearch,
    moveSelectionDown,
    moveSelectionUp,
    jumpHalfPageDown,
    jumpHalfPageUp,
    clearFocusAndModals,
    navigateToQuery,
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
