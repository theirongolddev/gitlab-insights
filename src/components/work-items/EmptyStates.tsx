"use client";

import { memo } from "react";

interface EmptyStateProps {
  className?: string;
}

interface SearchEmptyStateProps extends EmptyStateProps {
  searchTerm: string;
}

/**
 * EmptyStates - Components for edge case empty states
 *
 * Design: Clean, minimal (icon + text + optional CTA)
 * Colors:
 * - NO_ITEMS: neutral gray
 * - ALL_READ: green success, celebratory but professional
 * - SEARCH_NO_RESULTS: neutral with search term highlighted
 * - NO_ACTIVITIES: neutral gray (within expanded card)
 */

/**
 * No work items found - shown when filters return no results
 */
export const NoItemsState = memo(function NoItemsState({
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div
        className="w-12 h-12 mb-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "hsl(0, 0%, 20%)" }}
      >
        <svg
          className="w-6 h-6"
          style={{ color: "hsl(0, 0%, 50%)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <p className="text-sm text-default-500 text-center max-w-xs">
        No work items found. Try adjusting your filters or check back later.
      </p>
    </div>
  );
});

/**
 * All items read - shown when user has reviewed everything
 */
export const AllReadState = memo(function AllReadState({
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div
        className="w-12 h-12 mb-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "hsl(142, 71%, 25%)" }}
      >
        <svg
          className="w-6 h-6"
          style={{ color: "#22C55E" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <p
        className="text-sm font-medium text-center"
        style={{ color: "#22C55E" }}
      >
        All caught up!
      </p>
      <p className="text-xs text-default-500 text-center mt-1">
        You've reviewed all work items.
      </p>
    </div>
  );
});

/**
 * Search returned no results - shown with the search term highlighted
 */
export const SearchNoResultsState = memo(function SearchNoResultsState({
  searchTerm,
  className = "",
}: SearchEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div
        className="w-12 h-12 mb-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "hsl(0, 0%, 20%)" }}
      >
        <svg
          className="w-6 h-6"
          style={{ color: "hsl(0, 0%, 50%)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <p className="text-sm text-default-500 text-center max-w-xs">
        No work items match{" "}
        <span className="font-medium text-default-400">"{searchTerm}"</span>.
        Try different keywords.
      </p>
    </div>
  );
});

/**
 * No activity on work item - shown in expanded card
 */
export const NoActivitiesState = memo(function NoActivitiesState({
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-6 ${className}`}>
      <p className="text-sm text-default-500 text-center">
        No activity yet on this work item.
      </p>
    </div>
  );
});
