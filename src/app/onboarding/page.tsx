"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "~/components/layout/Header";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FDFFFC] dark:bg-[#2d2e2e]">
        <p className="text-xl text-[#2d2e2e] dark:text-[#FDFFFC]">Loading...</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FDFFFC] dark:bg-[#2d2e2e]">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
          <h1 className="text-4xl font-bold tracking-tight text-[#2d2e2e] dark:text-[#FDFFFC]">
            Welcome to GitLab Insights
          </h1>
          <p className="text-center text-xl text-[#2d2e2e] dark:text-[#FDFFFC]">
            Authenticated as {session?.user?.name}
          </p>
          <p className="text-center text-lg text-gray-600 dark:text-gray-400">
            Project selection will be implemented in Story 1.4
          </p>
        </div>
      </main>
    </>
  );
}
