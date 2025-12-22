"use client";

import { useMemo } from "react";
import { api } from "~/trpc/react";

interface UseInfiniteEventsOptions {
  /** Optional label filter */
  filterLabel?: string | null;
  /** Number of items per page (default 50) */
  limit?: number;
  /** Whether the query is enabled (default true) */
  enabled?: boolean;
}

/**
 * Hook for fetching events with infinite scroll pagination.
 *
 * Wraps the events.getForDashboard tRPC endpoint with TanStack Query's
 * useInfiniteQuery for cursor-based pagination.
 *
 * @example
 * const { events, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
 *   useInfiniteEvents({ filterLabel: 'bug' });
 *
 * return (
 *   <div>
 *     {events.map(event => <EventRow key={event.id} event={event} />)}
 *     <div ref={sentinelRef} />
 *   </div>
 * );
 */
export function useInfiniteEvents(options: UseInfiniteEventsOptions = {}) {
  const { filterLabel, limit = 50, enabled = true } = options;

  const query = api.events.getForDashboard.useInfiniteQuery(
    {
      filterLabel,
      limit,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      enabled,
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
    }
  );

  // Flatten all pages into a single array of events
  const events = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );

  return {
    /** Flattened array of all loaded events */
    events,
    /** Raw query data with pages structure */
    data: query.data,
    /** Whether the initial load is in progress */
    isLoading: query.isLoading,
    /** Whether any fetch is in progress */
    isFetching: query.isFetching,
    /** Function to load the next page */
    fetchNextPage: query.fetchNextPage,
    /** Whether there are more pages to load */
    hasNextPage: query.hasNextPage,
    /** Whether the next page is currently being fetched */
    isFetchingNextPage: query.isFetchingNextPage,
    /** Error if the query failed */
    error: query.error,
    /** Refetch all pages */
    refetch: query.refetch,
  };
}

/**
 * Helper hook to flatten pages from any infinite query result.
 *
 * Use this when you have a custom infinite query and need to flatten
 * the pages into a single array.
 *
 * @example
 * const query = api.events.getRecent.useInfiniteQuery(...);
 * const events = useFlattenedEvents(query.data);
 */
export function useFlattenedEvents<T>(
  data: { pages: Array<{ items: T[] }> } | undefined
): T[] {
  return useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );
}
