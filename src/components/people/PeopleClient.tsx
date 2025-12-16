"use client";

import { useState, useCallback } from "react";
import { Input } from "@heroui/react";
import { api } from "~/trpc/react";
import { PersonCard } from "./PersonCard";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { SplitView } from "~/components/layout/SplitView";
import { PersonDetail } from "./PersonDetail";
import { useDebounce } from "~/hooks/useDebounce";

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

  const people = data?.pages.flatMap((page) => page.items) ?? [];

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
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg">No people found</p>
            {debouncedSearch && (
              <p className="text-sm mt-2">
                Try adjusting your search query
              </p>
            )}
          </div>
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
