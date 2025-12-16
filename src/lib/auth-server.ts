import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { logger } from "~/lib/logger";

const SESSION_COOKIE_NAME = "better-auth.session_token";

type SessionResult =
  | { session: Awaited<ReturnType<typeof auth.api.getSession>>; error: null }
  | { session: null; error: Error };

/**
 * Server-side session helper for Server Components and Route Handlers
 * Returns session result with error information to distinguish between
 * "no session" (session: null, error: null) and "error occurred" (error: Error)
 */
async function getServerSessionWithError(): Promise<SessionResult> {
  const headersList = await headers();

  try {
    const session = await auth.api.getSession({ headers: headersList });
    return { session, error: null };
  } catch (error) {
    // Return error information instead of throwing
    // This allows callers to distinguish between "no session" and "error"
    logger.error({ error }, "auth-server: Failed to get server session");
    return {
      session: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Server-side session helper for Server Components and Route Handlers
 * Returns null if no session exists or if there's an error
 */
export async function getServerSession() {
  const result = await getServerSessionWithError();
  return result.session;
}

/**
 * Require authentication for a server component/route
 * Automatically redirects to login if not authenticated
 */
export async function requireAuth() {
  const result = await getServerSessionWithError();

  // If there was an error (e.g., database connection issue), don't clear cookies
  // The session might still be valid, we just can't verify it right now
  // Throw the error so Next.js can handle it (shows error page, doesn't log user out)
  if (result.error) {
    logger.error({ error: result.error }, "auth-server: Error getting session in requireAuth");
    throw result.error;
  }

  // If no error but no session, safe to clear cookie
  if (!result.session?.user) {
    // Clear invalid session cookie only when we're certain there's no valid session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (sessionCookie) {
      cookieStore.delete(SESSION_COOKIE_NAME);
    }
    // Redirect with a flag to indicate invalid session
    // This prevents redirect loops in middleware
    redirect("/?invalid_session=1");
  }

  return result.session;
}

/**
 * Get current user from session (server-side)
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user ?? null;
}
