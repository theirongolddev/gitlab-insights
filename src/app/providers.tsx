"use client";

import { useRouter } from "next/navigation";
import { RouterProvider } from "react-aria-components";
import { TRPCReactProvider } from "~/trpc/react";
import { ShortcutProvider } from "~/components/keyboard/ShortcutContext";
import { ShortcutHandler } from "~/components/keyboard/ShortcutHandler";
import { SearchProvider } from "~/components/search/SearchContext";
import { ToastProvider } from "~/components/ui/Toast/ToastContext";
import { ToastContainer } from "~/components/ui/Toast/ToastContainer";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <RouterProvider navigate={router.push}>
      <TRPCReactProvider>
        <ShortcutProvider>
          <ShortcutHandler />
          {/* Story 2.4: SearchProvider for global search state */}
          <SearchProvider>
            {/* Story 2.10: ToastProvider for error/success notifications */}
            <ToastProvider>
              {children}
              <ToastContainer />
            </ToastProvider>
          </SearchProvider>
        </ShortcutProvider>
      </TRPCReactProvider>
    </RouterProvider>
  );
}
