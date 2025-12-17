"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMediaQuery } from "./useMediaQuery";

/**
 * useScrollIntoViewRead - Mobile scroll-to-read hook
 *
 * Story 5.4: Mobile optimization for scroll-into-view marking
 *
 * Uses Intersection Observer to mark work items as read when:
 * - 50% of the card is visible in viewport
 * - Card has been visible for at least 2 seconds
 * - Only on mobile devices (<768px)
 *
 * @param itemId - The work item ID to potentially mark as read
 * @param isUnread - Whether the item is currently unread
 * @param onMarkAsRead - Callback to mark the item as read
 * @returns ref to attach to the element to observe
 */
export function useScrollIntoViewRead(
  itemId: string,
  isUnread: boolean,
  onMarkAsRead?: (itemId: string) => void
): React.RefObject<HTMLDivElement | null> {
  const elementRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;

      if (entry.isIntersecting && isUnread && onMarkAsRead) {
        // Start 2-second timer when 50%+ visible
        if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(() => {
            onMarkAsRead(itemId);
            timeoutRef.current = null;
          }, 2000);
        }
      } else {
        // Clear timer if no longer visible enough
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    },
    [itemId, isUnread, onMarkAsRead]
  );

  useEffect(() => {
    // Only enable on mobile
    if (!isMobile || !isUnread || !onMarkAsRead) {
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.5, // 50% visibility
      rootMargin: "0px",
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isMobile, isUnread, onMarkAsRead, handleIntersection]);

  return elementRef;
}
