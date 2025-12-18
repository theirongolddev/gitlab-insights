"use client";

import { Chip, Skeleton, Progress } from "@heroui/react";
import { api } from "~/trpc/react";
import { DuplicateBadge, isLikelyDuplicate } from "./DuplicateBadge";

const SIMILARITY_THRESHOLD = 0.5;
const RESULT_LIMIT = 5;

interface SimilarItemsPanelProps {
  eventId: string;
  onItemClick?: (eventId: string) => void;
}

/**
 * SimilarItemsPanel - Shows similar items for a given event
 *
 * Features:
 * - Queries similar items using combined scoring
 * - Shows similarity score as progress bar
 * - Displays "Likely Duplicate" badge for high similarity (>= 0.85)
 * - Hidden when no similar items found
 * - Links to related items in GitLab
 */
export function SimilarItemsPanel({ eventId, onItemClick }: SimilarItemsPanelProps) {
  const { data, isLoading, error } = api.similarity.getSimilar.useQuery(
    {
      eventId,
      limit: RESULT_LIMIT,
      threshold: SIMILARITY_THRESHOLD,
    },
    {
      enabled: !!eventId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-default-700 mb-3 pt-3 border-t border-default-200">
          Similar Items
        </h3>
        <Skeleton className="w-full h-16 rounded-lg" />
        <Skeleton className="w-full h-16 rounded-lg" />
      </div>
    );
  }

  // Error state - silently hide
  if (error) {
    return null;
  }

  // No results - hide the panel
  if (!data?.results || data.results.length === 0) {
    return null;
  }

  return (
    <div className="px-4 pb-4">
      <h3 className="text-sm font-medium text-default-700 mb-3 pt-3 border-t border-default-200">
        Similar Items ({data.results.length})
      </h3>
      <div className="space-y-2">
        {data.results.map((result) => (
          <SimilarItemCard
            key={result.event.id}
            event={result.event}
            similarity={result.similarity}
            onItemClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
}

interface SimilarEvent {
  id: string;
  type: string;
  title: string;
  project: string;
  author: string;
  gitlabUrl: string;
  labels: string[];
  status: string | null;
  createdAt: Date;
}

interface SimilarityBreakdown {
  titleSimilarity: number;
  descriptionSimilarity: number;
  labelSimilarity: number;
  fileOverlap: number;
  totalScore: number;
}

interface SimilarItemCardProps {
  event: SimilarEvent;
  similarity: SimilarityBreakdown;
  onItemClick?: (eventId: string) => void;
}

function SimilarItemCard({ event, similarity, onItemClick }: SimilarItemCardProps) {
  const typeIcon = event.type === "issue" ? "I" : "MR";
  const typeColor = event.type === "issue" ? "success" : "secondary";
  const isDuplicate = isLikelyDuplicate(similarity.totalScore);
  const scorePercent = Math.round(similarity.totalScore * 100);

  const handleClick = () => {
    if (onItemClick) {
      onItemClick(event.id);
    } else {
      window.open(event.gitlabUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex flex-col gap-2 p-3 rounded-lg bg-content2/50 hover:bg-content2 transition-colors text-left border border-default-100"
    >
      {/* Header row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Chip size="sm" color={typeColor} variant="flat" className="shrink-0">
          {typeIcon}
        </Chip>
        <span className="text-xs text-default-500 truncate flex-1">
          {event.project}
        </span>
        <DuplicateBadge similarity={similarity.totalScore} showPercentage={false} />
      </div>

      {/* Title */}
      <span className="text-sm text-default-700 line-clamp-2">{event.title}</span>

      {/* Similarity score */}
      <div className="flex items-center gap-2">
        <Progress
          size="sm"
          value={scorePercent}
          color={isDuplicate ? "danger" : scorePercent >= 70 ? "warning" : "primary"}
          className="flex-1"
          aria-label="Similarity score"
        />
        <span className="text-xs text-default-500 shrink-0 w-10 text-right">
          {scorePercent}%
        </span>
      </div>

      {/* Breakdown tooltip hint */}
      <div className="flex items-center gap-1 text-xs text-default-400">
        <span title={`Title: ${Math.round(similarity.titleSimilarity * 100)}%`}>
          T:{Math.round(similarity.titleSimilarity * 100)}
        </span>
        <span className="text-default-300">|</span>
        <span title={`Description: ${Math.round(similarity.descriptionSimilarity * 100)}%`}>
          D:{Math.round(similarity.descriptionSimilarity * 100)}
        </span>
        <span className="text-default-300">|</span>
        <span title={`Labels: ${Math.round(similarity.labelSimilarity * 100)}%`}>
          L:{Math.round(similarity.labelSimilarity * 100)}
        </span>
        <span className="text-default-300">|</span>
        <span title={`Files: ${Math.round(similarity.fileOverlap * 100)}%`}>
          F:{Math.round(similarity.fileOverlap * 100)}
        </span>
      </div>
    </button>
  );
}

export default SimilarItemsPanel;
