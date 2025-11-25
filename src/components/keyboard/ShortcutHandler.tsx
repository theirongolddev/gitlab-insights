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
    clearFocusAndModals,
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
      }
    },
    [focusSearch, moveSelectionDown, moveSelectionUp, clearFocusAndModals],
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
