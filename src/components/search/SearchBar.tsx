"use client";

import { useState, useEffect, useRef, type RefObject } from "react";
import {
  SearchField,
  Input,
  Button,
  Label,
} from "react-aria-components";
import { useDebounce } from "~/hooks/useDebounce";

/**
 * SearchBar Props Interface
 *
 * Party Mode Decision 2025-11-25 (Lag Fix):
 * SearchBar owns local input state for snappy typing, pushes debounced value to context.
 * This isolates re-renders - context consumers only update on debounced changes.
 */
export interface SearchBarProps {
  /** Current debounced search query (from context) */
  value: string;
  /** Called with debounced value after 300ms of no typing */
  onChange: (value: string) => void;
  /** Called when user clears the search (X button or Esc) */
  onClear: () => void;
  /** Shows loading spinner instead of X button when true */
  isLoading?: boolean;
  /** Ref to the input element for keyboard shortcut focus (/) */
  inputRef?: RefObject<HTMLInputElement | null>;
}

/**
 * SearchBar Component
 *
 * AC 2.4.1: Receives focus on `/` keypress (via inputRef from dashboard)
 * AC 2.4.2: 300ms debounce before triggering search (handled internally)
 * AC 2.4.3: Shows loading indicator when isLoading is true
 * AC 2.4.5: Clear button (X icon) visible when localValue.length > 0
 * AC 2.4.6: Esc clears search and removes focus (via React Aria)
 *
 * Performance: Local state for instant feedback, debounced push to context.
 */
export function SearchBar({
  value,
  onChange,
  onClear,
  isLoading = false,
  inputRef,
}: SearchBarProps) {
  // Local state for instant typing feedback (no lag)
  const [localValue, setLocalValue] = useState(value);

  // Track if we're in a clearing state to prevent debounce from reverting
  const [isClearing, setIsClearing] = useState(false);

  // Debounce local value before pushing to context (AC 2.4.2)
  const debouncedLocalValue = useDebounce(localValue, 300);

  // Internal ref fallback if no external ref provided
  const internalRef = useRef<HTMLInputElement>(null);
  const effectiveRef = inputRef ?? internalRef;

  // Sync local state when external value changes (e.g., programmatic clear)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Push debounced value to context when it changes
  // Skip if we're clearing (to prevent debounce from reverting the clear)
  useEffect(() => {
    if (isClearing) {
      // Reset clearing flag once debounce catches up to empty
      if (debouncedLocalValue === "") {
        setIsClearing(false);
      }
      return;
    }
    if (debouncedLocalValue !== value) {
      onChange(debouncedLocalValue);
    }
  }, [debouncedLocalValue, onChange, value, isClearing]);

  // Handle local input changes (instant, no lag)
  const handleLocalChange = (newValue: string) => {
    setLocalValue(newValue);
  };

  // Handle clear - reset local state and notify context immediately (bypass debounce)
  const handleClear = () => {
    setIsClearing(true); // Prevent debounce effect from reverting
    setLocalValue("");
    onChange(""); // Immediately update context (bypass debounce for clear)
    onClear();
    // Blur the input after clearing to remove focus (AC 2.4.6)
    effectiveRef.current?.blur();
  };

  const hasValue = localValue.length > 0;

  return (
    <SearchField
      value={localValue}
      onChange={handleLocalChange}
      onClear={handleClear}
      aria-label="Search events"
      className="relative w-full max-w-md"
    >
      <Label className="sr-only">Search events</Label>

      {/* Search Icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Input */}
      <Input
        ref={effectiveRef}
        placeholder="Search events..."
        className="
          w-full h-10 pl-10 pr-10
          bg-gray-800 text-[#FDFFFC]
          border border-gray-600 rounded-md
          placeholder:text-gray-500
          focus:outline-none focus:ring-2 focus:ring-[#9DAA5F] focus:border-transparent
          transition-colors duration-150
          [&::-webkit-search-cancel-button]:hidden
          [&::-webkit-search-decoration]:hidden
        "
      />

      {/* Loading Spinner - shown during search, positioned absolutely */}
      {isLoading && (
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-6 w-6 flex items-center justify-center"
          aria-label="Searching..."
        >
          <svg
            className="animate-spin h-4 w-4 text-[#9DAA5F]"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {/* Clear Button - direct child of SearchField for proper slot connection */}
      {/* Hidden when loading or empty, positioned absolutely */}
      <Button
        className={`
          absolute right-2 top-1/2 -translate-y-1/2 z-10
          h-6 w-6 flex items-center justify-center
          text-gray-400 hover:text-[#FDFFFC]
          rounded transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-[#9DAA5F]
          ${(!hasValue || isLoading) ? 'hidden' : ''}
        `}
        aria-label="Clear search"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </Button>
    </SearchField>
  );
}
