"use client";

/**
 * DashboardClient - Main dashboard view component
 *
 * Story 3.4: Sidebar New Item Badges
 * AC 3.4.5: Uses shared NewItemsContext for totalNewCount (no duplicate fetching)
 * AC 3.4.8: Data fetched once at AuthenticatedLayout level
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshButton } from "~/components/dashboard/RefreshButton";
import { type DashboardEvent } from "~/components/dashboard/ItemRow";
import { EventTable } from "~/components/dashboard/EventTable";
import { useSearch } from "~/components/search/SearchContext";
import { CatchUpView, CatchUpModeToggle } from "~/components/catchup";
import { useShortcuts } from "~/components/keyboard/ShortcutContext";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { useNewItems } from "~/contexts/NewItemsContext";
import { api } from "~/trpc/react";

export function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isCatchUpMode = searchParams?.get("mode") === "catchup";

  const prevCatchUpModeRef = useRef(isCatchUpMode);

  useEffect(() => {
    prevCatchUpModeRef.current = isCatchUpMode;
  }, [isCatchUpMode]);

  const { data: monitoredProjects, isLoading: isLoadingMonitored } =
    api.projects.getMonitored.useQuery();

  useEffect(() => {
    if (!isLoadingMonitored && monitoredProjects && monitoredProjects.length === 0) {
      router.replace("/onboarding");
    }
  }, [monitoredProjects, isLoadingMonitored, router]);

  const { searchResults, isSearchActive, clearSearch } = useSearch();

  const { setToggleCatchUpMode } = useShortcuts();

  const toggleCatchUpMode = useCallback(() => {
    if (isCatchUpMode) {
      router.push("/dashboard");
    } else {
      if (isSearchActive) {
        clearSearch();
      }
      router.push("/dashboard?mode=catchup");
    }
  }, [isCatchUpMode, router, isSearchActive, clearSearch]);

  useEffect(() => {
    setToggleCatchUpMode(toggleCatchUpMode);
  }, [setToggleCatchUpMode, toggleCatchUpMode]);

  useEffect(() => {
    if (!isCatchUpMode || !isSearchActive) return;

    const justEntered = !prevCatchUpModeRef.current;
    if (justEntered) {
      clearSearch();
    } else {
      router.push("/dashboard");
    }
  }, [isCatchUpMode, isSearchActive, clearSearch, router]);

  const utils = api.useUtils();

  const { data: dashboardData, isLoading: eventsLoading } =
    api.events.getForDashboard.useQuery({});

  // AC 3.4.5: Use shared context for totalNewCount (no duplicate fetching)
  // AC 3.4.8: Data fetched once at AuthenticatedLayout level in NewItemsProvider
  const { totalNewCount } = useNewItems();

  const manualRefresh = api.events.manualRefresh.useMutation({
    onSuccess: async () => {
      await utils.events.getForDashboard.invalidate();
      await utils.events.getLastSync.invalidate();
      await utils.queries.getNewItems.invalidate();
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

  const handleRowClick = (event: DashboardEvent) => {
    window.open(event.gitlabUrl, "_blank", "noopener,noreferrer");
  };

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

  const allDashboardEvents: DashboardEvent[] = [...issues, ...mergeRequests, ...comments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

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

  const displayEvents = isSearchActive ? searchEventsAsDashboard : allDashboardEvents;

  if (isLoadingMonitored) {
    return <LoadingSpinner size="lg" label="Loading..." className="min-h-screen" />;
  }

  if (monitoredProjects && monitoredProjects.length === 0) {
    return <LoadingSpinner size="lg" label="Redirecting to setup..." className="min-h-screen" />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              {isCatchUpMode ? "Catch-Up Mode" : "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <CatchUpModeToggle
              isCatchUpMode={isCatchUpMode}
              onToggle={toggleCatchUpMode}
              newItemsCount={totalNewCount}
            />
            <RefreshButton onRefresh={handleRefresh} isLoading={isRefreshing} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {isCatchUpMode ? (
          <CatchUpView />
        ) : eventsLoading && !isSearchActive ? (
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
