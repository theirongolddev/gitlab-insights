"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "~/lib/auth-client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/Button";
import { useShortcuts } from "~/components/keyboard/ShortcutContext";

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { setFocusSearch, setClearFocusAndModals } = useShortcuts();

  // Register keyboard shortcut handlers
  useEffect(() => {
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
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#2d2e2e] dark:text-[#FDFFFC]">
            GitLab <span className="text-[#5e6b24] dark:text-[#9DAA5F]">Insights</span>
          </h1>
        </div>

        <div className="flex flex-1 items-center justify-center px-4">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search... (/)"
            className="w-full max-w-md rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-[#2d2e2e] placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#9DAA5F] dark:border-gray-600 dark:bg-[#3d3e3e] dark:text-[#FDFFFC] dark:placeholder-gray-400"
            readOnly
          />
        </div>

        <div className="flex items-center gap-4">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name || "User avatar"}
              width={32}
              height={32}
              className="rounded-full"
              onError={(e) => {
                // Hide image on error (e.g., 401 from restricted GitLab instances)
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#2d2e2e] dark:text-[#FDFFFC]">
              {session.user.name}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {session.user.email}
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onPress={() => void handleSignOut()}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
