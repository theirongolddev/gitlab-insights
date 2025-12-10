"use client";

import { useRouter } from "next/navigation";
import { RouterProvider } from "react-aria-components";
import { HeroUIProvider } from "@heroui/react";
import { Toaster } from "sonner";
import { TRPCReactProvider } from "~/trpc/react";
import { ShortcutProvider } from "~/components/keyboard/ShortcutContext";
import { ShortcutHandler } from "~/components/keyboard/ShortcutHandler";
import { SearchProvider } from "~/components/search/SearchContext";
import { DetailPaneProvider } from "~/contexts/DetailPaneContext";
import { ToastProvider } from "~/components/ui/Toast/ToastContext";
import { ToastContainer } from "~/components/ui/Toast/ToastContainer";
import { ThemeProviderWithErrorBoundary } from "~/contexts/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // CRITICAL: ThemeProvider MUST be outermost (before HeroUIProvider) so that
  // theme class is applied to <html> before HeroUI components render their styles
  return (
    <ThemeProviderWithErrorBoundary>
      <HeroUIProvider>
      <RouterProvider navigate={router.push}>
        <TRPCReactProvider>
          <ShortcutProvider>
            {/* Story 2.4: SearchProvider for global search state */}
            <SearchProvider>
              {/* DetailPaneProvider for split pane state */}
              <DetailPaneProvider>
                {/* Story 5.1: ShortcutHandler needs access to DetailPaneProvider */}
                <ShortcutHandler />
                {/* Story 2.10: ToastProvider for error/success notifications */}
                <ToastProvider>
                  {children}
                  <ToastContainer />
                  {/* Story 3.3: Sonner toast for catch-up mode error notifications */}
                  <Toaster position="bottom-right" theme="system" />
                </ToastProvider>
              </DetailPaneProvider>
            </SearchProvider>
          </ShortcutProvider>
        </TRPCReactProvider>
      </RouterProvider>
    </HeroUIProvider>
    </ThemeProviderWithErrorBoundary>
  );
}
