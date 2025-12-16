"use client";

import { useEffect, useRef, useCallback } from "react";
import { Button, Chip, Avatar, Skeleton } from "@heroui/react";
import type { WorkItem, ActivityItem } from "~/types/work-items";
import { ActivityTimeline } from "./ActivityTimeline";
import { formatRelativeTime } from "~/lib/utils";

interface RelatedWorkItems {
  closes: WorkItem[];
  closedBy: WorkItem[];
  mentioned: WorkItem[];
}

interface SidePanelDetailProps {
  workItem: WorkItem | null;
  activities: ActivityItem[];
  relatedWorkItems?: RelatedWorkItems;
  isLoading?: boolean;
  onClose: () => void;
  onMarkAsRead?: (itemId: string) => void;
  onRelatedItemClick?: (item: WorkItem) => void;
}

/**
 * SidePanelDetail - Side panel for deep-dive work item detail view
 *
 * Features:
 * - Split-screen pattern: slides in from right (60% width on desktop)
 * - Panel header: work item title, type badge, close button
 * - Full activity timeline using ActivityTimeline component
 * - Related work section (closes/closedBy/mentions)
 * - AUTO-SCROLL: scrolls to newest unread activity on open
 * - Animation: 200ms slide-in ease-out
 */
export function SidePanelDetail({
  workItem,
  activities,
  relatedWorkItems,
  isLoading,
  onClose,
  onMarkAsRead,
  onRelatedItemClick,
}: SidePanelDetailProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-mark as read and scroll to first unread activity on open
  useEffect(() => {
    if (!workItem || isLoading) return;

    // Mark as read when panel opens (if unread)
    if (workItem.isUnread && onMarkAsRead) {
      onMarkAsRead(workItem.id);
    }

    // Find the first unread activity
    const firstUnreadIndex = activities.findIndex((a) => a.isUnread);

    if (firstUnreadIndex >= 0 && scrollContainerRef.current) {
      // Small delay to allow panel animation to complete
      const timeoutId = setTimeout(() => {
        const unreadElement = scrollContainerRef.current?.querySelector(
          `[data-activity-index="${firstUnreadIndex}"]`
        );
        if (unreadElement) {
          unreadElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 250);

      return () => clearTimeout(timeoutId);
    }
  }, [workItem?.id, workItem?.isUnread, activities, isLoading, onMarkAsRead]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleMarkAsRead = useCallback(() => {
    if (workItem && onMarkAsRead) {
      onMarkAsRead(workItem.id);
    }
  }, [workItem, onMarkAsRead]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-content1">
        {/* Header skeleton */}
        <div className="flex items-center justify-between p-4 border-b border-default-200">
          <div className="flex items-center gap-2 flex-1">
            <Skeleton className="w-8 h-6 rounded" />
            <Skeleton className="w-3/4 h-6 rounded" />
          </div>
          <Skeleton className="w-8 h-8 rounded" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="w-full h-20 rounded-lg" />
          <Skeleton className="w-full h-16 rounded-lg" />
          <Skeleton className="w-full h-16 rounded-lg" />
          <Skeleton className="w-3/4 h-16 rounded-lg" />
        </div>
      </div>
    );
  }

  // Empty state
  if (!workItem) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-content1 text-default-500">
        <svg
          className="w-16 h-16 mb-4 opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-sm">Select a work item to view details</p>
      </div>
    );
  }

  const typeIcon = workItem.type === "issue" ? "I" : "MR";
  const typeColor = workItem.type === "issue" ? "success" : "secondary";
  const statusColor =
    workItem.status === "open"
      ? "success"
      : workItem.status === "merged"
        ? "secondary"
        : "default";

  const hasRelatedItems =
    relatedWorkItems &&
    (relatedWorkItems.closes.length > 0 ||
      relatedWorkItems.closedBy.length > 0 ||
      relatedWorkItems.mentioned.length > 0);

  return (
    <div className="h-full flex flex-col bg-content1">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-default-200 bg-content2/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Chip size="sm" color={typeColor} variant="flat">
              {typeIcon}
            </Chip>
            <span className="text-xs text-default-500">
              {workItem.repositoryName} #{workItem.number}
            </span>
            <Chip size="sm" color={statusColor} variant="dot" className="capitalize">
              {workItem.status}
            </Chip>
          </div>
          <h2 className="text-base font-semibold text-default-800 line-clamp-2">
            {workItem.title}
          </h2>
          <div className="flex items-center gap-2 mt-2 text-xs text-default-500">
            <Avatar
              src={workItem.authorAvatar ?? undefined}
              name={workItem.author}
              size="sm"
              className="w-5 h-5"
            />
            <span>{workItem.author}</span>
            <span>-</span>
            <span>{formatRelativeTime(new Date(workItem.lastActivityAt))}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {workItem.isUnread && onMarkAsRead && (
            <Button size="sm" variant="flat" color="success" onPress={handleMarkAsRead}>
              Mark Read
            </Button>
          )}
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onClose}
            aria-label="Close detail panel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {/* Labels */}
        {workItem.labels.length > 0 && (
          <div className="px-4 py-3 border-b border-default-100">
            <div className="flex flex-wrap gap-1">
              {workItem.labels.map((label) => (
                <Chip key={label} size="sm" variant="bordered" className="text-xs">
                  {label}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-default-700 mb-3">
            Activity ({activities.length})
          </h3>
          {activities.length > 0 ? (
            <ActivityTimeline
              activities={activities}
              parentType={workItem.type}
              onActivityClick={(activity) => {
                if (activity.gitlabUrl) {
                  window.open(activity.gitlabUrl, "_blank", "noopener,noreferrer");
                }
              }}
            />
          ) : (
            <p className="text-sm text-default-400 text-center py-4">No activity yet</p>
          )}
        </div>

        {/* Related Work Items */}
        {hasRelatedItems && (
          <div className="px-4 pb-4">
            <h3 className="text-sm font-medium text-default-700 mb-3 pt-3 border-t border-default-200">
              Related Work Items
            </h3>

            {/* Closes (MR closes these issues) */}
            {relatedWorkItems.closes.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs text-default-500 mb-2">Closes</h4>
                <div className="space-y-1">
                  {relatedWorkItems.closes.map((item) => (
                    <RelatedItemRow
                      key={item.id}
                      item={item}
                      onClick={() => onRelatedItemClick?.(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Closed By (issue is closed by these MRs) */}
            {relatedWorkItems.closedBy.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs text-default-500 mb-2">Closed By</h4>
                <div className="space-y-1">
                  {relatedWorkItems.closedBy.map((item) => (
                    <RelatedItemRow
                      key={item.id}
                      item={item}
                      onClick={() => onRelatedItemClick?.(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Mentioned In */}
            {relatedWorkItems.mentioned.length > 0 && (
              <div>
                <h4 className="text-xs text-default-500 mb-2">Mentioned In</h4>
                <div className="space-y-1">
                  {relatedWorkItems.mentioned.map((item) => (
                    <RelatedItemRow
                      key={item.id}
                      item={item}
                      onClick={() => onRelatedItemClick?.(item)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Open in GitLab link */}
        <div className="px-4 pb-4">
          <Button
            as="a"
            href={workItem.gitlabUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="flat"
            color="primary"
            size="sm"
            className="w-full"
            startContent={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            }
          >
            Open in GitLab
          </Button>
        </div>
      </div>
    </div>
  );
}

interface RelatedItemRowProps {
  item: WorkItem;
  onClick?: () => void;
}

function RelatedItemRow({ item, onClick }: RelatedItemRowProps) {
  const typeIcon = item.type === "issue" ? "I" : "MR";
  const typeColor = item.type === "issue" ? "success" : "secondary";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-content2 transition-colors text-left"
    >
      <Chip size="sm" color={typeColor} variant="flat" className="shrink-0">
        {typeIcon}
      </Chip>
      <span className="text-xs text-default-500 shrink-0">#{item.number}</span>
      <span className="text-sm text-default-700 truncate flex-1">{item.title}</span>
      {item.isUnread && (
        <Chip size="sm" className="bg-[#9DAA5F] text-white shrink-0">
          NEW
        </Chip>
      )}
    </button>
  );
}
