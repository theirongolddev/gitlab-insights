import { requireAuth } from "~/lib/auth-server";
import { OnboardingClient } from "~/components/onboarding/OnboardingClient";

export default async function OnboardingPage() {
  await requireAuth();

  return <OnboardingClient />;
}
