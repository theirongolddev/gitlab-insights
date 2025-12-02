import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server-side session helper for Server Components and Route Handlers
 */
export async function getServerSession() {
  const headersList = await headers();

  try {
    const session = await auth.api.getSession({ headers: headersList });
    return session;
  } catch (error) {
    console.error("Failed to get server session:", error);
    return null;
  }
}

/**
 * Require authentication for a server component/route
 * Automatically redirects to login if not authenticated
 */
export async function requireAuth() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/");
  }

  return session;
}

/**
 * Get current user from session (server-side)
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user ?? null;
}
