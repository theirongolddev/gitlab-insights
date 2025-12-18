"use client";

import { Chip } from "@heroui/react";

const DUPLICATE_THRESHOLD = 0.85;

interface DuplicateBadgeProps {
  /**
   * Similarity score between 0 and 1
   */
  similarity: number;
  /**
   * Whether to show the percentage in the badge
   * @default true
   */
  showPercentage?: boolean;
  /**
   * Size of the badge
   * @default "sm"
   */
  size?: "sm" | "md" | "lg";
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * DuplicateBadge - Shows "Likely Duplicate" badge for high similarity items
 *
 * Only renders when similarity >= 0.85 (85%)
 * Uses danger color for visual prominence
 *
 * @example
 * <DuplicateBadge similarity={0.92} />
 * // Renders: "Likely Duplicate (92%)"
 *
 * @example
 * <DuplicateBadge similarity={0.50} />
 * // Renders: null (below threshold)
 */
export function DuplicateBadge({
  similarity,
  showPercentage = true,
  size = "sm",
  className,
}: DuplicateBadgeProps) {
  // Only show badge if similarity meets threshold
  if (similarity < DUPLICATE_THRESHOLD) {
    return null;
  }

  const percentage = Math.round(similarity * 100);
  const label = showPercentage
    ? `Likely Duplicate (${percentage}%)`
    : "Likely Duplicate";

  return (
    <Chip
      size={size}
      color="danger"
      variant="flat"
      className={className}
    >
      {label}
    </Chip>
  );
}

/**
 * Check if a similarity score qualifies as a likely duplicate
 */
export function isLikelyDuplicate(similarity: number): boolean {
  return similarity >= DUPLICATE_THRESHOLD;
}

/**
 * The threshold value for duplicate detection
 */
export { DUPLICATE_THRESHOLD };

export default DuplicateBadge;
