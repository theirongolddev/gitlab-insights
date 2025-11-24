"use client";

import { useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { Header } from "~/components/layout/Header";
import { RefreshButton } from "~/components/dashboard/RefreshButton";
import { SyncIndicator } from "~/components/dashboard/SyncIndicator";
import { SimpleEventList } from "~/components/dashboard/SimpleEventList";
import { api } from "~/trpc/react";
import { useState } from "react";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const utils = api.useUtils();

  // Manual refresh mutation
  const manualRefresh = api.events.manualRefresh.useMutation({
    onSuccess: async (result) => {
      console.log("[Dashboard] Manual refresh successful", result);
      await utils.events.getRecent.invalidate();
      await utils.events.getLastSync.invalidate();
      setIsRefreshing(false);
    },
    onError: (error) => {
      console.error("[Dashboard] Manual refresh failed", error);
      alert(`Refresh failed: ${error.message}`);
      setIsRefreshing(false);
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    manualRefresh.mutate();
  };

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
      <main className="flex min-h-screen flex-col bg-[#FDFFFC] dark:bg-[#2d2e2e]">
        {/* Header with Manual Refresh */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#2d2e2e] dark:text-[#FDFFFC]">
                Dashboard
              </h1>
              <SyncIndicator />
            </div>
            <RefreshButton onRefresh={handleRefresh} isLoading={isRefreshing} />
          </div>
        </div>

        {/* Events List */}
        <div className="container mx-auto px-4 py-6">
          <SimpleEventList />
        </div>
      </main>
    </>
  );
}
