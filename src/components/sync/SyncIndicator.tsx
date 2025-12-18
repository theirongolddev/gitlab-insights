"use client";

/**
 * SyncIndicator - Displays last sync timestamp with color-coded freshness states
 *
 * Story 3.6: Last Sync Indicator
 *
 * Features:
 * - Shows relative time since last sync (e.g., "2 minutes ago")
 * - Color-coded freshness using design tokens: success (<10m), warning (10-30m), danger (>30m)
 * - Warning state: "Sync delayed • X minutes ago" when >15 minutes since last sync
 * - Error state: "Sync failed • Retry" on API errors
 * - Syncing state: Spinner with "Syncing..." text during manual refresh
 * - Polls for sync status every 30 seconds
 *
 * @see docs/sprint-artifacts/3-6-last-sync-indicator.md
 */

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Spinner } from "@heroui/react";
import { useSession } from "~/lib/auth-client";
import { api } from "~/trpc/react";

interface SyncIndicatorProps {
  /** When true, shows "Syncing..." spinner (passed from parent during manual refresh) */
  isSyncing?: boolean;
}

/** Decorative checkmark icon for fresh sync state */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

/** Decorative warning triangle icon for delayed sync state */
function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

/** Decorative error circle icon for failed sync state */
function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

/** Decorative refresh icon for retry indication */
function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

const REFRESH_INTERVAL_MS = 30000;

/**
 * Internal component that renders sync status with color-coded freshness.
 *
 * Color thresholds (per UX spec Section 7.1) using HeroUI design tokens:
 * - Success (text-success): <10 minutes - Fresh
 * - Warning (text-warning): 10-30 minutes - Getting stale
 * - Danger (text-danger): >30 minutes - Stale
 *
 * Warning state: >15 minutes shows "Sync delayed • X minutes ago" message
 */
function SyncStatusDisplay({ 
  lastSyncAt, 
  currentTimestamp 
}: { 
  lastSyncAt: Date; 
  currentTimestamp: number; 
}) {
  const minutesAgo = (currentTimestamp - lastSyncAt.getTime()) / 1000 / 60;
  
  // Use HeroUI design tokens instead of hardcoded Tailwind colors
  const colorClass = minutesAgo < 10 
    ? "text-success" 
    : minutesAgo < 30 
      ? "text-warning" 
      : "text-danger";

  const relativeTime = formatDistanceToNow(lastSyncAt, { addSuffix: true });

  // AC 3.6.6: Warning state (>15 min) - show "Sync delayed • X minutes ago"
  if (minutesAgo > 15) {
    return (
      <div 
        className={`flex items-center gap-2 text-sm ${colorClass}`}
        aria-label={`Sync delayed. Last synced ${relativeTime}`}
        role="status"
        aria-live="polite"
      >
        <WarningIcon className="h-4 w-4" />
        <span>Sync delayed • {relativeTime}</span>
      </div>
    );
  }

  // Normal state with freshness color
  return (
    <div 
      className={`flex items-center gap-2 text-sm ${colorClass}`}
      aria-label={`Last synced ${relativeTime}`}
      role="status"
      aria-live="polite"
    >
      <CheckIcon className="h-4 w-4" />
      <span>{relativeTime}</span>
    </div>
  );
}

export function SyncIndicator({ isSyncing = false }: SyncIndicatorProps) {
  // Check session to prevent queries during logout transition (defense-in-depth)
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const { data: syncStatus, isLoading, error, dataUpdatedAt, refetch } = api.events.getLastSync.useQuery(
    undefined,
    { 
      refetchInterval: REFRESH_INTERVAL_MS,
      enabled: isAuthenticated,
    }
  );

  // Track current timestamp for time calculations
  // Updates every 10 seconds for smoother "X minutes ago" updates
  // Separate from query refetch to avoid stale display between refreshes
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());

  // Update timestamp more frequently for accurate relative time display
  // This is independent of query refetch to ensure UI stays fresh
  useEffect(() => {
    // Update every 10 seconds for smooth relative time display
    // Initial update happens on first interval tick to avoid synchronous setState
    const id = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 10000);

    // Use requestAnimationFrame for initial update to avoid synchronous setState in effect
    const rafId = requestAnimationFrame(() => {
      setCurrentTimestamp(Date.now());
    });

    return () => {
      clearInterval(id);
      cancelAnimationFrame(rafId);
    };
  }, [dataUpdatedAt]);

  // AC 3.6.7: Retry handler for error state
  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  // AC 3.6.10: Graceful loading state during hydration
  if (isLoading) return null;

  // AC 3.6.5: Syncing state (from parent - manual refresh in progress)
  if (isSyncing) {
    return (
      <div 
        className="flex items-center gap-2 text-sm text-default"
        aria-label="Syncing in progress"
        role="status"
        aria-live="polite"
      >
        <Spinner size="sm" />
        <span>Syncing...</span>
      </div>
    );
  }

  // AC 3.6.7: Error state - show "Sync failed" in red with retry indication
  if (error) {
    return (
      <button
        onClick={handleRetry}
        className="flex items-center gap-2 text-sm text-danger hover:opacity-80 transition-opacity"
        aria-label="Sync failed. Click to retry"
        role="status"
        aria-live="polite"
      >
        <ErrorIcon className="h-4 w-4" />
        <span>Sync failed</span>
        <RefreshIcon className="h-3 w-3" />
      </button>
    );
  }

  // AC 3.6.8: Never synced state
  if (!syncStatus?.lastSyncAt) {
    return (
      <div 
        className="flex items-center gap-2 text-sm text-default"
        aria-label="Not synced yet"
        role="status"
        aria-live="polite"
      >
        <span>Not synced yet</span>
      </div>
    );
  }

  const lastSyncedAt = new Date(syncStatus.lastSyncAt);

  return <SyncStatusDisplay lastSyncAt={lastSyncedAt} currentTimestamp={currentTimestamp} />;
}
