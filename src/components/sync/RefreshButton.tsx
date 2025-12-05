"use client";

import { Button, Tooltip } from "@heroui/react";

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading: boolean;
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

export function RefreshButton({ onRefresh, isLoading }: RefreshButtonProps) {
  return (
    <Tooltip content="Refresh (r)" placement="bottom">
      <Button
        variant="light"
        size="sm"
        onPress={onRefresh}
        isDisabled={isLoading}
        isIconOnly
        aria-label="Refresh data"
        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 focus-visible:ring-2 focus-visible:ring-olive-light focus-visible:outline-none"
      >
        <RefreshIcon
          className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
        />
      </Button>
    </Tooltip>
  );
}
