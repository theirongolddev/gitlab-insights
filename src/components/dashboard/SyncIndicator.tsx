"use client";

import { api } from "~/trpc/react";

export function SyncIndicator() {
  const { data: lastSyncData } = api.events.getLastSync.useQuery();

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
      {lastSyncData?.lastSyncAt ? (
        <>Last sync: {formatRelativeTime(new Date(lastSyncData.lastSyncAt))}</>
      ) : (
        <>No sync yet - click refresh to load events</>
      )}
    </p>
  );
}
