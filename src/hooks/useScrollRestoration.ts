"use client";

/**
 * useScrollRestoration Hook
 *
 * Story 4.7: Scroll Position Persistence
 * AC 4.7.3: Restore scroll after navigation
 * AC 4.7.6: Use sessionStorage (not localStorage)
 * AC 4.7.7: Debounced scroll handler for performance
 *
 * Preserves scroll position across page navigations and detail pane toggles
 * using sessionStorage with per-query keys.
 */

import { useRef, useEffect, useMemo } from "react";

interface UseScrollRestorationReturn {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  isRestoring: () => boolean;
}

export function useScrollRestoration(key: string): UseScrollRestorationReturn {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isRestoringRef = useRef<boolean>(false);
  // Use ref to always access current key value in callbacks (avoids stale closure)
  const keyRef = useRef<string>(key);

  // Update keyRef in effect to avoid updating ref during render
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  // Restore scroll position on mount or key change
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let restoreTimeout: NodeJS.Timeout | undefined;

    const savedScrollY = sessionStorage.getItem(`scroll-${key}`);
    if (savedScrollY) {
      // Use requestAnimationFrame to ensure content is rendered before scrolling
      isRestoringRef.current = true;
      requestAnimationFrame(() => {
        container.scrollTop = parseInt(savedScrollY, 10);
        // Allow scrollIntoView after a brief delay
        restoreTimeout = setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      });
    } else {
      // AC4: Reset scroll to top when switching to different query with no saved value
      isRestoringRef.current = true;
      requestAnimationFrame(() => {
        container.scrollTop = 0;
        restoreTimeout = setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      });
    }

    return () => {
      if (restoreTimeout) {
        clearTimeout(restoreTimeout);
      }
    };
  }, [key]);

  // Cleanup timeout on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Debounced scroll handler to save position
  // Uses keyRef.current to always access the latest key value while keeping
  // the callback reference stable (empty deps array is intentional)
  const handleScroll = useMemo(() => {
    return (e: React.UIEvent<HTMLDivElement>) => {
      // Capture scrollTop immediately (React event pooling nulls currentTarget after handler)
      const scrollY = e.currentTarget.scrollTop;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        sessionStorage.setItem(`scroll-${keyRef.current}`, scrollY.toString());
      }, 100); // Debounce 100ms
    };
  }, []);

  return {
    scrollContainerRef,
    handleScroll,
    isRestoring: () => isRestoringRef.current
  };
}
