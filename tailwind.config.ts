import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
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
