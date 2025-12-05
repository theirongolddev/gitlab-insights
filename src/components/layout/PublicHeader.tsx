"use client";

/**
 * PublicHeader - Simple header for public routes (login page)
 * 
 * Shows branding and theme toggle only - no user UI or search.
 * Used in (public) route group layout.
 */

import Link from "next/link";
import { ThemeToggle } from "~/components/theme/ThemeToggle";

export function PublicHeader() {
  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-bg-dark">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
            GitLab <span className="text-olive dark:text-olive-light">Insights</span>
          </h1>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
