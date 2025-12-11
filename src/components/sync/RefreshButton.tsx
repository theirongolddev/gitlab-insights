"use client";

import { Button, Tooltip } from "@heroui/react";

interface RetryState {
  isRetrying: boolean;
  attempt: number;
  nextRetryIn: number;
}

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading: boolean;
  retryState?: RetryState | null;
  showRetryPrompt?: boolean;
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

export function RefreshButton({ onRefresh, isLoading, retryState, showRetryPrompt }: RefreshButtonProps) {
  // AC5: Show "Retry" button after exhausting retries
  const isRetrying = retryState?.isRetrying ?? false;
  const countdown = retryState?.nextRetryIn ?? 0;
  
  // Determine tooltip content based on state
  let tooltipContent = "Refresh (r)";
  if (isRetrying && countdown > 0) {
    tooltipContent = `Retrying in ${countdown}s...`;
  } else if (showRetryPrompt) {
    tooltipContent = "Click to retry (r)";
  }

  // AC5: Visual indication when retry is needed
  const buttonClassName = showRetryPrompt
    ? "text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 focus-visible:ring-2 focus-visible:ring-olive-light focus-visible:outline-none"
    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 focus-visible:ring-2 focus-visible:ring-olive-light focus-visible:outline-none";

  return (
    <Tooltip content={tooltipContent} placement="bottom">
      <Button
        variant="light"
        size="sm"
        onPress={onRefresh}
        isDisabled={isLoading || isRetrying}
        isIconOnly={!showRetryPrompt}
        aria-label={showRetryPrompt ? "Retry refresh" : "Refresh data"}
        className={buttonClassName}
      >
        <RefreshIcon
          className={`h-5 w-5 ${isLoading || isRetrying ? "animate-spin" : ""}`}
        />
        {showRetryPrompt && (
          <span className="ml-1 text-sm font-medium">Retry</span>
        )}
      </Button>
    </Tooltip>
  );
}
