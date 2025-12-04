"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { signOut, useSession } from "~/lib/auth-client";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { useShortcuts } from "~/components/keyboard/ShortcutContext";
import { useSearch } from "~/components/search/SearchContext";
import { SearchBar } from "~/components/search/SearchBar";
import { CreateQueryModal } from "~/components/queries/CreateQueryModal";
import { api, clearQueryCache } from "~/trpc/react";
import { useToast } from "~/components/ui/Toast/ToastContext";
import { ThemeToggle } from "~/components/theme/ThemeToggle";

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { setFocusSearch, setClearFocusAndModals, setOpenSaveModal } = useShortcuts();
  const { showToast } = useToast();

  // Story 2.6: Search state from context - now uses keywords array
  const { keywords, addKeyword, removeKeyword, clearSearch, setKeywords, isSearchLoading } = useSearch();

  // Story 3.2: Check if currently in Catch-Up Mode
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const isCatchUpMode = pathname === "/dashboard" && searchParams.get("mode") === "catchup";

  // Story 3.2: Wrap addKeyword to exit Catch-Up Mode first
  const handleAddKeyword = useCallback((keyword: string) => {
    if (isCatchUpMode) {
      // Navigate to dashboard first, then add keyword
      router.push("/dashboard");
    }
    addKeyword(keyword);
  }, [isCatchUpMode, router, addKeyword]);

  // Story 2.8.5: Modal state for CreateQueryModal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Story 2.10: Extract query ID from pathname if on a query page
  const queryIdMatch = pathname?.match(/^\/queries\/([^/]+)$/);
  const currentQueryId = queryIdMatch ? queryIdMatch[1] : null;

  // Fetch current query if on a query page
  const { data: currentQuery } = api.queries.getById.useQuery(
    { id: currentQueryId! },
    { enabled: !!currentQueryId }
  );

  // Story 2.10 (AC 2.10.6): Auto-populate SearchBar with query keywords when on query page
  // Only sync when query ID changes (navigation), NOT when user edits keywords
  useEffect(() => {
    if (currentQuery?.filters) {
      const queryKeywords = (currentQuery.filters as { keywords: string[] }).keywords || [];
      setKeywords(queryKeywords);
    } else if (currentQueryId === null) {
      // Clear keywords when navigating away from query page
      clearSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuery?.id, currentQueryId]);

  // Story 2.10: Update mutation for updating existing query
  const utils = api.useUtils();
  const updateMutation = api.queries.update.useMutation({
    onSuccess: () => {
      void utils.queries.getById.invalidate({ id: currentQueryId! });
      void utils.queries.list.invalidate();
      showToast("Query updated successfully", "success");
    },
    onError: (error) => {
      // AC 2.10.15: Display user-friendly error message
      if (error.data?.code === "FORBIDDEN") {
        showToast("You don't have permission to edit this query", "error");
      } else {
        showToast("Failed to update query. Please try again.", "error");
      }
    },
  });

  const handleSaveQuery = () => {
    // Story 2.8.5: Open modal instead of prompt()
    setIsModalOpen(true);
  };

  const handleUpdateQuery = () => {
    // Story 2.10: Update existing query with new keywords
    if (currentQueryId && currentQuery && keywords.length > 0) {
      updateMutation.mutate({
        id: currentQueryId,
        filters: { keywords },
      });
    }
  };

  // Register keyboard shortcut handlers
  useEffect(() => {
    // AC 2.4.1: `/` focuses search input
    setFocusSearch(() => {
      searchInputRef.current?.focus();
    });

    setClearFocusAndModals(() => {
      // Blur any focused element
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });

    // Story 2.8.5 (AC 2.8.5.4): 's' key opens save modal (only if keywords exist)
    setOpenSaveModal(() => {
      if (keywords.length > 0) {
        setIsModalOpen(true);
      }
    });
  }, [setFocusSearch, setClearFocusAndModals, setOpenSaveModal, keywords.length]);

  if (!session?.user) {
    return null; // Don't show header on login page
  }

  const handleSignOut = async () => {
    // Clear the query cache first to prevent UNAUTHORIZED errors from in-flight queries
    clearQueryCache();
    await signOut();
    // Force a hard navigation so middleware runs and properly redirects
    window.location.href = "/";
  };

  return (
    <>
      {/* Story 2.8.5: CreateQueryModal */}
      <CreateQueryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        keywords={keywords}
      />

      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-bg-dark">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
              GitLab <span className="text-olive dark:text-olive-light">Insights</span>
            </h1>
          </Link>

          {/* Story 2.6: Global SearchBar with tag pill input */}
          {/* Story 2.10: Context-aware - passes currentQuery for Update button */}
          <div className="flex flex-1 items-center justify-center px-4">
            <SearchBar
              keywords={keywords}
              onAddKeyword={handleAddKeyword}
              onRemoveKeyword={removeKeyword}
              onSave={handleSaveQuery}
              onUpdate={handleUpdateQuery}
              currentQuery={currentQuery ? { id: currentQuery.id, name: currentQuery.name, filters: currentQuery.filters } : null}
              isLoading={isSearchLoading}
              inputRef={searchInputRef}
            />
          </div>

        <div className="flex items-center gap-4">
          {/* Story 1.5.6: Theme toggle button */}
          <ThemeToggle />

          {/* Settings link */}
          <Link
            href="/settings"
            className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-olive-light dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-50"
            title="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>

          {/* User menu dropdown - HeroUI Dropdown */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="light"
                size="sm"
                className="flex items-center gap-2 px-2"
              >
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User avatar"}
                    width={32}
                    height={32}
                    className="rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {session.user.name}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {session.user.email}
                  </span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="User actions"
              onAction={(key) => {
                if (key === "settings") {
                  router.push("/settings");
                } else if (key === "signout") {
                  void handleSignOut();
                }
              }}
            >
              <DropdownItem
                key="settings"
                startContent={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              >
                Settings
              </DropdownItem>
              <DropdownItem
                key="signout"
                startContent={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                }
              >
                Sign out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </header>
    </>
  );
}
