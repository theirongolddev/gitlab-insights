"use client";

import { useMemo } from "react";
import { Button } from "@heroui/react";
import { ExternalLink } from "lucide-react";
import { api } from "~/trpc/react";
import { formatRelativeTime, formatEventType } from "~/lib/utils";
import { useSearch } from "~/components/search/SearchContext";
import { HighlightedText } from "~/components/ui/HighlightedText";

interface EventDetailProps {
  eventId: string | null;
}

/**
 * Story 4.2: Event Detail Component
 *
 * Displays full event information in the detail pane:
 * - Event title, body, author, timestamps
 * - Project metadata and labels
 * - "Open in GitLab" button
 * - Proper empty states and loading states
 *
 * Story 4.4: Keyword highlighting in detail view
 * - Highlights search keywords in title and body
 * - Uses SearchContext to get active search terms
 * - Conditionally renders HighlightedText when highlights available
 *
 * AC1: Display full event data (title, body, author, timestamp, project, labels, GitLab link)
 * AC2: GitLab link button opens event URL in new tab
 * AC3: Empty state when no event selected
 * AC4: Empty body placeholder when event has no body text
 */
export function EventDetail({ eventId }: EventDetailProps) {
  const { keywords } = useSearch(); // Story 4.4: Get active search terms

  // Bug Fix (Story 4.4 regression): Stabilize searchTerms for React Query cache key
  // Defense-in-depth to prevent cache fragmentation if SearchContext keywords change
  const keywordsString = JSON.stringify(keywords); // Extract for ESLint compliance
  const searchTerms = useMemo(() => {
    return keywords.length > 0 ? keywords : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordsString]);

  const { data: event, isLoading, error } = api.events.getById.useQuery(
    {
      id: eventId!,
      searchTerms, // Use memoized version
    },
    { enabled: !!eventId }
  );

  // AC3: Empty state - no event selected
  if (!eventId) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-600">
        <p>Select an event to view details</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-500 dark:border-gray-700 dark:border-t-primary-500"
          role="status"
          aria-label="Loading event details"
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-600">
        <p>Failed to load event details. Please try again.</p>
      </div>
    );
  }

  // Not found state
  if (!event) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-600">
        <p>Event not found</p>
      </div>
    );
  }

  // AC1: Full event data display
  return (
    <div className="flex h-full flex-col">
      {/* Sticky Header */}
      <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
          {/* Story 4.4: Render highlighted title if available */}
          {"titleHighlighted" in event && event.titleHighlighted ? (
            <HighlightedText html={event.titleHighlighted} />
          ) : (
            event.title
          )}
        </h2>
        <div className="mt-2 flex gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>{event.author}</span>
          <span>•</span>
          <span>{formatRelativeTime(event.createdAt)}</span>
        </div>
      </div>

      {/* Scrollable Content */}
      {/* Layout: Two-section structure (Title section removed to avoid duplication with sticky header - Code Review Issue #3)
          - #body: Event description with empty state placeholder
          - #metadata: Project details, type, labels, timestamps
          Ready for Story 4.5 section navigation (chips can scroll: top for title, #body, #metadata) */}
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* Body Section */}
        <section id="body">
          <h3 className="mb-2 font-medium text-gray-700 dark:text-gray-300">
            Description
          </h3>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-900 dark:prose-invert dark:text-gray-50">
            {/* Story 4.4: Render highlighted body if available, otherwise plain text */}
            {"bodyHighlighted" in event && event.bodyHighlighted ? (
              <HighlightedText html={event.bodyHighlighted} />
            ) : event.body ? (
              event.body
            ) : (
              <em className="text-gray-400 dark:text-gray-600">
                (No description)
              </em>
            )}
          </div>
        </section>

        {/* Metadata Section */}
        <section id="metadata">
          <h3 className="mb-2 font-medium text-gray-700 dark:text-gray-300">
            Details
          </h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-600 dark:text-gray-400">Project:</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-50">
              {event.project}
            </dd>

            <dt className="text-gray-600 dark:text-gray-400">Type:</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-50">
              {formatEventType(event.type)}
            </dd>

            <dt className="text-gray-600 dark:text-gray-400">Created:</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-50">
              {new Date(event.createdAt).toLocaleString()}
            </dd>

            {event.labels && event.labels.length > 0 && (
              <>
                <dt className="text-gray-600 dark:text-gray-400">Labels:</dt>
                <dd className="flex flex-wrap gap-1">
                  {event.labels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {label}
                    </span>
                  ))}
                </dd>
              </>
            )}
          </dl>
        </section>
      </div>

      {/* Footer - AC2: GitLab link button */}
      <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <Button
          color="primary"
          className="w-full"
          onPress={() => window.open(event.gitlabUrl, '_blank')}
          endContent={<ExternalLink className="h-4 w-4" />}
        >
          Open in GitLab
        </Button>
      </div>
    </div>
  );
}
