"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { Button, Chip, Skeleton } from "@heroui/react";
import type { WorkItem, GroupedWorkItems } from "~/types/work-items";
import { WorkItemCard } from "./WorkItemCard";

interface WorkItemSectionProps {
  title: string;
  items: WorkItem[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onMarkAllAsRead: () => void;
  onItemSelect?: (item: WorkItem) => void;
  onItemMarkAsRead?: (itemId: string) => void;
  isMarkingAllAsRead?: boolean;
}

const WorkItemSection = memo(function WorkItemSection({
  title,
  items,
  isCollapsed,
  onToggleCollapse,
  onMarkAllAsRead,
  onItemSelect,
  onItemMarkAsRead,
  isMarkingAllAsRead,
}: WorkItemSectionProps) {
  const unreadCount = useMemo(() => items.filter((i) => i.isUnread).length, [items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
        >
          <span
            className={`transform transition-transform duration-200 text-default-500 ${
              isCollapsed ? "-rotate-90" : ""
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </span>
          <h2 className="text-base font-semibold text-default-700">{title}</h2>
          <Chip size="sm" variant="flat" className="text-xs">
            {items.length}
          </Chip>
          {unreadCount > 0 && (
            <Chip size="sm" className="bg-[#9DAA5F] text-white text-xs">
              {unreadCount} new
            </Chip>
          )}
        </button>

        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="flat"
            color="default"
            onPress={onMarkAllAsRead}
            isLoading={isMarkingAllAsRead}
            className="text-xs"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Section content */}
      {!isCollapsed && (
        <div className="space-y-0">
          {items.map((item) => (
            <WorkItemCard
              key={item.id}
              item={item}
              onSelect={onItemSelect}
              onMarkAsRead={onItemMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
});

interface WorkItemListProps {
  items: GroupedWorkItems | null;
  isLoading?: boolean;
  onItemSelect?: (item: WorkItem) => void;
  onMarkAsRead?: (itemId: string) => void;
  onMarkMultipleAsRead?: (itemIds: string[]) => Promise<void>;
  emptyMessage?: string;
  searchQuery?: string;
}

/**
 * WorkItemList - Container for displaying grouped work items
 *
 * Features:
 * - Grouped sections (Issues, Merge Requests)
 * - Unread count indicator at top (olive when >0, green when zero)
 * - Sort: unread items float to top, then by lastActivityAt desc
 * - Section headers with collapse/expand + "Mark all as read"
 * - Empty states (no items, all read, search no results)
 * - Max-width 1200px container, 16px spacing between cards
 */
export function WorkItemList({
  items,
  isLoading,
  onItemSelect,
  onMarkAsRead,
  onMarkMultipleAsRead,
  emptyMessage = "No work items found",
  searchQuery,
}: WorkItemListProps) {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [markingAllAsRead, setMarkingAllAsRead] = useState<Record<string, boolean>>({});

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleMarkAllAsRead = useCallback(
    async (section: "issues" | "mergeRequests") => {
      if (!items || !onMarkMultipleAsRead) return;

      const sectionItems = section === "issues" ? items.issues : items.mergeRequests;
      const unreadIds = sectionItems.filter((i) => i.isUnread).map((i) => i.id);

      if (unreadIds.length === 0) return;

      setMarkingAllAsRead((prev) => ({ ...prev, [section]: true }));
      try {
        await onMarkMultipleAsRead(unreadIds);
      } finally {
        setMarkingAllAsRead((prev) => ({ ...prev, [section]: false }));
      }
    },
    [items, onMarkMultipleAsRead]
  );

  // Sort items: unread first, then by lastActivityAt desc
  const sortedItems = useMemo(() => {
    if (!items) return null;

    const sortByUnreadThenDate = (a: WorkItem, b: WorkItem) => {
      if (a.isUnread !== b.isUnread) {
        return a.isUnread ? -1 : 1;
      }
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
    };

    return {
      issues: [...items.issues].sort(sortByUnreadThenDate),
      mergeRequests: [...items.mergeRequests].sort(sortByUnreadThenDate),
      totalCount: items.totalCount,
      unreadCount: items.unreadCount,
    };
  }, [items]);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-4 py-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Section skeletons */}
        <div className="space-y-6">
          <div>
            <Skeleton className="h-6 w-32 rounded-lg mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
          <div>
            <Skeleton className="h-6 w-40 rounded-lg mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no items at all
  if (!sortedItems || sortedItems.totalCount === 0) {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-default-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-default-400"
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
          <h2 className="text-lg font-semibold text-default-700 mb-2">
            {searchQuery ? "No results found" : emptyMessage}
          </h2>
          <p className="text-default-500 max-w-md">
            {searchQuery
              ? `No work items match "${searchQuery}". Try adjusting your search.`
              : "When you have issues or merge requests, they'll appear here."}
          </p>
        </div>
      </div>
    );
  }

  // "All caught up" state - items exist but all are read
  if (sortedItems.unreadCount === 0 && sortedItems.totalCount > 0) {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-4 py-6">
        {/* Header with success state */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-default-800">Work Items</h1>
          <Chip
            size="md"
            className="bg-[#22C55E] text-white font-medium"
            startContent={
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            }
          >
            All caught up!
          </Chip>
        </div>

        {/* Sections */}
        <WorkItemSection
          title="Issues"
          items={sortedItems.issues}
          isCollapsed={collapsedSections.issues ?? false}
          onToggleCollapse={() => toggleSection("issues")}
          onMarkAllAsRead={() => handleMarkAllAsRead("issues")}
          onItemSelect={onItemSelect}
          onItemMarkAsRead={onMarkAsRead}
          isMarkingAllAsRead={markingAllAsRead.issues}
        />

        <WorkItemSection
          title="Merge Requests"
          items={sortedItems.mergeRequests}
          isCollapsed={collapsedSections.mergeRequests ?? false}
          onToggleCollapse={() => toggleSection("mergeRequests")}
          onMarkAllAsRead={() => handleMarkAllAsRead("mergeRequests")}
          onItemSelect={onItemSelect}
          onItemMarkAsRead={onMarkAsRead}
          isMarkingAllAsRead={markingAllAsRead.mergeRequests}
        />
      </div>
    );
  }

  // Normal state - has unread items
  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-6">
      {/* Header with unread count */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-default-800">Work Items</h1>
        <Chip size="md" className="bg-[#9DAA5F] text-white font-medium">
          {sortedItems.unreadCount} unread
        </Chip>
      </div>

      {/* Sections */}
      <WorkItemSection
        title="Issues"
        items={sortedItems.issues}
        isCollapsed={collapsedSections.issues ?? false}
        onToggleCollapse={() => toggleSection("issues")}
        onMarkAllAsRead={() => handleMarkAllAsRead("issues")}
        onItemSelect={onItemSelect}
        onItemMarkAsRead={onMarkAsRead}
        isMarkingAllAsRead={markingAllAsRead.issues}
      />

      <WorkItemSection
        title="Merge Requests"
        items={sortedItems.mergeRequests}
        isCollapsed={collapsedSections.mergeRequests ?? false}
        onToggleCollapse={() => toggleSection("mergeRequests")}
        onMarkAllAsRead={() => handleMarkAllAsRead("mergeRequests")}
        onItemSelect={onItemSelect}
        onItemMarkAsRead={onMarkAsRead}
        isMarkingAllAsRead={markingAllAsRead.mergeRequests}
      />
    </div>
  );
}
