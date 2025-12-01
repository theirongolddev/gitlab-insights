"use client";

/**
 * NavList - A navigation list component using React Aria ListBox
 *
 * Provides accessible keyboard navigation for sidebar navigation items.
 * Uses ListBox with link items for proper navigation semantics.
 */

import { ListBox, ListBoxItem, Text } from "react-aria-components";
import type { ListBoxProps, ListBoxItemProps } from "react-aria-components";
import type { ReactNode, Key } from "react";

// Re-export for convenience
export { Text };

export interface NavListProps<T extends object>
  extends Omit<ListBoxProps<T>, "className" | "selectionMode"> {
  /** Additional CSS classes */
  className?: string;
  /** Content to display when there are no items */
  emptyState?: ReactNode;
}

/**
 * NavList provides keyboard-navigable navigation using React Aria ListBox.
 *
 * Features:
 * - Arrow key navigation between items
 * - Type-ahead search
 * - Focus management
 * - Screen reader support
 */
export function NavList<T extends object>({
  children,
  className = "",
  emptyState,
  ...props
}: NavListProps<T>) {
  return (
    <ListBox
      {...props}
      selectionMode="none"
      className={`
        outline-none px-2
        ${className}
      `.trim()}
      renderEmptyState={emptyState ? () => emptyState : undefined}
    >
      {children}
    </ListBox>
  );
}

export interface NavItemProps extends Omit<ListBoxItemProps, "className"> {
  /** URL to navigate to */
  href: string;
  /** Whether this item is currently active/selected */
  isActive?: boolean;
  /** Primary label text */
  children: ReactNode;
  /** Secondary content (e.g., count badge, shortcut hint) */
  trailing?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * NavItem - A navigation list item that acts as a link.
 *
 * Features:
 * - Proper link semantics with href
 * - Active state styling with olive accent
 * - Hover and focus states
 * - Support for trailing content (badges, shortcuts)
 */
export function NavItem({
  href,
  isActive = false,
  children,
  trailing,
  className = "",
  ...props
}: NavItemProps) {
  return (
    <ListBoxItem
      {...props}
      href={href}
      className={({ isFocused, isHovered }) => `
        group flex items-center justify-between
        rounded-md px-3 py-2 text-sm
        outline-none cursor-pointer
        transition-colors duration-150
        ${
          isActive
            ? "bg-olive-light/10 text-olive font-medium dark:bg-olive-light/15 dark:text-olive-light"
            : isFocused || isHovered
              ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
              : "text-gray-700 dark:text-gray-400"
        }
        ${className}
      `.trim()}
    >
      <span className="truncate">{children}</span>
      {trailing && (
        <span className="ml-2 flex shrink-0 items-center gap-1.5">
          {trailing}
        </span>
      )}
    </ListBoxItem>
  );
}

export interface NavItemCountProps {
  /** The count value to display */
  count: number;
  /** Whether the parent item is active */
  isActive?: boolean;
}

/**
 * NavItemCount - A count badge for NavItem trailing content.
 */
export function NavItemCount({ count, isActive = false }: NavItemCountProps) {
  return (
    <span
      className={`
        text-xs tabular-nums
        ${
          isActive
            ? "text-olive/80 dark:text-olive-light/80"
            : "text-gray-500 dark:text-gray-500"
        }
      `.trim()}
    >
      {count}
    </span>
  );
}

export interface NavItemShortcutProps {
  /** The keyboard shortcut key */
  shortcut: string | number;
  /** Whether the parent item is active */
  isActive?: boolean;
}

/**
 * NavItemShortcut - A keyboard shortcut hint shown on hover.
 */
export function NavItemShortcut({ shortcut, isActive = false }: NavItemShortcutProps) {
  return (
    <kbd
      className={`
        hidden rounded px-1 py-0.5 font-mono text-[10px]
        group-hover:inline-block group-data-[focused]:inline-block
        ${
          isActive
            ? "bg-olive-light/20 text-olive dark:bg-olive-light/30 dark:text-olive-light"
            : "bg-gray-200/70 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
        }
      `.trim()}
    >
      {shortcut}
    </kbd>
  );
}
