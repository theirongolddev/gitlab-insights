"use client";

import { useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshButton } from "~/components/dashboard/RefreshButton";
import { SyncIndicator } from "~/components/dashboard/SyncIndicator";
import { type DashboardEvent } from "~/components/dashboard/ItemRow";
import { EventTable } from "~/components/dashboard/EventTable";
import { useSearch } from "~/components/search/SearchContext";
import { api } from "~/trpc/react";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Story 2.6: Search state from global SearchContext
  // Search input lives in Header with tag pills, results displayed here
  const { searchResults, isSearchActive } = useSearch();

  const utils = api.useUtils();

  const { data: dashboardData, isLoading: eventsLoading } = api.events.getForDashboard.useQuery({});

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
  const allDashboardEvents: DashboardEvent[] = [...issues, ...mergeRequests, ...comments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  // Story 2.4/2.5: Transform SearchResultEvent[] to DashboardEvent[] format
  // Search results come from SearchContext (global Header search)
  // Include rank for relevance display and highlighted fields for keyword highlighting
  const searchEventsAsDashboard: DashboardEvent[] = searchResults.map((e) => ({
    id: e.id,
    type: e.type as DashboardEvent["type"],
    title: e.title,
    body: e.body,
    author: e.author,
    authorAvatar: e.authorAvatar,
    project: e.project,
    labels: e.labels,
    gitlabUrl: e.gitlabUrl,
    createdAt: new Date(e.createdAt),
    rank: e.rank,
    highlightedTitle: e.highlightedTitle,
    highlightedSnippet: e.highlightedSnippet,
  }));

  // Final events to display - search results when searching, all events otherwise
  const displayEvents = isSearchActive ? searchEventsAsDashboard : allDashboardEvents;

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFFFC] dark:bg-[#2d2e2e]">
      {/* Dashboard sub-header with sync indicator and refresh */}
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
        {/* Loading state for initial dashboard load */}
        {eventsLoading && !isSearchActive ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-lg text-gray-400">Loading events...</p>
          </div>
        ) : (
          /* Pass displayEvents - either search results or all events */
          <EventTable events={displayEvents} onRowClick={handleRowClick} />
        )}
      </div>
    </div>
  );
}
