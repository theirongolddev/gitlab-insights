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
  activities: ActivityItem[];
  relatedWorkItems: {
    closes: WorkItem[];
    closedBy: WorkItem[];
    mentioned: WorkItem[];
  };
}
