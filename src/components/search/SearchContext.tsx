"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useSession } from "~/lib/auth-client";
import { api } from "~/trpc/react";
import type { SearchResultEvent } from "~/lib/search/postgres-fts";

/**
 * Search Context - Global search state for the application
 *
 * Story 2.6: Updated to support multiple keyword tags with AND logic
 * Keywords are stored as an array; search requires ALL keywords to match.
 *
 * Party Mode Decision 2025-11-25 (Lag Fix):
 * SearchBar owns local input state and handles debounce internally.
 * Context receives already-debounced/committed values.
 */

interface SearchContextValue {
  /** Array of committed keyword tags (ANDed together) */
  keywords: string[];
  /** Add a new keyword tag */
  addKeyword: (keyword: string) => void;
  /** Remove a keyword tag */
  removeKeyword: (keyword: string) => void;
  /** Clear all keywords and reset search */
  clearSearch: () => void;
  /** Search results from tRPC query */
  searchResults: SearchResultEvent[];
  /** Total count of search results */
  searchResultsTotal: number;
  /** Is search query in flight */
  isSearchLoading: boolean;
  /** Is search active (has at least one keyword) */
  isSearchActive: boolean;
}

const SearchContext = createContext<SearchContextValue | null>(null);

interface SearchProviderProps {
  children: ReactNode;
}

/**
 * SearchProvider - Wraps app to provide global search state
 *
 * Story 2.6: Manages keyword tags array with add/remove operations
 *
 * Handles:
 * - Keyword tags state (array of strings)
 * - tRPC search query with authentication check
 * - Loading state for UI indicators
 */
export function SearchProvider({ children }: SearchProviderProps) {
  const { data: session } = useSession();
  const [keywords, setKeywords] = useState<string[]>([]);

  // Only search when authenticated AND has at least one keyword
  const isSearchActive = keywords.length > 0;

  // tRPC search query - AC 2.4.4: Results in <1s
  const {
    data: searchData,
    isLoading: isSearchLoading,
    isFetching: isSearchFetching,
  } = api.events.search.useQuery(
    { keywords },
    {
      enabled: !!session && isSearchActive,
      // Keep previous data while fetching new results
      placeholderData: (prev) => prev,
    }
  );

  const addKeyword = useCallback((keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    setKeywords((prev) => {
      // Don't add duplicates (case-insensitive)
      if (prev.some((k) => k.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return [...prev, trimmed];
    });
  }, []);

  const removeKeyword = useCallback((keyword: string) => {
    setKeywords((prev) => prev.filter((k) => k !== keyword));
  }, []);

  const clearSearch = useCallback(() => {
    setKeywords([]);
  }, []);

  const value: SearchContextValue = {
    keywords,
    addKeyword,
    removeKeyword,
    clearSearch,
    searchResults: searchData?.events ?? [],
    searchResultsTotal: searchData?.total ?? 0,
    isSearchLoading: isSearchActive && (isSearchLoading || isSearchFetching),
    isSearchActive,
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
