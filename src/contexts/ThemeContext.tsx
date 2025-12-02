"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useSyncExternalStore,
  useCallback,
  Component,
  type ReactNode,
  type ErrorInfo,
} from "react";
import {
  getSystemTheme,
  resolveTheme,
  applyTheme,
  THEME_STORAGE_KEY,
  type ThemeMode,
  type ThemePreference,
} from "~/lib/theme";

/**
 * Theme Context - Global theme state management
 *
 * Story 1.5.6: Dark Mode Toggle & System Preference Detection
 *
 * Provides:
 * - Theme state (light/dark mode)
 * - User preference tracking (system/light/dark)
 * - localStorage persistence
 * - System preference tracking with matchMedia
 * - Toggle functionality
 */

interface ThemeContextValue {
  /** Current resolved theme mode */
  theme: ThemeMode;
  /** User's theme preference */
  preference: ThemePreference;
  /** Set user theme preference */
  setPreference: (pref: ThemePreference) => void;
  /** Toggle theme (cycles through system → light → dark → system) */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Custom hook to subscribe to system color scheme changes
 * Uses useSyncExternalStore for proper React 18+ external state synchronization
 */
function useSystemTheme(): ThemeMode {
  const subscribe = useCallback((callback: () => void) => {
    if (typeof window === 'undefined') return () => {};
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', callback);
    return () => mediaQuery.removeEventListener('change', callback);
  }, []);

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return 'light';
    return getSystemTheme();
  }, []);

  const getServerSnapshot = useCallback(() => 'light' as ThemeMode, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * ThemeProvider - Wraps app to provide global theme state
 *
 * Story 1.5.6: Manages theme preference with localStorage persistence
 *
 * Handles:
 * - localStorage initialization (default: 'system')
 * - Theme resolution (system → actual light/dark)
 * - DOM application (toggles 'dark' class on <html>)
 * - Real-time system preference tracking via matchMedia (using useSyncExternalStore)
 * - Theme persistence on preference change
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize preference from localStorage or default to 'system'
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') {
      return 'system'; // SSR fallback
    }

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'system' || stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch (error) {
      console.warn('localStorage unavailable (privacy mode?):', error);
    }

    return 'system';
  });

  // Subscribe to system theme changes using useSyncExternalStore (React 18+ pattern)
  const systemTheme = useSystemTheme();

  // Derive theme from preference and system theme (no useState needed for theme)
  const theme: ThemeMode = preference === 'system' ? systemTheme : preference;

  // Apply theme to DOM when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Persist preference to localStorage when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch (error) {
      console.warn('localStorage unavailable (privacy mode?):', error);
    }
  }, [preference]);

  /**
   * Set user theme preference and persist to localStorage
   */
  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
  }, []);

  /**
   * Toggle theme - cycles through: system → light → dark → system
   */
  const toggleTheme = useCallback(() => {
    setPreferenceState(current => {
      if (current === 'system') return 'light';
      if (current === 'light') return 'dark';
      return 'system';
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

interface ThemeErrorBoundaryProps {
  children: ReactNode;
}

interface ThemeErrorBoundaryState {
  hasError: boolean;
}

/**
 * ThemeErrorBoundary - Catches theme initialization errors
 * 
 * Prevents theme errors (e.g., matchMedia not supported in old browsers)
 * from crashing the entire app. Falls back to light mode on error.
 */
class ThemeErrorBoundary extends Component<ThemeErrorBoundaryProps, ThemeErrorBoundaryState> {
  constructor(props: ThemeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ThemeErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ThemeProvider error (falling back to light mode):', error, errorInfo);
  }

  render() {
    // Always render children - on error, they render without theme context (light mode fallback)
    // Error is logged in componentDidCatch for debugging
    return this.props.children;
  }
}

/**
 * ThemeProviderWithErrorBoundary - ThemeProvider wrapped with error boundary
 * 
 * Use this as the exported provider to ensure theme errors don't crash the app.
 */
export function ThemeProviderWithErrorBoundary({ children }: ThemeProviderProps) {
  return (
    <ThemeErrorBoundary>
      <ThemeProvider>{children}</ThemeProvider>
    </ThemeErrorBoundary>
  );
}

/**
 * useTheme hook - Access theme context
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
