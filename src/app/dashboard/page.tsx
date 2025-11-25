"use client";

import { useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { RefreshButton } from "~/components/dashboard/RefreshButton";
import { SyncIndicator } from "~/components/dashboard/SyncIndicator";
import { type DashboardEvent } from "~/components/dashboard/ItemRow";
import { EventTable } from "~/components/dashboard/EventTable";
import { api } from "~/trpc/react";
import { useState } from "react";

// AC-10: Hardcoded filter label
// Developer override: AC-10 specifies "security" but user's GitLab instance lacks this label.
// Changed to "bug" for practical testing. Reviewer accepted this deviation.
// User-controlled queries will be implemented in Epic 2.
const HARDCODED_FILTER_LABEL = "bug";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const utils = api.useUtils();

  // AC-10: Get dashboard events with hardcoded security label filter
  const { data: dashboardData, isLoading: eventsLoading } = api.events.getForDashboard.useQuery({
    filterLabel: HARDCODED_FILTER_LABEL,
  });

  // Manual refresh mutation
  const manualRefresh = api.events.manualRefresh.useMutation({
    onSuccess: async () => {
      await utils.events.getForDashboard.invalidate();
      await utils.events.getLastSync.invalidate();
      setIsRefreshing(false);
    },
    onError: (error) => {
      alert(`Refresh failed: ${error.message}`);
      setIsRefreshing(false);
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    manualRefresh.mutate();
  };

  // Handle row click - open GitLab URL in new tab
  const handleRowClick = (event: DashboardEvent) => {
    window.open(event.gitlabUrl, "_blank", "noopener,noreferrer");
  };

  if (isPending) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FDFFFC] dark:bg-[#2d2e2e]">
        <p className="text-xl text-[#2d2e2e] dark:text-[#FDFFFC]">Loading...</p>
      </main>
    );
  }

  if (!session) {
    router.push("/");
    return null;
  }

  // Transform API data to DashboardEvent format and combine into single array
  // Events are already sorted by createdAt desc from the API
  const issues: DashboardEvent[] = (dashboardData?.issues ?? []).map((e) => ({
    ...e,
    type: e.type as DashboardEvent["type"],
    createdAt: new Date(e.createdAt),
  }));

  const mergeRequests: DashboardEvent[] = (dashboardData?.mergeRequests ?? []).map((e) => ({
    ...e,
    type: e.type as DashboardEvent["type"],
    createdAt: new Date(e.createdAt),
  }));

  const comments: DashboardEvent[] = (dashboardData?.comments ?? []).map((e) => ({
    ...e,
    type: e.type as DashboardEvent["type"],
    createdAt: new Date(e.createdAt),
  }));

  // Combine all events and sort by createdAt desc for unified j/k navigation
  const allEvents: DashboardEvent[] = [...issues, ...mergeRequests, ...comments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFFFC] dark:bg-[#2d2e2e]">
      {/* Header with Manual Refresh */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#2d2e2e] dark:text-[#FDFFFC]">
              Dashboard
            </h1>
            <SyncIndicator />
          </div>
          <RefreshButton onRefresh={handleRefresh} isLoading={isRefreshing} />
        </div>
      </div>

      {/* Events Table with vim-style navigation */}
      <div className="container mx-auto px-4 py-6">
        {/* Task 6.3: Loading state */}
        {eventsLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-lg text-gray-400">Loading events...</p>
          </div>
        ) : (
          /* Task 6.2: Pass events data to EventTable */
          <EventTable events={allEvents} onRowClick={handleRowClick} />
        )}
      </div>
    </div>
  );
}
