import { requireAuth } from "~/lib/auth-server";
import { QueryDetailClient } from "~/components/queries/QueryDetailClient";

interface QueryPageProps {
  params: Promise<{ id: string }>;
}

export default async function QueryPage({ params }: QueryPageProps) {
  await requireAuth();

  const { id } = await params;

  return <QueryDetailClient queryId={id} />;
}
