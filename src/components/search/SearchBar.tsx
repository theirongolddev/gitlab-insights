"use client";

import { useState, useRef, type RefObject, type KeyboardEvent } from "react";
import {
  TagGroup,
  TagList,
  Tag,
  Button as AriaButton,
  Label,
  Text,
} from "react-aria-components";

/**
 * SearchBar Props Interface
 *
 * Story 2.6: Redesigned for tag pill input pattern
 * - Keywords appear as removable pills inside the input
 * - Press Enter to commit text as a new tag
 * - Arrow keys navigate between tags (React Aria built-in)
 * - Backspace/Delete removes focused tag (React Aria built-in)
 *
 * Story 2.10: Context-aware behavior
 * - When on query page, shows "Update Query" instead of "Save"
 * - onUpdate callback handles updating existing query
 */
export interface SearchBarProps {
  /** Array of committed keyword tags */
  keywords: string[];
  /** Called when user commits a new keyword (Enter) */
  onAddKeyword: (keyword: string) => void;
  /** Called when user removes a keyword tag */
  onRemoveKeyword: (keyword: string) => void;
  /** Called when user wants to save current keywords as a query */
  onSave?: () => void;
  /** Called when user wants to update existing query (Story 2.10) */
  onUpdate?: () => void;
  /** Current query context (if on query page) - Story 2.10 */
  currentQuery?: { id: string; name: string; filters: unknown } | null;
  /** Shows loading spinner when true */
  isLoading?: boolean;
  /** Ref to the input element for keyboard shortcut focus (/) */
  inputRef?: RefObject<HTMLInputElement | null>;
}

/**
 * SearchBar Component - Tag Pill Input Pattern
 *
 * Story 2.6: Filter UI & Logic
 * AC 2.6.1: Active keywords display as chips with remove buttons
 * AC 2.6.2: Clicking remove clears that keyword
 * AC 2.6.3: Save as Query button visible when keywords active
 * AC 2.6.4: Save button disabled when no keywords
 *
 * Keyboard Navigation (React Aria TagGroup built-in):
 * - Type text and press Enter → commits as a tag
 * - Left/Right arrows → navigate between tags
 * - Backspace/Delete on focused tag → removes that tag
 * - Tab → moves focus into/out of tag group
 *
 * Custom keyboard handling:
 * - Backspace on empty input → removes last tag
 * - ArrowLeft at input start → focuses last tag
 * - ArrowRight on last tag → focuses input
 * - Escape → blurs input
 */
