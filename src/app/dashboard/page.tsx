"use client";

import { useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { Header } from "~/components/layout/Header";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FDFFFC] dark:bg-[#2d2e2e]">
        <p className="text-xl text-[#2d2e2e] dark:text-[#FDFFFC]">Loading...</p>
      </main>
    );
  }

  if (!session) {
    router.push("/");
    return null;
  }

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center bg-[#FDFFFC] dark:bg-[#2d2e2e] px-4 py-16">
        <div className="container max-w-4xl">
          <h1 className="mb-8 text-4xl font-bold tracking-tight text-[#2d2e2e] dark:text-[#FDFFFC]">
            Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Dashboard coming in Story 1.5 - GitLab API Client with Manual Refresh
          </p>
        </div>
      </main>
    </>
  );
}
