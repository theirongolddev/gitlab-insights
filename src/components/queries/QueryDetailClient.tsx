"use client";

/**
 * Query Detail Client Component
 *
 * Story 2.8: Sidebar Navigation
 * AC 2.8.3: Clicking query navigates to /queries/[id]
 *
 * Story 2.10: Edit/Delete Query Actions
 * AC 2.10.1-2.10.5: Inline name editing with pencil/check icons
 */

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { EventTable } from "~/components/dashboard/EventTable";
import type { DashboardEvent } from "~/components/dashboard/ItemRow";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { useSearch } from "~/components/search/SearchContext";
import { useToast } from "~/components/ui/Toast/ToastContext";
import { SplitView } from "~/components/layout/SplitView";
import { useDetailPane } from "~/contexts/DetailPaneContext";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { EventDetail } from "~/components/events/EventDetail";
import { Check, Pencil, Trash2 } from "lucide-react";

// Story 4.1: Storage key for detail pane state (must match useDetailPane.ts)
const STORAGE_KEY = 'gitlab-insights-split-view-open';

/**
 * Helper: Get last selected event from localStorage for a query
 * Returns null if not found or error accessing localStorage
 */
function getLastSelectedEvent(queryId: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(`gitlab-insights-last-event-${queryId}`);
  } catch (error) {
    // Client-side graceful degradation for localStorage failures (private browsing, quota exceeded)
    // Using console.warn (not logger) as this is non-critical client-side edge case
    console.warn('Failed to read last selected event from localStorage:', error);
    return null;
  }
}

/**
 * Helper: Get initial selected event ID
 * Priority 1: URL param (deep linking)
 * Priority 2: Last selected event from localStorage (AC4 - restore on reopen)
 */
function getInitialEventId(queryId: string): string | null {
  if (typeof window === 'undefined') return null;

  // Priority 1: URL param for deep linking
  const params = new URLSearchParams(window.location.search);
  const detailParam = params.get('detail');
  if (detailParam) return detailParam;

  // Priority 2: Restore last selected event if pane was open
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const isOpen = JSON.parse(stored) as boolean;
      if (isOpen) {
        return getLastSelectedEvent(queryId);
      }
    }
  } catch (error) {
    // Client-side graceful degradation for localStorage failures
    console.warn('Failed to restore initial event state:', error);
  }

  return null;
}

interface QueryDetailClientProps {
  queryId: string;
}

