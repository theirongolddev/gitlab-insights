"use client";

import { useRouter } from "next/navigation";
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
 *
 * Note: This is a placeholder implementation for Story 4.1.
 * Full event details fetching will be implemented in a future story.
 */
export function EventDetailClient({ eventId }: EventDetailClientProps) {
  const router = useRouter();

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
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">
              Event Information
            </h2>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Full event details will be implemented in a future story.</p>
              <p>For now, this page provides mobile navigation for Story 4.1.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
