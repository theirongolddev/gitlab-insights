"use client";

import { Avatar, Chip, Divider } from "@heroui/react";
import { api } from "~/trpc/react";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { PersonActivityStats } from "./PersonActivityStats";

interface PersonDetailProps {
  personId: string | null;
}

export function PersonDetail({ personId }: PersonDetailProps) {
  const { data: person, isLoading } = api.people.getById.useQuery(
    { id: personId! },
    { enabled: !!personId }
  );

  const { data: activityData, isLoading: activityLoading } =
    api.people.getActivity.useQuery(
      { personId: personId!, limit: 20 },
      { enabled: !!personId }
    );

  if (!personId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>Select a person to view details</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="md" label="Loading..." />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>Person not found</p>
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

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <Avatar
            src={person.avatarUrl ?? undefined}
            name={initials}
            size="lg"
            className="shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {displayName}
            </h2>
            <Chip
              size="sm"
              variant="flat"
              className="mt-1"
            >
              @{person.username}
            </Chip>
          </div>
        </div>

        <Divider className="my-4" />

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Activity Summary
          </h3>
          {person.stats && (
            <PersonActivityStats stats={person.stats} />
          )}
        </div>

        <Divider className="my-4" />

        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Recent Activity
          </h3>
          {activityLoading ? (
            <LoadingSpinner size="sm" label="Loading activity..." />
          ) : activityData?.items.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No recent activity
            </p>
          ) : (
            <div className="space-y-3">
              {activityData?.items.map((event) => (
                <ActivityItem key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ActivityItemProps {
  event: {
    id: string;
    type: string;
    title: string;
    project: string;
    createdAt: Date;
    gitlabUrl: string;
  };
}

function ActivityItem({ event }: ActivityItemProps) {
  const typeColors: Record<string, "primary" | "success" | "warning" | "default"> = {
    issue: "warning",
    merge_request: "success",
    comment: "primary",
  };

  const typeLabels: Record<string, string> = {
    issue: "Issue",
    merge_request: "MR",
    comment: "Comment",
  };

  return (
    <a
      href={event.gitlabUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 
                 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="flex items-start gap-2">
        <Chip
          size="sm"
          color={typeColors[event.type] ?? "default"}
          variant="flat"
        >
          {typeLabels[event.type] ?? event.type}
        </Chip>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {event.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {event.project} • {new Date(event.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </a>
  );
}
