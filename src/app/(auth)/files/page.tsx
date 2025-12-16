import { requireAuth } from "~/lib/auth-server";
import { FilesPageClient } from "~/components/files/FilesPageClient";

export default async function FilesPage() {
  await requireAuth();

  return <FilesPageClient />;
}
