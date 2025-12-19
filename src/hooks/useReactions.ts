/**
 * useReactions Hook
 *
 * Fetches and caches emoji reactions for comments from GitLab.
 * Uses react-query with aggressive caching since reactions change infrequently.
 */

import { api } from "~/trpc/react";

interface UseReactionsOptions {
  repositoryPath: string; // From workItem.repositoryPath
  noteableType: "issue" | "merge_request";
  noteableIid: number; // From workItem.number
  noteIds: number[];
}

/**
 * Fetches and caches emoji reactions for comments
 *
 * Caching strategy:
 * - staleTime: 5 min (reactions change infrequently)
 * - gcTime: 30 min (keep in memory for back navigation)
 * - No refetch on window focus (avoid unnecessary API calls)
 *
 * @param options - Repository path, noteable type/IID, and note IDs
 * @returns Query result with reactions grouped by note ID
 */
export function useReactions({
  repositoryPath,
  noteableType,
  noteableIid,
  noteIds,
}: UseReactionsOptions) {
  return api.workItems.getReactions.useQuery(
    { repositoryPath, noteableType, noteableIid, noteIds },
    {
      enabled: noteIds.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1, // Only retry once on failure
    }
  );
}
