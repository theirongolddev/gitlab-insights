/**
 * Theme utilities for light/dark mode management
 * Provides type-safe theme functions for system preference detection and DOM manipulation
 */

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

/**
 * localStorage key for theme preference persistence
 * 
 * NOTE: This key is shared across all browser tabs/instances of the app.
 * Theme preference is intentionally global per-browser, not per-user or per-project.
 * This is expected behavior - users typically want consistent theme across all tabs.
 * 
 * CRITICAL: This key is duplicated in src/app/layout.tsx FOUC prevention script.
 * If changed here, the inline script must also be updated to match.
 */
export const THEME_STORAGE_KEY = 'gitlab-insights-theme';

/**
 * Detects system color scheme preference
 * @returns 'dark' if system prefers dark mode, 'light' otherwise
 */
export function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'; // SSR fallback
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Resolves theme preference to actual theme mode
 * @param preference User's theme preference
 * @returns Resolved theme mode
 */
export function resolveTheme(preference: ThemePreference): ThemeMode {
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
}

/**
 * Applies theme to document element
 * Toggles 'dark' class on <html> element for Tailwind darkMode: 'class'
 * @param mode Theme mode to apply
 */
export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') {
    return; // SSR guard
  }

  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
