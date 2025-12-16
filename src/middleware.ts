import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "better-auth.session_token";

const PROTECTED_ROUTES = ["/dashboard", "/queries", "/settings", "/onboarding"];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const referer = request.headers.get("referer");

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME);
  const hasSession = !!sessionToken;
  const hasInvalidSessionFlag = searchParams.get("invalid_session") === "1";

  // Detect redirect loops: if we're on a protected route and came from the same route
  const isRedirectLoop =
    isProtectedRoute && referer && new URL(referer).pathname === pathname;

  // If we detect a redirect loop, clear the session cookie and allow through
  // The page's requireAuth will handle the redirect properly
  if (isRedirectLoop && hasSession) {
    const response = NextResponse.next();
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  // If we have an invalid session flag, clear the cookie and remove the flag
  if (hasInvalidSessionFlag) {
    const url = new URL(request.url);
    url.searchParams.delete("invalid_session");
    const response = NextResponse.redirect(url);
    if (hasSession) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  // Redirect unauthenticated users from protected routes
  // Only redirect if there's NO session cookie at all
  // If there's a cookie (even if invalid), let the page handle it
  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Don't redirect authenticated users from public pages in middleware
  // This prevents redirect loops. Let the client-side or page handle navigation.
  // The root page can check the session and redirect client-side if needed.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - files with extensions (e.g., .png, .jpg, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
