import { useEffect, useEffectEvent } from "react";
import { useShortcuts, type ShortcutHandlerName } from "~/components/keyboard/ShortcutContext";

/**
 * Custom hook for registering keyboard shortcut handlers
 *
 * Eliminates the need for manual useEffect and useCallback in consuming components.
 * Uses React 19's useEffectEvent to create stable handler references that always
 * have access to latest props/state without causing re-registration.
 *
 * @param name - Shortcut name (type-safe union of valid handler names)
 * @param handler - Function to call when shortcut is triggered
 * @param scopeId - Optional scope ID for section-specific handlers (Catch-Up Mode)
 *
 * @example
 * ```typescript
 * // Simple handler
 * useShortcutHandler('focusSearch', () => {
 *   searchInputRef.current?.focus();
 * });
 *
 * // Handler with dynamic state (no useCallback needed!)
 * useShortcutHandler('openSaveModal', () => {
 *   if (keywords.length > 0) {
 *     setIsModalOpen(true);
 *   }
 * });
 *
 * // Scoped handler for specific table instance
 * useShortcutHandler('moveSelectionDown', () => {
 *   setSelectedIndex(prev => prev + 1);
 * }, 'catch-up-new-section');
 *
 * // Parameterized handler (e.g., navigateToQuery)
 * useShortcutHandler('navigateToQuery', (index: number) => {
 *   if (queries?.[index]) {
 *     router.push(`/queries/${queries[index].id}`);
 *   }
 * });
 * ```
 */
export function useShortcutHandler(
  name: ShortcutHandlerName,
  handler: (...args: any[]) => void,
  scopeId?: string
) {
  const { registerHandler } = useShortcuts();

  // useEffectEvent creates a stable reference that always calls the latest handler
  // This eliminates the need for handler in the dependency array
  const stableHandler = useEffectEvent(handler);

  useEffect(() => {
    return registerHandler(name, stableHandler, scopeId);
  }, [name, scopeId, registerHandler]);
}
