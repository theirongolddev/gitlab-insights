import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDetailPane } from "~/contexts/DetailPaneContext";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import type { DashboardEvent } from "~/components/dashboard/ItemRow";

interface UseEventDetailPaneOptions {
  /**
   * Base URL path for the page (e.g., "/dashboard" or "/queries/:id")
   */
  baseUrl: string;

  /**
   * Optional localStorage key prefix for persisting last selected event
   * (e.g., "query-123" will create "gitlab-insights-last-event-query-123")
   * If not provided, localStorage persistence is disabled
   */
  persistenceKey?: string;

  /**
   * URL params to preserve when updating the detail param
   * (e.g., ["mode"] to preserve ?mode=catchup)
   */
  preserveParams?: string[];
}

/**
 * Custom hook for managing event detail pane state and behavior
 *
 * Encapsulates common logic for:
 * - Split pane state management
 * - Deep linking from URL params
 * - Mobile vs desktop/tablet navigation
 * - URL synchronization with shallow routing
 * - Optional localStorage persistence
 *
 * Used by DashboardClient and QueryDetailClient for consistent behavior.
 */
export function useEventDetailPane({
  baseUrl,
  persistenceKey,
  preserveParams = [],
}: UseEventDetailPaneOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setIsOpen: setDetailPaneOpen, isOpen: isDetailPaneOpen } = useDetailPane();
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Storage key for localStorage persistence
  const STORAGE_KEY = persistenceKey
    ? `gitlab-insights-last-event-${persistenceKey}`
    : null;

  /**
   * Get initial selected event ID
   * Priority 1: URL param (deep linking)
   * Priority 2: Last selected event from localStorage (if persistence enabled)
   */
  const getInitialEventId = useCallback((): string | null => {
    if (typeof window === "undefined") return null;

    // Priority 1: URL param for deep linking
    const params = new URLSearchParams(window.location.search);
    const detailParam = params.get("detail");
    if (detailParam) return detailParam;

    // Priority 2: Restore last selected event if pane was open and persistence enabled
    if (STORAGE_KEY) {
      try {
        const stored = localStorage.getItem("gitlab-insights-split-view-open");
        if (stored) {
          const isOpen = JSON.parse(stored) as boolean;
          if (isOpen) {
            return localStorage.getItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.warn("Failed to restore initial event state:", error);
      }
    }

    return null;
  }, [STORAGE_KEY]);

  // Visual selection state (source of truth for rendering)
  // This state updates instantly on keyboard navigation (no lag)
  // URL updates are debounced (200ms) to prevent blocking operations
  const [visualSelectedEventId, setVisualSelectedEventId] = useState<string | null>(
    getInitialEventId
  );

  // Deep linking initialization (runs once on mount)
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!searchParams || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const detailParam = searchParams.get("detail");
    if (detailParam) {
      // URL has ?detail param - open pane
      setDetailPaneOpen(true);
    } else if (isDetailPaneOpen && visualSelectedEventId && STORAGE_KEY) {
      // Event was restored from localStorage - sync URL to match state
      const params = new URLSearchParams(window.location.search);
      params.set("detail", visualSelectedEventId);
      router.push(`${baseUrl}?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Track last committed URL param to detect URL changes (browser back/forward)
  const lastCommittedUrlParamRef = useRef<string | null>(null);

  // URL synchronization (browser back/forward navigation)
  // This is one-way: URL changes → update visual state
  // Only triggers on searchParams changes (not on visual state changes)
  useEffect(() => {
    if (!searchParams || !hasInitializedRef.current) return;

    const detailParam = searchParams.get("detail");

    // Only update if URL actually changed (not triggered by our own commit)
    if (detailParam !== lastCommittedUrlParamRef.current) {
      lastCommittedUrlParamRef.current = detailParam;

      if (detailParam) {
        // URL changed to different event - sync state and open pane
        setVisualSelectedEventId(detailParam);
        setDetailPaneOpen(true);
      } else {
        // URL no longer has detail param - close pane and clear selection
        setVisualSelectedEventId(null);
        setDetailPaneOpen(false);
      }
    }
  }, [searchParams, setDetailPaneOpen]);

  /**
   * Ref to store pending debounce timeout ID
   * Using ref instead of closure variable ensures timeout is properly shared across calls
   */
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  /**
   * Debounced commit function for expensive operations (localStorage + URL update)
   * Uses useCallback with ref to ensure proper cancellation of pending commits
   * Debounce delay: 200ms (user preference for responsive feel)
   */
  const debouncedCommit = useCallback((eventId: string) => {
    // Cancel previous pending commit
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Schedule new commit after 200ms
    debounceTimeoutRef.current = setTimeout(() => {
      // Store last selected event in localStorage (non-blocking, happens after delay)
      if (STORAGE_KEY && typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, eventId);
        } catch (error) {
          console.warn("Failed to save last selected event:", error);
        }
      }

      // Update URL with detail param (triggers EventDetail data fetch)
      const params = new URLSearchParams(window.location.search);
      params.set("detail", eventId);

      // Remove params not in preserveParams list (except 'detail')
      const currentParams = Array.from(params.keys());
      currentParams.forEach((key) => {
        if (key !== "detail" && !preserveParams.includes(key)) {
          params.delete(key);
        }
      });

      router.push(`${baseUrl}?${params.toString()}`, { scroll: false });
      lastCommittedUrlParamRef.current = eventId;  // Track committed URL
      debounceTimeoutRef.current = undefined;  // Clear ref after commit
    }, 200);
  }, [STORAGE_KEY, baseUrl, preserveParams, router]);

  // Cleanup: Cancel pending debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handle row click - open in split pane on desktop/tablet, navigate to full page on mobile
   *
   * Performance optimization: Split into instant visual update + debounced side effects
   * - Visual state updates immediately (smooth navigation, no lag)
   * - URL update + localStorage write debounced (200ms after last navigation)
   * - Prevents blocking main thread during rapid j/k navigation
   */
  const handleRowClick = useCallback(
    (event: DashboardEvent) => {
      const eventId = event.id;

      // Mobile: Navigate to full-screen detail page immediately (no debounce)
      if (isMobile) {
        router.push(`/events/${eventId}`);
        return;
      }

      // Desktop/Tablet: Split into instant visual + debounced commit
      setVisualSelectedEventId(eventId);  // Instant visual feedback (no lag)
      debouncedCommit(eventId);            // Debounced side effects (200ms)
      setDetailPaneOpen(true);             // Open pane immediately for UX
    },
    [isMobile, router, debouncedCommit, setDetailPaneOpen]
  );

  return {
    selectedEventId: visualSelectedEventId,  // Return visual state for rendering
    handleRowClick,
    isDetailPaneOpen,
    isMobile,
  };
}
