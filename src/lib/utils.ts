import { formatDistanceToNow } from 'date-fns';

/**
 * Utility function for conditionally joining classNames
 *
 * @param classes - Class names to join (filters out falsy values)
 * @returns Combined className string
 *
 * @example
 * cn('base-class', isActive && 'active', 'another-class')
 * // => 'base-class active another-class' (if isActive is true)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format relative time using date-fns
 *
 * @param date - The date to format
 * @returns Formatted relative time string (e.g., "about 2 hours ago", "3 days ago")
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000))
 * // => "about 1 hour ago"
 */
export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format GitLab event type for display (converts snake_case to Title Case)
 *
 * @param type - The event type in snake_case (e.g., "merge_request", "issue")
 * @returns Formatted event type string
 *
 * @example
 * formatEventType("merge_request")
 * // => "Merge Request"
 *
 * formatEventType("issue")
 * // => "Issue"
 */
export function formatEventType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
