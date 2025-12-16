import { requireAuth } from "~/lib/auth-server";
import { PersonDetailClient } from "~/components/people/PersonDetailClient";

interface PersonDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PersonDetailPage({ params }: PersonDetailPageProps) {
  await requireAuth();
  const { id } = await params;

  return <PersonDetailClient personId={id} />;
}
