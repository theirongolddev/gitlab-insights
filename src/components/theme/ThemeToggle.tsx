"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@heroui/react";
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { useTheme } from "~/contexts/ThemeContext";

/**
 * Icon size class for theme toggle icons
 * Sized to match HeroUI Button size="sm" (20px = h-5 w-5)
 */
const ICON_SIZE_CLASS = "h-5 w-5";

/**
 * Hook to detect if component is mounted (client-side)
 * Uses useSyncExternalStore to avoid hydration mismatch
 */
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {}, // subscribe (no-op, value never changes)
    () => true,     // getSnapshot (client: always true)
    () => false     // getServerSnapshot (server: always false)
  );
}

/**
 * ThemeToggle - Icon-only button for cycling through theme preferences
 *
 * Story 1.5.6: Dark Mode Toggle & System Preference Detection
 *
 * Features:
 * - Icon-only HeroUI Button (isIconOnly, variant="light", size="sm")
 * - Three-state cycle: system → light → dark → system
 * - Computer icon when using system preference
 * - Sun icon when forced light mode
 * - Moon icon when forced dark mode
 * - Keyboard accessible (Tab + Space/Enter)
 * - Descriptive aria-labels for screen readers
 * - Renders placeholder during SSR to prevent hydration mismatch
 */
export function ThemeToggle() {
  const { theme, preference, toggleTheme } = useTheme();
  
  // Track mounted state to prevent hydration mismatch
  // Server renders with 'system' preference, but client may have different localStorage value
  const isMounted = useIsMounted();

  // Render placeholder during SSR to prevent hydration mismatch
  // The actual icon depends on localStorage which isn't available on server
  if (!isMounted) {
    return (
      <Button
        isIconOnly
        variant="light"
        size="sm"
        aria-label="Toggle theme"
        className="text-gray-700 dark:text-gray-300"
        isDisabled
      >
        <ComputerDesktopIcon className={ICON_SIZE_CLASS} />
      </Button>
    );
  }

  // Determine icon and label based on PREFERENCE (not resolved theme)
  let Icon;
  let ariaLabel;

  if (preference === 'system') {
    Icon = ComputerDesktopIcon;
    ariaLabel = `Following system preference (${theme}). Click to force light mode`;
  } else if (preference === 'light') {
    Icon = SunIcon;
    ariaLabel = 'Light mode (forced). Click for dark mode';
  } else {
    Icon = MoonIcon;
    ariaLabel = 'Dark mode (forced). Click to follow system';
  }

  return (
    <Button
      isIconOnly
      variant="light"
      size="sm"
      onPress={toggleTheme}
      aria-label={ariaLabel}
      className="text-gray-700 dark:text-gray-300"
    >
      <Icon className={ICON_SIZE_CLASS} />
    </Button>
  );
}
