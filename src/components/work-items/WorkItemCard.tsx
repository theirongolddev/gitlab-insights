"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { Card, CardBody, Chip, Avatar } from "@heroui/react";
import type { WorkItem } from "~/types/work-items";
import { formatRelativeTime } from "~/lib/utils";
import { ActivityTimeline } from "./ActivityTimeline";
import { ContextBadges, extractKeywords } from "./ContextBadges";
import { useScrollIntoViewRead } from "~/hooks/useScrollIntoViewRead";
import styles from "./WorkItemCard.module.css";

interface WorkItemCardProps {
  item: WorkItem;
  onSelect?: (item: WorkItem) => void;
  onMarkAsRead?: (itemId: string) => void;
}

/**
 * WorkItemCard - Collapsible card for displaying work items (issues/MRs)
 *
 * Features:
 * - Collapsed state: Title, activity summary, context signals
 * - Expanded state: Full activity timeline
 * - Visual distinction for read/unread states
 * - Badge-specific hover interaction for mark as read
 * - Mobile: Touch-friendly targets (min 44px), tighter padding
 *
 * Performance optimizations:
 * - Memoized with React.memo to prevent unnecessary re-renders
 * - Expensive computations (keywords, activity summaries) memoized with useMemo
 */
export const WorkItemCard = memo(function WorkItemCard({ item, onSelect, onMarkAsRead }: WorkItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBadgeHovered, setIsBadgeHovered] = useState(false);

  // Mobile: scroll-into-view marks as read after 2s at 50% visibility
  const scrollRef = useScrollIntoViewRead(item.id, item.isUnread, onMarkAsRead);

  const handleClick = useCallback(() => {
    // Mark as read when selecting (opening side panel)
    if (item.isUnread && onMarkAsRead) {
      onMarkAsRead(item.id);
    }
    if (onSelect) {
      onSelect(item);
    }
  }, [item, onSelect, onMarkAsRead]);

  const handleToggleExpand = useCallback(() => {
    const willExpand = !isExpanded;
    setIsExpanded(willExpand);
    // Mark as read when expanding (if unread)
    if (willExpand && item.isUnread && onMarkAsRead) {
      onMarkAsRead(item.id);
    }
  }, [isExpanded, item.isUnread, item.id, onMarkAsRead]);

  const handleMarkAsRead = useCallback(() => {
    if (onMarkAsRead) {
      onMarkAsRead(item.id);
    }
  }, [item.id, onMarkAsRead]);

  // Memoize expensive computations
  const keywords = useMemo(() => extractKeywords(item.title), [item.title]);

  // Filter activities to show only unread ones in expanded view (AC 1.2)
  const newActivities = useMemo(() => {
    if (!item.activities) return [];
    return item.activities.filter((activity) => activity.isUnread);
  }, [item.activities]);

  const typeIcon = item.type === "issue" ? "I" : "MR";
  const typeColor = item.type === "issue" ? "success" : "secondary";

  const statusColor =
    item.status === "open"
      ? "success"
      : item.status === "merged"
        ? "secondary"
        : "default";

  return (
    <div ref={scrollRef}>
      <Card
        className={`w-full mb-2 transition-all duration-200 cursor-pointer ${item.isUnread
            ? "border-l-2 border-l-[#9DAA5F] bg-content1"
            : "border-l border-l-default-200 opacity-70"
          }`}
        isPressable
        onPress={handleClick}
      >
        <CardBody className="p-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Type badge */}
            <Chip size="sm" color={typeColor} variant="flat" className="shrink-0">
              {typeIcon}
            </Chip>

            {/* Title */}
            <h3
              className={`text-sm truncate flex-1 ${item.isUnread ? "font-semibold" : "font-normal"
                }`}
            >
              {item.title}
            </h3>
          </div>

          {/* Right side: NEW badge or Mark Read button */}
          {/* Mobile: 12px dead zone around badge, 44px min touch target */}
          <div className="flex items-center gap-2 shrink-0 -mr-1 md:mr-0">
            {item.isUnread && (
              <div
                className="relative p-3 -m-3 md:p-0 md:m-0"
                onMouseEnter={() => setIsBadgeHovered(true)}
                onMouseLeave={() => setIsBadgeHovered(false)}
              >
                {isBadgeHovered ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        e.preventDefault();
                        handleMarkAsRead();
                      }
                    }}
                    className="text-xs px-3 py-2 min-h-[44px] flex items-center justify-center rounded-md bg-success-100 text-success-700 hover:bg-success-200 active:bg-success-300 cursor-pointer animate-in fade-in duration-200 md:px-2 md:py-1 md:min-h-0"
                  >
                    Mark Read
                  </div>
                ) : (
                  <Chip
                    size="sm"
                    className="bg-[#9DAA5F] text-white animate-in fade-in duration-200"
                  >
                    NEW
                  </Chip>
                )}
              </div>
            )}

            {/* Expand/collapse toggle - 44px touch target on mobile */}
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  handleToggleExpand();
                }
              }}
              aria-label={isExpanded ? "Collapse" : "Expand"}
              className="w-11 h-11 md:w-8 md:h-8 flex items-center justify-center rounded-md hover:bg-default-100 active:bg-default-200 cursor-pointer"
            >
              <span
                className={`transform transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                  }`}
              >
                v
              </span>
            </div>
          </div>
        </div>

        {/* Description/body preview (if available) */}
        {item.body && (
          <p className="mt-1 text-xs text-default-500 line-clamp-2">
            {item.body}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-2 mt-2 text-xs text-default-500">
          {/* Repository */}
          <span className="truncate max-w-[120px]">{item.repositoryName}</span>

          <span>·</span>

          {/* Number */}
          <span>#{item.number}</span>

          {/* Status */}
          <Chip size="sm" color={statusColor} variant="dot" className="capitalize">
            {item.status}
          </Chip>

          <span>·</span>

          {/* Author with avatar */}
          <div className="flex items-center gap-1">
            <Avatar
              src={item.authorAvatar ?? undefined}
              name={item.author}
              size="sm"
              className="w-4 h-4"
            />
            <span className="truncate max-w-[100px]">@{item.author}</span>
          </div>

          {/* Timestamp */}
          <span className="ml-auto">{formatRelativeTime(item.lastActivityAt)}</span>
        </div>

        {/* Activity summary */}
        {item.activitySummary.totalCount > 0 && (
          <div className="flex items-center gap-2 mt-2 text-xs text-default-500">
            <span>
              {item.activitySummary.totalCount} comment
              {item.activitySummary.totalCount !== 1 ? "s" : ""}
            </span>
            {item.activitySummary.newCount > 0 && (
              <Chip size="sm" color="warning" variant="flat">
                {item.activitySummary.newCount} new
              </Chip>
            )}
          </div>
        )}

        {/* Latest activity preview */}
        {item.activitySummary.latestActivity && (
          <div className="mt-2 text-xs text-default-500 truncate">
            <span className="font-medium">{item.activitySummary.latestActivity.author}:</span>{" "}
            <span className="italic">&ldquo;{item.activitySummary.latestActivity.preview}&ldquo;</span>
          </div>
        )}

        {/* Related items */}
        {(item.type === "merge_request" && item.closesIssueIds.length > 0) && (
          <div className="mt-2 text-xs text-default-500">
            <span>Closes: </span>
            {item.closesIssueIds.map((issueId, idx) => (
              <span key={issueId}>
                {idx > 0 && ", "}
                <span className="text-success">#{issueId}</span>
              </span>
            ))}
          </div>
        )}
        {(item.type === "issue" && item.closedByMRIds.length > 0) && (
          <div className="mt-2 text-xs text-default-500">
            <span>Closed by: </span>
            {item.closedByMRIds.map((mrId, idx) => (
              <span key={mrId}>
                {idx > 0 && ", "}
                <span className="text-secondary">!{mrId}</span>
              </span>
            ))}
          </div>
        )}

        {/* Context badges (repo, keywords extracted from title) */}
        <ContextBadges
          repositoryName={item.repositoryName}
          keywords={keywords}
          className="mt-2"
        />

        {/* Labels */}
        {item.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.labels.slice(0, 3).map((label) => (
              <Chip key={label} size="sm" variant="bordered" className="text-xs">
                {label}
              </Chip>
            ))}
            {item.labels.length > 3 && (
              <Chip size="sm" variant="flat" className="text-xs">
                +{item.labels.length - 3}
              </Chip>
            )}
          </div>
        )}

        {/* Participants */}
        {item.activitySummary.participants.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            {item.activitySummary.participants.slice(0, 5).map((p) => (
              <Avatar
                key={p.username}
                src={p.avatarUrl ?? undefined}
                name={p.username}
                size="sm"
                className="w-6 h-6"
              />
            ))}
            {item.activitySummary.participants.length > 5 && (
              <span className="text-xs text-default-500">
                +{item.activitySummary.participants.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Expanded content: Activity timeline with grid-based animation */}
        <div
          className={`${styles.expandContainer} ${isExpanded ? styles.expanded : ""}`}
        >
          <div className={styles.expandContent}>
            <div className="mt-4 pt-4 border-t border-default-200">
              {newActivities.length > 0 ? (
                <ActivityTimeline activities={newActivities} parentType={item.type} />
              ) : (
                <p className="text-center py-4 text-sm text-default-500">
                  No new activity since you last viewed this item
                </p>
              )}
            </div>
          </div>
        </div>
        </CardBody>
      </Card>
    </div>
  );
});
