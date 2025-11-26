"use client";

/**
 * Sidebar - A navigation landmark component for app sidebars
 *
 * Uses React Aria useLandmark hook for F6 keyboard navigation between landmarks.
 * Provides consistent sidebar structure with header, nav content, and footer slots.
 */

import { useRef, type ReactNode } from "react";
import { useLandmark } from "@react-aria/landmark";

export interface SidebarProps {
  /** Accessible label for the sidebar landmark */
  "aria-label": string;
  /** Header content (e.g., section title) */
  header?: ReactNode;
  /** Main navigation content */
  children: ReactNode;
  /** Footer content (e.g., keyboard hints) */
  footer?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Sidebar component that serves as a navigation landmark.
 *
 * Features:
 * - Uses semantic <aside> element with navigation role
 * - F6/Shift+F6 navigation between landmarks (via useLandmark)
 * - Flexible slots for header, content, and footer
 * - Proper light/dark mode styling
 */
export function Sidebar({
  "aria-label": ariaLabel,
  header,
  children,
  footer,
  className = "",
}: SidebarProps) {
  const ref = useRef<HTMLElement>(null);
  const { landmarkProps } = useLandmark(
    { role: "navigation", "aria-label": ariaLabel },
    ref
  );

  return (
    <aside
      ref={ref}
      {...landmarkProps}
      className={`
        flex h-full w-56 flex-col
        border-r border-gray-200 dark:border-gray-800
        bg-white dark:bg-[#2d2e2e]
        ${className}
      `.trim()}
    >
      {header && (
        <div className="shrink-0 px-4 py-3">
          {header}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {footer && (
        <div className="shrink-0 border-t border-gray-200 px-4 py-3 dark:border-gray-700/50">
          {footer}
        </div>
      )}
    </aside>
  );
}
