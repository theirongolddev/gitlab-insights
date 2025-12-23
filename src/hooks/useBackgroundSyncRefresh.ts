"use client";

/**
 * useBackgroundSyncRefresh - Detects background sync completion and refreshes UI
 *
 * Polls the lastSyncAt timestamp every 30 seconds. When it changes (indicating
 * Inngest background job completed), invalidates all relevant queries to refresh
 * the UI in a coordinated way.
 *
 * This ensures dashboard, sidebar badges, and catch-up views all update together
 * after a background sync, rather than with separate polling intervals.
 */

import { useEffect, useRef } from "react";
import { useSession } from "~/lib/auth-client";
import { api } from "~/trpc/react";

export function useBackgroundSyncRefresh() {
  // Check session to prevent queries during logout transition
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const utils = api.useUtils();
  const lastKnownSyncRef = useRef<string | null>(null);

  const { data: lastSyncData } = api.events.getLastSync.useQuery(undefined, {
    refetchInterval: 30000, // Poll every 30 seconds
    refetchIntervalInBackground: false, // Stop polling when tab is in background (saves resources)
    refetchOnWindowFocus: true, // Also check when user returns to tab
    enabled: isAuthenticated, // Don't poll when not authenticated
  });

  useEffect(() => {
    if (!lastSyncData?.lastSyncAt) return;

    const currentSync = new Date(lastSyncData.lastSyncAt).toISOString();

    // On first load, just store the value
    if (lastKnownSyncRef.current === null) {
      lastKnownSyncRef.current = currentSync;
      return;
    }

    // If sync time changed, background job completed - invalidate all queries
    if (lastKnownSyncRef.current !== currentSync) {
      lastKnownSyncRef.current = currentSync;

      // Invalidate all relevant queries in one coordinated refresh
      void Promise.all([
        utils.events.getForDashboard.invalidate(),
        utils.events.getLastSync.invalidate(),
        utils.queries.getNewItems.invalidate(),
        utils.queries.list.invalidate(),
      ]);
    }
  }, [lastSyncData?.lastSyncAt, utils]);
}
