import { requireAuth } from "~/lib/auth-server";
import { QueryMetadataClient } from "~/components/queries/QueryMetadataClient";

interface QueryMetadataPageProps {
  params: Promise<{ id: string }>;
}

export default async function QueryMetadataPage({
  params,
}: QueryMetadataPageProps) {
  await requireAuth();

  const { id: queryId } = await params;

  return <QueryMetadataClient queryId={queryId} />;
}
