"use client";

import { useState, useCallback, useRef } from "react";
import { api } from "~/trpc/react";
import { WorkItemList } from "~/components/work-items/WorkItemList";
import { WorkItemDetailView } from "~/components/work-items/WorkItemDetailView";
import { useMarkAsRead } from "~/hooks/useMarkAsRead";
import type { WorkItem } from "~/types/work-items";

/**
 * CatchUpClient - Main client component for /catch-up page
 *
 * Features:
 * - WorkItemList with grouped sections (Issues, MRs)
 * - Full-width detail view when item is selected
 * - Read tracking integration
 * - Scroll position preservation on back navigation
 */
export function CatchUpClient() {
  // Detail view state
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const listContainerRef = useRef<HTMLDivElement>(null);

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

  // Read tracking
  const { markAsRead, markMultipleAsRead } = useMarkAsRead();

  // Handle item selection - show detail view
  const handleItemSelect = useCallback((item: WorkItem) => {
    // Save scroll position before switching to detail view
    scrollPositionRef.current = listContainerRef.current?.scrollTop ?? 0;
    setSelectedItemId(item.id);
  }, []);

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
    <div ref={listContainerRef} className="h-full overflow-y-auto">
      <WorkItemList
        items={workItemsData?.items ?? null}
        isLoading={isLoading}
        onItemSelect={handleItemSelect}
        onMarkAsRead={handleMarkAsRead}
        onMarkMultipleAsRead={handleMarkMultipleAsRead}
        emptyMessage="No work items to catch up on"
      />
    </div>
  );
}
