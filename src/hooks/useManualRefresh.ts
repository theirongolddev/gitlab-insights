"use client";

import { useState, useRef, useCallback } from "react";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/Toast/ToastContext";
import { useShortcutHandler } from "~/hooks/useShortcutHandler";

/**
 * Custom hook for manual refresh functionality
 * 
 * Handles:
 * - Manual refresh mutation with proper error handling
 * - Double-trigger prevention with synchronous ref
 * - Keyboard shortcut registration and cleanup
 * - Toast notifications for success/error states
 * - Query invalidation to update UI
 * 
 * @returns Object with isSyncing state and triggerRefresh function
 */
export function useManualRefresh() {
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false); // Synchronous check to prevent race condition
  const { showToast } = useToast();
  const utils = api.useUtils();

  // Manual refresh mutation
  const manualRefresh = api.events.manualRefresh.useMutation({
    onSuccess: async (data) => {
      await utils.events.getForDashboard.invalidate();
      // AC 3.7.5: Invalidate triggers SyncIndicator refetch, timestamp updates to "just now"
      await utils.events.getLastSync.invalidate();
      await utils.queries.getNewItems.invalidate();
      
      // Reset both state and ref
      setIsSyncing(false);
      isSyncingRef.current = false;

      // AC 3.7.4: Show new items count in toast
      // Note: 'stored' = NEW events inserted (skipDuplicates ensures this)
      // 'skipped' = duplicates already in DB, 'errors' = failed inserts
      const newItemsCount = data?.stored ?? 0;
      showToast(`Refreshed! ${newItemsCount} new item${newItemsCount === 1 ? '' : 's'} found`, "success");
    },
    onError: (error) => {
      // Reset both state and ref
      setIsSyncing(false);
      isSyncingRef.current = false;
      
      // AC 3.7.9: Show error toast on failure
      showToast(`Refresh failed: ${error.message}`, "error");
    },
  });

  // Stable handler function that won't change on every render
  const triggerRefresh = useCallback(() => {
    // AC 3.7.8: Prevent double-trigger with synchronous ref check
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    manualRefresh.mutate();
  }, [manualRefresh]);

  // Register keyboard shortcut (r key) - cleanup handled by hook
  useShortcutHandler('triggerManualRefresh', triggerRefresh);

  return {
    isSyncing,
    triggerRefresh,
  };
}
