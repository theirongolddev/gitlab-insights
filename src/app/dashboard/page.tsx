import { requireAuth } from "~/lib/auth-server";
import { DashboardClient } from "~/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  await requireAuth();

  return <DashboardClient />;
}
