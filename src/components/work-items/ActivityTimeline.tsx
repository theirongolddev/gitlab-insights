"use client";

import { memo } from "react";
import { Avatar } from "@heroui/react";
import type { ActivityItem, ThreadedActivityItem, Reaction } from "~/types/work-items";
import { formatRelativeTime } from "~/lib/utils";
import { HighlightedText } from "~/components/ui/HighlightedText";
import { getEmoji } from "~/lib/emoji-map";
import { GitLabMarkdown } from "~/components/ui/GitLabMarkdown";

interface ActivityTimelineProps {
  activities: ThreadedActivityItem[];
  parentType: "issue" | "merge_request";
  /** Reactions grouped by note ID, fetched on-demand */
  reactions?: Record<number, Reaction[]>;
  onActivityClick?: (activity: ActivityItem) => void;
  /** GitLab instance URL for markdown link resolution */
  gitlabInstanceUrl?: string;
  /** Project path for resolving local refs (#123, !456) */
  projectPath?: string;
  /** Project ID for resolving upload URLs */
  projectId?: number;
}

/**
 * Single activity row - used for both thread starters and replies
 * Memoized to prevent re-renders when parent re-renders with many activities
 */
const ActivityRow = memo(function ActivityRow({
  activity,
  parentType,
  isReply,
  getDotColor,
  reactions,
  onActivityClick,
  gitlabInstanceUrl,
  projectPath,
  projectId,
}: {
  activity: ActivityItem;
  parentType: "issue" | "merge_request";
  isReply: boolean;
  getDotColor: (activity: ActivityItem) => string;
  reactions?: Record<number, Reaction[]>;
  onActivityClick?: (activity: ActivityItem) => void;
  gitlabInstanceUrl?: string;
  projectPath?: string;
  projectId?: number;
}) {
  const dotSize = isReply ? "w-[10px] h-[10px]" : "w-[14px] h-[14px]";
  const dotMargin = isReply ? "mt-1.5 ml-[2px]" : "mt-1";

  return (
    <div
      className={`relative flex gap-3 ${
        onActivityClick ? "cursor-pointer hover:bg-content2 rounded-lg -mx-2 px-2 py-1" : ""
      }`}
      onClick={() => onActivityClick?.(activity)}
    >
      {/* Timeline dot */}
      <div className={`relative z-10 flex-shrink-0 ${dotMargin}`}>
        <div
          className={`${dotSize} rounded-full ${getDotColor(activity)} ${
            activity.isUnread ? "ring-2 ring-[#9DAA5F] ring-offset-1 ring-offset-content1" : ""
          }`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header: author, timestamp */}
        <div className="flex items-center gap-2 flex-wrap">
          {activity.authorAvatar && (
            <Avatar
              src={activity.authorAvatar}
              name={activity.author}
              size="sm"
              className="w-5 h-5"
            />
          )}
          <span
            className={`text-[13px] ${
              activity.isUnread ? "font-semibold text-default-800" : "font-medium text-default-700"
            } ${activity.isSystemNote ? "italic opacity-70" : ""}`}
          >
            {activity.author}
          </span>
          <span className="text-[11px] text-default-400">
            {formatRelativeTime(new Date(activity.timestamp))}
          </span>
          {activity.isSystemNote && (
            <span className="text-[10px] text-default-400 bg-default-100 px-1.5 py-0.5 rounded">
              system
            </span>
          )}
          {isReply && (
            <span className="text-[10px] text-default-400 bg-default-100 px-1.5 py-0.5 rounded">
              reply
            </span>
          )}
        </div>

        {/* Body content */}
        {activity.body && (
          <div
            className={`mt-1 text-[13px] ${
              activity.isSystemNote
                ? "italic text-default-500 opacity-70"
                : activity.isUnread
                  ? "text-default-700"
                  : "text-default-600"
            }`}
          >
            {activity.highlightedBody ? (
              <HighlightedText
                html={activity.highlightedBody}
                className="whitespace-pre-wrap break-words"
              />
            ) : gitlabInstanceUrl ? (
              <GitLabMarkdown
                content={activity.body}
                gitlabInstanceUrl={gitlabInstanceUrl}
                projectPath={projectPath}
                projectId={projectId}
                className="break-words"
              />
            ) : (
              <p className="whitespace-pre-wrap break-words">
                {activity.body}
              </p>
            )}
          </div>
        )}

        {/* Emoji reactions */}
        {(() => {
          const noteReactions = activity.gitlabNoteId
            ? reactions?.[activity.gitlabNoteId]
            : undefined;
          if (!noteReactions || noteReactions.length === 0) return null;
          return (
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {noteReactions.map((reaction) => (
                <div
                  key={reaction.emoji}
                  className="flex items-center gap-1 bg-default-100 hover:bg-default-200 px-2 py-0.5 rounded-full text-xs cursor-default transition-colors"
                  title={reaction.users.map((u) => u.username).join(", ")}
                >
                  <span>{getEmoji(reaction.emoji)}</span>
                  <span className="text-default-600 font-medium">
                    {reaction.users.length}
                  </span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Activity type indicator for non-comment types */}
        {activity.type !== "comment" && activity.type !== "system" && (
          <div className="mt-1">
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded ${
                activity.type === "status_change"
                  ? "bg-green-500/10 text-green-600"
                  : activity.type === "label_change"
                    ? "bg-yellow-500/10 text-yellow-600"
                    : "bg-blue-500/10 text-blue-600"
              }`}
            >
              {activity.type.replace("_", " ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * ActivityTimeline - Vertical timeline of events within a work item
 *
 * Features:
 * - Vertical timeline with left-side colored dots
 * - Purple (#B794F4) for issues, blue (#38BDF8) for MRs, gray for system notes
 * - Threaded comments: replies indented with smaller dots and connecting line
 * - System notes appear inline chronologically
 * - Per-activity unread indicators
 */
export function ActivityTimeline({
  activities,
  parentType,
  reactions,
  onActivityClick,
  gitlabInstanceUrl,
  projectPath,
  projectId,
}: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-default-400">
        No activity yet
      </div>
    );
  }

  const getDotColor = (activity: ActivityItem) => {
    if (activity.isSystemNote || activity.type === "system") {
      return "bg-gray-500";
    }
    if (activity.type === "comment") {
      return parentType === "issue" ? "bg-[#B794F4]" : "bg-[#38BDF8]";
    }
    switch (activity.type) {
      case "status_change":
        return "bg-green-500";
      case "label_change":
        return "bg-yellow-500";
      case "assignment":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="relative">
      {/* Vertical connecting line */}
      <div
        className="absolute left-[7px] top-3 bottom-3 w-[2px] bg-default-300"
        aria-hidden="true"
      />

      {/* Activity threads */}
      <div className="space-y-3">
        {activities.map((thread) => (
          <div key={thread.id}>
            {/* Thread starter */}
            <ActivityRow
              activity={thread}
              parentType={parentType}
              isReply={false}
              getDotColor={getDotColor}
              reactions={reactions}
              onActivityClick={onActivityClick}
              gitlabInstanceUrl={gitlabInstanceUrl}
              projectPath={projectPath}
              projectId={projectId}
            />

            {/* Replies (indented) */}
            {thread.replies.length > 0 && (
              <div className="ml-6 mt-2 pl-3 border-l-2 border-default-300 space-y-2">
                {thread.replies.map((reply) => (
                  <ActivityRow
                    key={reply.id}
                    activity={reply}
                    parentType={parentType}
                    isReply={true}
                    getDotColor={getDotColor}
                    reactions={reactions}
                    onActivityClick={onActivityClick}
                    gitlabInstanceUrl={gitlabInstanceUrl}
                    projectPath={projectPath}
                    projectId={projectId}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
