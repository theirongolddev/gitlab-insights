"use client";

/**
 * NewItemsBadge - Badge displaying count of new items for a query
 *
 * Story 3.4: Sidebar New Item Badges
 * AC 3.4.1: Displays badge showing count of new items
 * AC 3.4.2: Olive background with appropriate WCAG AA contrast text
 * AC 3.4.3: Returns null if newCount === 0 (hidden, not "0")
 * AC 3.4.6: Accessible with proper aria-label (singular vs plural)
 * AC 3.4.10: Gracefully handles loading/error by rendering nothing
 */

interface NewItemsBadgeProps {
  newCount: number;
}

/**
 * NewItemsBadge - Display-only badge component
 *
 * Receives newCount from parent (data comes from context via parent).
 * Does not fetch data itself.
 */
export function NewItemsBadge({ newCount }: NewItemsBadgeProps) {
  // AC 3.4.3: Return null if newCount === 0 (badge hidden, not "0")
  if (newCount === 0) {
    return null;
  }

  // AC 3.4.6: Dynamic aria-label with singular/plural
  const ariaLabel = `${newCount} new item${newCount === 1 ? "" : "s"}`;

  // AC 3.4.2: Olive styling with WCAG AA compliant text colors
  // Light mode: bg-olive (#5e6b24) with white text
  // Dark mode: bg-olive-light (#9DAA5F) with gray-900 text
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className="
        bg-olive text-white
        dark:bg-olive-light dark:text-gray-900
        rounded-full px-1.5 py-0.5
        text-[11px] font-medium tabular-nums
      "
    >
      {newCount}
    </span>
  );
}
