"use client";

import { Button } from "@heroui/react";
import { toast } from "sonner";
import { api } from "~/trpc/react";

/**
 * MarkAsReviewedButton - Per-query button to mark a saved query as reviewed
 *
 * Story 3.3: Mark Query as Reviewed
 * AC 3.3.1: Button appears in each query section header in Catch-Up Mode
 * AC 3.3.3: After marking as reviewed, new item count updates to 0 (optimistic)
 * AC 3.3.5: On mutation failure, error toast displays using Sonner
 * AC 3.3.8: Button is disabled when query has 0 new items
 */

interface MarkAsReviewedButtonProps {
  queryId: string;
  queryName: string;
  newCount: number;
  onSuccess?: () => void;
  /** Called when mutation starts (for tracking pending mutations) */
  onMutationStart?: () => void;
  /** Called when mutation ends (success or error) */
  onMutationEnd?: () => void;
}

export function MarkAsReviewedButton({
  queryId,
  queryName,
  newCount,
  onSuccess,
  onMutationStart,
  onMutationEnd,
}: MarkAsReviewedButtonProps) {
  const utils = api.useUtils();

  const mutation = api.queries.markAsReviewed.useMutation({
    // AC 3.3.3: Optimistic update - set newCount to 0 immediately
    onMutate: async ({ queryId }) => {
      // Notify parent that mutation is starting (for race condition prevention)
      onMutationStart?.();

      // Cancel outgoing fetches
      await utils.queries.getNewItems.cancel({ queryId });

      // Snapshot previous value
      const previousData = utils.queries.getNewItems.getData({ queryId });

      // Optimistically update to zero new items
      utils.queries.getNewItems.setData({ queryId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          newCount: 0,
          events: [],
        };
      });

      return { previousData };
    },

    onSuccess: () => {
      // Invalidate queries to refetch fresh data
      void utils.queries.getNewItems.invalidate({ queryId });
      void utils.queries.list.invalidate();
      onSuccess?.();
      // Notify parent that mutation ended
      onMutationEnd?.();
    },

    // AC 3.3.5: Show error toast on failure, rollback optimistic update
    onError: (_error, variables, context) => {
      // Rollback to previous data
      if (context?.previousData) {
        utils.queries.getNewItems.setData(
          { queryId: variables.queryId },
          context.previousData
        );
      }
      toast.error(`Couldn't mark "${queryName}" as reviewed`);
      // Notify parent that mutation ended
      onMutationEnd?.();
    },
  });

  return (
    <Button
      variant="flat"
      size="sm"
      isDisabled={newCount === 0}
      isLoading={mutation.isPending}
      startContent={
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      }
      onPress={() => mutation.mutate({ queryId })}
    >
      Mark as Reviewed
    </Button>
  );
}
