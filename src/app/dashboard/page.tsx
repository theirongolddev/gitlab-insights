"use client";

import { useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { Header } from "~/components/layout/Header";
import { RefreshButton } from "~/components/dashboard/RefreshButton";
import { SyncIndicator } from "~/components/dashboard/SyncIndicator";
import { ItemRow, type DashboardEvent } from "~/components/dashboard/ItemRow";
import { api } from "~/trpc/react";
import { useState, useRef } from "react";

type SectionType = "issues" | "mergeRequests" | "comments";

// Default filter label - can be changed to any label
const DEFAULT_FILTER_LABEL = "bug";

interface FilterToggleProps {
  filterLabel: string;
  isFiltered: boolean;
  onToggle: () => void;
}

function FilterToggle({ filterLabel, isFiltered, onToggle }: FilterToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
          ${isFiltered
            ? "bg-[#9DAA5F] text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
      >
        <svg
          className={`w-4 h-4 transition-transform ${isFiltered ? "" : "opacity-50"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        {isFiltered ? (
          <>label:{filterLabel}</>
        ) : (
          <>All Events</>
        )}
      </button>
      {isFiltered && (
        <span className="text-xs text-gray-400">
          Click to show all
        </span>
      )}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  count: number;
  sectionId: SectionType;
  onNavigate: (sectionId: SectionType) => void;
}

function SectionHeader({ title, count, sectionId, onNavigate }: SectionHeaderProps) {
  return (
    <button
      onClick={() => onNavigate(sectionId)}
      className="flex items-center gap-2 px-4 py-2 text-left w-full
        hover:bg-gray-700/50 transition-colors
        border-b border-gray-700"
    >
      <h2 className="text-lg font-semibold text-[#FDFFFC]">{title}</h2>
      <span className="text-sm text-gray-400">({count})</span>
    </button>
  );
}

interface EventSectionProps {
  title: string;
  sectionId: SectionType;
  events: DashboardEvent[];
  sectionRef: React.RefObject<HTMLDivElement | null>;
  onNavigate: (sectionId: SectionType) => void;
}

function EventSection({ title, sectionId, events, sectionRef, onNavigate }: EventSectionProps) {
  return (
    <div ref={sectionRef} className="mb-6">
      <SectionHeader
        title={title}
        count={events.length}
        sectionId={sectionId}
        onNavigate={onNavigate}
      />
      <div role="table" aria-label={`${title} events`}>
        <div role="rowgroup">
          {events.map((event) => (
            <ItemRow
              key={event.id}
              item={event}
              isSelected={false}
              isNew={false}
              onClick={() => { }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFiltered, setIsFiltered] = useState(true); // Start with filter ON

  // Section refs for scroll navigation
  const issuesRef = useRef<HTMLDivElement>(null);
  const mrsRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  const utils = api.useUtils();

  // Get dashboard events with optional label filter
  const { data: dashboardData } = api.events.getForDashboard.useQuery({
    filterLabel: isFiltered ? DEFAULT_FILTER_LABEL : null,
  });

  // Manual refresh mutation
  const manualRefresh = api.events.manualRefresh.useMutation({
    onSuccess: async (result) => {
      console.log("[Dashboard] Manual refresh successful", result);
      await utils.events.getForDashboard.invalidate();
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

  const handleFilterToggle = () => {
    setIsFiltered(!isFiltered);
  };

  const handleSectionNavigate = (sectionId: SectionType) => {
    const refs: Record<SectionType, React.RefObject<HTMLDivElement | null>> = {
      issues: issuesRef,
      mergeRequests: mrsRef,
      comments: commentsRef,
    };

    refs[sectionId].current?.scrollIntoView({ behavior: "smooth" });
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

  // Transform API data to DashboardEvent format
  const issues: DashboardEvent[] = (dashboardData?.issues ?? []).map((e) => ({
    ...e,
    type: e.type as DashboardEvent["type"],
    createdAt: new Date(e.createdAt),
  }));

  const mergeRequests: DashboardEvent[] = (dashboardData?.mergeRequests ?? []).map((e) => ({
    ...e,
    type: e.type as DashboardEvent["type"],
    createdAt: new Date(e.createdAt),
  }));

  const comments: DashboardEvent[] = (dashboardData?.comments ?? []).map((e) => ({
    ...e,
    type: e.type as DashboardEvent["type"],
    createdAt: new Date(e.createdAt),
  }));

  const totalEvents = issues.length + mergeRequests.length + comments.length;
  const isEmpty = totalEvents === 0;

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

        {/* Filter Bar */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="container mx-auto px-4 py-2">
            <FilterToggle
              filterLabel={DEFAULT_FILTER_LABEL}
              isFiltered={isFiltered}
              onToggle={handleFilterToggle}
            />
          </div>
        </div>

        {/* Sectioned Events List */}
        <div className="container mx-auto px-4 py-6">
          {isEmpty ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {isFiltered
                  ? `No events match label:${DEFAULT_FILTER_LABEL}`
                  : "No events found"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                {isFiltered
                  ? "Try switching to 'All Events' or add this label to items in GitLab."
                  : "Click Refresh to load events from GitLab."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Issues Section */}
              {issues.length > 0 && (
                <EventSection
                  title="Issues"
                  sectionId="issues"
                  events={issues}
                  sectionRef={issuesRef}
                  onNavigate={handleSectionNavigate}
                />
              )}

              {/* Merge Requests Section */}
              {mergeRequests.length > 0 && (
                <EventSection
                  title="Merge Requests"
                  sectionId="mergeRequests"
                  events={mergeRequests}
                  sectionRef={mrsRef}
                  onNavigate={handleSectionNavigate}
                />
              )}

              {/* Comments Section */}
              {comments.length > 0 && (
                <EventSection
                  title="Comments"
                  sectionId="comments"
                  events={comments}
                  sectionRef={commentsRef}
                  onNavigate={handleSectionNavigate}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
