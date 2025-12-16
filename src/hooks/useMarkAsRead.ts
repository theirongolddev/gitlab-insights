"use client";

import { useCallback, useRef } from "react";
import { api } from "~/trpc/react";

/**
 * useMarkAsRead - Hook for managing work item read state
 *
 * Features:
 * - markAsRead(id): Mark single item as read with optimistic update
 * - markMultipleAsRead(ids): Batch mark as read
 * - Optimistic updates: immediately update local cache before server confirms
 * - Query invalidation: refetch unread counts after mutations
 * - Race condition handling: debounce rapid clicks via pending IDs set
 *
 * THREE INTERACTION PATHS:
 * 1. Mark Read button click -> markAsRead
 * 2. Expand card in-place -> markAsRead
 * 3. Open side panel -> markAsRead
 */
export function useMarkAsRead() {
  const utils = api.useUtils();

  // Track pending mutations to prevent race conditions
  const pendingIdsRef = useRef<Set<string>>(new Set());

  // Helper to update work item in cache data
  const updateWorkItemInCache = (
    data: NonNullable<ReturnType<typeof utils.workItems.getGrouped.getData>>,
    workItemId: string
  ) => {
    const updateItem = (items: typeof data.items.issues) =>
      items.map((item) =>
        item.id === workItemId
          ? { ...item, isUnread: false, lastReadAt: new Date() }
          : item
      );

    const updatedIssues = updateItem(data.items.issues);
    const updatedMRs = updateItem(data.items.mergeRequests);

    // Only decrement if item was actually unread
    const wasUnread =
      data.items.issues.some((i) => i.id === workItemId && i.isUnread) ||
      data.items.mergeRequests.some((i) => i.id === workItemId && i.isUnread);

    return {
      ...data,
      items: {
        ...data.items,
        issues: updatedIssues,
        mergeRequests: updatedMRs,
        unreadCount: wasUnread
          ? Math.max(0, data.items.unreadCount - 1)
          : data.items.unreadCount,
      },
    };
  };

  // Single item mutation
  const markAsReadMutation = api.workItems.markAsRead.useMutation({
    onMutate: async ({ workItemId }) => {
      // Skip if already pending
      if (pendingIdsRef.current.has(workItemId)) {
        return { previousData: undefined };
      }
      pendingIdsRef.current.add(workItemId);

      // Cancel outgoing refetches to prevent overwriting optimistic update
      await utils.workItems.getGrouped.cancel();

      // Get all cached queries and update them optimistically
      const queryClient = utils.workItems.getGrouped;
      
      // We can't easily snapshot all queries, so we'll rely on invalidation for rollback
      // Update all cached getGrouped queries regardless of their input params
      queryClient.setData(
        { limit: 50, filters: { status: ["open"] } },
        (old) => (old ? updateWorkItemInCache(old, workItemId) : old)
      );

      return { previousData: undefined };
    },
    onError: (_err, { workItemId }) => {
      pendingIdsRef.current.delete(workItemId);
      // Invalidate to refetch correct state on error
      void utils.workItems.getGrouped.invalidate();
    },
    onSettled: (_data, _error, { workItemId }) => {
      pendingIdsRef.current.delete(workItemId);
      // Invalidate to ensure consistency
      void utils.workItems.getGrouped.invalidate();
    },
  });

  // Helper to update multiple work items in cache data
  const updateMultipleWorkItemsInCache = (
    data: NonNullable<ReturnType<typeof utils.workItems.getGrouped.getData>>,
    workItemIds: string[]
  ) => {
    const idsSet = new Set(workItemIds);
    const updateItem = (items: typeof data.items.issues) =>
      items.map((item) =>
        idsSet.has(item.id)
          ? { ...item, isUnread: false, lastReadAt: new Date() }
          : item
      );

    const updatedIssues = updateItem(data.items.issues);
    const updatedMRs = updateItem(data.items.mergeRequests);

    // Count how many were actually unread
    const unreadCountReduction =
      data.items.issues.filter((i) => idsSet.has(i.id) && i.isUnread).length +
      data.items.mergeRequests.filter((i) => idsSet.has(i.id) && i.isUnread).length;

    return {
      ...data,
      items: {
        ...data.items,
        issues: updatedIssues,
        mergeRequests: updatedMRs,
        unreadCount: Math.max(0, data.items.unreadCount - unreadCountReduction),
      },
    };
  };

  // Batch mutation
  const markMultipleAsReadMutation = api.workItems.markMultipleAsRead.useMutation({
    onMutate: async ({ workItemIds }) => {
      // Filter out already pending items
      const newIds = workItemIds.filter((id) => !pendingIdsRef.current.has(id));
      if (newIds.length === 0) {
        return { newIds: [] };
      }

      newIds.forEach((id) => pendingIdsRef.current.add(id));

      // Cancel outgoing refetches
      await utils.workItems.getGrouped.cancel();

      // Update cached query with the params used by CatchUpClient
      utils.workItems.getGrouped.setData(
        { limit: 50, filters: { status: ["open"] } },
        (old) => (old ? updateMultipleWorkItemsInCache(old, newIds) : old)
      );

      return { newIds };
    },
    onError: (_err, _vars, context) => {
      context?.newIds?.forEach((id) => pendingIdsRef.current.delete(id));
      // Invalidate to refetch correct state on error
      void utils.workItems.getGrouped.invalidate();
    },
    onSettled: (_data, _error, _vars, context) => {
      context?.newIds?.forEach((id) => pendingIdsRef.current.delete(id));
      // Invalidate to ensure consistency
      void utils.workItems.getGrouped.invalidate();
    },
  });

  // Stable callback for marking single item as read
  const markAsRead = useCallback(
    (workItemId: string) => {
      // Skip if already pending
      if (pendingIdsRef.current.has(workItemId)) {
        return;
      }
      markAsReadMutation.mutate({ workItemId });
    },
    [markAsReadMutation]
  );

  // Stable callback for marking multiple items as read
  const markMultipleAsRead = useCallback(
    async (workItemIds: string[]) => {
      if (workItemIds.length === 0) return;

      // Filter out already pending items
      const newIds = workItemIds.filter((id) => !pendingIdsRef.current.has(id));
      if (newIds.length === 0) return;

      await markMultipleAsReadMutation.mutateAsync({ workItemIds: newIds });
    },
    [markMultipleAsReadMutation]
  );

  // Check if a specific item is pending
  const isPending = useCallback((workItemId: string) => {
    return pendingIdsRef.current.has(workItemId);
  }, []);

  return {
    markAsRead,
    markMultipleAsRead,
    isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingMultiple: markMultipleAsReadMutation.isPending,
  };
}
