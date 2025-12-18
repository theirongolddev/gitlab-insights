"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { Button, Skeleton, Chip, Checkbox } from "@heroui/react";
import { CheckCheck, X } from "lucide-react";
import { api } from "~/trpc/react";
import { WorkItemList } from "~/components/work-items/WorkItemList";
import { WorkItemDetailView } from "~/components/work-items/WorkItemDetailView";
import { useMarkAsRead } from "~/hooks/useMarkAsRead";
import type { WorkItem } from "~/types/work-items";

interface CatchUpWorkItemsProps {
  searchQuery?: string;
  showClosed?: boolean;
  onShowClosedChange?: (showClosed: boolean) => void;
  /** When true, hides read/unread visual indicators (for dashboard view) */
  hideReadIndicators?: boolean;
}

/**
 * CatchUpWorkItems - Work-item-based catch-up view
 *
 * Features:
 * - WorkItemList with grouped sections (Issues, MRs)
 * - Full-width detail view when item is selected
 * - Read tracking integration
 * - "Mark All as Read" button
 * - Responsive layout
 * - Scroll position preservation on back navigation
 */
export function CatchUpWorkItems({ searchQuery, showClosed = false, onShowClosedChange, hideReadIndicators = false }: CatchUpWorkItemsProps) {
  // Detail view state
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Multi-select state (Gmail-style, catchup view only)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  // Handle item selection - show detail view
  const handleItemSelect = useCallback((item: WorkItem) => {
    // Save scroll position before switching to detail view
    scrollPositionRef.current = listContainerRef.current?.scrollTop ?? 0;
    // In catchup view, mark as read when opening detail
    if (!hideReadIndicators && item.isUnread) {
      markAsRead(item.id);
    }
    setSelectedItemId(item.id);
  }, [hideReadIndicators, markAsRead]);

  // Handle back from detail view - restore scroll position
  const handleBack = useCallback(() => {
    setSelectedItemId(null);
    // Restore scroll position after DOM update
    requestAnimationFrame(() => {
      listContainerRef.current?.scrollTo(0, scrollPositionRef.current);
    });
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

  // Toggle selection for multi-select (Gmail-style)
  const handleToggleSelect = useCallback((itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  // Clear all selections
  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Mark selected items as read
  const handleMarkSelectedAsRead = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await markMultipleAsRead(Array.from(selectedIds));
    setSelectedIds(new Set());
  }, [selectedIds, markMultipleAsRead]);

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

  // Error state (only for list view errors)
  if (error && !selectedItemId) {
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

  // Detail view - replaces list when item is selected
  if (selectedItemId) {
    return (
      <div className="h-full">
        <WorkItemDetailView workItemId={selectedItemId} onBack={handleBack} />
      </div>
    );
  }

  // List view
  return (
    <div className="flex flex-col h-full">
      {/* Header - catchup view shows selection/unread UI, dashboard view shows only filter */}
      {hideReadIndicators ? (
        /* Dashboard view - minimal header with just filter toggle */
        onShowClosedChange && (
          <div className="flex-shrink-0 px-4 py-3 border-b border-default-200 bg-content1">
            <div className="flex items-center justify-end">
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
            </div>
          </div>
        )
      ) : (
        /* Catchup view - full header with selection actions or unread count */
        <div className="flex-shrink-0 px-4 py-3 border-b border-default-200 bg-content1">
          {selectedIds.size > 0 ? (
            /* Selection action bar */
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Chip size="sm" color="primary" variant="flat">
                  {selectedIds.size} selected
                </Chip>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  startContent={<CheckCheck className="w-4 h-4" />}
                  onPress={handleMarkSelectedAsRead}
                  isLoading={isMarkingMultiple}
                >
                  Mark as Read
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onPress={handleClearSelection}
                  aria-label="Clear selection"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* Default header with unread count */
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
          )}
        </div>
      )}

      {/* Work item list - full width */}
      <div ref={listContainerRef} className="flex-1 overflow-y-auto">
        <WorkItemList
          items={workItemsData?.items ?? null}
          isLoading={isLoading}
          onItemSelect={handleItemSelect}
          onMarkAsRead={handleMarkAsRead}
          onMarkMultipleAsRead={handleMarkMultipleAsRead}
          emptyMessage="No work items to catch up on"
          hideReadIndicators={hideReadIndicators}
          selectedIds={hideReadIndicators ? undefined : selectedIds}
          onToggleSelect={hideReadIndicators ? undefined : handleToggleSelect}
        />
      </div>
    </div>
  );
}
