"use client";

type EventType = "issue" | "merge_request" | "comment";

interface BadgeProps {
  type: EventType;
  isNew?: boolean;
}

const badgeColors: Record<EventType, string> = {
  issue: "bg-badge-issue dark:bg-badge-issue-dark text-white", // Purple
  merge_request: "bg-badge-mr dark:bg-badge-mr-dark text-white", // Blue
  comment: "bg-badge-comment dark:bg-badge-comment-dark text-white", // Gray
};

const badgeLabels: Record<EventType, string> = {
  issue: "Issue",
  merge_request: "MR",
  comment: "Comment",
};

export function Badge({ type, isNew }: BadgeProps) {
  return (
    <div className="flex items-center gap-1.5">
      {isNew && (
        <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-olive-light text-white">
          NEW
        </span>
      )}
      <span
        className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${badgeColors[type]}`}
      >
        {badgeLabels[type]}
      </span>
    </div>
  );
}

export type { EventType };
