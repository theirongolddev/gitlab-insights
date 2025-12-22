"use client";

import { useMemo, useEffect, useRef } from "react";
import { Button, Chip, Avatar, Skeleton } from "@heroui/react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { api } from "~/trpc/react";
import { ActivityTimeline } from "./ActivityTimeline";
import { formatRelativeTime } from "~/lib/utils";
import type { WorkItem } from "~/types/work-items";
import { HighlightedText } from "~/components/ui/HighlightedText";
import { highlightText } from "~/lib/search/highlight-text";
import { useReactions } from "~/hooks/useReactions";
import { GitLabMarkdown, extractInstanceUrl } from "~/components/ui/GitLabMarkdown";

interface WorkItemDetailViewProps {
  workItemId: string;
  onBack: () => void;
  /** Optional search query for highlighting matching terms */
  searchQuery?: string;
}

/**
 * WorkItemDetailView - Full-width detail view for a work item
 *
 * Replaces the list when a card is clicked. Shows complete GitLab context:
 * - Header with back button, title, and Open in GitLab
 * - Status, labels, assignees
 * - Full description
 * - Complete activity timeline
 * - Related work items
 */
export function WorkItemDetailView({ workItemId, onBack, searchQuery }: WorkItemDetailViewProps) {
  const { data, isLoading, error } = api.workItems.getWithActivity.useQuery(
    { id: workItemId, includeRelated: true },
    { enabled: !!workItemId }
  );

  // Apply highlighting when search query is active
  // These hooks must be called unconditionally before early returns
  const highlightedTitle = useMemo(() => {
    if (!searchQuery || !data?.workItem) return null;
    return highlightText(data.workItem.title, searchQuery);
  }, [searchQuery, data]);

  const highlightedBody = useMemo(() => {
    if (!searchQuery || !data?.workItem?.body) return null;
    return highlightText(data.workItem.body, searchQuery);
  }, [searchQuery, data]);

  // Apply highlighting to activities
  const highlightedActivities = useMemo(() => {
    if (!data?.activities) return [];
    if (!searchQuery) return data.activities;
    return data.activities.map((activity) => ({
      ...activity,
      highlightedBody: activity.body ? highlightText(activity.body, searchQuery) : undefined,
    }));
  }, [searchQuery, data]);

  // Extract note IDs from activities (including replies) for fetching reactions
  // Memoized to prevent unnecessary refetches when data reference changes but activities don't
  const noteIds = useMemo(() => {
    if (!data?.activities) return [];
    return data.activities
      .flatMap((thread) => [thread, ...(thread.replies ?? [])])
      .map((a) => a.gitlabNoteId)
      .filter((id): id is number => id !== undefined);
  }, [data?.activities]);

  // Fetch reactions on-demand with react-query caching
  const { data: reactions } = useReactions({
    repositoryPath: data?.workItem.repositoryPath ?? "",
    noteableType: data?.workItem.type ?? "issue",
    noteableIid: data?.workItem.number ?? 0,
    noteIds,
  });

  // Ref for scrollable content to enable scroll-to-first-match
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to first match when data loads with a search query
  useEffect(() => {
    if (!searchQuery || !data || isLoading) return;

    // Small delay to ensure DOM is rendered with highlighted content
    const timeoutId = setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      // Find the first <mark> element (highlighted match)
      const firstMatch = container.querySelector("mark");
      if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, data, isLoading]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col animate-in fade-in duration-150">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 p-4 border-b border-default-200 bg-content1">
          <Skeleton className="w-8 h-8 rounded" />
          <div className="flex-1">
            <Skeleton className="w-3/4 h-6 rounded mb-2" />
            <Skeleton className="w-1/4 h-4 rounded" />
          </div>
          <Skeleton className="w-32 h-9 rounded" />
        </div>
        {/* Content skeleton */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <Skeleton className="w-full h-24 rounded-lg" />
          <Skeleton className="w-full h-16 rounded-lg" />
          <Skeleton className="w-full h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="h-full flex flex-col animate-in fade-in duration-150">
        <div className="flex items-center gap-3 p-4 border-b border-default-200 bg-content1">
          <Button
            isIconOnly
            variant="light"
            onPress={onBack}
            aria-label="Back to list"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-default-700">Error loading details</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-danger-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-default-500 mb-4">{error?.message ?? "Failed to load work item"}</p>
          <Button variant="flat" color="primary" onPress={onBack}>
            Back to list
          </Button>
        </div>
      </div>
    );
  }

  const { workItem, activities, relatedWorkItems } = data;
  const typeIcon = workItem.type === "issue" ? "I" : "MR";
  const typeColor = workItem.type === "issue" ? "success" : "secondary";
  const statusColor =
    workItem.status === "open"
      ? "success"
      : workItem.status === "merged"
        ? "secondary"
        : "default";

  const hasRelatedItems =
    relatedWorkItems.closes.length > 0 ||
    relatedWorkItems.closedBy.length > 0 ||
    relatedWorkItems.mentioned.length > 0;

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-150">
      {/* Fixed Header */}
      <div className="flex items-start gap-3 p-4 border-b border-default-200 bg-content1 shrink-0">
        <Button
          isIconOnly
          variant="light"
          onPress={onBack}
          aria-label="Back to list"
          className="shrink-0 mt-0.5"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Chip size="sm" color={typeColor} variant="flat">
              {typeIcon}
            </Chip>
            <span className="text-xs text-default-500">
              {workItem.repositoryName} #{workItem.number}
            </span>
            <Chip size="sm" color={statusColor} variant="dot" className="capitalize">
              {workItem.status}
            </Chip>
          </div>
          {highlightedTitle ? (
            <HighlightedText
              html={highlightedTitle}
              className="text-lg font-semibold text-default-800 line-clamp-2"
            />
          ) : (
            <h1 className="text-lg font-semibold text-default-800 line-clamp-2">
              {workItem.title}
            </h1>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-default-500">
            <Avatar
              src={workItem.authorAvatar ?? undefined}
              name={workItem.author}
              size="sm"
              className="w-5 h-5"
            />
            <span>{workItem.author}</span>
            <span>-</span>
            <span>{formatRelativeTime(workItem.lastActivityAt)}</span>
          </div>
        </div>

        <Button
          as="a"
          href={workItem.gitlabUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="flat"
          color="primary"
          size="sm"
          startContent={<ExternalLink className="w-4 h-4" />}
          className="shrink-0"
        >
          Open in GitLab
        </Button>
      </div>

      {/* Scrollable Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {/* Labels */}
        {workItem.labels.length > 0 && (
          <div className="px-4 py-3 border-b border-default-100">
            <h3 className="text-xs font-medium text-default-500 mb-2">Labels</h3>
            <div className="flex flex-wrap gap-1">
              {workItem.labels.map((label) => (
                <Chip key={label} size="sm" variant="bordered" className="text-xs">
                  {label}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Assignees */}
        {workItem.assignees.length > 0 && (
          <div className="px-4 py-3 border-b border-default-100">
            <h3 className="text-xs font-medium text-default-500 mb-2">Assignees</h3>
            <div className="flex flex-wrap gap-2">
              {workItem.assignees.map((assignee) => (
                <div key={assignee} className="flex items-center gap-1 text-sm">
                  <Avatar name={assignee} size="sm" className="w-5 h-5" />
                  <span>@{assignee}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {workItem.body && (
          <div className="px-4 py-3 border-b border-default-100">
            <h3 className="text-xs font-medium text-default-500 mb-2">Description</h3>
            {highlightedBody ? (
              <HighlightedText
                html={highlightedBody}
                className="text-sm text-default-700 whitespace-pre-wrap"
              />
            ) : (
              <GitLabMarkdown
                content={workItem.body}
                gitlabInstanceUrl={extractInstanceUrl(workItem.gitlabUrl) ?? 'https://gitlab.com'}
                projectPath={workItem.repositoryPath}
                projectId={workItem.projectId}
                className="text-sm text-default-700"
              />
            )}
          </div>
        )}

        {/* Activity Timeline */}
        <div className="px-4 py-3 border-b border-default-100">
          <h3 className="text-xs font-medium text-default-500 mb-3">
            Activity ({activities.length})
          </h3>
          <ActivityTimeline
            activities={highlightedActivities}
            parentType={workItem.type}
            reactions={reactions}
            onActivityClick={(activity) => {
              if (activity.gitlabUrl) {
                window.open(activity.gitlabUrl, "_blank", "noopener,noreferrer");
              }
            }}
            gitlabInstanceUrl={extractInstanceUrl(workItem.gitlabUrl) ?? 'https://gitlab.com'}
            projectPath={workItem.repositoryPath}
            projectId={workItem.projectId}
          />
        </div>

        {/* Related Work Items */}
        {hasRelatedItems && (
          <div className="px-4 py-3 border-b border-default-100">
            <h3 className="text-xs font-medium text-default-500 mb-3">Related Work Items</h3>

            {relatedWorkItems.closes.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs text-default-400 mb-2">Closes</h4>
                <div className="space-y-1">
                  {relatedWorkItems.closes.map((item) => (
                    <RelatedItemRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {relatedWorkItems.closedBy.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs text-default-400 mb-2">Closed By</h4>
                <div className="space-y-1">
                  {relatedWorkItems.closedBy.map((item) => (
                    <RelatedItemRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {relatedWorkItems.mentioned.length > 0 && (
              <div>
                <h4 className="text-xs text-default-400 mb-2">Mentioned In</h4>
                <div className="space-y-1">
                  {relatedWorkItems.mentioned.map((item) => (
                    <RelatedItemRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-8" />
      </div>
    </div>
  );
}

function RelatedItemRow({ item }: { item: WorkItem }) {
  const typeIcon = item.type === "issue" ? "I" : "MR";
  const typeColor = item.type === "issue" ? "success" : "secondary";

  return (
    <a
      href={item.gitlabUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-content2 transition-colors"
    >
      <Chip size="sm" color={typeColor} variant="flat" className="shrink-0">
        {typeIcon}
      </Chip>
      <span className="text-xs text-default-500 shrink-0">#{item.number}</span>
      <span className="text-sm text-default-700 truncate flex-1">{item.title}</span>
      {item.isUnread && (
        <Chip size="sm" className="bg-[#9DAA5F] text-white shrink-0">
          NEW
        </Chip>
      )}
    </a>
  );
}
