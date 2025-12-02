import { requireAuth } from "~/lib/auth-server";
import { SettingsClient } from "~/components/settings/SettingsClient";

export default async function SettingsPage() {
  await requireAuth();

  return <SettingsClient />;
}
