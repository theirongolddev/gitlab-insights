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

  // Initialize selected event from URL or localStorage
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
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
    } else if (isDetailPaneOpen && selectedEventId && STORAGE_KEY) {
      // Event was restored from localStorage - sync URL to match state
      const params = new URLSearchParams(window.location.search);
      params.set("detail", selectedEventId);
      router.push(`${baseUrl}?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // URL synchronization (browser back/forward navigation)
  useEffect(() => {
    if (!searchParams || !hasInitializedRef.current) return;

    const detailParam = searchParams.get("detail");
    if (detailParam && detailParam !== selectedEventId) {
      // URL changed to different event - sync state and open pane
      setSelectedEventId(detailParam);
      setDetailPaneOpen(true);
    }
  }, [searchParams, selectedEventId, setDetailPaneOpen]);

  /**
   * Handle row click - open in split pane on desktop/tablet, navigate to full page on mobile
   */
  const handleRowClick = useCallback(
    (event: DashboardEvent) => {
      const eventId = event.id;

      // Mobile: Navigate to full-screen detail page
      if (isMobile) {
        router.push(`/events/${eventId}`);
        return;
      }

      // Desktop/Tablet: Update URL only - state derives from URL (single source of truth)
      // Bug Fix (Story 4.4 regression): Removed direct setSelectedEventId() call
      // to eliminate dual source of truth. URL sync effect (line 116) handles state update.
      setDetailPaneOpen(true); // Open pane immediately for UX

      // Store last selected event in localStorage (if persistence enabled)
      if (STORAGE_KEY && typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, eventId);
        } catch (error) {
          console.warn("Failed to save last selected event:", error);
        }
      }

      // Update URL with detail param, preserving specified params
      // The URL sync effect will call setSelectedEventId(detailParam)
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
    },
    [
      isMobile,
      router,
      setDetailPaneOpen,
      STORAGE_KEY,
      baseUrl,
      preserveParams,
    ]
  );

  return {
    selectedEventId,
    handleRowClick,
    isDetailPaneOpen,
    isMobile,
  };
}
