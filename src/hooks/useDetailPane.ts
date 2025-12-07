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
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (error) {
      // localStorage unavailable (private browsing, etc.) - ignore and use default
      console.warn('localStorage not available:', error);
    }

    // Fall back to screen size default
    return defaultOpenForScreenSize();
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isOpen));
    } catch (error) {
      // localStorage unavailable - ignore (functionality degrades gracefully)
      console.warn('Failed to save detail pane state to localStorage:', error);
    }
  }, [isOpen]);

  // Dispatch custom event AFTER state changes (not during setState)
  // This prevents "Cannot update component while rendering" errors
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dispatch event to notify other component instances
    window.dispatchEvent(new CustomEvent('detailPaneChange', { detail: isOpen }));
  }, [isOpen]);

  // Sync state across components when localStorage changes (e.g., from Header toggle)
  // NOTE: Custom events are necessary because each useDetailPane() call creates its own useState.
  // Without sync mechanism, toggling in Header wouldn't update QueryDetailClient's state.
  // localStorage 'storage' events only fire in OTHER tabs/windows, not same-window changes.
  // Alternative: React Context (future refactor consideration).
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        try {
          setIsOpen(JSON.parse(e.newValue));
        } catch (error) {
          console.warn('Failed to parse storage event value:', error);
        }
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom event for same-page component sync
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      // Prevent infinite loop by only updating if value actually changed
      setIsOpen(prev => {
        if (prev === customEvent.detail) return prev;
        return customEvent.detail;
      });
    };

    window.addEventListener('detailPaneChange', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('detailPaneChange', handleCustomEvent);
    };
  }, []);

  return { isOpen, setIsOpen };
}
