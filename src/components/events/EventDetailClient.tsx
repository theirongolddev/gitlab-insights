"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import { EventDetail } from "./EventDetail";

interface EventDetailClientProps {
  eventId: string;
}

/**
 * Story 4.2: Mobile full-screen event detail view
 *
 * Displays event details in a full-screen layout for mobile devices.
 * Includes a back button to return to the previous page.
 *
 * Uses the EventDetail component for rendering full event information.
 */
export function EventDetailClient({ eventId }: EventDetailClientProps) {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <Button
          onPress={() => router.back()}
          variant="light"
          size="sm"
          startContent={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <EventDetail eventId={eventId} />
      </div>
    </div>
  );
}
