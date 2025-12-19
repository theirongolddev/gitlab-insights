"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseInfiniteScrollOptions {
  /** Function to fetch the next page */
  fetchNextPage: () => void;
  /** Whether there are more pages to fetch */
  hasNextPage: boolean | undefined;
  /** Whether currently fetching the next page */
  isFetchingNextPage: boolean;
  /** Distance from bottom (in pixels) to trigger fetch, default 200 */
  threshold?: number;
}

/**
 * Find the nearest scrollable ancestor of an element
 */
function findScrollableAncestor(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element.parentElement;

  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;

    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      current.scrollHeight > current.clientHeight
    ) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

/**
 * Hook for infinite scroll using scroll events
 *
 * Attaches the returned sentinelRef to a div at the bottom of your list.
 * When the user scrolls near the bottom, fetchNextPage is called automatically.
 *
 * This hook finds the scrollable ancestor automatically, making it work
 * correctly with nested scroll containers.
 *
 * @example
 * const { sentinelRef } = useInfiniteScroll({
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * });
 *
 * return (
 *   <div className="overflow-y-auto">
 *     {items.map(item => <Item key={item.id} />)}
 *     <div ref={sentinelRef} />
 *   </div>
 * );
 */
export function useInfiniteScroll({
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  threshold = 200,
}: UseInfiniteScrollOptions): { sentinelRef: React.RefObject<HTMLDivElement | null> } {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasNextPage || isFetchingNextPage) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < threshold) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, threshold]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Find the scrollable ancestor
    const scrollContainer = findScrollableAncestor(sentinel);
    if (!scrollContainer) return;

    scrollContainerRef.current = scrollContainer;

    // Don't listen if no more pages
    if (!hasNextPage) return;

    // Check immediately in case we're already near the bottom
    handleScroll();

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll, hasNextPage]);

  return { sentinelRef };
}
