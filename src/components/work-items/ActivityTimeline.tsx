"use client";

import { Avatar } from "@heroui/react";
import type { ActivityItem } from "~/types/work-items";
import { formatRelativeTime } from "~/lib/utils";

interface ActivityTimelineProps {
  activities: ActivityItem[];
  parentType: "issue" | "merge_request";
  onActivityClick?: (activity: ActivityItem) => void;
}

/**
 * ActivityTimeline - Vertical timeline of events within a work item
 *
 * Features:
 * - Vertical timeline with left-side colored dots
 * - Purple (#B794F4) for issues, blue (#38BDF8) for MRs, gray for comments
 * - Connecting line (2px gray-600)
 * - Event text (13px), timestamps (11px, gray-400)
 * - System notes: italic, lower opacity
 * - User comments: normal styling
 * - Per-activity unread indicators (bold if isUnread)
 * - 12px spacing between items
 */
export function ActivityTimeline({
  activities,
  parentType,
  onActivityClick,
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
    // Status changes, label changes, assignments
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

      {/* Activity items */}
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={`relative flex gap-3 ${
              onActivityClick ? "cursor-pointer hover:bg-content2 rounded-lg -mx-2 px-2 py-1" : ""
            }`}
            onClick={() => onActivityClick?.(activity)}
          >
            {/* Timeline dot */}
            <div className="relative z-10 flex-shrink-0 mt-1">
              <div
                className={`w-[14px] h-[14px] rounded-full ${getDotColor(activity)} ${
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
                  <p className="whitespace-pre-wrap break-words line-clamp-4">
                    {activity.body}
                  </p>
                </div>
              )}

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
        ))}
      </div>
    </div>
  );
}
