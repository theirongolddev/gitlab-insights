"use client";

import { Button, Tooltip, Badge } from "@heroui/react";
import { LayoutGrid, List } from "lucide-react";

interface ViewModeToggleProps {
  isFlatMode: boolean;
  onToggle: () => void;
  newItemsCount: number;
}

/**
 * ViewModeToggle - Button to toggle between Card View (grouped) and Flat View
 *
 * PRD FR24: Default view shows grouped WorkItemCards
 * PRD: Toggle allows switching to flat EventTable view
 * - Shows badge when there are new items (only in card mode)
 * - Applies accent color when flat mode is active
 * - Displays keyboard hint on hover via tooltip
 */
export function ViewModeToggle({
  isFlatMode,
  onToggle,
  newItemsCount,
}: ViewModeToggleProps) {
  const button = (
    <Button
      variant={isFlatMode ? "solid" : "bordered"}
      color="primary"
      onPress={onToggle}
      className="gap-2"
      aria-label={isFlatMode ? "Switch to Card View" : "Switch to Flat View"}
      aria-pressed={isFlatMode}
    >
      {isFlatMode ? (
        <List className="w-5 h-5" />
      ) : (
        <LayoutGrid className="w-5 h-5" />
      )}
      <span className="hidden sm:inline">
        {isFlatMode ? "Flat View" : "Card View"}
      </span>
      <kbd className="hidden sm:inline text-xs opacity-60 ml-1 px-1 py-0.5 rounded bg-white/20 dark:bg-white/30 font-mono">
        c
      </kbd>
    </Button>
  );

  const showBadge = newItemsCount > 0 && !isFlatMode;
  const badgeContent = newItemsCount > 99 ? "99+" : newItemsCount.toString();

  return (
    <Tooltip
      content={
        <span className="text-xs">
          Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded font-mono">c</kbd> to {isFlatMode ? "switch to Card View" : "switch to Flat View"}
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
