"use client";

/**
 * Query Metadata Client Component
 *
 * Story 4.6: Query Metadata Page
 * AC 4.6.2: Display query name, filters, activity metadata
 * AC 4.6.3: Inline name editing with pencil/check icons (reuse Story 2.10 pattern)
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "@heroui/react";
import { useToast } from "~/components/ui/Toast/ToastContext";
import { Check, Pencil, ArrowLeft } from "lucide-react";
import { QueryFiltersSchema, type QueryFilters } from "~/lib/filters/types";
import { formatRelativeTime, formatDate } from "~/lib/utils";

interface QueryMetadataClientProps {
  queryId: string;
}

export function QueryMetadataClient({ queryId }: QueryMetadataClientProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const { showToast } = useToast();

  // State for inline editing (reuse Story 2.10 pattern)
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch query details
  const {
    data: query,
    isLoading,
    error,
  } = api.queries.getById.useQuery({ id: queryId });

  // Update mutation for renaming query
  const updateMutation = api.queries.update.useMutation({
    onSuccess: () => {
      setIsEditingName(false);
      void utils.queries.getById.invalidate({ id: queryId });
      showToast("Query updated successfully", "success");
    },
    onError: (error) => {
      if (
        error.message.includes("already exists") ||
        error.data?.code === "CONFLICT"
      ) {
        showToast("A query with this name already exists", "error");
      } else if (error.data?.code === "FORBIDDEN") {
        showToast("You don't have permission to edit this query", "error");
      } else {
        showToast("Failed to update query. Please try again.", "error");
      }
    },
  });

  // Auto-focus input when entering edit mode (Story 2.10 pattern)
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  // Start editing
  const startEditing = () => {
    if (query) {
      setEditedName(query.name);
      setIsEditingName(true);
    }
  };

  // Save edited name
  const saveEdit = () => {
    if (editedName.trim() && editedName !== query?.name) {
      updateMutation.mutate({ id: queryId, name: editedName.trim() });
    } else {
      setIsEditingName(false);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  // Handle Esc/Enter keys
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      cancelEdit();
    } else if (e.key === "Enter") {
      saveEdit();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const errorMessage =
      error.data?.code === "NOT_FOUND"
        ? "This query doesn't exist or has been deleted."
        : error.data?.code === "FORBIDDEN"
          ? "You don't have permission to view this query."
          : error.data?.code === "UNAUTHORIZED"
            ? "Please sign in to view this query."
            : "We couldn't load this query. Please try again.";

    const errorTitle =
      error.data?.code === "NOT_FOUND"
        ? "Query not found"
        : error.data?.code === "FORBIDDEN"
          ? "Access denied"
          : error.data?.code === "UNAUTHORIZED"
            ? "Sign in required"
            : "Error loading query";

    return (
      <div className="flex-1 p-6">
        <div className="py-12 text-center">
          <p className="text-lg text-red-400">{errorTitle}</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-500">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  // No query found
  if (!query) {
    return (
      <div className="flex-1 p-6">
        <div className="py-12 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Query not found
          </p>
        </div>
      </div>
    );
  }

  // Parse and validate filters with runtime validation
  const parseResult = QueryFiltersSchema.safeParse(query.filters);
  const filters = parseResult.success ? parseResult.data : { keywords: [] };

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Header with Back Button */}
      <div className="mb-6">
        <Button
          onPress={() => router.push(`/queries/${queryId}`)}
          variant="light"
          size="sm"
          startContent={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Results
        </Button>
      </div>

      {/* Query Name Section with Inline Editing */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-50">
          Query Details
        </h1>
        <div className="flex items-center gap-1">
          {isEditingName ? (
            <>
              <input
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full border-b-2 border-olive-light bg-transparent text-xl font-semibold text-gray-900 focus:outline-none dark:text-gray-50"
              />
              <Button
                onPointerDown={(e) => {
                  e.preventDefault();
                  saveEdit();
                }}
                isIconOnly
                variant="light"
                size="sm"
                isDisabled={updateMutation.isPending || !editedName.trim()}
                className="text-olive dark:text-olive-light"
                aria-label="Save name"
              >
                <Check className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                {query.name}
              </h2>
              <Button
                onPress={startEditing}
                isIconOnly
                variant="light"
                size="sm"
                className="text-gray-400 hover:text-olive dark:hover:text-olive-light"
                aria-label="Edit query name"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters Section (Read-Only) */}
      <div className="mb-8 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Filters
        </h3>
        <div className="space-y-2.5">
          {/* Keywords */}
          {filters.keywords && filters.keywords.length > 0 ? (
            <div>
              <span className="mr-2 text-xs text-gray-600 dark:text-gray-400">
                Keywords:
              </span>
              <div className="inline-flex flex-wrap gap-1.5">
                {filters.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full bg-olive/15 px-2.5 py-0.5 text-xs font-medium text-olive dark:bg-olive-light/20 dark:text-olive-light"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm italic text-gray-500 dark:text-gray-500">
              No filters applied
            </p>
          )}
        </div>
      </div>

      {/* Activity Metadata Section */}
      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Activity
        </h3>
        <dl className="space-y-1.5 text-sm">
          <div>
            <dt className="inline text-gray-600 dark:text-gray-400">
              Last viewed:{" "}
            </dt>
            <dd className="inline text-gray-900 dark:text-gray-50">
              {query.lastVisitedAt
                ? formatRelativeTime(query.lastVisitedAt)
                : "Never"}
            </dd>
          </div>
          <div>
            <dt className="inline text-gray-600 dark:text-gray-400">
              New items:{" "}
            </dt>
            <dd className="inline text-gray-900 dark:text-gray-50">
              {query.count || 0}
            </dd>
          </div>
          <div>
            <dt className="inline text-gray-600 dark:text-gray-400">
              Created:{" "}
            </dt>
            <dd className="inline text-gray-900 dark:text-gray-50">
              {formatDate(query.createdAt)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
