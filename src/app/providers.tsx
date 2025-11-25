"use client";

import { TRPCReactProvider } from "~/trpc/react";
import { ShortcutProvider } from "~/components/keyboard/ShortcutContext";
import { ShortcutHandler } from "~/components/keyboard/ShortcutHandler";
import { SearchProvider } from "~/components/search/SearchContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCReactProvider>
      <ShortcutProvider>
        <ShortcutHandler />
        {/* Story 2.4: SearchProvider for global search state */}
        <SearchProvider>
          {children}
        </SearchProvider>
      </ShortcutProvider>
    </TRPCReactProvider>
  );
}
