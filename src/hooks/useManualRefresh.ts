"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/Toast/ToastContext";
import { useShortcutHandler } from "~/hooks/useShortcutHandler";

// AC2: Exponential backoff delays in milliseconds (1s, 2s, 4s)
const RETRY_DELAYS = [1000, 2000, 4000];
const MAX_RETRIES = 3;

interface RetryState {
  isRetrying: boolean;
  attempt: number;
  nextRetryIn: number; // countdown in seconds
}

/**
 * Custom hook for manual refresh functionality with rate limit retry
 * 
 * Handles:
 * - Manual refresh mutation with proper error handling
 * - Double-trigger prevention with synchronous ref
 * - Keyboard shortcut registration and cleanup
 * - Toast notifications for success/error states
 * - Query invalidation to update UI
 * - AC1-AC10: Rate limit retry with exponential backoff and countdown
 * 
 * @returns Object with isSyncing state and triggerRefresh function
 */
export function useManualRefresh() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [retryState, setRetryState] = useState<RetryState | null>(null);
  const isSyncingRef = useRef(false); // Synchronous check to prevent race condition
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { showToast } = useToast();
  const utils = api.useUtils();

  // AC9: Cleanup retry state on unmount (user navigates away)
  useEffect(() => {
    const retryTimeout = retryTimeoutRef;
    const countdownInterval = countdownIntervalRef;
    const abortController = abortControllerRef;
    
    return () => {
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Clear retry timers helper
  const clearRetryTimers = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Reset all state
  const resetState = useCallback(() => {
    setIsSyncing(false);
    setRetryState(null);
    isSyncingRef.current = false;
    clearRetryTimers();
  }, [clearRetryTimers]);

  // Manual refresh mutation
  const manualRefresh = api.events.manualRefresh.useMutation({
    onSuccess: async (data) => {
      await utils.events.getForDashboard.invalidate();
      await utils.events.getLastSync.invalidate();
      await utils.queries.getNewItems.invalidate();
      
      resetState();

      const newItemsCount = data?.stored ?? 0;
      showToast(`Refreshed! ${newItemsCount} new item${newItemsCount === 1 ? '' : 's'} found`, "success");
    },
    // Error handling moved to executeRefresh for retry logic
  });

  // Execute refresh with retry handling
  const executeRefresh = useCallback(async (attemptNumber: number = 0) => {
    try {
      await manualRefresh.mutateAsync();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRateLimitError = errorMessage.toLowerCase().includes('rate limit') || 
                               errorMessage.includes('TOO_MANY_REQUESTS');
      
      // AC1, AC7: Only retry on rate limit errors for manual refresh
      if (isRateLimitError && attemptNumber < MAX_RETRIES) {
        // AC2: Calculate backoff delay
        const delayMs = RETRY_DELAYS[attemptNumber] ?? 4000;
        const delaySeconds = Math.ceil(delayMs / 1000);
        
        // AC3, AC4, AC10: Show countdown toast and update state
        setRetryState({
          isRetrying: true,
          attempt: attemptNumber + 1,
          nextRetryIn: delaySeconds,
        });
        
        showToast(
          attemptNumber === 0 
            ? `GitLab rate limit reached. Retrying in ${delaySeconds}s...`
            : `Still rate limited. Retrying in ${delaySeconds}s...`,
          "info"
        );

        // Start countdown interval for UI updates
        let countdown = delaySeconds;
        countdownIntervalRef.current = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            setRetryState(prev => prev ? { ...prev, nextRetryIn: countdown } : null);
          }
        }, 1000);

        // Schedule retry after delay
        retryTimeoutRef.current = setTimeout(() => {
          clearRetryTimers();
          void executeRefresh(attemptNumber + 1);
        }, delayMs);
        
        return;
      }

      // AC5: After exhausting retries or non-rate-limit error, show error toast
      resetState();
      
      if (isRateLimitError) {
        // Exhausted retries on rate limit
        showToast(
          "GitLab rate limit exceeded. Please try again in a few minutes.",
          "error"
        );
      } else {
        // AC 3.7.9: Show error toast on non-rate-limit failure
        showToast(`Refresh failed: ${errorMessage}`, "error");
      }
    }
  }, [manualRefresh, showToast, resetState, clearRetryTimers]);

  // Stable handler function that won't change on every render
  const triggerRefresh = useCallback(() => {
    // AC 3.7.8: Prevent double-trigger with synchronous ref check
    // AC6: Also prevent triggering during retry sequence
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    void executeRefresh(0);
  }, [executeRefresh]);

  // Register keyboard shortcut (r key) - cleanup handled by hook
  useShortcutHandler('triggerManualRefresh', triggerRefresh);

  return {
    isSyncing,
    triggerRefresh,
    // AC10: Expose retry state for UI components that want to show countdown
    retryState,
  };
}
