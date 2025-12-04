"use client";

import { Button, Tooltip, Badge } from "@heroui/react";

interface CatchUpModeToggleProps {
  isCatchUpMode: boolean;
  onToggle: () => void;
  newItemsCount: number;
}

/**
 * CatchUpModeToggle - Button to toggle between Dashboard and Catch-Up Mode
 *
 * Story 3.2: Catch-Up Mode View with Toggle
 * AC 3.2.7: Toggle button visible in dashboard header with keyboard hint "Press c to toggle"
 * - Shows bell icon with badge when there are new items
 * - Applies olive accent color when Catch-Up Mode is active
 * - Displays keyboard hint on hover via tooltip
 */
export function CatchUpModeToggle({
  isCatchUpMode,
  onToggle,
  newItemsCount,
}: CatchUpModeToggleProps) {
  const button = (
    <Button
      variant={isCatchUpMode ? "solid" : "bordered"}
      color="primary"
      onPress={onToggle}
      className="gap-2"
      aria-label={isCatchUpMode ? "Exit Catch-Up Mode" : "Enter Catch-Up Mode"}
      aria-pressed={isCatchUpMode}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>
      <span className="hidden sm:inline">
        {isCatchUpMode ? "Exit Catch-Up" : "Catch-Up"}
      </span>
      <kbd className="hidden sm:inline text-xs opacity-60 ml-1 px-1 py-0.5 rounded bg-white/20 dark:bg-white/30 font-mono">
        c
      </kbd>
    </Button>
  );

  const showBadge = newItemsCount > 0 && !isCatchUpMode;
  const badgeContent = newItemsCount > 99 ? "99+" : newItemsCount.toString();

  return (
    <Tooltip
      content={
        <span className="text-xs">
          Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded font-mono">c</kbd> to {isCatchUpMode ? "exit Catch-Up Mode" : "enter Catch-Up Mode"}
        </span>
      }
      placement="bottom"
    >
      {showBadge ? (
        <Badge
          content={badgeContent}
          color="danger"
          size="sm"
          placement="top-right"
        >
          {button}
        </Badge>
      ) : (
        button
      )}
    </Tooltip>
  );
}
