import { type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "~/lib/auth-server";
import { AuthenticatedLayout } from "~/components/layout/AuthenticatedLayout";

/**
 * Layout for authenticated routes (dashboard, queries, settings)
 * 
 * Story 6-2: Route Architecture Refactor
 * - Server-side auth check redirects unauthenticated users to /login
 * - AuthenticatedLayout provides sidebar, NewItemsProvider, etc.
 * - No auth-required queries run until we've confirmed user is authenticated
 */
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
