"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Avatar, Chip, Divider, Select, SelectItem } from "@heroui/react";
import { api } from "~/trpc/react";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { PersonActivityStats } from "./PersonActivityStats";
import { useInfiniteScroll } from "~/hooks/useInfiniteScroll";

interface PersonDetailClientProps {
  personId: string;
}

type EventTypeFilter = "all" | "issue" | "merge_request" | "comment";

const eventTypeOptions: Array<{ key: EventTypeFilter; label: string }> = [
  { key: "all", label: "All Activity" },
  { key: "issue", label: "Issues" },
  { key: "merge_request", label: "Merge Requests" },
  { key: "comment", label: "Comments" },
];

export function PersonDetailClient({ personId }: PersonDetailClientProps) {
  const [typeFilter, setTypeFilter] = useState<EventTypeFilter>("all");

  const { data: person, isLoading } = api.people.getById.useQuery(
    { id: personId },
    { enabled: !!personId }
  );

  const {
    data: activityData,
    isLoading: activityLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.people.getActivity.useInfiniteQuery(
    { personId, limit: 50 },
    {
      enabled: !!personId,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const { sentinelRef } = useInfiniteScroll({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });

  const allActivities = useMemo(
    () => activityData?.pages.flatMap((page) => page.items) ?? [],
    [activityData]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading person..." />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <p className="text-lg">Person not found</p>
        <Link href="/people" className="text-olive-light hover:underline mt-2">
          Back to People
        </Link>
      </div>
    );
  }

  const displayName = person.name ?? person.username;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const filteredActivity = useMemo(() => {
    if (typeFilter === "all") return allActivities;
    return allActivities.filter((event) => event.type === typeFilter);
  }, [allActivities, typeFilter]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/people"
            className="text-sm text-olive-light hover:underline inline-flex items-center gap-1"
          >
            <span>←</span> Back to People
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-6">
            <Avatar
              src={person.avatarUrl ?? undefined}
              name={initials}
              className="w-24 h-24 text-2xl shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {displayName}
              </h1>
              <Chip size="sm" variant="flat" className="mt-2">
                @{person.username}
              </Chip>

              {person.stats && (
                <div className="mt-4">
                  <PersonActivityStats stats={person.stats} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Activity Timeline
            </h2>
            <Select
              label="Filter"
              selectedKeys={[typeFilter]}
              onChange={(e) => setTypeFilter(e.target.value as EventTypeFilter)}
              size="sm"
              className="w-40"
            >
              {eventTypeOptions.map((opt) => (
                <SelectItem key={opt.key}>{opt.label}</SelectItem>
              ))}
            </Select>
          </div>

          <Divider className="mb-6" />

          {activityLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" label="Loading activity..." />
            </div>
          ) : filteredActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No activity found</p>
              {typeFilter !== "all" && (
                <button
                  onClick={() => setTypeFilter("all")}
                  className="text-olive-light hover:underline mt-2 text-sm"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivity.map((event) => (
                <ActivityTimelineItem key={event.id} event={event} />
              ))}

              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className="py-4">
                {isFetchingNextPage && (
                  <div className="flex justify-center">
                    <LoadingSpinner size="sm" label="Loading more..." />
                  </div>
                )}
              </div>

              {/* End of list indicator */}
              {!hasNextPage && filteredActivity.length > 0 && (
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-2">
                  End of activity history
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ActivityTimelineItemProps {
  event: {
    id: string;
    type: string;
    title: string;
    body: string | null;
    project: string;
    createdAt: Date;
    gitlabUrl: string;
  };
}

function ActivityTimelineItem({ event }: ActivityTimelineItemProps) {
  const typeColors: Record<string, "primary" | "success" | "warning" | "default"> = {
    issue: "warning",
    merge_request: "success",
    comment: "primary",
  };

  const typeLabels: Record<string, string> = {
    issue: "Issue",
    merge_request: "Merge Request",
    comment: "Comment",
  };

  const snippet = event.body
    ? event.body.replace(/\s+/g, " ").trim().slice(0, 150)
    : null;

  return (
    <a
      href={event.gitlabUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 
                 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="pt-1">
          <Chip
            size="sm"
            color={typeColors[event.type] ?? "default"}
            variant="flat"
          >
            {typeLabels[event.type] ?? event.type}
          </Chip>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {event.title}
          </p>
          {snippet && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {snippet}
              {event.body && event.body.length > 150 && "..."}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {event.project} • {new Date(event.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </a>
  );
}
