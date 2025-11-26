"use client";

/**
 * Query Detail Page - View saved query results
 *
 * Story 2.8: Sidebar Navigation
 * AC 2.8.3: Clicking query navigates to /queries/[id]
 *
 * Loads the saved query by ID and displays search results using EventTable.
 */

import { use } from "react";
import { api } from "~/trpc/react";
import { EventTable } from "~/components/dashboard/EventTable";
import type { DashboardEvent } from "~/components/dashboard/ItemRow";
import type { QueryFilters } from "~/lib/filters/types";

interface QueryPageProps {
  params: Promise<{ id: string }>;
}

export default function QueryPage({ params }: QueryPageProps) {
  const { id } = use(params);

  // Fetch query details (name, filters, count)
  const {
    data: query,
    isLoading: isQueryLoading,
    error: queryError,
  } = api.queries.getById.useQuery({ id });

  // Extract keywords from query filters for search
  const keywords = query ? (query.filters as QueryFilters).keywords : [];

  // Fetch search results based on query's keywords
  const {
    data: searchData,
    isLoading: isSearchLoading,
  } = api.events.search.useQuery(
    { keywords },
    {
      enabled: keywords.length > 0,
    }
  );

  // Handle row click - open in new tab
  const handleRowClick = (event: DashboardEvent) => {
    window.open(event.gitlabUrl, "_blank");
  };

  // Loading state for query
  if (isQueryLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  // Error state
  if (queryError) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <p className="text-lg text-red-400">
            {queryError.data?.code === "NOT_FOUND"
              ? "Query not found"
              : queryError.data?.code === "FORBIDDEN"
                ? "You don't have access to this query"
                : "Error loading query"}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-500 mt-2">
            {queryError.message}
          </p>
        </div>
      </div>
    );
  }

  // No query found (shouldn't happen with proper error handling)
  if (!query) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <p className="text-lg text-gray-600 dark:text-gray-400">Query not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      {/* Query header */}
      <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700/50">
        <h1 className="text-xl font-semibold text-[#2d2e2e] dark:text-[#FDFFFC]">
          {query.name}
        </h1>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {query.count} {query.count === 1 ? "result" : "results"}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-500">Keywords:</span>
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#9DAA5F]/15 text-[#5e6b24] dark:bg-[#9DAA5F]/20 dark:text-[#9DAA5F]"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Search results */}
      {isSearchLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-[52px] animate-pulse rounded bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : searchData?.events && searchData.events.length > 0 ? (
        <EventTable
          events={searchData.events as DashboardEvent[]}
          onRowClick={handleRowClick}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500 dark:text-gray-400">No matching events</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Try syncing your GitLab projects or adjusting your search terms
          </p>
        </div>
      )}
    </div>
  );
}
