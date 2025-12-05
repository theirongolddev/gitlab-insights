import { redirect } from "next/navigation";
import { getServerSession } from "~/lib/auth-server";

/**
 * Root Page - Smart Redirect
 * 
 * Story 6-2: Route Architecture Refactor
 * - Server-side redirect based on authentication status
 * - Authenticated users → /dashboard
 * - Unauthenticated users → /login
 * - Future: Can become a landing page with client-side redirect
 */
export default async function Home() {
  const session = await getServerSession();

  if (session?.user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
