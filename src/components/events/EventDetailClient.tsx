"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

interface EventDetailClientProps {
  eventId: string;
}

/**
 * Story 4.1: Mobile full-screen event detail view
 *
 * Displays event details in a full-screen layout for mobile devices.
 * Includes a back button to return to the previous page.
 */
export function EventDetailClient({ eventId }: EventDetailClientProps) {
  const router = useRouter();

  // Fetch event details
  const { data: event, isLoading, error } = api.events.getById.useQuery({ id: eventId });

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <p className="text-lg text-red-400">
            {error?.data?.code === "NOT_FOUND" ? "Event not found" : "Error loading event"}
          </p>
          <Button
            onPress={() => router.back()}
            variant="light"
            color="primary"
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-4">
        <Button
          onPress={() => router.back()}
          variant="light"
          size="sm"
          startContent={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            Event Details
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Event ID: {eventId}
          </p>
        </div>

        <div className="space-y-4">
          {event.gitlabUrl && (
            <div>
              <a
                href={event.gitlabUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-olive dark:text-olive-light hover:underline"
              >
                View in GitLab →
              </a>
            </div>
          )}

          {/* Additional event details would go here */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">
              Event Information
            </h2>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Full event details would be displayed here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
