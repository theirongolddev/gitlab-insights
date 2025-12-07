"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

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
 * Detail Pane Context - Global split pane state management
 *
 * Provides:
 * - Split pane open/closed state
 * - localStorage persistence of user's preference
 * - Screen size-aware default (open on desktop, closed on tablet/mobile)
 * - Multi-tab synchronization via storage events
 */

interface DetailPaneContextValue {
  /** Whether detail pane is open */
  isOpen: boolean;
  /** Set detail pane open state */
  setIsOpen: (isOpen: boolean) => void;
}

const DetailPaneContext = createContext<DetailPaneContextValue | null>(null);

interface DetailPaneProviderProps {
  children: ReactNode;
}

/**
 * DetailPaneProvider - Manages split pane detail view state
 *
 * Provides:
 * - localStorage persistence of user's preference
 * - Screen size-aware default (open on desktop, closed on tablet/mobile)
 * - Shared state across all components (no custom events needed)
 */
export function DetailPaneProvider({ children }: DetailPaneProviderProps) {
  // Initialize from localStorage with screen-size fallback
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;

    // Check localStorage first for user preference
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (error) {
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
      console.warn('Failed to save detail pane state to localStorage:', error);
    }
  }, [isOpen]);

  // Sync across browser tabs via storage event
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

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <DetailPaneContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </DetailPaneContext.Provider>
  );
}

/**
 * useDetailPane hook - Access detail pane context
 *
 * @returns Object with isOpen state and setIsOpen setter
 * @throws Error if used outside DetailPaneProvider
 *
 * @example
 * const { isOpen, setIsOpen } = useDetailPane();
 * <Button onPress={() => setIsOpen(!isOpen)}>Toggle</Button>
 */
export function useDetailPane(): DetailPaneContextValue {
  const context = useContext(DetailPaneContext);

  if (!context) {
    throw new Error('useDetailPane must be used within DetailPaneProvider');
  }

  return context;
}
