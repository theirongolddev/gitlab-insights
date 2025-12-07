import { requireAuth } from "~/lib/auth-server";
import { EventDetailClient } from "~/components/events/EventDetailClient";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Story 4.1: Mobile full-screen event detail page
 *
 * On mobile (<768px), clicking an event row navigates here instead of
 * opening a split pane. Provides a full-screen view of event details.
 */
export default async function EventPage({ params }: EventPageProps) {
  await requireAuth();

  const { id } = await params;

  return <EventDetailClient eventId={id} />;
}
