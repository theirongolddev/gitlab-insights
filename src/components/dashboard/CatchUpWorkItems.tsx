"use client";

import { useState, useCallback, lazy, Suspense } from "react";
import { Button, Skeleton, Chip } from "@heroui/react";
import { CheckCheck } from "lucide-react";
import { api } from "~/trpc/react";
import { WorkItemList } from "~/components/work-items/WorkItemList";
import { useMarkAsRead } from "~/hooks/useMarkAsRead";
import { useDetailPane } from "~/contexts/DetailPaneContext";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import type { WorkItem } from "~/types/work-items";

// Lazy load SidePanelDetail for code splitting
const SidePanelDetail = lazy(() =>
  import("~/components/work-items/SidePanelDetail").then((module) => ({
    default: module.SidePanelDetail,
  }))
);

/**
 * CatchUpWorkItems - Work-item-based catch-up view
 *
 * Replaces the old query-based CatchUpView with type-based grouping (Issues/MRs).
 * Features:
 * - WorkItemList with grouped sections (Issues, MRs)
 * - Side panel for work item details
 * - Read tracking integration
 * - "Mark All as Read" button
 * - Responsive layout
 */
export function CatchUpWorkItems() {
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);
  const { isOpen, setIsOpen } = useDetailPane();
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Fetch grouped work items
  const {
    data: workItemsData,
    isLoading,
    error,
  } = api.workItems.getGrouped.useQuery({
    limit: 50,
    filters: {
      status: ["open"],
    },
  });

  // Fetch details for selected item
  const { data: detailData, isLoading: isDetailLoading } =
    api.workItems.getWithActivity.useQuery(
      { id: selectedItem?.id ?? "", includeRelated: true },
      { enabled: !!selectedItem }
    );

  // Read tracking
  const { markAsRead, markMultipleAsRead, isMarkingMultiple } = useMarkAsRead();

  // Handle item selection
  const handleItemSelect = useCallback(
    (item: WorkItem) => {
      setSelectedItem(item);
      setIsOpen(true);
    },
    [setIsOpen]
  );

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
    if (!workItemsData?.items) return;

    const allUnreadIds = [
      ...workItemsData.items.issues.filter((i) => i.isUnread).map((i) => i.id),
      ...workItemsData.items.mergeRequests
        .filter((i) => i.isUnread)
        .map((i) => i.id),
    ];

    if (allUnreadIds.length > 0) {
      await markMultipleAsRead(allUnreadIds);
    }
  }, [workItemsData?.items, markMultipleAsRead]);

  // Handle closing detail panel
  const handleCloseDetail = useCallback(() => {
    setIsOpen(false);
    setSelectedItem(null);
  }, [setIsOpen]);

  // Handle clicking related item
  const handleRelatedItemClick = useCallback((item: WorkItem) => {
    setSelectedItem(item);
  }, []);

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

  const shouldShowPane = isOpen && !isMobile && selectedItem;

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

      {/* Main content with split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Work item list */}
        <div
          className={`flex-1 overflow-y-auto transition-all duration-200 ${
            shouldShowPane ? "w-[60%]" : "w-full"
          }`}
        >
          <WorkItemList
            items={workItemsData?.items ?? null}
            isLoading={isLoading}
            onItemSelect={handleItemSelect}
            onMarkAsRead={handleMarkAsRead}
            onMarkMultipleAsRead={handleMarkMultipleAsRead}
            emptyMessage="No work items to catch up on"
          />
        </div>

        {/* Detail panel - slides in from right */}
        {!isMobile && (
          <div
            className={`border-l border-default-200 bg-content1 overflow-hidden flex-shrink-0 transition-all duration-200 ease-out ${
              shouldShowPane ? "w-[40%] min-w-[400px] max-w-[600px]" : "w-0"
            }`}
          >
            {shouldShowPane && (
              <Suspense
                fallback={
                  <div className="h-full flex flex-col bg-content1">
                    <div className="flex items-center justify-between p-4 border-b border-default-200">
                      <div className="flex items-center gap-2 flex-1">
                        <Skeleton className="w-8 h-6 rounded" />
                        <Skeleton className="w-3/4 h-6 rounded" />
                      </div>
                      <Skeleton className="w-8 h-8 rounded" />
                    </div>
                    <div className="flex-1 p-4 space-y-4">
                      <Skeleton className="w-full h-20 rounded-lg" />
                      <Skeleton className="w-full h-16 rounded-lg" />
                      <Skeleton className="w-full h-16 rounded-lg" />
                      <Skeleton className="w-3/4 h-16 rounded-lg" />
                    </div>
                  </div>
                }
              >
                <SidePanelDetail
                  workItem={detailData?.workItem ?? selectedItem}
                  activities={detailData?.activities ?? []}
                  relatedWorkItems={detailData?.relatedWorkItems}
                  isLoading={isDetailLoading}
                  onClose={handleCloseDetail}
                  onMarkAsRead={handleMarkAsRead}
                  onRelatedItemClick={handleRelatedItemClick}
                />
              </Suspense>
            )}
          </div>
        )}

        {/* Mobile: Full-screen overlay */}
        {isMobile && selectedItem && isOpen && (
          <div className="fixed inset-0 z-50 bg-content1">
            <Suspense
              fallback={
                <div className="h-full flex flex-col bg-content1">
                  <div className="flex items-center justify-between p-4 border-b border-default-200">
                    <div className="flex items-center gap-2 flex-1">
                      <Skeleton className="w-8 h-6 rounded" />
                      <Skeleton className="w-3/4 h-6 rounded" />
                    </div>
                    <Skeleton className="w-8 h-8 rounded" />
                  </div>
                  <div className="flex-1 p-4 space-y-4">
                    <Skeleton className="w-full h-20 rounded-lg" />
                    <Skeleton className="w-full h-16 rounded-lg" />
                    <Skeleton className="w-full h-16 rounded-lg" />
                    <Skeleton className="w-3/4 h-16 rounded-lg" />
                  </div>
                </div>
              }
            >
              <SidePanelDetail
                workItem={detailData?.workItem ?? selectedItem}
                activities={detailData?.activities ?? []}
                relatedWorkItems={detailData?.relatedWorkItems}
                isLoading={isDetailLoading}
                onClose={handleCloseDetail}
                onMarkAsRead={handleMarkAsRead}
                onRelatedItemClick={handleRelatedItemClick}
              />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
