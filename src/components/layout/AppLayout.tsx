"use client";

/**
 * AppLayout - Application layout with sidebar for authenticated users
 *
 * Story 2.8: Sidebar Navigation
 * AC 2.8.1: Sidebar visible on all authenticated pages (dashboard, queries, settings)
 *
 * Shows sidebar only for authenticated users on appropriate routes.
 * Login/onboarding pages don't show sidebar.
 */

import { useSession } from "~/lib/auth-client";
import { usePathname } from "next/navigation";
import { QuerySidebar } from "~/components/queries/QuerySidebar";
import { type ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

// Routes where sidebar should NOT appear (login, onboarding, etc.)
const NO_SIDEBAR_ROUTES = ["/", "/onboarding"];

export function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Don't show sidebar if not authenticated
  const isAuthenticated = !!session?.user;

  // Don't show sidebar on certain routes (login, onboarding)
  const shouldShowSidebar =
    isAuthenticated && !NO_SIDEBAR_ROUTES.includes(pathname ?? "");

  if (!shouldShowSidebar) {
    // No sidebar - just render content
    return <main className="flex-1">{children}</main>;
  }

  // AC 2.8.1: Sidebar visible on authenticated pages
  return (
    <div className="flex flex-1">
      <QuerySidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
