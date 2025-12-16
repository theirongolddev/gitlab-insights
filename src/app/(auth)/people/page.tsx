import { requireAuth } from "~/lib/auth-server";
import { PeopleClient } from "~/components/people/PeopleClient";

export default async function PeoplePage() {
  await requireAuth();

  return <PeopleClient />;
}
