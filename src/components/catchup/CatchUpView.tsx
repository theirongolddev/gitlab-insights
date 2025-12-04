"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Skeleton } from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import { api } from "~/trpc/react";
import { EventTable } from "~/components/dashboard/EventTable";
import { type DashboardEvent } from "~/components/dashboard/ItemRow";
import { useShortcuts } from "~/components/keyboard/ShortcutContext";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";

/**
 * CatchUpView - Displays events grouped by saved queries since last visit
 *
 * Story 3.2: Catch-Up Mode View with Toggle
 * AC 3.2.2: Header displays "Catch-Up: X new items since [last visit time]"
 * AC 3.2.3: Events grouped by saved queries with "[Query Name] (X new items)"
 * AC 3.2.5: Empty state for no queries
 * AC 3.2.6: "All caught up!" state for zero new items
 * AC 3.2.10: Uses EventTable component for event display
 * AC 3.2.12: Tab navigation between query sections with olive focus styling
 */
export function CatchUpView() {
  // Track which section is currently focused for styling and scoped navigation
  const [focusedSectionIndex, setFocusedSectionIndex] = useState<number | null>(null);

  // Scope management for keyboard shortcuts
  const { setActiveScope, clearActiveScope } = useShortcuts();

  // Fetch user's queries
  const { data: queries, isLoading: queriesLoading } = api.queries.list.useQuery();

  // Fetch new items for each query using useQueries pattern
  // Only fetch when we have queries to avoid empty/invalid requests
  const queryIds = queries?.map(q => q.id) ?? [];
  
  const newItemsQueries = api.useQueries((t) =>
    queryIds.length > 0
      ? queryIds.map((queryId) => t.queries.getNewItems({ queryId }))
      : []
  );

  // Calculate total new items across all queries
  const totalNewItems = useMemo(() => {
    if (!newItemsQueries || newItemsQueries.length === 0) return 0;
    return newItemsQueries.reduce((sum, query) => {
      if (query.data) {
        return sum + query.data.newCount;
      }
      return sum;
    }, 0);
  }, [newItemsQueries]);

  // Determine loading states
  const isInitialLoading = queriesLoading;
  const allQueriesLoaded = newItemsQueries.every(q => !q.isLoading);

  // AC 3.2.8: Performance measurement - track load time
  const loadStartTimeRef = useRef<number | null>(null);
  const hasLoggedPerformanceRef = useRef(false);

  // Initialize start time on mount (only runs once)
  useEffect(() => {
    if (loadStartTimeRef.current === null) {
      loadStartTimeRef.current = performance.now();
    }
  }, []);

  useEffect(() => {
    if (allQueriesLoaded && !hasLoggedPerformanceRef.current && !isInitialLoading && loadStartTimeRef.current !== null) {
      const loadTime = performance.now() - loadStartTimeRef.current;
      const meetsTarget = loadTime < 500;
      // AC 3.2.8: Log performance measurement to console (browser dev tools)
      console.info(`[CatchUpView] Load time: ${loadTime.toFixed(2)}ms (target: <500ms, met: ${meetsTarget})`);
      if (!meetsTarget) {
        console.warn(`[CatchUpView] Performance target missed: ${loadTime.toFixed(2)}ms exceeds 500ms threshold`);
      }
      hasLoggedPerformanceRef.current = true;
    }
  }, [allQueriesLoaded, isInitialLoading]);

  // Find the most recent lastVisitedAt timestamp for header display
  const mostRecentVisit = useMemo(() => {
    if (!queries || queries.length === 0) return null;
    const visits = queries
      .map(q => q.lastVisitedAt as Date | null)
      .filter((d): d is Date => d !== null);
    if (visits.length === 0) return null;
    return new Date(Math.max(...visits.map(d => new Date(d).getTime())));
  }, [queries]);

  /**
   * Transforms API response events to DashboardEvent format for EventTable.
   *
   * The tRPC `queries.getNewItems` endpoint returns events with a generic `type: string`,
   * but EventTable expects the stricter `DashboardEvent["type"]` union type.
   * This function performs the type assertion and ensures Date objects are properly
   * instantiated (API may return ISO strings that need conversion).
   *
   * @param events - Raw events from the `queries.getNewItems` API response
   * @returns Events formatted for use with EventTable component
   */
  const transformEvents = (events: Array<{
    id: string;
    type: string;
    title: string;
    body: string | null;
    author: string;
    authorAvatar: string | null;
    project: string;
    labels: string[];
    gitlabUrl: string;
    createdAt: Date;
  }>): DashboardEvent[] => {
    return events.map(e => ({
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
    }));
  };

  // Handle row click - open GitLab URL in new tab
  const handleRowClick = (event: DashboardEvent) => {
    window.open(event.gitlabUrl, "_blank", "noopener,noreferrer");
  };

  // AC 3.2.5: Empty state for no queries
  if (!isInitialLoading && (!queries || queries.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
          No Saved Queries
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          Create saved queries to use Catch-Up Mode. Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm">s</kbd> while viewing search results to save a query.
        </p>
      </div>
    );
  }

  // Initial loading state - spinner while fetching queries list
  if (isInitialLoading) {
    return <LoadingSpinner size="lg" className="py-16" />;
  }

  // AC 3.2.6: "All caught up!" state when all queries have 0 new items
  if (allQueriesLoaded && totalNewItems === 0) {
    return (
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Catch-Up Mode
          </h2>
        </div>
        {/* All caught up message */}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
            All caught up!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            No new items since last visit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* AC 3.2.2: Header with total count and relative timestamp */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          Catch-Up: {allQueriesLoaded ? totalNewItems : "..."} new items
          {mostRecentVisit && (
            <span className="font-normal text-gray-600 dark:text-gray-400">
              {" "}since {formatDistanceToNow(mostRecentVisit, { addSuffix: true })}
            </span>
          )}
        </h2>
      </div>

      {/* AC 3.2.3: Query sections with "[Query Name] (X new items)" headers */}
      <div className="flex flex-col gap-6 p-4">
        {newItemsQueries.map((queryResult, index) => {
          const query = queries?.[index];
          if (!query) return null;

          const sectionScopeId = `catchup-section-${query.id}`;
          const isFocused = focusedSectionIndex === index;

          return (
            <div
              key={query.id}
              tabIndex={0}
              onFocus={() => {
                setFocusedSectionIndex(index);
                setActiveScope(sectionScopeId);
              }}
              onBlur={(e) => {
                const currentTarget = e.currentTarget;
                const relatedTarget = e.relatedTarget as Node | null;
                
                // If relatedTarget exists and is within section, don't clear
                if (relatedTarget && currentTarget.contains(relatedTarget)) {
                  return;
                }
                
                // Use requestAnimationFrame to check if focus moved within section
                // This handles cases where relatedTarget is null (e.g., clicking elements)
                requestAnimationFrame(() => {
                  if (!currentTarget.contains(document.activeElement)) {
                    setFocusedSectionIndex(null);
                    clearActiveScope(sectionScopeId);
                  }
                });
              }}
              className={`
                rounded-lg transition-all outline-none
                ${isFocused
                  ? "bg-olive/5 border border-olive/30 dark:bg-olive/10 dark:border-olive/40"
                  : "border border-gray-200 dark:border-gray-700"
                }
              `}
            >
              {/* Query section header */}
              <div className={`px-4 py-2 rounded-t-lg ${isFocused ? "" : "bg-gray-50 dark:bg-gray-800"}`}>
                <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                  {query.name}
                  {queryResult.isLoading ? (
                    <span className="ml-2 text-sm text-gray-500">loading...</span>
                  ) : (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      ({queryResult.data?.newCount ?? 0} new items)
                    </span>
                  )}
                </h3>
              </div>

              {/* Query section content */}
              <div className="px-2 py-2">
                {queryResult.isLoading ? (
                  // Progressive loading: skeleton per section
                  <div className="space-y-2 p-2">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                ) : queryResult.data && queryResult.data.events.length > 0 ? (
                  // AC 3.2.10, 3.2.12: EventTable with scoped keyboard handlers
                  <EventTable
                    events={transformEvents(queryResult.data.events)}
                    onRowClick={handleRowClick}
                    scopeId={sectionScopeId}
                    showNewBadges={true}
                  />
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 px-4 py-3">
                    No new items for this query
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
