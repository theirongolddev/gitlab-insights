"use client";

import { api } from "~/trpc/react";

export function SimpleEventList() {
  const { data } = api.events.getRecent.useQuery({});

  const events = data?.items;

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          No events yet. Click the Refresh button to fetch events from GitLab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div key={event.id} className="bg-white dark:bg-gray-800 border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${event.type === "issue"
                ? "bg-purple-800 text-purple-100"
                : event.type === "merge_request"
                  ? "bg-blue-800 text-blue-100"
                  : "bg-gray-600 text-gray-100"
                }`}
            >
              {event.type === "merge_request" ? "MR" : event.type}
            </span>
            <div className="flex-1">
              <a
                href={event.gitlabUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-medium text-gray-900 dark:text-gray-50 hover:text-olive dark:hover:text-olive-light hover:underline"
              >
                {event.title}
              </a>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                <span>{event.author}</span>
                <span>•</span>
                <span>{event.project}</span>
                <span>•</span>
                <span>{formatRelativeTime(new Date(event.createdAt))}</span>
              </div>
              {event.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {event.labels.map((label) => (
                    <span
                      key={label}
                      className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-400 rounded"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
