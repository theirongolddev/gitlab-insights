"use client";

import { memo } from "react";
import { ClipboardList, CheckCircle, Search, MessageCircle } from "lucide-react";

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
 * Colors use semantic tokens from design system:
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
    <div className={`flex flex-col items-center justify-center py-12 animate-fade-in ${className}`}>
      <div className="w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-default-200 dark:bg-default-100">
        <ClipboardList
          className="w-6 h-6 text-default-500"
          aria-hidden="true"
        />
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
    <div className={`flex flex-col items-center justify-center py-12 animate-fade-in ${className}`}>
      <div className="w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-success/20 dark:bg-success/10">
        <CheckCircle
          className="w-6 h-6 text-success dark:text-success"
          aria-hidden="true"
        />
      </div>
      <p className="text-sm font-medium text-center text-success dark:text-success">
        All caught up!
      </p>
      <p className="text-xs text-default-500 text-center mt-1">
        You&apos;ve reviewed all work items.
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
    <div className={`flex flex-col items-center justify-center py-12 animate-fade-in ${className}`}>
      <div className="w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-default-200 dark:bg-default-100">
        <Search
          className="w-6 h-6 text-default-500"
          aria-hidden="true"
        />
      </div>
      <p className="text-sm text-default-500 text-center max-w-xs">
        No work items match{" "}
        <span className="font-medium text-default-700 dark:text-default-300">
          &quot;{searchTerm}&quot;
        </span>
        . Try different keywords.
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
    <div className={`flex flex-col items-center justify-center py-6 animate-fade-in ${className}`}>
      <MessageCircle
        className="w-8 h-8 text-default-300 mb-2"
        aria-hidden="true"
      />
      <p className="text-sm text-default-500 text-center">
        No activity yet on this work item.
      </p>
    </div>
  );
});
