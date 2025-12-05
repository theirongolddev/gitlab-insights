"use client";

/**
 * AppLayout - Application layout with sidebar for authenticated users
 *
 * Story 2.8: Sidebar Navigation
 * AC 2.8.1: Sidebar visible on all authenticated pages (dashboard, queries, settings)
 *
 * Story 3.4: Sidebar New Item Badges
 * AC 3.4.8: NewItemsProvider wraps children to share new items data
 *
 * Story 3.5: Background Sync Refresh
 * Uses useBackgroundSyncRefresh to detect Inngest sync completion and refresh UI
 *
 * Shows sidebar only for authenticated users on appropriate routes.
 * Login/onboarding pages don't show sidebar.
 */

import { useSession } from "~/lib/auth-client";
import { usePathname } from "next/navigation";
import { QuerySidebar } from "~/components/queries/QuerySidebar";
import { NewItemsProvider } from "~/contexts/NewItemsContext";
import { useBackgroundSyncRefresh } from "~/hooks/useBackgroundSyncRefresh";
import { type ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

// Routes where sidebar should NOT appear (login, onboarding, etc.)
const NO_SIDEBAR_ROUTES = ["/", "/onboarding"];

/**
 * BackgroundSyncWatcher - Runs the background sync detection hook
 * Must be inside providers that give it access to tRPC context
 */
function BackgroundSyncWatcher({ children }: { children: ReactNode }) {
  useBackgroundSyncRefresh();
  return <>{children}</>;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Don't show sidebar if not authenticated
  const isAuthenticated = !!session?.user;

  // Don't show sidebar on certain routes (login, onboarding)
  const shouldShowSidebar =
    isAuthenticated && !NO_SIDEBAR_ROUTES.includes(pathname ?? "");

  // AC 3.4.8: NewItemsProvider ALWAYS wraps children to ensure useNewItems() works
  // This is necessary because useSession() returns undefined during initial hydration,
  // but server-protected routes (like /dashboard) render children that need the context.
  // The provider handles unauthenticated state gracefully (queries will fail/return empty).
  //
  // Story 3.5: BackgroundSyncWatcher detects Inngest sync completion and refreshes all queries
  return (
    <NewItemsProvider>
      <BackgroundSyncWatcher>
        {shouldShowSidebar ? (
          // AC 2.8.1: Sidebar visible on authenticated pages
          <div className="flex flex-1 min-w-0">
            <QuerySidebar />
            <main className="flex-1 overflow-auto min-w-0">{children}</main>
          </div>
        ) : (
          // No sidebar - login, onboarding, or session still loading
          <main className="flex-1">{children}</main>
        )}
      </BackgroundSyncWatcher>
    </NewItemsProvider>
  );
}
