"use client";

import { Button } from "@heroui/react";
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { useTheme } from "~/contexts/ThemeContext";

/**
 * Icon size class for theme toggle icons
 * Sized to match HeroUI Button size="sm" (20px = h-5 w-5)
 */
const ICON_SIZE_CLASS = "h-5 w-5";

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
 */
export function ThemeToggle() {
  const { theme, preference, toggleTheme } = useTheme();

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
