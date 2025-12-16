"use client";

import { memo } from "react";

interface UnreadCountIndicatorProps {
  unreadCount: number;
  className?: string;
}

/**
 * UnreadCountIndicator - Displays unread count at top of work item list
 *
 * States:
 * - unreadCount > 0: Shows "X NEW ITEMS" in olive badge
 * - unreadCount === 0: Shows "All caught up!" in green success badge
 *
 * Design specs:
 * - 13px semibold text
 * - Pill shape with 12px border-radius
 * - Sticky positioning (remains visible during scroll)
 * - Real-time updates via tRPC query invalidation
 */
export const UnreadCountIndicator = memo(function UnreadCountIndicator({
  unreadCount,
  className = "",
}: UnreadCountIndicatorProps) {
  if (unreadCount > 0) {
    return (
      <div
        className={`sticky top-0 z-10 py-2 bg-background/80 backdrop-blur-sm ${className}`}
      >
        <span
          className="inline-flex items-center px-3 py-1 rounded-xl text-[13px] font-semibold"
          style={{
            backgroundColor: "#9DAA5F",
            color: "white",
          }}
        >
          {unreadCount} NEW ITEM{unreadCount !== 1 ? "S" : ""}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`sticky top-0 z-10 py-2 bg-background/80 backdrop-blur-sm ${className}`}
    >
      <span
        className="inline-flex items-center px-3 py-1 rounded-xl text-[13px] font-semibold"
        style={{
          backgroundColor: "#22C55E",
          color: "white",
        }}
      >
        All caught up!
      </span>
    </div>
  );
});
