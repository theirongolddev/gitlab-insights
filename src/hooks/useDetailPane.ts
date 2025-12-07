import { useState, useEffect } from 'react';

const STORAGE_KEY = 'gitlab-insights-split-view-open';

/**
 * Determines default open state based on screen size
 * - Desktop (≥1024px): OPEN by default
 * - Tablet/Mobile (<1024px): CLOSED by default
 */
function defaultOpenForScreenSize(): boolean {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= 1024;
}

/**
 * Custom hook for managing split pane detail view state
 *
 * Provides:
 * - localStorage persistence of user's preference
 * - Screen size-aware default (open on desktop, closed on tablet/mobile)
 * - Toggle functionality
 *
 * @returns Object with isOpen state and setIsOpen setter
 *
 * @example
 * const { isOpen, setIsOpen } = useDetailPane();
 * <Button onPress={() => setIsOpen(!isOpen)}>Toggle</Button>
 */
export function useDetailPane() {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;

    // Check localStorage first for user preference
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return JSON.parse(stored);
    }

    // Fall back to screen size default
    return defaultOpenForScreenSize();
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isOpen));
  }, [isOpen]);

  return { isOpen, setIsOpen };
}
