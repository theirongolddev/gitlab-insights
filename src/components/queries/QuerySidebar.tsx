"use client";

/**
 * QuerySidebar - Sidebar displaying user's saved queries
 *
 * Story 2.8: Sidebar Navigation
 * AC 2.8.1: Sidebar visible on all authenticated pages
 * AC 2.8.2: Lists user's saved queries with counts
 * AC 2.8.3: Clicking query navigates to /queries/[id]
 * AC 2.8.4: Number keys 1-9 jump to queries by position
 * AC 2.8.5: Empty state shown when no queries
 *
 * Story 3.4: Sidebar New Item Badges
 * AC 3.4.1: Each sidebar query displays badge showing new item count
 * AC 3.4.5: Badge count derived from single data source (NewItemsContext)
 * AC 3.4.7: Badge replaces total count; total count moves to tooltip
 */

import { usePathname, useRouter } from "next/navigation";
import { useShortcutHandler } from "~/hooks/useShortcutHandler";
import { useNewItems } from "~/contexts/NewItemsContext";
import { NewItemsBadge } from "~/components/sidebar/NewItemsBadge";
import { Sidebar } from "~/components/ui/Sidebar";
import {
  NavList,
  NavItem,
  NavItemShortcut,
} from "~/components/ui/NavList";

interface QuerySidebarProps {
  className?: string;
}

/**
 * NavigationSection - Quick links to main app sections
 */
function NavigationSection() {
  const pathname = usePathname();

  const navItems = [
    { href: "/catch-up", label: "Catch Up" },
    { href: "/people", label: "People" },
    { href: "/files", label: "Files" },
  ];

  return (
    <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500 px-2 mb-2">
        Navigate
      </h2>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                isActive
                  ? "bg-olive-light/10 text-olive-dark dark:text-olive-light font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * SidebarHeader - Section header for saved queries
 */
function SidebarHeader() {
  return (
    <h2 className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500 px-2 mb-2">
      Saved Queries
    </h2>
  );
}

/**
 * SidebarFooter - Keyboard shortcuts hint
 */
function SidebarFooter() {
  return (
    <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-500">
      <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-700">
        /
      </kbd>
      <span>search</span>
      <span className="mx-1">·</span>
      <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-700">
        1-9
      </kbd>
      <span>jump to query</span>
    </div>
  );
}

/**
 * EmptyState - Displayed when user has no saved queries
 */
function EmptyState() {
  return (
    <div className="px-4 py-6 text-center">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        No saved queries yet
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
        Use{" "}
        <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-olive dark:bg-gray-700 dark:text-olive-light">
          /
        </kbd>{" "}
        to search
      </p>
    </div>
  );
}

/**
 * LoadingSkeleton - Placeholder while queries are loading
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-1 px-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-9 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800"
        />
      ))}
    </div>
  );
}

export function QuerySidebar({ className = "" }: QuerySidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Code Review Fix: Consume queries from shared context (AC 3.4.8)
  // This eliminates duplicate queries.list fetch and inherits staleTime/refetchOnWindowFocus settings
  const { queries, queriesWithNewCounts, isQueriesLoading: isLoading } = useNewItems();

  // AC 2.8.4: Register keyboard shortcut handler for 1-9 navigation
  useShortcutHandler('navigateToQuery', (index: number) => {
    if (queries?.[index]) {
      router.push(`/queries/${queries[index].id}`);
    }
  });

  // Extract current query ID from pathname (for active state)
  const currentQueryId = pathname?.startsWith("/queries/")
    ? pathname.split("/")[2]
    : null;

  // AC 3.4.5: Helper to look up newCount by queryId
  const getNewCount = (queryId: string): number => {
    const found = queriesWithNewCounts.find((q) => q.queryId === queryId);
    return found?.newCount ?? 0;
  };

  return (
    <Sidebar
      aria-label="Navigation and queries"
      header={<NavigationSection />}
      footer={<SidebarFooter />}
      className={className}
    >
      {/* Saved Queries section header */}
      <SidebarHeader />

      {/* Loading state */}
      {isLoading && <LoadingSkeleton />}

      {/* AC 2.8.5: Empty state */}
      {!isLoading && (!queries || queries.length === 0) && <EmptyState />}

      {/* AC 2.8.2, 2.8.3: Query list with navigation */}
      {/* AC 3.4.1, 3.4.7: New items badge + total count in tooltip */}
      {!isLoading && queries && queries.length > 0 && (
        <NavList aria-label="Saved queries list">
          {queries.map((query, index) => {
            const isActive = query.id === currentQueryId;
            const shortcutKey = index < 9 ? index + 1 : null;
            const newCount = getNewCount(query.id);

            // AC 3.4.7: Total count moved to tooltip
            const tooltipContent = `${query.count} matching event${query.count === 1 ? "" : "s"}`;

            // Code Review Fix: Use native title attribute for tooltip instead of HeroUI Tooltip
            // to avoid breaking React Aria ListBox keyboard navigation (arrow keys, type-ahead)
            return (
              <NavItem
                key={query.id}
                id={query.id}
                href={`/queries/${query.id}`}
                isActive={isActive}
                textValue={query.name}
                title={tooltipContent}
                trailing={
                  <>
                    {/* AC 3.4.1: New items badge (replaces NavItemCount) */}
                    <NewItemsBadge newCount={newCount} />
                    {shortcutKey && (
                      <NavItemShortcut
                        shortcut={shortcutKey}
                        isActive={isActive}
                      />
                    )}
                  </>
                }
              >
                {query.name}
              </NavItem>
            );
          })}
        </NavList>
      )}
    </Sidebar>
  );
}
