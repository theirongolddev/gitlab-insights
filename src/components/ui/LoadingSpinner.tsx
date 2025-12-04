"use client";

import { Spinner } from "@heroui/react";

export type SpinnerSize = "sm" | "md" | "lg";

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

/**
 * LoadingSpinner - Consistent wrapper around HeroUI Spinner
 *
 * Provides a standardized loading spinner with optional label text.
 * Uses olive primary color from theme.
 */
export function LoadingSpinner({
  size = "md",
  label,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Spinner size={size} color="primary" />
      {label && (
        <p className="mt-4 text-gray-600 dark:text-gray-400">{label}</p>
      )}
    </div>
  );
}
