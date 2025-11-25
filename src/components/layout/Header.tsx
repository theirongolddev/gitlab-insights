"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "~/lib/auth-client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/Button";
import { useShortcuts } from "~/components/keyboard/ShortcutContext";
import { useSearch } from "~/components/search/SearchContext";
import { SearchBar } from "~/components/search/SearchBar";
import { Menu, MenuTrigger, MenuItem, Popover } from "react-aria-components";
import { api } from "~/trpc/react";

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { setFocusSearch, setClearFocusAndModals } = useShortcuts();

  // Story 2.6: Search state from context - now uses keywords array
  const { keywords, addKeyword, removeKeyword, isSearchLoading } = useSearch();

  // Story 2.7a: Save query mutation
  const createQuery = api.queries.create.useMutation({
    onSuccess: (data) => {
      alert(`Query saved! "${data.name}"`);
    },
    onError: (error) => {
      alert(`Failed to save query: ${error.message}`);
    },
  });

  const handleSaveQuery = () => {
    // Simple prompt for query name (Story 2.9 will add proper modal)
    const name = prompt("Enter a name for this query:", keywords.join(" + "));
    if (name) {
      createQuery.mutate({
        name,
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
  }, [setFocusSearch, setClearFocusAndModals]);

  if (!session?.user) {
    return null; // Don't show header on login page
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-[#2d2e2e]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#2d2e2e] dark:text-[#FDFFFC]">
            GitLab <span className="text-[#5e6b24] dark:text-[#9DAA5F]">Insights</span>
          </h1>
        </Link>

        {/* Story 2.6: Global SearchBar with tag pill input */}
        <div className="flex flex-1 items-center justify-center px-4">
          <SearchBar
            keywords={keywords}
            onAddKeyword={addKeyword}
            onRemoveKeyword={removeKeyword}
            onSave={handleSaveQuery}
            isLoading={isSearchLoading}
            inputRef={searchInputRef}
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Settings link */}
          <Link
            href="/settings"
            className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#2d2e2e] focus:outline-none focus:ring-2 focus:ring-[#9DAA5F] dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-[#FDFFFC]"
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

          {/* User menu dropdown */}
          <MenuTrigger>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 border-0 px-2"
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
                <span className="text-sm font-medium text-[#2d2e2e] dark:text-[#FDFFFC]">
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
            <Popover
              className="rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <Menu
                className="min-w-[160px] py-1 outline-none"
                onAction={(key) => {
                  if (key === "settings") {
                    router.push("/settings");
                  } else if (key === "signout") {
                    void handleSignOut();
                  }
                }}
              >
                <MenuItem
                  id="settings"
                  className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-[#2d2e2e] outline-none hover:bg-gray-100 focus:bg-gray-100 dark:text-[#FDFFFC] dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                >
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
                  Settings
                </MenuItem>
                <MenuItem
                  id="signout"
                  className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-[#2d2e2e] outline-none hover:bg-gray-100 focus:bg-gray-100 dark:text-[#FDFFFC] dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                >
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
                  Sign out
                </MenuItem>
              </Menu>
            </Popover>
          </MenuTrigger>
        </div>
      </div>
    </header>
  );
}
