"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { Card, CardBody, Chip, Avatar } from "@heroui/react";
import { Bug, CircleDot, GitMerge, ChevronDown, MessageSquare, GitCommit, ArrowRightLeft, Clock } from "lucide-react";
import type { WorkItem } from "~/types/work-items";
import { formatRelativeTime } from "~/lib/utils";
import styles from "./WorkItemCard.module.css";

interface WorkItemCardProps {
  item: WorkItem;
  onSelect?: (item: WorkItem) => void;
  onMarkAsRead?: (itemId: string) => void;
}

/**
 * WorkItemCard - Collapsible card for displaying work items (issues/MRs)
 *
 * Design matches PRD wireframe:
 * - Collapsed: icon + repo/number, title, body preview, author footer
 * - Expanded: Activity timeline with event icons
 */
export const WorkItemCard = memo(function WorkItemCard({ item, onSelect, onMarkAsRead }: WorkItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBadgeHovered, setIsBadgeHovered] = useState(false);

  const handleClick = useCallback(() => {
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
    if (willExpand && item.isUnread && onMarkAsRead) {
      onMarkAsRead(item.id);
    }
  }, [isExpanded, item.isUnread, item.id, onMarkAsRead]);

  const handleMarkAsRead = useCallback(() => {
    if (onMarkAsRead) {
      onMarkAsRead(item.id);
    }
  }, [item.id, onMarkAsRead]);

  // Compute author initials for avatar fallback
  const authorInitials = useMemo(() => {
    const names = item.author.split(/[._-]/);
    if (names.length >= 2) {
      return (names[0]?.[0] ?? "") + (names[1]?.[0] ?? "");
    }
    return item.author.slice(0, 2).toUpperCase();
  }, [item.author]);

  // Filter activities to show only unread ones in expanded view
  const newActivities = useMemo(() => {
    if (!item.activities) return [];
    return item.activities.filter((activity) => activity.isUnread);
  }, [item.activities]);

  // Determine type icon and color
  const isBug = item.labels.some(l => l.toLowerCase().includes('bug'));
  const TypeIcon = item.type === "merge_request" ? GitMerge : (isBug ? Bug : CircleDot);
  const typeIconColor = item.type === "merge_request"
    ? "text-purple-500"
    : (isBug ? "text-orange-500" : "text-blue-500");
  const typeIconBg = item.type === "merge_request"
    ? "bg-purple-500/20"
    : (isBug ? "bg-orange-500/20" : "bg-blue-500/20");

  // Get priority label if exists
  const priorityLabel = item.labels.find(l =>
    l.toLowerCase().includes('priority') ||
    l.toLowerCase() === 'high' ||
    l.toLowerCase() === 'medium' ||
    l.toLowerCase() === 'low' ||
    l.toLowerCase() === 'critical'
  );
  const priorityColor = priorityLabel?.toLowerCase().includes('high') || priorityLabel?.toLowerCase() === 'critical'
    ? "danger"
    : priorityLabel?.toLowerCase().includes('medium')
      ? "warning"
      : "default";

  return (
    <Card
      className={`w-full mb-2 transition-all duration-200 cursor-pointer ${
        item.isUnread
          ? "border-l-2 border-l-[#9DAA5F] bg-content1"
          : "border-l border-l-default-200 opacity-70"
      }`}
      isPressable
      onPress={handleClick}
    >
      <CardBody className="p-4">
        {/* Header: Type icon + repo · #number */}
        <div className="flex items-start gap-3">
          {/* Type icon */}
          <div className={`w-10 h-10 rounded-lg ${typeIconBg} flex items-center justify-center shrink-0`}>
            <TypeIcon className={`w-5 h-5 ${typeIconColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Repo and number */}
            <div className="flex items-center gap-1 text-xs text-default-500">
              <span>{item.repositoryName}</span>
              <span>·</span>
              <span>#{item.number}</span>
            </div>

            {/* Title */}
            <h3 className={`text-sm mt-0.5 ${item.isUnread ? "font-semibold" : "font-normal"}`}>
              {item.title}
            </h3>

            {/* Body preview - show first ~100 chars if available */}
            {item.activitySummary.latestActivity?.preview && (
              <p className="text-xs text-default-400 mt-1 line-clamp-2">
                {item.activitySummary.latestActivity.preview}
              </p>
            )}

            {/* Footer: Avatar + @author · timestamp + priority */}
            <div className="flex items-center gap-2 mt-3">
              <Avatar
                src={item.authorAvatar || undefined}
                name={authorInitials}
                showFallback
                size="sm"
                classNames={{
                  base: "w-5 h-5",
                  fallback: "text-[8px]",
                }}
              />
              <span className="text-xs text-default-500">@{item.author}</span>
              <span className="text-xs text-default-400">·</span>
              <Clock className="w-3 h-3 text-default-400" />
              <span className="text-xs text-default-400">{formatRelativeTime(item.lastActivityAt)}</span>

              {priorityLabel && (
                <Chip size="sm" color={priorityColor} variant="flat" className="ml-2 text-xs uppercase">
                  {priorityLabel.replace(/priority::/i, '').replace(/priority/i, '').trim() || priorityLabel}
                </Chip>
              )}
            </div>
          </div>

          {/* Right side: NEW badge + expand toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {item.isUnread && (
              <div
                className="relative"
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
                    className="text-xs px-2 py-1 rounded-md bg-success-100 text-success-700 hover:bg-success-200 cursor-pointer"
                  >
                    Mark Read
                  </div>
                ) : (
                  <Chip size="sm" className="bg-[#9DAA5F] text-white">
                    NEW
                  </Chip>
                )}
              </div>
            )}

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
              <ChevronDown
                className={`w-4 h-4 transform transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>
        </div>

        {/* Expanded content: Activity timeline */}
        <div className={`${styles.expandContainer} ${isExpanded ? styles.expanded : ""}`}>
          <div className={styles.expandContent}>
            <div className="mt-4 pt-4 border-t border-default-200">
              <h4 className="text-xs font-semibold text-default-500 uppercase tracking-wider mb-3">
                Activity
              </h4>

              {newActivities.length > 0 ? (
                <div className="space-y-3">
                  {newActivities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
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
  );
});

// Activity item component for expanded view
interface ActivityItemProps {
  activity: {
    id: string;
    type: string;
    author: string;
    authorAvatar: string | null;
    body: string | null;
    timestamp: Date;
    isSystemNote: boolean;
  };
}

function ActivityItem({ activity }: ActivityItemProps) {
  // Determine icon based on activity type
  const getActivityIcon = () => {
    if (activity.isSystemNote) {
      if (activity.body?.toLowerCase().includes('status')) {
        return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
      }
      if (activity.body?.toLowerCase().includes('mentioned')) {
        return <GitMerge className="w-4 h-4 text-purple-500" />;
      }
      return <GitCommit className="w-4 h-4 text-default-400" />;
    }
    return <MessageSquare className="w-4 h-4 text-default-400" />;
  };

  // Format activity text
  const getActivityText = () => {
    if (activity.isSystemNote) {
      return activity.body ?? "System update";
    }
    return `commented: "${activity.body?.slice(0, 100)}${(activity.body?.length ?? 0) > 100 ? '...' : ''}"`;
  };

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-default-100 flex items-center justify-center shrink-0">
        {getActivityIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <span className="font-medium text-primary">@{activity.author}</span>
          <span className="text-default-600 ml-1">{getActivityText()}</span>
        </div>
        <div className="text-xs text-default-400 mt-0.5">
          {formatRelativeTime(activity.timestamp)}
        </div>
      </div>
    </div>
  );
}
