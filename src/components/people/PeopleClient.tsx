"use client";

import { useState, useCallback, useMemo } from "react";
import { Input } from "@heroui/react";
import { api } from "~/trpc/react";
import { PersonCard } from "./PersonCard";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { SplitView } from "~/components/layout/SplitView";
import { PersonDetail } from "./PersonDetail";
import { useDebounce } from "~/hooks/useDebounce";
import { useShortcutHandler } from "~/hooks/useShortcutHandler";

export function PeopleClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.people.list.useInfiniteQuery(
      { search: debouncedSearch || undefined, limit: 50 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const people = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  // Keyboard navigation (j/k) following existing patterns
  const selectedIndex = useMemo(() => {
    if (!selectedPersonId) return -1;
    return people.findIndex((p) => p.id === selectedPersonId);
  }, [selectedPersonId, people]);

  // j key - move selection down
  useShortcutHandler("moveSelectionDown", () => {
    if (people.length === 0) return;
    const nextIndex = selectedIndex === -1 ? 0 : Math.min(selectedIndex + 1, people.length - 1);
    const nextPerson = people[nextIndex];
    if (nextPerson) {
      setSelectedPersonId(nextPerson.id);
    }
  });

  // k key - move selection up
  useShortcutHandler("moveSelectionUp", () => {
    if (people.length === 0) return;
    const prevIndex = selectedIndex === -1 ? people.length - 1 : Math.max(selectedIndex - 1, 0);
    const prevPerson = people[prevIndex];
    if (prevPerson) {
      setSelectedPersonId(prevPerson.id);
    }
  });

  const handlePersonClick = useCallback((personId: string) => {
    setSelectedPersonId((prev) => (prev === personId ? null : personId));
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - var(--header-height, 64px))' }}>
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              People
            </h1>
            <div className="w-80">
              <Input
                type="search"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "h-9",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" label="Loading people..." />
          </div>
        ) : people.length === 0 ? (
          <EmptyState hasSearch={!!debouncedSearch} />
        ) : (
          <SplitView
            listContent={
              <PersonList
                people={people}
                selectedPersonId={selectedPersonId}
                onPersonClick={handlePersonClick}
                onLoadMore={handleLoadMore}
                hasMore={hasNextPage ?? false}
                isLoadingMore={isFetchingNextPage}
              />
            }
            detailContent={<PersonDetail personId={selectedPersonId} />}
            selectedEventId={selectedPersonId}
          />
        )}
      </div>
    </div>
  );
}

interface PersonListProps {
  people: Array<{
    id: string;
    gitlabId: number;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  }>;
  selectedPersonId: string | null;
  onPersonClick: (id: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

function PersonList({
  people,
  selectedPersonId,
  onPersonClick,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: PersonListProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-2">
        {people.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            isSelected={selectedPersonId === person.id}
            onClick={() => onPersonClick(person.id)}
            showActivity={false}
          />
        ))}

        {hasMore && (
          <div className="pt-4 flex justify-center">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="px-4 py-2 text-sm font-medium text-olive-light hover:text-olive-dark
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  hasSearch: boolean;
}

function EmptyState({ hasSearch }: EmptyStateProps) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg">No people found</p>
        <p className="text-sm mt-2">Try adjusting your search query</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12 mb-4 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <p className="text-lg font-medium">No people extracted yet</p>
      <p className="text-sm mt-2 max-w-md text-center">
        People are automatically extracted from your GitLab activity during sync.
        Run a manual refresh to fetch the latest data.
      </p>
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-700">r</kbd>
        <span>to refresh</span>
      </div>
    </div>
  );
}
