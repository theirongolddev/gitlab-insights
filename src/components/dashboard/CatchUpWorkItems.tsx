"use client";

import { useState, useCallback, useMemo } from "react";
import { Button, Skeleton, Chip, Checkbox } from "@heroui/react";
import { CheckCheck } from "lucide-react";
import { api } from "~/trpc/react";
import { WorkItemList } from "~/components/work-items/WorkItemList";
import { useMarkAsRead } from "~/hooks/useMarkAsRead";
import type { WorkItem } from "~/types/work-items";

interface CatchUpWorkItemsProps {
  searchQuery?: string;
  showClosed?: boolean;
  onShowClosedChange?: (showClosed: boolean) => void;
}

/**
 * CatchUpWorkItems - Work-item-based catch-up view
 *
 * Features:
 * - WorkItemList with grouped sections (Issues, MRs)
 * - Read tracking integration
 * - "Mark All as Read" button
 * - Responsive layout
 * - Optional search filter via searchQuery prop
 * - Optional showClosed toggle for closed/merged items
 */
export function CatchUpWorkItems({ searchQuery, showClosed = false, onShowClosedChange }: CatchUpWorkItemsProps) {
  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(() => {
    const statusFilter = searchQuery
      ? undefined
      : showClosed
        ? undefined
        : (["open"] as ("open" | "closed" | "merged")[]);

    return {
      status: statusFilter,
      unreadOnly: searchQuery ? undefined : true,
      search: searchQuery,
    };
  }, [searchQuery, showClosed]);

  // Fetch grouped work items
  const {
    data: workItemsData,
    isLoading,
    error,
  } = api.workItems.getGrouped.useQuery({
    limit: 50,
    filters,
  });

  // Read tracking
  const { markAsRead, markMultipleAsRead, isMarkingMultiple } = useMarkAsRead();

  // Handle item selection (placeholder for Bead 4 detail view)
  const handleItemSelect = useCallback((item: WorkItem) => {
    // Will be implemented in Bead 4 to show detail view
    console.log("Item selected:", item.id);
  }, []);

  // Handle marking item as read
  const handleMarkAsRead = useCallback(
    (itemId: string) => {
      markAsRead(itemId);
    },
    [markAsRead]
  );

  // Handle marking multiple items as read
  const handleMarkMultipleAsRead = useCallback(
    async (itemIds: string[]) => {
      await markMultipleAsRead(itemIds);
    },
    [markMultipleAsRead]
  );

  // Handle marking all visible items as read
  const handleMarkAllAsRead = useCallback(async () => {
    const items = workItemsData?.items;
    if (!items) return;

    const allUnreadIds = [
      ...items.issues.filter((i) => i.isUnread).map((i) => i.id),
      ...items.mergeRequests.filter((i) => i.isUnread).map((i) => i.id),
    ];

    if (allUnreadIds.length > 0) {
      await markMultipleAsRead(allUnreadIds);
    }
  }, [workItemsData, markMultipleAsRead]);

  const unreadCount = workItemsData?.items.unreadCount ?? 0;

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-danger-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-danger"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-default-700 mb-2">
          Failed to load work items
        </h2>
        <p className="text-default-500 max-w-md">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with unread count and Mark All button */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-default-200 bg-content1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-default-600">
              {isLoading ? (
                <Skeleton className="w-32 h-5 rounded" />
              ) : (
                <>
                  {unreadCount > 0 ? (
                    <>
                      <Chip
                        size="sm"
                        color="danger"
                        variant="flat"
                        className="mr-2"
                      >
                        {unreadCount}
                      </Chip>
                      unread item{unreadCount !== 1 ? "s" : ""}
                    </>
                  ) : (
                    "All caught up!"
                  )}
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {onShowClosedChange && (
              <Checkbox
                size="sm"
                isSelected={showClosed}
                onValueChange={onShowClosedChange}
                classNames={{
                  label: "text-sm text-default-600",
                }}
              >
                Show closed
              </Checkbox>
            )}
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="flat"
                color="primary"
                startContent={<CheckCheck className="w-4 h-4" />}
                onPress={handleMarkAllAsRead}
                isLoading={isMarkingMultiple}
              >
                Mark All as Read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Work item list - full width */}
      <div className="flex-1 overflow-y-auto">
        <WorkItemList
          items={workItemsData?.items ?? null}
          isLoading={isLoading}
          onItemSelect={handleItemSelect}
          onMarkAsRead={handleMarkAsRead}
          onMarkMultipleAsRead={handleMarkMultipleAsRead}
          emptyMessage="No work items to catch up on"
        />
      </div>
    </div>
  );
}