export function QueryDetailClient({ queryId }: QueryDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = api.useUtils();
  const { showToast } = useToast();

  // Story 2.10: Use live keywords from SearchContext instead of saved query
  const { keywords: liveKeywords } = useSearch();

  // Story 4.1: Split pane state
  const { isOpen: isDetailPaneOpen, setIsOpen: setDetailPaneOpen } = useDetailPane();
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Story 4.1 AC4: Initialize selected event from URL (deep linking) or localStorage (restore last)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(() =>
    getInitialEventId(queryId)
  );

  // State for inline editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch query details (name, filters, count)
  const {
    data: query,
    isLoading: isQueryLoading,
    error: queryError,
  } = api.queries.getById.useQuery({ id: queryId });

  // Fetch search results based on LIVE keywords from SearchContext
  const {
    data: searchData,
    isLoading: isSearchLoading,
  } = api.events.search.useQuery(
    { keywords: liveKeywords },
    {
      enabled: liveKeywords.length > 0,
    }
  );

  // Update mutation for renaming query
  const updateMutation = api.queries.update.useMutation({
    onSuccess: () => {
      setIsEditingName(false);
      void utils.queries.getById.invalidate({ id: queryId });
      void utils.queries.list.invalidate();
      showToast("Query updated successfully", "success");
    },
    onError: (error) => {
      if (error.message.includes("already exists") || error.data?.code === "CONFLICT") {
        showToast("A query with this name already exists", "error");
      } else if (error.data?.code === "FORBIDDEN") {
        showToast("You don't have permission to edit this query", "error");
      } else {
        showToast("Failed to update query. Please try again.", "error");
      }
    },
  });

  // Delete mutation for deleting query
  const deleteMutation = api.queries.delete.useMutation({
    onSuccess: () => {
      void utils.queries.list.invalidate();
      showToast("Query deleted successfully", "success");
      router.push("/dashboard");
    },
    onError: (error) => {
      if (error.data?.code === "FORBIDDEN") {
        showToast("You don't have permission to delete this query", "error");
      } else if (error.data?.code === "NOT_FOUND") {
        showToast("Query not found", "error");
      } else {
        showToast("Failed to delete query. Please try again.", "error");
      }
      setIsDeleteDialogOpen(false);
    },
  });

  // Story 4.1: Deep linking initialization (runs once on mount)
  // Open detail pane if ?detail param present, or sync URL if event was restored from localStorage
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!searchParams || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const detailParam = searchParams.get('detail');
    if (detailParam) {
      // URL has ?detail param - open pane (selectedEventId already initialized from URL)
      setDetailPaneOpen(true);
    } else if (isDetailPaneOpen && selectedEventId) {
      // AC4: Event was restored from localStorage - sync URL to match state
      router.push(`/queries/${queryId}?detail=${selectedEventId}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Story 4.1: URL synchronization (browser back/forward navigation)
  // When URL changes, update detail pane state to match
  useEffect(() => {
    if (!searchParams || !hasInitializedRef.current) return;

    const detailParam = searchParams.get('detail');
    if (detailParam && detailParam !== selectedEventId) {
      // URL changed to different event - open pane
      setDetailPaneOpen(true);
    }
  }, [searchParams, selectedEventId, setDetailPaneOpen]);

  // Story 4.1: Handle row click - open in split pane on desktop/tablet, navigate to full page on mobile
  const handleRowClick = (event: DashboardEvent) => {
    if (isMobile) {
      // Mobile: Navigate to full-screen detail page
      router.push(`/events/${event.id}`);
    } else {
      // Desktop/Tablet: Open in split pane and update URL
      setSelectedEventId(event.id);
      setDetailPaneOpen(true);

      // AC4: Store last selected event in localStorage for this query
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`gitlab-insights-last-event-${queryId}`, event.id);
        } catch (error) {
          // Client-side graceful degradation - localStorage unavailable (AC4 degrades gracefully)
          // No user-facing error needed; feature simply won't restore selection on return
          console.warn('Failed to save last selected event:', error);
        }
      }

      router.push(`/queries/${queryId}?detail=${event.id}`, { scroll: false });
    }
  };

  // Auto-focus input when entering edit mode
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

  // Handle Esc key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      cancelEdit();
    } else if (e.key === "Enter") {
      saveEdit();
    }
  };

  // Handle delete query
  const handleDeleteQuery = () => {
    deleteMutation.mutate({ id: queryId });
    setIsDeleteDialogOpen(false);
  };

  // Loading state for query
  if (isQueryLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  // Error state
  if (queryError) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <p className="text-lg text-red-400">
            {queryError.data?.code === "NOT_FOUND"
              ? "Query not found"
              : queryError.data?.code === "FORBIDDEN"
                ? "You don't have access to this query"
                : "Error loading query"}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-500 mt-2">
            {queryError.message}
          </p>
        </div>
      </div>
    );
  }

  // No query found
  if (!query) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <p className="text-lg text-gray-600 dark:text-gray-400">Query not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - var(--header-height))' }}>
      {/* Delete Confirmation Dialog - HeroUI Modal */}
      <Modal
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        isDismissable
        placement="center"
        classNames={{
          backdrop: "bg-black/60 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Delete Query?
            </h2>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete &quot;{query.name}&quot;? This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => setIsDeleteDialogOpen(false)}
              color="default"
              variant="flat"
            >
              Cancel
            </Button>
            <Button
              onPress={handleDeleteQuery}
              color="danger"
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Query header */}
      <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center gap-1">
          {isEditingName ? (
            <>
              <input
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={cancelEdit}
                className="text-xl font-semibold text-gray-900 dark:text-gray-50 bg-transparent border-b-2 border-olive-light focus:outline-none w-100"
              />
              <Button
                onPress={() => saveEdit()}
                isIconOnly
                variant="light"
                size="sm"
                isDisabled={updateMutation.isPending}
                className="text-olive dark:text-olive-light"
                aria-label="Save name"
              >
                <Check className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                {query.name}
              </h1>
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
              <Button
                onPress={() => setIsDeleteDialogOpen(true)}
                isIconOnly
                variant="light"
                size="sm"
                className="text-gray-400 hover:text-red-600 dark:hover:text-red-500"
                aria-label="Delete query"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {searchData?.events.length ?? 0} {(searchData?.events.length ?? 0) === 1 ? "result" : "results"}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-500">Keywords:</span>
            {liveKeywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-olive/15 text-olive dark:bg-olive-light/20 dark:text-olive-light"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Story 4.1: Search results with SplitView */}
      <div className="flex-1 overflow-hidden">
        {isSearchLoading ? (
          <div className="space-y-2 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-[52px] animate-pulse rounded bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
        ) : searchData?.events && searchData.events.length > 0 ? (
          <SplitView
          listContent={
            <EventTable
              events={searchData.events as DashboardEvent[]}
              onRowClick={handleRowClick}
            />
          }
          detailContent={<EventDetail eventId={selectedEventId} />}
          selectedEventId={selectedEventId}
        />
        ) : (
          <div className="text-center py-12 p-6">
            <p className="text-lg text-gray-500 dark:text-gray-400">No matching events</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              Try syncing your GitLab projects or adjusting your search terms
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
