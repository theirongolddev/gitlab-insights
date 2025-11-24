"use client";

import { useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { Header } from "~/components/layout/Header";
import { api } from "~/trpc/react";
import { useState } from "react";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Query for events and last sync
  const { data: events, refetch: refetchEvents } = api.events.getRecent.useQuery(undefined, {
    enabled: !!session,
  });

  const { data: lastSyncData, refetch: refetchLastSync } = api.events.getLastSync.useQuery(undefined, {
    enabled: !!session,
  });

  // Manual refresh mutation
  const manualRefresh = api.events.manualRefresh.useMutation({
    onSuccess: async (result) => {
      console.log("[Dashboard] Manual refresh successful", result);
      await refetchEvents();
      await refetchLastSync();
      setIsRefreshing(false);
    },
    onError: (error) => {
      console.error("[Dashboard] Manual refresh failed", error);
      alert(`Refresh failed: ${error.message}`);
      setIsRefreshing(false);
    },
  });

  const handleRefresh = () => {
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

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

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
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {lastSyncData?.lastSyncAt ? (
                  <>Last sync: {formatRelativeTime(new Date(lastSyncData.lastSyncAt))}</>
                ) : (
                  <>No sync yet - click refresh to load events</>
                )}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-[#5e6b24] text-white rounded-md hover:bg-[#4F5A1F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isRefreshing ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="container mx-auto px-4 py-6">
          {!events || events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                No events yet. Click the Refresh button to fetch events from GitLab.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  {/* Event Type Badge */}
                  <div className="flex items-start gap-3">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        event.type === "issue"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          : event.type === "merge_request"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {event.type === "merge_request" ? "MR" : event.type}
                    </span>
                    <div className="flex-1">
                      {/* Title */}
                      <a
                        href={event.gitlabUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-medium text-[#2d2e2e] dark:text-[#FDFFFC] hover:text-[#5e6b24] dark:hover:text-[#9DAA5F] hover:underline"
                      >
                        {event.title}
                      </a>
                      {/* Metadata */}
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span>{event.author}</span>
                        <span>•</span>
                        <span>{event.project}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(new Date(event.createdAt))}</span>
                      </div>
                      {/* Labels */}
                      {event.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.labels.map((label) => (
                            <span
                              key={label}
                              className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
