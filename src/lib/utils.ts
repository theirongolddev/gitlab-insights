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
