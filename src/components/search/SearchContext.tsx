"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "~/lib/auth-client";
import { api } from "~/trpc/react";
import type { SearchResultEvent } from "~/lib/search/postgres-fts";

/**
 * Search Context - Global search state for the application
 *
 * Story 2.4: Party Mode Decision 2025-11-25 (Lag Fix)
 * SearchBar owns local input state and handles debounce internally.
 * Context receives already-debounced values - no double-debounce.
 * This isolates re-renders: typing updates SearchBar only, context
 * consumers (Dashboard) only re-render on debounced changes.
 */

interface SearchContextValue {
  /** Current search query (already debounced by SearchBar) */
  searchQuery: string;
  /** Update search query (called by SearchBar with debounced value) */
  setSearchQuery: (query: string) => void;
  /** Search results from tRPC query */
  searchResults: SearchResultEvent[];
  /** Total count of search results */
  searchResultsTotal: number;
  /** Is search query in flight */
  isSearchLoading: boolean;
  /** Is search active (has query) */
  isSearchActive: boolean;
  /** Clear search and reset to empty state */
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

interface SearchProviderProps {
  children: ReactNode;
}

/**
 * SearchProvider - Wraps app to provide global search state
 *
 * Handles:
 * - Search query state (receives debounced values from SearchBar)
 * - tRPC search query with authentication check
 * - Loading state for UI indicators (AC 2.4.3)
 *
 * Note: Debounce (AC 2.4.2) is handled in SearchBar for performance.
 */
export function SearchProvider({ children }: SearchProviderProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");

  // Only search when authenticated AND has query
  const isSearchActive = searchQuery.length > 0;

  // tRPC search query - AC 2.4.4: Results in <1s
  const {
    data: searchData,
    isLoading: isSearchLoading,
    isFetching: isSearchFetching,
  } = api.events.search.useQuery(
    { keyword: searchQuery },
    {
      enabled: !!session && isSearchActive,
      // Keep previous data while fetching new results
      placeholderData: (prev) => prev,
    }
  );

  const clearSearch = () => {
    setSearchQuery("");
  };

  const value: SearchContextValue = {
    searchQuery,
    setSearchQuery,
    searchResults: searchData?.events ?? [],
    searchResultsTotal: searchData?.total ?? 0,
    isSearchLoading: isSearchActive && (isSearchLoading || isSearchFetching),
    isSearchActive,
    clearSearch,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

/**
 * Hook to access search context
 * Must be used within SearchProvider
 */
export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
