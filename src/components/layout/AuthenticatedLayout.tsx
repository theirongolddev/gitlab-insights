"use client";

/**
 * AuthenticatedLayout - Layout for authenticated routes
 *
 * Story 6-2: Route Architecture Refactor
 * - Only rendered for authenticated users (server checks auth first)
 * - Includes Header component (moved from root layout)
 * - Provides sidebar navigation (except on onboarding)
 * - Wraps children in NewItemsProvider for badge data
 * - Runs background sync watcher
 * - Shows loading skeleton during initial hydration
 *
 * Story 2.8: Sidebar Navigation
 * Story 3.4: Sidebar New Item Badges
 * Story 3.5: Background Sync Refresh
 */

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "~/lib/auth-client";
import { Header } from "~/components/layout/Header";
import { QuerySidebar } from "~/components/queries/QuerySidebar";
import { NewItemsProvider } from "~/contexts/NewItemsContext";
import { useBackgroundSyncRefresh } from "~/hooks/useBackgroundSyncRefresh";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

// Routes where sidebar should NOT appear (onboarding)
const NO_SIDEBAR_ROUTES = ["/onboarding"];

/**
 * BackgroundSyncWatcher - Runs the background sync detection hook
 * Must be inside providers that give it access to tRPC context
 */
function BackgroundSyncWatcher({ children }: { children: ReactNode }) {
  useBackgroundSyncRefresh();
  return <>{children}</>;
}

/**
 * Skeleton shown during initial hydration to prevent layout shift.
 * Matches exact dimensions: header py-3, sidebar w-56.
 */
function AuthenticatedLayoutSkeleton() {
  return (
    <>
      {/* Header skeleton - matches py-3 padding */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-bg-dark">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="flex-1 mx-4">
            <div className="h-10 max-w-2xl mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
      {/* Content skeleton */}
      <div className="flex flex-1 min-w-0">
        {/* Sidebar skeleton - w-56 to match Sidebar component */}
        <aside className="flex h-full w-56 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 py-3">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="flex-1 px-2 space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </aside>
        {/* Main content skeleton */}
        <main className="flex-1 overflow-auto min-w-0 p-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </main>
      </div>
    </>
  );
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const showSidebar = !NO_SIDEBAR_ROUTES.includes(pathname ?? "");

  // Show skeleton only during initial hydration (isPending)
  if (isPending) {
    return <AuthenticatedLayoutSkeleton />;
  }

  // If no session after hydration, show skeleton (middleware will redirect)
  if (!session?.user) {
    return <AuthenticatedLayoutSkeleton />;
  }

  return (
    <NewItemsProvider>
      <BackgroundSyncWatcher>
        <Header />
        {showSidebar ? (
          <div className="flex flex-1 min-w-0">
            <QuerySidebar />
            <main className="flex-1 overflow-auto min-w-0">{children}</main>
          </div>
        ) : (
          <main className="flex-1">{children}</main>
        )}
      </BackgroundSyncWatcher>
    </NewItemsProvider>
  );
}
