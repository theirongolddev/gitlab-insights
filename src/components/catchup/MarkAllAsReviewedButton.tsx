"use client";

import { Button } from "@heroui/react";
import { toast } from "sonner";
import { api, type RouterOutputs } from "~/trpc/react";

/**
 * MarkAllAsReviewedButton - Button to mark all user queries as reviewed
 *
 * Story 3.3: Mark Query as Reviewed
 * AC 3.3.9: "Mark All as Reviewed" button appears in header when totalNewCount > 0
 * AC 3.3.10: Updates lastVisitedAt for ALL user queries with single batch operation
 *
 * Code Review Fix (2025-12-05):
 * - Added true optimistic update: sets all getNewItems data to newCount: 0, events: []
 * - Added proper rollback: stores previousDataMap for restoration on error
 */

interface MarkAllAsReviewedButtonProps {
  totalNewCount: number;
  onSuccess?: () => void;
  /** Disable button when individual mark-as-reviewed mutations are pending (prevents race condition) */
  isDisabledByPendingMutation?: boolean;
}

type GetNewItemsData = RouterOutputs["queries"]["getNewItems"];

export function MarkAllAsReviewedButton({
  totalNewCount,
  onSuccess,
  isDisabledByPendingMutation = false,
}: MarkAllAsReviewedButtonProps) {
  const utils = api.useUtils();

  const mutation = api.queries.markAllAsReviewed.useMutation({
    // True optimistic update: set all getNewItems data to 0 immediately
    onMutate: async () => {
      // Cancel all outgoing fetches for new items
      await utils.queries.getNewItems.cancel();

      // Get all cached getNewItems data entries
      const cache = utils.queries.getNewItems.getData;
      const previousDataMap = new Map<string, GetNewItemsData | undefined>();

      // Get list of all queries to find their IDs
      const queriesList = utils.queries.list.getData();
      const queryIds = queriesList?.map((q) => q.id) ?? [];

      // Store previous data and optimistically update each query
      for (const queryId of queryIds) {
        const previousData = cache({ queryId });
        previousDataMap.set(queryId, previousData);

        // Optimistically set to zero new items
        if (previousData) {
          utils.queries.getNewItems.setData({ queryId }, {
            ...previousData,
            newCount: 0,
            events: [],
          });
        }
      }

      return { previousDataMap };
    },

    onSuccess: () => {
      // Invalidate all queries to refetch fresh data
      void utils.queries.getNewItems.invalidate();
      void utils.queries.list.invalidate();
      onSuccess?.();
    },

    // Show error toast on failure and rollback optimistic update
    onError: (_error, _variables, context) => {
      // Rollback to previous data
      if (context?.previousDataMap) {
        for (const [queryId, previousData] of context.previousDataMap) {
          if (previousData) {
            utils.queries.getNewItems.setData({ queryId }, previousData);
          }
        }
      }
      toast.error("Couldn't mark queries as reviewed");
    },
  });

  return (
    <Button
      variant="bordered"
      size="sm"
      isDisabled={totalNewCount === 0 || isDisabledByPendingMutation}
      isLoading={mutation.isPending}
      onPress={() => mutation.mutate()}
    >
      Mark All as Reviewed
    </Button>
  );
}
