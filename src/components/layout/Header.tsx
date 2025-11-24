"use client";

import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

export function Header() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null; // Don't show header on login page
  }

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-[#2d2e2e]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#2d2e2e] dark:text-[#FDFFFC]">
            GitLab <span className="text-[#5e6b24] dark:text-[#9DAA5F]">Insights</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name || "User avatar"}
              width={32}
              height={32}
              className="rounded-full"
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
          <button
            onClick={() => void signOut({ callbackUrl: "/" })}
            className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium text-[#2d2e2e] transition hover:bg-gray-300 dark:bg-gray-800 dark:text-[#FDFFFC] dark:hover:bg-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
