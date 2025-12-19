/**
 * Work Item Types
 *
 * TypeScript interfaces for the work-item-centric grouped view.
 * These types are used by tRPC endpoints and UI components.
 */

/**
 * Participant in a work item's activity
 */
export interface Participant {
  username: string;
  avatarUrl: string | null;
}

/**
 * Summary of activity on a work item (for collapsed card view)
 */
export interface ActivitySummary {
  totalCount: number;
  newCount: number;
  latestActivity: {
    author: string;
    authorAvatar: string | null;
    timestamp: Date;
    preview: string;
  } | null;
  participants: Participant[];
}

/**
 * Grouped emoji reaction on a comment
 *
 * Multiple users can have the same reaction, grouped by emoji name.
 * Used for displaying reactions like: 👍 3  ❤️ 2
 */
export interface Reaction {
  emoji: string; // GitLab emoji name: "thumbsup", "heart", "smile", etc.
  users: Array<{
    username: string;
    avatar: string | null;
  }>;
}

/**
 * Individual activity item (comment, status change, etc.)
 */
export interface ActivityItem {
  id: string;
  type: "comment" | "status_change" | "label_change" | "assignment" | "system";
  author: string;
  authorAvatar: string | null;
  body: string | null;
  timestamp: Date;
  isSystemNote: boolean;
  isUnread: boolean;
  gitlabUrl: string;

  // Discussion threading (for grouping comments into threads)
  discussionId?: string;

  // GitLab note ID for fetching reactions on-demand
  gitlabNoteId?: number;

  // Search highlighting (optional, only present when search active)
  highlightedBody?: string;
}

/**
 * Threaded activity item - a thread starter with nested replies
 *
 * Used to group comments by GitLab discussion thread. System notes and
 * standalone comments (null discussionId) are treated as single-item threads.
 *
 * Ordering rules:
 * 1. Threads ordered by first comment time (threadStartTime)
 * 2. System notes appear inline chronologically
 * 3. Within a thread, replies ordered chronologically
 */
export interface ThreadedActivityItem extends ActivityItem {
  replies: ActivityItem[];
  isThreadStart: boolean;
  threadStartTime: Date;
}

/**
 * Work item (issue or MR) with activity summary
 */
export interface WorkItem {
  id: string;
  gitlabEventId: string;
  type: "issue" | "merge_request";
  status: "open" | "closed" | "merged";
  title: string;
  body: string | null;
  number: number;
  repositoryName: string;
  repositoryPath: string;
  labels: string[];
  author: string;
  authorAvatar: string | null;
  assignees: string[];
  createdAt: Date;
  lastActivityAt: Date;
  gitlabUrl: string;

  // Relationships
  closesIssueIds: number[];
  closedByMRIds: number[];
  mentionedInIds: number[];

  // Activity
  activitySummary: ActivitySummary;
  activities?: ActivityItem[];

  // Read state
  isUnread: boolean;
  lastReadAt: Date | null;

  // Search highlighting (optional, only present when search active)
  highlightedTitle?: string;
  highlightedSnippet?: string;
  /** When match is in a child comment, shows the highlighted snippet from that comment */
  matchingChildSnippet?: string;
}

/**
 * Grouped work items by type (for WorkItemList)
 */
export interface GroupedWorkItems {
  issues: WorkItem[];
  mergeRequests: WorkItem[];
  totalCount: number;
  unreadCount: number;
}

/**
 * Read metadata for tracking read state
 */
export interface ReadMetadata {
  userId: string;
  eventId: string;
  readAt: Date;
}

/**
 * Filter options for work item queries
 */
export interface WorkItemFilters {
  status?: ("open" | "closed" | "merged")[];
  type?: ("issue" | "merge_request")[];
  repository?: string[];
  unreadOnly?: boolean;
  search?: string;
}

/**
 * Pagination cursor for work item queries
 */
export interface WorkItemCursor {
  lastActivityAt: Date;
  id: string;
}

/**
 * Response shape for getWorkItemsGrouped endpoint
 */
export interface GetWorkItemsGroupedResponse {
  items: GroupedWorkItems;
  nextCursor: WorkItemCursor | null;
  hasMore: boolean;
}

/**
 * Response shape for getWorkItemWithActivity endpoint
 */
export interface GetWorkItemWithActivityResponse {
  workItem: WorkItem;
  activities: ThreadedActivityItem[];
  relatedWorkItems: {
    closes: WorkItem[];
    closedBy: WorkItem[];
    mentioned: WorkItem[];
  };
}
