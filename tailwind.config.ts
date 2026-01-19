import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Animation timing utilities
      transitionDuration: {
        instant: "0ms",
        fast: "100ms",
        normal: "200ms",
        slow: "300ms",
        slower: "400ms",
        slowest: "500ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
        in: "cubic-bezier(0.4, 0, 1, 1)",
        out: "cubic-bezier(0, 0, 0.2, 1)",
        "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      scale: {
        pressed: "0.97",
        hover: "1.02",
        pop: "1.05",
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "fade-out": "fade-out 200ms ease-in",
        "scale-in": "scale-in 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "scale-out": "scale-out 100ms ease-in",
        "slide-up": "slide-up 200ms ease-out",
        "slide-down": "slide-down 200ms ease-out",
        "slide-in": "slide-in 200ms ease-out",
        "slide-out": "slide-out 200ms ease-out",
        shimmer: "shimmer 2s infinite linear",
        "pulse-soft": "pulse-soft 2s infinite ease-in-out",
        "bounce-in": "bounce-in 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.95)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            // Primary (Olive) - Main brand color for buttons, accents
            primary: {
              DEFAULT: "hsl(68, 49%, 28%)", // Olive (#5e6b24)
              foreground: "#FFFFFF",
            },
            // Focus rings
            focus: "hsl(68, 49%, 28%)",
            // Success states (green)
            success: {
              DEFAULT: "hsl(142, 71%, 37%)", // #16A34A
              foreground: "#FFFFFF",
            },
            // Warning states (amber)
            warning: {
              DEFAULT: "hsl(38, 92%, 50%)", // #F59E0B
              foreground: "#000000",
            },
            // Error/Danger states (red)
            danger: {
              DEFAULT: "hsl(0, 72%, 42%)", // #B91C1C
              foreground: "#FFFFFF",
            },
            // Default/Secondary (gray)
            default: {
              DEFAULT: "hsl(220, 9%, 46%)", // gray-500 (#6B7280)
              foreground: "#FFFFFF",
            },
          },
        },
        dark: {
          colors: {
            // Primary (Olive Light) - Main brand color for dark mode
            primary: {
              DEFAULT: "hsl(68, 36%, 52%)", // Olive Light (#9DAA5F)
              foreground: "#000000",
            },
            // Focus rings
            focus: "hsl(68, 36%, 52%)",
            // Success states (lighter green for dark mode)
            success: {
              DEFAULT: "hsl(142, 71%, 45%)", // #22C55E
              foreground: "#000000",
            },
            // Warning states (lighter amber for dark mode)
            warning: {
              DEFAULT: "hsl(54, 97%, 63%)", // #FDE047
              foreground: "#000000",
            },
            // Error/Danger states (lighter red for dark mode)
            danger: {
              DEFAULT: "hsl(0, 72%, 51%)", // #DC2626
              foreground: "#FFFFFF",
            },
            // Default/Secondary (lighter gray for dark mode)
            default: {
              DEFAULT: "hsl(214, 17%, 66%)", // gray-400 (#94A3B8)
              foreground: "#000000",
            },
          },
        },
      },
    }),
  ],
};

export default config;
