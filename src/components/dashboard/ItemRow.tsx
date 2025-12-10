"use client";

import { Badge, type EventType } from "./Badge";
import { HighlightedText } from "~/components/ui/HighlightedText";
import { formatRelativeTime } from "~/lib/utils";
import { Chip } from "@heroui/react";

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
  /** Highlighted title HTML from ts_headline() (search results only) */
  highlightedTitle?: string;
  /** Highlighted snippet HTML from ts_headline() (search results only) */
  highlightedSnippet?: string;
}

interface ItemRowProps {
  item: DashboardEvent;
  isSelected: boolean;
  isNew: boolean;
  onClick: () => void;
}

/**
 * Generate a consistent color for a username using a simple hash function.
 * Returns HSL color with controlled saturation and lightness for visual appeal.
 */
const hashStringToColor = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

/**
 * Calculate relative luminance of an RGB color (0-1 scale).
 * Used for WCAG contrast ratio calculations.
 */
const getLuminance = (r: number, g: number, b: number): number => {
  const adjust = (val: number) => {
    const normalized = val / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };
  
  const rs = adjust(r);
  const gs = adjust(g);
  const bs = adjust(b);
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Convert HSL to RGB for luminance calculation.
 */
const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [
    Math.round(255 * f(0)),
    Math.round(255 * f(8)),
    Math.round(255 * f(4)),
  ];
};

/**
 * Generate accessible author color with proper contrast.
 * Returns HSL color string and appropriate text color (light or dark).
 */
const getAuthorColor = (
  author: string
): { bg: string; text: string; contrast: "light" | "dark" } => {
  const hash = hashStringToColor(author);
  
  // Generate hue from hash (0-360)
  const hue = hash % 360;
  
  // Use moderate saturation and lightness for pleasant, accessible colors
  // Light mode: lighter backgrounds (70-85% lightness, 45-65% saturation)
  const saturation = 45 + (hash % 20); // 45-65%
  const lightness = 70 + (hash % 15); // 70-85%
  
  const bgColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  
  // Calculate luminance to determine text color
  const [r, g, b] = hslToRgb(hue, saturation, lightness);
  const luminance = getLuminance(r, g, b);
  
  // Use dark text for light backgrounds, light text for dark backgrounds
  // Threshold of 0.5 provides good contrast in most cases
  const textColor = luminance > 0.5 ? "#1f2937" : "#f9fafb"; // gray-800 or gray-50
  
  return {
    bg: bgColor,
    text: textColor,
    contrast: luminance > 0.5 ? "dark" : "light",
  };
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
export function ItemRow({ item, isSelected, isNew, onClick }: ItemRowProps) {
  const authorColor = getAuthorColor(item.author);
  
  return (
    <div
      onClick={onClick}
      className={`min-h-10 px-4 mb-2 rounded-lg transition-colors overflow-hidden
        hover:bg-gray-300 dark:hover:bg-gray-800
        ${isSelected ? "ring-2 ring-olive-light" : ""}`}
    >
      {/* Line 1: Badge + Title + Metadata */}
      <div className="flex items-center justify-between min-h-7 pt-1.5 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          <Badge type={item.type} isNew={isNew} />
          <Chip
            size="sm"
            variant="flat"
            classNames={{
              base: "shrink-0 h-5",
              content: "px-0.5 py-0 text-[10px] font-medium"
            }}
            style={{
              backgroundColor: authorColor.bg,
              color: authorColor.text,
            }}
          >
            {item.author}
          </Chip>
          {item.highlightedTitle ? (
            <HighlightedText
              html={item.highlightedTitle}
              className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate min-w-0"
            />
          ) : (
            <span className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate min-w-0">
              {item.title}
            </span>
          )}
        </div>
        {/* Right-aligned metadata column */}
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 ml-4 min-w-0 shrink">
          {/* Show relevance rank for search results */}
          {item.rank !== undefined && (
            <>
              <span className="text-olive-light font-mono hidden sm:inline" title="FTS relevance score">
                {item.rank.toFixed(4)}
              </span>
              <span className="hidden sm:inline">•</span>
            </>
          )}
          <span className="max-w-[80px] sm:max-w-[120px] truncate">{item.project}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">{formatRelativeTime(new Date(item.createdAt))}</span>
        </div>
      </div>

      {/* Line 2: Snippet */}
      <div className="pl-4 pt-1 overflow-hidden">
        {item.highlightedSnippet ? (
          <HighlightedText
            html={item.highlightedSnippet}
            className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 break-all"
          />
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {getSnippet(item.body)}
          </p>
        )}
      </div>
    </div>
  );
}
