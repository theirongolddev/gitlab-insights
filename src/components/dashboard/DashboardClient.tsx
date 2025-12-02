"use client";

import { useState } from "react";
import { RefreshButton } from "~/components/dashboard/RefreshButton";
import { SyncIndicator } from "~/components/dashboard/SyncIndicator";
import { type DashboardEvent } from "~/components/dashboard/ItemRow";
import { EventTable } from "~/components/dashboard/EventTable";
import { useSearch } from "~/components/search/SearchContext";
import { api } from "~/trpc/react";

export function DashboardClient() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Story 2.6: Search state from global SearchContext
  const { searchResults, isSearchActive } = useSearch();

  const utils = api.useUtils();

  // Fetch dashboard data (session already validated by server component)
  const { data: dashboardData, isLoading: eventsLoading } =
    api.events.getForDashboard.useQuery({});

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

  // Transform API data to DashboardEvent format
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

  // Combine all events and sort by createdAt desc
  const allDashboardEvents: DashboardEvent[] = [...issues, ...mergeRequests, ...comments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  // Transform search results to DashboardEvent format
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
    <div className="flex min-h-screen flex-col bg-bg-light dark:bg-bg-dark">
      {/* Dashboard sub-header with sync indicator and refresh */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Dashboard
            </h1>
            <SyncIndicator />
          </div>
          <RefreshButton onRefresh={handleRefresh} isLoading={isRefreshing} />
        </div>
      </div>

      {/* Events Table with vim-style navigation */}
      <div className="container mx-auto px-4 py-6">
        {eventsLoading && !isSearchActive ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-lg text-gray-400">Loading events...</p>
          </div>
        ) : (
          <EventTable events={displayEvents} onRowClick={handleRowClick} />
        )}
      </div>
    </div>
  );
}
