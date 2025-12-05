"use client";

import { useEffect, useCallback } from "react";
import { useShortcuts } from "./ShortcutContext";

/**
 * Checks if the event target is an input element where typing should be allowed.
 * Returns true for INPUT, TEXTAREA, and contenteditable elements.
 */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA") {
    return true;
  }

  // Check for contenteditable elements (future-proofing for rich text editors)
  if (target.isContentEditable) {
    return true;
  }

  return false;
}

/**
 * Global keyboard shortcut handler component.
 * Listens for keyboard events at the document level and routes them to
 * registered handlers via ShortcutContext.
 *
 * Context-aware: suppresses shortcuts when user is typing in input fields,
 * except for Escape which always fires.
 */
export function ShortcutHandler() {
  const {
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
  } = useShortcuts();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isTyping = isTypingTarget(event.target);

      // Escape always fires, even when typing
      if (event.key === "Escape") {
        clearFocusAndModals();
        return;
      }

      // Suppress all other shortcuts when typing
      if (isTyping) {
        return;
      }

      // Route shortcuts when not typing
      switch (event.key) {
        case "/":
          event.preventDefault(); // Prevent Quick Find in Firefox
          focusSearch();
          break;
        case "j":
          moveSelectionDown();
          break;
        case "k":
          moveSelectionUp();
          break;
        case "d":
          if (event.ctrlKey) {
            event.preventDefault(); // Prevent browser bookmark dialog
            jumpHalfPageDown();
          }
          break;
        case "u":
          if (event.ctrlKey) {
            event.preventDefault(); // Prevent view source
            jumpHalfPageUp();
          }
          break;
        // Story 2.8.5 (AC 2.8.5.4): 's' key opens save query modal
        case "s":
          openSaveModal();
          break;
        // Story 3.2 (AC 3.2.1, 3.2.4, 3.2.9): 'c' key toggles Catch-Up Mode
        case "c":
          toggleCatchUpMode();
          break;
        // Story 3.7 (AC 3.7.1): 'r' key triggers manual refresh
        case "r":
          triggerManualRefresh();
          break;
        // Story 2.8 (AC 2.8.4): Number keys 1-9 navigate to query by position
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          // Convert key to 0-based index (key "1" = index 0)
          navigateToQuery(parseInt(event.key) - 1);
          break;
      }
    },
    [focusSearch, moveSelectionDown, moveSelectionUp, jumpHalfPageDown, jumpHalfPageUp, clearFocusAndModals, navigateToQuery, openSaveModal, toggleCatchUpMode, triggerManualRefresh],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // This component doesn't render anything
  return null;
}
