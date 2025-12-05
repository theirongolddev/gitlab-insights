import { type ReactNode } from "react";
import { PublicHeader } from "~/components/layout/PublicHeader";

/**
 * Layout for public routes (login)
 * 
 * Story 6-2: Route Architecture Refactor
 * - Simple layout with PublicHeader (branding + theme toggle)
 * - No sidebar, no NewItemsProvider, no background sync
 */
export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">{children}</main>
    </>
  );
}
