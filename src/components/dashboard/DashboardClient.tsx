"use client";

/**
 * DashboardClient - Main dashboard view component
 *
 * Story 3.4: Sidebar New Item Badges
 * AC 3.4.5: Uses shared NewItemsContext for totalNewCount (no duplicate fetching)
 * AC 3.4.8: Data fetched once at AuthenticatedLayout level
 */

import { useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type DashboardEvent } from "~/components/dashboard/ItemRow";
import { EventTable } from "~/components/dashboard/EventTable";
import { useSearch } from "~/components/search/SearchContext";
import { CatchUpView, CatchUpModeToggle } from "~/components/catchup";
import { useShortcutHandler } from "~/hooks/useShortcutHandler";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { useNewItems } from "~/contexts/NewItemsContext";
import { api } from "~/trpc/react";
import { SplitView } from "~/components/layout/SplitView";
import { EventDetail } from "~/components/events/EventDetail";
import { useEventDetailPane } from "~/hooks/useEventDetailPane";
import { useToast } from "~/components/ui/Toast/ToastContext";

export function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isCatchUpMode = searchParams?.get("mode") === "catchup";

  // Split pane state for event details
  const { selectedEventId, handleRowClick } = useEventDetailPane({
    baseUrl: '/dashboard',
    preserveParams: ['mode'], // Preserve ?mode=catchup in URLs
  });

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

  useShortcutHandler('toggleCatchUpMode', toggleCatchUpMode);

  const { showToast } = useToast();

  useEffect(() => {
    if (!isCatchUpMode || !isSearchActive) return;

    const justEntered = !prevCatchUpModeRef.current;
    if (justEntered) {
      clearSearch();
    } else {
      router.push("/dashboard");
    }
  }, [isCatchUpMode, isSearchActive, clearSearch, router]);

  const { data: dashboardData, isLoading: eventsLoading } =
    api.events.getForDashboard.useQuery({});

  // AC 3.4.5: Use shared context for totalNewCount (no duplicate fetching)
  // AC 3.4.8: Data fetched once at AuthenticatedLayout level in NewItemsProvider
  const { totalNewCount } = useNewItems();

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

  // Story 5.1 (AC 5.1.1): 'o' key opens selected event in GitLab
  // Fixed: Moved after displayEvents definition to avoid closure bug
  useShortcutHandler('openInGitLab', () => {
    if (!selectedEventId) {
      showToast("No event selected", "error");
      return;
    }
    const selectedEvent = displayEvents.find(e => e.id === selectedEventId);
    if (!selectedEvent) {
      showToast("Event not found", "error");
      return;
    }
    const result = window.open(selectedEvent.gitlabUrl, '_blank');
    if (!result) {
      showToast("Failed to open link. Please check popup blocker settings.", "error");
    }
  });

  // Story 5.1 (AC 5.1.6): 1/2/3 keys scroll to sections in detail pane
  useShortcutHandler('scrollToSection', (sectionId: 'title' | 'body' | 'metadata') => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  if (isLoadingMonitored) {
    return <LoadingSpinner size="lg" label="Loading..." className="min-h-screen" />;
  }

  if (monitoredProjects && monitoredProjects.length === 0) {
    return <LoadingSpinner size="lg" label="Redirecting to setup..." className="min-h-screen" />;
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - var(--header-height))' }}>
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isCatchUpMode ? (
          <div className="container mx-auto px-4 py-6">
            <CatchUpView />
          </div>
        ) : eventsLoading && !isSearchActive ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-lg text-gray-400">Loading events...</p>
          </div>
        ) : (
          <SplitView
            listContent={
              <EventTable
                events={displayEvents}
                selectedEventId={selectedEventId}
                onRowClick={handleRowClick}
              />
            }
            detailContent={<EventDetail eventId={selectedEventId} />}
            selectedEventId={selectedEventId}
          />
        )}
      </div>
    </div>
  );
}
