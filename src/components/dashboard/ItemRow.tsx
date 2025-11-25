"use client";

import { Badge, type EventType } from "./Badge";

export interface DashboardEvent {
  id: string;
  type: EventType;
  title: string;
  body: string | null;
  author: string;
  authorAvatar: string | null;
  project: string;
  labels: string[];
  gitlabUrl: string;
  createdAt: Date;
  /** FTS relevance rank (only present for search results) */
  rank?: number;
}

interface ItemRowProps {
  item: DashboardEvent;
  isSelected: boolean;
  isNew: boolean;
  onClick: () => void;
}

/**
 * Format relative time (e.g., "5m ago", "2h ago", "3d ago")
 */
const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

/**
 * Truncate title to max length with ellipsis
 */
const truncateTitle = (title: string, maxLength = 120) => {
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength) + "...";
};

/**
 * Get snippet from body (first 80-100 chars)
 */
const getSnippet = (body: string | null, maxLength = 100) => {
  if (!body) return "";
  const cleaned = body.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength) + "...";
};

/**
 * 2-Line Dense Table Row Component
 *
 * AC-5: 52px row height, 8-10 items visible without scrolling
 * AC-6: Line 1: Badge + Title (truncated >120 chars) + right-aligned metadata
 * AC-7: Line 2: First 80-100 chars of body as snippet
 * AC-8: Badge colors per event type
 * AC-9: NEW badge for unreviewed events
 *
 * Note: This component renders the content inside a React Aria Table Row.
 * Keyboard navigation and click handling are managed by the parent Table component.
 */
export function ItemRow({ item, isSelected, isNew }: ItemRowProps) {
  return (
    <div
      className={`h-[52px] px-4
        ${isSelected ? "ring-2 ring-[#9DAA5F]" : ""}`}
    >
      {/* Line 1: Badge + Title + Metadata */}
      <div className="flex items-center justify-between h-7 pt-1.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Badge type={item.type} isNew={isNew} />
          <span className="text-sm font-medium text-[#FDFFFC] truncate">
            {truncateTitle(item.title)}
          </span>
        </div>
        {/* Right-aligned metadata column */}
        <div className="flex items-center gap-2 text-xs text-gray-400 ml-4 shrink-0">
          {/* Show relevance rank for search results */}
          {item.rank !== undefined && (
            <>
              <span className="text-[#9DAA5F] font-mono" title="FTS relevance score">
                {item.rank.toFixed(4)}
              </span>
              <span>•</span>
            </>
          )}
          <span>{item.author}</span>
          <span>•</span>
          <span className="max-w-[120px] truncate">{item.project}</span>
          <span>•</span>
          <span>{formatRelativeTime(new Date(item.createdAt))}</span>
        </div>
      </div>

      {/* Line 2: Snippet */}
      <div className="h-5 pl-0">
        <p className="text-sm text-gray-400 truncate">
          {getSnippet(item.body)}
        </p>
      </div>
    </div>
  );
}
