"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { logger } from "~/lib/logger";

/**
 * Valid shortcut handler names for type safety
 */
export type ShortcutHandlerName =
  | 'focusSearch'
  | 'clearFocusAndModals'
  | 'openSaveModal'
  | 'toggleCatchUpMode'
  | 'toggleFlatMode'
  | 'triggerManualRefresh'
  | 'toggleDetailPane'
  | 'openInGitLab'
  | 'scrollToSection'
  | 'navigateToQuery'
  | 'moveSelectionDown'
  | 'moveSelectionUp'
  | 'jumpHalfPageDown'
  | 'jumpHalfPageUp';

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
  // Modern registration API (useShortcutHandler hook)
  registerHandler: (name: ShortcutHandlerName, handler: () => void, scopeId?: string) => () => void;

  // Legacy: Global-only handler setters (deprecated, use registerHandler instead)
  setFocusSearch: (handler: () => void) => void;
  setClearFocusAndModals: (handler: () => void) => void;
  setNavigateToQuery: (handler: (index: number) => void) => void;
  setOpenSaveModal: (handler: () => void) => void;
  setToggleCatchUpMode: (handler: () => void) => void;
  setTriggerManualRefresh: (handler: () => void) => void;
  setToggleDetailPane: (handler: () => void) => void;
  setOpenInGitLab: (handler: () => void) => void;
  setScrollToSection: (handler: (sectionId: 'title' | 'body' | 'metadata') => void) => void;

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
  triggerManualRefresh: () => void;
  toggleDetailPane: () => void;
  openInGitLab: () => void;
  scrollToSection: (sectionId: 'title' | 'body' | 'metadata') => void;
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
  const triggerManualRefreshRef = useRef<(() => void) | null>(null);
  const toggleDetailPaneRef = useRef<(() => void) | null>(null);
  const openInGitLabRef = useRef<(() => void) | null>(null);
  const scrollToSectionRef = useRef<((sectionId: 'title' | 'body' | 'metadata') => void) | null>(null);

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

  const setTriggerManualRefresh = useCallback((handler: () => void) => {
    triggerManualRefreshRef.current = handler;
  }, []);

  const setToggleDetailPane = useCallback((handler: () => void) => {
    toggleDetailPaneRef.current = handler;
  }, []);

  const setOpenInGitLab = useCallback((handler: () => void) => {
    openInGitLabRef.current = handler;
  }, []);

  const setScrollToSection = useCallback((handler: (sectionId: 'title' | 'body' | 'metadata') => void) => {
    scrollToSectionRef.current = handler;
  }, []);

  // Modern registration API - name-based registration for useShortcutHandler hook
  const registerHandler = useCallback((
    name: string,
    handler: () => void,
    scopeId?: string
  ) => {
    // Map handler name to appropriate ref
    switch (name) {
      case 'focusSearch':
        focusSearchRef.current = handler;
        break;
      case 'clearFocusAndModals':
        clearFocusAndModalsRef.current = handler;
        break;
      case 'openSaveModal':
        openSaveModalRef.current = handler;
        break;
      case 'toggleCatchUpMode':
      case 'toggleFlatMode':
        toggleCatchUpModeRef.current = handler;
        break;
      case 'triggerManualRefresh':
        triggerManualRefreshRef.current = handler;
        break;
      case 'toggleDetailPane':
        toggleDetailPaneRef.current = handler;
        break;
      case 'openInGitLab':
        openInGitLabRef.current = handler;
        break;
      case 'scrollToSection':
        scrollToSectionRef.current = handler as (sectionId: 'title' | 'body' | 'metadata') => void;
        break;
      case 'navigateToQuery':
        navigateToQueryRef.current = handler as (index: number) => void;
        break;
      // Scoped handlers
      case 'moveSelectionDown':
        moveSelectionDownRef.current.set(scopeId ?? null, handler);
        break;
      case 'moveSelectionUp':
        moveSelectionUpRef.current.set(scopeId ?? null, handler);
        break;
      case 'jumpHalfPageDown':
        jumpHalfPageDownRef.current.set(scopeId ?? null, handler);
        break;
      case 'jumpHalfPageUp':
        jumpHalfPageUpRef.current.set(scopeId ?? null, handler);
        break;
      default:
        if (process.env.NODE_ENV === "development") {
          logger.warn(`[ShortcutContext] Unknown handler name: ${name}`);
        }
    }

    // Return cleanup function
    return () => {
      switch (name) {
        case 'focusSearch':
          focusSearchRef.current = null;
          break;
        case 'clearFocusAndModals':
          clearFocusAndModalsRef.current = null;
          break;
        case 'openSaveModal':
          openSaveModalRef.current = null;
          break;
        case 'toggleCatchUpMode':
        case 'toggleFlatMode':
          toggleCatchUpModeRef.current = null;
          break;
        case 'triggerManualRefresh':
          triggerManualRefreshRef.current = null;
          break;
        case 'toggleDetailPane':
          toggleDetailPaneRef.current = null;
          break;
        case 'openInGitLab':
          openInGitLabRef.current = null;
          break;
        case 'scrollToSection':
          scrollToSectionRef.current = null;
          break;
        case 'navigateToQuery':
          navigateToQueryRef.current = null;
          break;
        // Scoped handlers
        case 'moveSelectionDown':
          if (scopeId) moveSelectionDownRef.current.delete(scopeId);
          break;
        case 'moveSelectionUp':
          if (scopeId) moveSelectionUpRef.current.delete(scopeId);
          break;
        case 'jumpHalfPageDown':
          if (scopeId) jumpHalfPageDownRef.current.delete(scopeId);
          break;
        case 'jumpHalfPageUp':
          if (scopeId) jumpHalfPageUpRef.current.delete(scopeId);
          break;
      }
    };
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
      logger.debug("[Shortcuts] focusSearch() called - no handler registered");
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
      logger.debug("[Shortcuts] moveSelectionDown() - no handler registered (j key)");
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
      logger.debug("[Shortcuts] moveSelectionUp() - no handler registered (k key)");
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
      logger.debug("[Shortcuts] jumpHalfPageDown() - no handler registered (Ctrl+d)");
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
      logger.debug("[Shortcuts] jumpHalfPageUp() - no handler registered (Ctrl+u)");
    }
  }, []);

  const clearFocusAndModals = useCallback(() => {
    if (clearFocusAndModalsRef.current) {
      clearFocusAndModalsRef.current();
    } else if (process.env.NODE_ENV === "development") {
      logger.debug(
        "[Shortcuts] clearFocusAndModals() called - no handler registered",
      );
    }
  }, []);

  // Story 2.8: Invoke query navigation handler (AC 2.8.4)
  const navigateToQuery = useCallback((index: number) => {
    if (navigateToQueryRef.current) {
      navigateToQueryRef.current(index);
    } else if (process.env.NODE_ENV === "development") {
      logger.debug(
        `[Shortcuts] navigateToQuery(${index}) called - no handler registered`,
      );
    }
  }, []);

  // Story 2.8.5: Invoke save modal handler (AC 2.8.5.4)
  const openSaveModal = useCallback(() => {
    if (openSaveModalRef.current) {
      openSaveModalRef.current();
    } else if (process.env.NODE_ENV === "development") {
      logger.debug(
        "[Shortcuts] openSaveModal() called - no handler registered (s key)",
      );
    }
  }, []);

  // Story 3.2: Invoke Catch-Up Mode toggle handler (AC 3.2.1, 3.2.4)
  const toggleCatchUpMode = useCallback(() => {
    if (toggleCatchUpModeRef.current) {
      toggleCatchUpModeRef.current();
    } else if (process.env.NODE_ENV === "development") {
      logger.debug(
        "[Shortcuts] toggleCatchUpMode() called - no handler registered (c key)",
      );
    }
  }, []);

  // Story 3.7: Invoke manual refresh handler (AC 3.7.1)
  const triggerManualRefresh = useCallback(() => {
    if (triggerManualRefreshRef.current) {
      triggerManualRefreshRef.current();
    } else if (process.env.NODE_ENV === "development") {
      logger.debug(
        "[Shortcuts] triggerManualRefresh() called - no handler registered (r key)",
      );
    }
  }, []);

  // Epic 5: Invoke detail pane toggle handler (d key)
  const toggleDetailPane = useCallback(() => {
    if (toggleDetailPaneRef.current) {
      toggleDetailPaneRef.current();
    } else if (process.env.NODE_ENV === "development") {
      logger.debug(
        "[Shortcuts] toggleDetailPane() called - no handler registered (d key)",
      );
    }
  }, []);

  // Story 5.1: Invoke open in GitLab handler (o key)
  const openInGitLab = useCallback(() => {
    if (openInGitLabRef.current) {
      openInGitLabRef.current();
    } else if (process.env.NODE_ENV === "development") {
      logger.debug(
        "[Shortcuts] openInGitLab() called - no handler registered (o key)",
      );
    }
  }, []);

  // Story 5.1: Invoke scroll to section handler (1/2/3 keys)
  const scrollToSection = useCallback((sectionId: 'title' | 'body' | 'metadata') => {
    if (scrollToSectionRef.current) {
      scrollToSectionRef.current(sectionId);
    } else if (process.env.NODE_ENV === "development") {
      logger.debug(
        `[Shortcuts] scrollToSection(${sectionId}) called - no handler registered (1/2/3 keys)`,
      );
    }
  }, []);

  const value: ShortcutContextValue = {
    // Modern API
    registerHandler,
    // Legacy setters (deprecated)
    setFocusSearch,
    setClearFocusAndModals,
    setNavigateToQuery,
    setOpenSaveModal,
    setToggleCatchUpMode,
    setTriggerManualRefresh,
    setToggleDetailPane,
    setOpenInGitLab,
    setScrollToSection,
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
    triggerManualRefresh,
    toggleDetailPane,
    openInGitLab,
    scrollToSection,
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
