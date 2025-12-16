"use client";

import { memo, useCallback, useMemo, useState, useEffect } from "react";
import {
  Select,
  SelectItem,
  Input,
  Checkbox,
  Button,
  Chip,
} from "@heroui/react";
import { useDebounce } from "~/hooks/useDebounce";
import type { WorkItemFilters as FilterType } from "~/types/work-items";
import type { SharedSelection } from "@heroui/react";

interface WorkItemFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  availableRepositories?: string[];
  className?: string;
}

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "merged", label: "Merged" },
] as const;

const TYPE_OPTIONS = [
  { value: "issue", label: "Issues" },
  { value: "merge_request", label: "Merge Requests" },
] as const;

/**
 * WorkItemFilters - Filter controls for work item list
 *
 * Filters:
 * 1. Status multi-select (open/closed/merged, default open)
 * 2. Type toggle (issues/MRs/both)
 * 3. Repository multi-select from user's projects
 * 4. Search input (debounced 300ms, queries title+description)
 * 5. Show read items toggle
 *
 * Filter state should be stored in URL query params by parent for bookmarkable URLs.
 */
export const WorkItemFilters = memo(function WorkItemFilters({
  filters,
  onFiltersChange,
  availableRepositories = [],
  className = "",
}: WorkItemFiltersProps) {
  // Local search input state
  const [searchValue, setSearchValue] = useState(filters.search ?? "");
  
  // Debounced search value
  const debouncedSearchValue = useDebounce(searchValue, 300);

  // Update filters when debounced value changes
  // Uses cleanup flag to prevent stale updates after unmount
  useEffect(() => {
    let isActive = true;

    // Use microtask to batch with other state updates
    queueMicrotask(() => {
      if (isActive) {
        onFiltersChange({ ...filters, search: debouncedSearchValue || undefined });
      }
    });

    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchValue]); // Only depend on debounced value to avoid infinite loops
  
  // Sync local state when filters.search changes externally
  useEffect(() => {
    setSearchValue(filters.search ?? "");
  }, [filters.search]);

  const handleStatusChange = useCallback(
    (keys: SharedSelection) => {
      if (keys === "all") {
        onFiltersChange({ ...filters, status: undefined });
        return;
      }
      const selected = Array.from(keys as Set<string>) as ("open" | "closed" | "merged")[];
      onFiltersChange({
        ...filters,
        status: selected.length > 0 ? selected : undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleTypeChange = useCallback(
    (keys: SharedSelection) => {
      if (keys === "all") {
        onFiltersChange({ ...filters, type: undefined });
        return;
      }
      const selected = Array.from(keys as Set<string>) as ("issue" | "merge_request")[];
      onFiltersChange({
        ...filters,
        type: selected.length > 0 ? selected : undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleRepositoryChange = useCallback(
    (keys: SharedSelection) => {
      if (keys === "all") {
        onFiltersChange({ ...filters, repository: undefined });
        return;
      }
      const selected = Array.from(keys as Set<string>);
      onFiltersChange({
        ...filters,
        repository: selected.length > 0 ? selected : undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleUnreadOnlyChange = useCallback(
    (checked: boolean) => {
      onFiltersChange({ ...filters, unreadOnly: checked || undefined });
    },
    [filters, onFiltersChange]
  );

  const handleClearFilters = useCallback(() => {
    setSearchValue("");
    onFiltersChange({});
  }, [onFiltersChange]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      (filters.status && filters.status.length > 0) ||
      (filters.type && filters.type.length > 0) ||
      (filters.repository && filters.repository.length > 0) ||
      filters.unreadOnly ||
      filters.search
    );
  }, [filters]);

  // Count active filters for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.type && filters.type.length > 0) count++;
    if (filters.repository && filters.repository.length > 0) count++;
    if (filters.unreadOnly) count++;
    if (filters.search) count++;
    return count;
  }, [filters]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Search input */}
      <Input
        type="search"
        placeholder="Search work items..."
        value={searchValue}
        onValueChange={setSearchValue}
        size="sm"
        classNames={{
          inputWrapper: "bg-default-100",
        }}
        startContent={
          <svg
            className="w-4 h-4 text-default-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        }
        isClearable
        onClear={() => setSearchValue("")}
      />

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status filter */}
        <Select
          label="Status"
          placeholder="All statuses"
          size="sm"
          selectionMode="multiple"
          selectedKeys={new Set(filters.status ?? [])}
          onSelectionChange={handleStatusChange}
          className="w-40"
          classNames={{
            trigger: "bg-default-100 min-h-10",
          }}
        >
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value}>{option.label}</SelectItem>
          ))}
        </Select>

        {/* Type filter */}
        <Select
          label="Type"
          placeholder="All types"
          size="sm"
          selectionMode="multiple"
          selectedKeys={new Set(filters.type ?? [])}
          onSelectionChange={handleTypeChange}
          className="w-44"
          classNames={{
            trigger: "bg-default-100 min-h-10",
          }}
        >
          {TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value}>{option.label}</SelectItem>
          ))}
        </Select>

        {/* Repository filter */}
        {availableRepositories.length > 0 && (
          <Select
            label="Repository"
            placeholder="All repositories"
            size="sm"
            selectionMode="multiple"
            selectedKeys={new Set(filters.repository ?? [])}
            onSelectionChange={handleRepositoryChange}
            className="w-48"
            classNames={{
              trigger: "bg-default-100 min-h-10",
            }}
          >
            {availableRepositories.map((repo) => (
              <SelectItem key={repo}>{repo}</SelectItem>
            ))}
          </Select>
        )}

        {/* Unread only toggle */}
        <Checkbox
          size="sm"
          isSelected={filters.unreadOnly ?? false}
          onValueChange={handleUnreadOnlyChange}
          classNames={{
            label: "text-sm text-default-600",
          }}
        >
          Unread only
        </Checkbox>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="flat"
            color="default"
            onPress={handleClearFilters}
            startContent={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            }
          >
            Clear
            {activeFilterCount > 0 && (
              <Chip size="sm" className="ml-1 min-w-5 h-5">
                {activeFilterCount}
              </Chip>
            )}
          </Button>
        )}
      </div>
    </div>
  );
});
