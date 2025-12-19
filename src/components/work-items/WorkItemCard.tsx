"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { Card, CardBody, Chip, Avatar, Checkbox } from "@heroui/react";
import type { WorkItem } from "~/types/work-items";
import { formatRelativeTime } from "~/lib/utils";
import { ContextBadges, extractKeywords } from "./ContextBadges";
import { HighlightedText } from "~/components/ui/HighlightedText";

interface WorkItemCardProps {
  item: WorkItem;
  onSelect?: (item: WorkItem) => void;
  onMarkAsRead?: (itemId: string) => void;
  /** When true, hides all read/unread visual indicators (for dashboard view) */
  hideReadIndicators?: boolean;
  /** Whether this item is selected (for multi-select) */
  isSelected?: boolean;
  /** Callback to toggle selection (for multi-select) */
  onToggleSelect?: (itemId: string) => void;
}

/**
 * WorkItemCard - Card for displaying work items (issues/MRs)
 *
 * Features:
 * - Title, activity summary, context signals
 * - Visual distinction for read/unread states (unless hideReadIndicators is true)
 * - Badge-specific hover interaction for mark as read
 * - Mobile: Touch-friendly targets (min 44px), tighter padding
 *
 * Performance optimizations:
 * - Memoized with React.memo to prevent unnecessary re-renders
 * - Expensive computations (keywords) memoized with useMemo
 */
export const WorkItemCard = memo(function WorkItemCard({
  item,
  onSelect,
  onMarkAsRead,
  hideReadIndicators = false,
  isSelected = false,
  onToggleSelect,
}: WorkItemCardProps) {
  const [isBadgeHovered, setIsBadgeHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (onSelect) {
      onSelect(item);
    }
  }, [item, onSelect]);

  const handleMarkAsRead = useCallback(() => {
    if (onMarkAsRead) {
      onMarkAsRead(item.id);
    }
  }, [item.id, onMarkAsRead]);

  const handleToggleSelect = useCallback((e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(item.id);
    }
  }, [item.id, onToggleSelect]);

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

  // Determine card styling based on read state and hideReadIndicators
  const showUnreadStyling = item.isUnread && !hideReadIndicators;
  const cardClassName = hideReadIndicators
    ? "w-full mb-2 transition-all duration-200 cursor-pointer border-l border-l-default-200 bg-content1"
    : `w-full mb-2 transition-all duration-200 cursor-pointer ${
        item.isUnread
          ? "border-l-2 border-l-[#9DAA5F] bg-content1"
          : "border-l border-l-default-200 opacity-70"
      }`;

  return (
    <Card
      className={cardClassName}
      isPressable
      onPress={handleClick}
    >
      <CardBody className="p-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Selection checkbox (catchup view only) */}
            {onToggleSelect && (
              <div
                onClick={handleToggleSelect}
                className="shrink-0 -ml-1"
              >
                <Checkbox
                  isSelected={isSelected}
                  onChange={handleToggleSelect}
                  size="sm"
                  aria-label={`Select ${item.title}`}
                  classNames={{
                    wrapper: "before:border-default-300",
                  }}
                />
              </div>
            )}

            {/* Type badge */}
            <Chip size="sm" color={typeColor} variant="flat" className="shrink-0">
              {typeIcon}
            </Chip>

            {/* Title - bold only if unread and not hiding indicators */}
            {item.highlightedTitle ? (
              <HighlightedText
                html={item.highlightedTitle}
                className={`text-sm truncate flex-1 ${
                  showUnreadStyling ? "font-semibold" : "font-normal"
                }`}
              />
            ) : (
              <h3
                className={`text-sm truncate flex-1 ${
                  showUnreadStyling ? "font-semibold" : "font-normal"
                }`}
              >
                {item.title}
              </h3>
            )}
          </div>

          {/* Right side: NEW badge or Mark Read button (only when not hiding indicators) */}
          {!hideReadIndicators && (
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
            </div>
          )}
        </div>

        {/* Description/body preview (if available) */}
        {item.body && (
          item.highlightedSnippet ? (
            <HighlightedText
              html={item.highlightedSnippet}
              className="mt-1 text-xs text-default-500 line-clamp-2"
            />
          ) : (
            <p className="mt-1 text-xs text-default-500 line-clamp-2">
              {item.body}
            </p>
          )
        )}

        {/* Matching child snippet - shows where the search match was found in comments */}
        {item.matchingChildSnippet && (
          <div className="mt-1 text-xs">
            <span className="text-default-400 italic">Match in comment: </span>
            <HighlightedText
              html={item.matchingChildSnippet}
              className="text-default-500 line-clamp-2"
            />
          </div>
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
            <span className="italic">&ldquo;{item.activitySummary.latestActivity.preview}&rdquo;</span>
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
      </CardBody>
    </Card>
  );
});
