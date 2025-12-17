"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { Card, CardBody, Chip, Avatar } from "@heroui/react";
import type { WorkItem } from "~/types/work-items";
import { formatRelativeTime } from "~/lib/utils";
import { ActivityTimeline } from "./ActivityTimeline";
import { ContextBadges, extractKeywords } from "./ContextBadges";
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
 * - Hover interaction for mark as read
 *
 * Performance optimizations:
 * - Memoized with React.memo to prevent unnecessary re-renders
 * - Expensive computations (keywords, activity summaries) memoized with useMemo
 */
export const WorkItemCard = memo(function WorkItemCard({ item, onSelect, onMarkAsRead }: WorkItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
  
  const typeIcon = item.type === "issue" ? "I" : "MR";
  const typeColor = item.type === "issue" ? "success" : "secondary";

  const statusColor =
    item.status === "open"
      ? "success"
      : item.status === "merged"
        ? "secondary"
        : "default";

  return (
    <Card
      className={`mb-2 transition-all duration-200 cursor-pointer ${
        item.isUnread
          ? "border-l-2 border-l-[#9DAA5F] bg-content1"
          : "border-l border-l-default-200 opacity-80"
      }`}
      isPressable
      onPress={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
              className={`text-sm truncate flex-1 ${
                item.isUnread ? "font-semibold" : "font-normal"
              }`}
            >
              {item.title}
            </h3>
          </div>

          {/* Right side: NEW badge or Mark Read button */}
          <div className="flex items-center gap-2 shrink-0">
            {item.isUnread && (
              <div className="relative">
                {isHovered ? (
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
                    className="text-xs px-2 py-1 rounded-md bg-success-100 text-success-700 hover:bg-success-200 cursor-pointer animate-in fade-in duration-200"
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

            {/* Expand/collapse toggle */}
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
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-default-100 cursor-pointer"
            >
              <span
                className={`transform transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              >
                v
              </span>
            </div>
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-2 mt-2 text-xs text-default-500">
          {/* Repository */}
          <span className="truncate max-w-[120px]">{item.repositoryName}</span>

          <span>-</span>

          {/* Number */}
          <span>#{item.number}</span>

          {/* Status */}
          <Chip size="sm" color={statusColor} variant="dot" className="capitalize">
            {item.status}
          </Chip>

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
            {item.activitySummary.latestActivity && (
              <span className="truncate">
                Latest by {item.activitySummary.latestActivity.author}
              </span>
            )}
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
              {item.activities && item.activities.length > 0 ? (
                <ActivityTimeline activities={item.activities} parentType={item.type} />
              ) : (
                <p className="text-center py-4 text-sm text-default-500">
                  Click to open detail pane for full activity timeline
                </p>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
});
