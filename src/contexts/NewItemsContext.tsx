"use client";

/**
 * NewItemsContext - Centralized provider for new items data
 *
 * Story 3.4: Sidebar New Item Badges
 * AC 3.4.5: Badge count is accurate and derived from a single data source shared with CatchUpModeToggle
 * AC 3.4.8: New items data is fetched once at AppLayout level and shared via context
 * AC 3.4.9: React Query configured with appropriate staleTime (30s) and refetchOnWindowFocus: false
 * AC 3.4.10: Badge gracefully handles loading and error states
 *
 * Data Flow:
 * 1. NewItemsProvider fetches queries.list → gets query IDs
 * 2. NewItemsProvider fetches getNewItems for each query (N parallel requests, once)
 * 3. Context exposes { queries, queriesWithNewCounts, newItemsResults, totalNewCount, isLoading }
 * 4. All consumers read from cache - zero duplicate requests
 *
 * Code Review Fix: Also expose queries and newItemsResults for CatchUpView consumption
 */

import { createContext, useContext, type ReactNode } from "react";
import { api, type RouterOutputs } from "~/trpc/react";

type Query = RouterOutputs["queries"]["list"][number];
type NewItemsResult = RouterOutputs["queries"]["getNewItems"];

interface QueryWithNewCount {
  queryId: string;
  queryName: string;
  newCount: number;
}

interface NewItemsContextValue {
  /** List of user's saved queries with counts */
  queries: Query[];
  /** Summary of new counts per query (for badges) */
  queriesWithNewCounts: QueryWithNewCount[];
  /** Full new items results including events (for CatchUpView) */
  newItemsResults: Array<{ data: NewItemsResult | undefined; isLoading: boolean; isError: boolean }>;
  /** Total new items across all queries */
  totalNewCount: number;
  /** Whether initial data is still loading */
  isLoading: boolean;
  /** Whether queries list is loading */
  isQueriesLoading: boolean;
  /** Whether all new items queries have finished loading */
  allNewItemsLoaded: boolean;
}

const NewItemsContext = createContext<NewItemsContextValue | null>(null);

interface NewItemsProviderProps {
  children: ReactNode;
}

/**
 * NewItemsProvider - Fetches new items data once and shares via context
 *
 * AC 3.4.8: Fetches data once at AppLayout level
 * AC 3.4.9: Configured with staleTime: 30s, refetchOnWindowFocus: false
 *
 * Code Review Fix: Also expose queries and newItemsResults for CatchUpView
 */
export function NewItemsProvider({ children }: NewItemsProviderProps) {
  // Fetch list of user's queries
  const queriesQuery = api.queries.list.useQuery(undefined, {
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const queries = queriesQuery.data ?? [];
  const queryIds = queries.map((q) => q.id);

  // AC 3.4.9: Fetch new items for each query with optimized cache settings
  const newItemsQueries = api.useQueries((t) =>
    queryIds.length > 0
      ? queryIds.map((queryId) =>
          t.queries.getNewItems(
            { queryId },
            {
              staleTime: 30 * 1000,
              refetchOnWindowFocus: false,
            }
          )
        )
      : []
  );

  // AC 3.4.10: Check loading state (either queries list or any new items query loading)
  const isQueriesLoading = queriesQuery.isLoading;
  const allNewItemsLoaded = newItemsQueries.every((q) => !q.isLoading);
  const isLoading = isQueriesLoading || (queryIds.length > 0 && !allNewItemsLoaded);

  // AC 3.4.10: Handle error states gracefully (return empty arrays, log errors)
  // Note: Using console.error for client-side logging (pino is server-only)
  if (queriesQuery.isError) {
    console.error("Failed to fetch queries list:", queriesQuery.error);
  }

  const errorQueries = newItemsQueries.filter((q) => q.isError);
  if (errorQueries.length > 0) {
    console.error("Failed to fetch new items for some queries:", errorQueries.length, "errors");
  }

  // AC 3.4.5: Derive queriesWithNewCounts from query results
  const queriesWithNewCounts: QueryWithNewCount[] = newItemsQueries
    .filter((q) => q.data)
    .map((q) => ({
      queryId: q.data!.queryId,
      queryName: q.data!.queryName,
      newCount: q.data!.newCount,
    }));

  // AC 3.4.5: Derive totalNewCount by summing all newCount values
  const totalNewCount = queriesWithNewCounts.reduce(
    (sum, q) => sum + q.newCount,
    0
  );

  // Code Review Fix: Expose newItemsResults for CatchUpView to consume
  const newItemsResults = newItemsQueries.map((q) => ({
    data: q.data,
    isLoading: q.isLoading,
    isError: q.isError,
  }));

  return (
    <NewItemsContext.Provider
      value={{
        queries,
        queriesWithNewCounts,
        newItemsResults,
        totalNewCount,
        isLoading,
        isQueriesLoading,
        allNewItemsLoaded,
      }}
    >
      {children}
    </NewItemsContext.Provider>
  );
}

/**
 * useNewItems hook - Access new items context
 * @throws Error if used outside NewItemsProvider
 */
export function useNewItems(): NewItemsContextValue {
  const context = useContext(NewItemsContext);

  if (!context) {
    throw new Error("useNewItems must be used within NewItemsProvider");
  }

  return context;
}