export function SearchBar({
  keywords,
  onAddKeyword,
  onRemoveKeyword,
  onSave,
  onUpdate,
  currentQuery,
  isLoading = false,
  inputRef,
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState("");
  const internalRef = useRef<HTMLInputElement>(null);
  const tagGroupRef = useRef<HTMLDivElement>(null);
  const effectiveRef = inputRef ?? internalRef;

  const hasKeywords = keywords.length > 0;
  const isOnQueryPage = !!currentQuery;

  // AC 2.10.7: Detect if keywords have changed from saved query
  const hasChanges = currentQuery
    ? JSON.stringify([...keywords].sort()) !== JSON.stringify([...(currentQuery.filters as { keywords: string[] }).keywords].sort())
    : hasKeywords;

  // Button should be visible when:
  // - On query page AND keywords have changed, OR
  // - Not on query page AND has keywords
  const shouldShowButton = hasKeywords && (!isOnQueryPage || hasChanges);

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const input = effectiveRef.current;
    const cursorAtStart = input?.selectionStart === 0 && input?.selectionEnd === 0;

    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      onAddKeyword(inputValue.trim());
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && hasKeywords) {
      // Remove last tag when backspace on empty input
      e.preventDefault();
      const lastKeyword = keywords[keywords.length - 1];
      if (lastKeyword) {
        onRemoveKeyword(lastKeyword);
      }
    } else if (e.key === "ArrowLeft" && cursorAtStart && hasKeywords) {
      // Move focus to last tag when pressing left at start of input
      e.preventDefault();
      const lastTag = tagGroupRef.current?.querySelector(
        '[role="row"]:last-child'
      ) as HTMLElement;
      lastTag?.focus();
    } else if (e.key === "Escape") {
      // Blur input on Escape
      effectiveRef.current?.blur();
    }
  };

  // Handle keyboard navigation from TagGroup back to input
  const handleTagGroupKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // When pressing right arrow on the last tag, move focus to input
    if (e.key === "ArrowRight") {
      const focusedTag = document.activeElement;
      const tags = tagGroupRef.current?.querySelectorAll('[role="row"]');
      const lastTag = tags?.[tags.length - 1];

      if (focusedTag === lastTag) {
        e.preventDefault();
        effectiveRef.current?.focus();
      }
    }
  };

  const handleSave = () => {
    // Story 2.10: Context-aware - call onUpdate if on query page, otherwise onSave
    if (isOnQueryPage && onUpdate) {
      onUpdate();
    } else if (onSave) {
      onSave();
    } else {
      // Placeholder behavior until Story 2.9 implements modal
      console.log(`Save as Query: "${keywords.join(", ")}"`);
    }
  };

  return (
    <div className="relative w-full max-w-xl flex items-center gap-2">
      {/* Search container with tags and input */}
      <div
        className="
          flex flex-1 items-center flex-wrap gap-1.5
          min-h-[40px] px-3 py-1.5
          bg-gray-100 text-[#2d2e2e] dark:bg-gray-800 dark:text-[#FDFFFC]
          border border-gray-300 dark:border-gray-600 rounded-md
          focus-within:ring-2 focus-within:ring-[#9DAA5F] focus-within:border-transparent
          transition-colors duration-150
        "
        onClick={() => effectiveRef.current?.focus()}
      >
        {/* Search Icon */}
        <svg
          className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0"
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

        {/* Keyword Tags - React Aria TagGroup handles keyboard navigation */}
        {hasKeywords && (
          <div
            onKeyDown={handleTagGroupKeyDown}
            className="contents"
          >
            <TagGroup
              ref={tagGroupRef}
              aria-label="Active search filters"
              onRemove={(keys) => {
                const keysArray = Array.from(keys);
                keysArray.forEach((key) => onRemoveKeyword(String(key)));
                // Return focus to input after removal
                effectiveRef.current?.focus();
              }}
              className="flex flex-wrap gap-1.5"
            >
              <Label className="sr-only">Search filters</Label>
              <TagList className="flex flex-wrap gap-1.5">
                {keywords.map((keyword) => (
                  <Tag
                    key={keyword}
                    id={keyword}
                    textValue={keyword}
                    className={`
                      inline-flex items-center gap-1 px-2 py-0.5
                      text-sm font-medium rounded-full cursor-default
                      bg-[#9DAA5F]/15 border border-[#9DAA5F]/50 dark:bg-[#9DAA5F]/20 dark:border-[#9DAA5F]
                      text-[#5e6b24] dark:text-[#FDFFFC]
                      outline-none
                      transition-all duration-150
                      data-[focus-visible]:ring-2 data-[focus-visible]:ring-[#9DAA5F] data-[focus-visible]:ring-offset-1 data-[focus-visible]:ring-offset-white dark:data-[focus-visible]:ring-offset-gray-800
                      data-[selected]:bg-[#9DAA5F]/30 dark:data-[selected]:bg-[#9DAA5F]/40
                    `}
                  >
                    {({ allowsRemoving }) => (
                      <>
                        <span>{keyword}</span>
                        {allowsRemoving && (
                          <AriaButton
                            slot="remove"
                            aria-label={`Remove ${keyword} filter`}
                            className={`
                              flex items-center justify-center
                              w-4 h-4 rounded-full
                              text-[#9DAA5F]
                              transition-colors duration-150
                              outline-none
                              data-[hovered]:text-[#FDFFFC] data-[hovered]:bg-[rgba(157,170,95,0.3)]
                              data-[pressed]:bg-[rgba(157,170,95,0.5)]
                              data-[focus-visible]:ring-2 data-[focus-visible]:ring-[#9DAA5F]
                            `}
                          >
                            <svg
                              className="w-3 h-3"
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
                          </AriaButton>
                        )}
                      </>
                    )}
                  </Tag>
                ))}
              </TagList>
              <Text slot="description" className="sr-only">
                Use arrow keys to navigate between filters, Backspace or Delete to remove
              </Text>
            </TagGroup>
          </div>
        )}

        {/* Text Input */}
        <input
          ref={effectiveRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={hasKeywords ? "Add filter..." : "Search events..."}
          className="
            flex-1 min-w-[120px] bg-transparent
            text-[#2d2e2e] dark:text-[#FDFFFC] placeholder:text-gray-500 dark:placeholder:text-gray-500
            focus:outline-none
            [&::-webkit-search-cancel-button]:hidden
            [&::-webkit-search-decoration]:hidden
          "
          aria-label={hasKeywords ? "Add another search filter" : "Search events"}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex-shrink-0" role="status" aria-label="Searching">
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
      </div>

      {/* Save/Update Button - AC 2.6.3, 2.6.4 | Story 2.10: Context-aware label */}
      {/* AC 2.10.7: Hidden when on query page with no changes */}
      {shouldShowButton && (
        <AriaButton
          onPress={handleSave}
          className={`
            flex-shrink-0
            inline-flex items-center justify-center
            px-3 py-2 text-sm font-medium rounded-lg
            transition-colors duration-150
            outline-none
            bg-[#9DAA5F] text-white
            data-[hovered]:bg-[#A8B86C]
            data-[pressed]:bg-[#8A9A4F]
            data-[focus-visible]:ring-2 data-[focus-visible]:ring-[#9DAA5F] data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-white dark:data-[focus-visible]:ring-offset-[#2d2e2e]
          `}
        >
          {isOnQueryPage ? "Update Query" : "Save"}
        </AriaButton>
      )}
    </div>
  );
}
