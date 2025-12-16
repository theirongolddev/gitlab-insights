import { requireAuth } from "~/lib/auth-server";
import { CatchUpClient } from "./CatchUpClient";

export default async function CatchUpPage() {
  await requireAuth();

  return <CatchUpClient />;
}
