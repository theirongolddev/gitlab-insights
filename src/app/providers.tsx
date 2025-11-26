"use client";

import { useRouter } from "next/navigation";
import { RouterProvider } from "react-aria-components";
import { TRPCReactProvider } from "~/trpc/react";
import { ShortcutProvider } from "~/components/keyboard/ShortcutContext";
import { ShortcutHandler } from "~/components/keyboard/ShortcutHandler";
import { SearchProvider } from "~/components/search/SearchContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <RouterProvider navigate={router.push}>
      <TRPCReactProvider>
        <ShortcutProvider>
          <ShortcutHandler />
          {/* Story 2.4: SearchProvider for global search state */}
          <SearchProvider>
            {children}
          </SearchProvider>
        </ShortcutProvider>
      </TRPCReactProvider>
    </RouterProvider>
  );
}
