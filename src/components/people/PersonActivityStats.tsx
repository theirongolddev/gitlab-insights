"use client";

interface PersonStats {
  issueCount: number;
  mrCount: number;
  commentCount: number;
  totalEvents: number;
}

interface PersonActivityStatsProps {
  stats: PersonStats;
  compact?: boolean;
}

type StatKey = "issueCount" | "mrCount" | "commentCount";

const statConfig: ReadonlyArray<{ key: StatKey; label: string; color: string }> = [
  { key: "issueCount", label: "Issues", color: "bg-badge-issue dark:bg-badge-issue-dark" },
  { key: "mrCount", label: "MRs", color: "bg-badge-mr dark:bg-badge-mr-dark" },
  { key: "commentCount", label: "Comments", color: "bg-badge-comment dark:bg-badge-comment-dark" },
];

export function PersonActivityStats({ stats, compact = false }: PersonActivityStatsProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{stats.totalEvents} events</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {statConfig.map(({ key, label, color }) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${color}`} />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {stats[key]} {label}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 border-l border-gray-200 dark:border-gray-700 pl-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {stats.totalEvents} total
        </span>
      </div>
    </div>
  );
}

export type { PersonStats, PersonActivityStatsProps };
