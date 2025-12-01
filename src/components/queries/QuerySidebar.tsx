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
 */

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { useShortcuts } from "~/components/keyboard/ShortcutContext";
import { Sidebar } from "~/components/ui/Sidebar";
import {
  NavList,
  NavItem,
  NavItemCount,
  NavItemShortcut,
} from "~/components/ui/NavList";

interface QuerySidebarProps {
  className?: string;
}

/**
 * SidebarHeader - Section header for the sidebar
 */
function SidebarHeader() {
  return (
    <h2 className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">
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
  const { setNavigateToQuery } = useShortcuts();

  // AC 2.8.2: Fetch user's queries with counts
  const { data: queries, isLoading } = api.queries.list.useQuery();

  // AC 2.8.4: Register keyboard shortcut handler for 1-9 navigation
  useEffect(() => {
    setNavigateToQuery((index: number) => {
      if (queries?.[index]) {
        router.push(`/queries/${queries[index].id}`);
      }
    });
  }, [queries, router, setNavigateToQuery]);

  // Extract current query ID from pathname (for active state)
  const currentQueryId = pathname?.startsWith("/queries/")
    ? pathname.split("/")[2]
    : null;

  return (
    <Sidebar
      aria-label="Saved queries"
      header={<SidebarHeader />}
      footer={<SidebarFooter />}
      className={className}
    >
      {/* Loading state */}
      {isLoading && <LoadingSkeleton />}

      {/* AC 2.8.5: Empty state */}
      {!isLoading && (!queries || queries.length === 0) && <EmptyState />}

      {/* AC 2.8.2, 2.8.3: Query list with counts and navigation */}
      {!isLoading && queries && queries.length > 0 && (
        <NavList aria-label="Saved queries list">
          {queries.map((query, index) => {
            const isActive = query.id === currentQueryId;
            const shortcutKey = index < 9 ? index + 1 : null;

            return (
              <NavItem
                key={query.id}
                id={query.id}
                href={`/queries/${query.id}`}
                isActive={isActive}
                textValue={query.name}
                trailing={
                  <>
                    <NavItemCount count={query.count} isActive={isActive} />
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
