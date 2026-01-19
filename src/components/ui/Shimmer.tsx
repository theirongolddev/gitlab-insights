"use client";

import { memo } from "react";

interface ShimmerProps {
  /** Additional CSS classes */
  className?: string;
  /** Width class (Tailwind) - defaults to w-full */
  width?: string;
  /** Height class (Tailwind) - defaults to h-4 */
  height?: string;
  /** Border radius class - defaults to rounded */
  rounded?: string;
}

/**
 * Shimmer - Animated loading placeholder
 *
 * Uses the shimmer animation defined in globals.css for a smooth
 * loading effect. Adapts to light/dark mode automatically.
 *
 * Usage:
 * ```tsx
 * <Shimmer width="w-32" height="h-4" />
 * <Shimmer className="w-full h-8 rounded-lg" />
 * ```
 */
export const Shimmer = memo(function Shimmer({
  className = "",
  width = "w-full",
  height = "h-4",
  rounded = "rounded",
}: ShimmerProps) {
  return (
    <div
      className={`shimmer ${width} ${height} ${rounded} ${className}`}
      aria-hidden="true"
    />
  );
});

interface ShimmerTextProps {
  /** Number of lines to render */
  lines?: number;
  /** Width of last line (Tailwind) - defaults to w-2/3 */
  lastLineWidth?: string;
  /** Gap between lines */
  gap?: string;
  className?: string;
}

/**
 * ShimmerText - Multiple shimmer lines simulating text content
 */
export const ShimmerText = memo(function ShimmerText({
  lines = 3,
  lastLineWidth = "w-2/3",
  gap = "gap-2",
  className = "",
}: ShimmerTextProps) {
  return (
    <div className={`flex flex-col ${gap} ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer
          key={i}
          width={i === lines - 1 ? lastLineWidth : "w-full"}
          height="h-4"
        />
      ))}
    </div>
  );
});

interface ShimmerCardProps {
  /** Show avatar placeholder */
  showAvatar?: boolean;
  /** Number of text lines */
  lines?: number;
  className?: string;
}

/**
 * ShimmerCard - Card-shaped loading placeholder
 *
 * Mimics the structure of common card components with optional
 * avatar and configurable text lines.
 */
export const ShimmerCard = memo(function ShimmerCard({
  showAvatar = true,
  lines = 2,
  className = "",
}: ShimmerCardProps) {
  return (
    <div
      className={`space-y-3 p-4 rounded-lg border border-default-200 dark:border-default-100 ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        {showAvatar && <Shimmer width="w-10" height="h-10" rounded="rounded-full" />}
        <div className="flex-1 space-y-2">
          <Shimmer width="w-1/3" height="h-4" />
          <Shimmer width="w-1/4" height="h-3" />
        </div>
      </div>
      <ShimmerText lines={lines} />
    </div>
  );
});

interface ShimmerListProps {
  /** Number of items to render */
  count?: number;
  /** Height of each item */
  itemHeight?: string;
  /** Gap between items */
  gap?: string;
  className?: string;
}

/**
 * ShimmerList - List of shimmer items for table/list loading states
 */
export const ShimmerList = memo(function ShimmerList({
  count = 5,
  itemHeight = "h-12",
  gap = "gap-2",
  className = "",
}: ShimmerListProps) {
  return (
    <div className={`flex flex-col ${gap} ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Shimmer key={i} height={itemHeight} rounded="rounded-lg" />
      ))}
    </div>
  );
});
