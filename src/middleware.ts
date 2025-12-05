import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "better-auth.session_token";

const PROTECTED_ROUTES = ["/dashboard", "/queries", "/settings", "/onboarding"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME);
  const hasSession = !!sessionToken;

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect authenticated users from public pages (root and login)
  if ((pathname === "/" || pathname === "/login") && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)"],
};
