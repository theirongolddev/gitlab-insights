import { requireAuth } from "~/lib/auth-server";
import { CatchUpView } from "~/components/catchup";

export default async function CatchUpPage() {
  await requireAuth();

  return <CatchUpView />;
}
