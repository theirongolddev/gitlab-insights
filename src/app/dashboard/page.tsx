"use client";

import { useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { RefreshButton } from "~/components/dashboard/RefreshButton";
import { SyncIndicator } from "~/components/dashboard/SyncIndicator";
import { ItemRow, type DashboardEvent } from "~/components/dashboard/ItemRow";
import { api } from "~/trpc/react";
import { useState, useRef } from "react";
import {
  Table,
  TableBody,
  Row,
  Cell,
  Column,
  TableHeader,
} from "react-aria-components";

type SectionType = "issues" | "mergeRequests" | "comments";

// AC-10: Hardcoded filter label
// Developer override: AC-10 specifies "security" but user's GitLab instance lacks this label.
// Changed to "bug" for practical testing. Reviewer accepted this deviation.
// User-controlled queries will be implemented in Epic 2.
const HARDCODED_FILTER_LABEL = "bug";

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
      {/* AC-17: React Aria Table for keyboard Tab navigation */}
      <Table
        aria-label={`${title} events`}
        className="w-full"
        onRowAction={(key) => {
          const event = events.find((e) => e.id === key);
          if (event) {
            window.open(event.gitlabUrl, "_blank", "noopener,noreferrer");
          }
        }}
      >
        <TableHeader className="sr-only">
          <Column isRowHeader>Event</Column>
        </TableHeader>
        <TableBody items={events}>
          {(event) => (
            <Row
              key={event.id}
              id={event.id}
              className="outline-none cursor-pointer
                hover:bg-gray-800
                focus:ring-2 focus:ring-[#9DAA5F]"
            >
              <Cell className="p-0">
                <ItemRow
                  item={event}
                  isSelected={false}
                  isNew={false}
                  onClick={() => {}}
                />
              </Cell>
            </Row>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Section refs for scroll navigation
  const issuesRef = useRef<HTMLDivElement>(null);
  const mrsRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  const utils = api.useUtils();

  // AC-10: Get dashboard events with hardcoded security label filter
  const { data: dashboardData } = api.events.getForDashboard.useQuery({
    filterLabel: HARDCODED_FILTER_LABEL,
  });

  // Manual refresh mutation
  const manualRefresh = api.events.manualRefresh.useMutation({
    onSuccess: async () => {
      await utils.events.getForDashboard.invalidate();
      await utils.events.getLastSync.invalidate();
      setIsRefreshing(false);
    },
    onError: (error) => {
      alert(`Refresh failed: ${error.message}`);
      setIsRefreshing(false);
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    manualRefresh.mutate();
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
    <div className="flex min-h-screen flex-col bg-[#FDFFFC] dark:bg-[#2d2e2e]">
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

        {/* Sectioned Events List */}
        <div className="container mx-auto px-4 py-6">
          {isEmpty ? (
            <div className="text-center py-12">
              {/* AC-4: Exact empty state message */}
              <p className="text-lg text-gray-600 dark:text-gray-400">
                No events match the current filter
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
    </div>
  );
}
