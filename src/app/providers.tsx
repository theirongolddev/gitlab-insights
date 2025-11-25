"use client";

import { TRPCReactProvider } from "~/trpc/react";
import { ShortcutProvider } from "~/components/keyboard/ShortcutContext";
import { ShortcutHandler } from "~/components/keyboard/ShortcutHandler";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCReactProvider>
      <ShortcutProvider>
        <ShortcutHandler />
        {children}
      </ShortcutProvider>
    </TRPCReactProvider>
  );
}
