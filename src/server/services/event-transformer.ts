/**
 * Event Transformer Service
 *
 * Transforms GitLab API responses into database Event records
 * Handles deduplication and determines which events are new
 */

import type { PrismaClient } from "@prisma/client";
import type {
  GitLabIssue,
  GitLabMergeRequest,
  GitLabNote,
} from "./gitlab-client";
import { logger } from "~/lib/logger";

export interface TransformedEvent {
  type: "issue" | "merge_request" | "comment";
  title: string;
  body: string | null;
  author: string;
  authorAvatar: string | null;
  project: string;
  projectId: string;
  labels: string[];
  gitlabEventId: string;
  gitlabUrl: string;
  createdAt: Date;
  // Work item grouping fields (for comments/notes)
  parentType: "issue" | "merge_request" | null;
  parentEventId: string | null; // gitlabEventId format, will be resolved to DB ID
  gitlabParentId: number | null;
  isSystemNote: boolean;
  // Issue/MR metadata fields
  assignees: string[];
  participants: string[]; // Everyone who commented/interacted
  status: "open" | "closed" | "merged" | null;
  lastActivityAt: Date | null;
  commentCount: number;
  unresolvedCommentCount: number;
  // Cross-references
  mentionedInIds: number[];
  // MR -> Issue closing relationships
  closesIssueIds: number[];
}

/**
 * Extract issue/MR references from text
 * Matches #123 (issues) and !456 (MRs) patterns
 * Returns array of numeric IIDs
 */
export function extractMentionedIds(text: string | null): number[] {
  if (!text) return [];

  // Match #123 for issues and !456 for MRs
  const pattern = /[#!](\d+)/g;
  const ids: number[] = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const id = parseInt(match[1]!, 10);
    if (!isNaN(id) && !ids.includes(id)) {
      ids.push(id);
    }
  }

  return ids;
}

/**
 * Parse 'closes #N' patterns from MR descriptions
 * Supports: closes, close, closed, fix, fixes, fixed, resolve, resolves, resolved
 * Case-insensitive
 */
export function parseClosesIssueIds(text: string | null): number[] {
  if (!text) return [];

  const pattern = /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi;
  const ids: number[] = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const id = parseInt(match[1]!, 10);
    if (!isNaN(id) && !ids.includes(id)) {
      ids.push(id);
    }
  }

  return ids;
}

export interface StoreEventsResult {
  stored: number;
  skipped: number;
  errors: number;
}

/**
 * Transform GitLab issues into Event records
 */
export function transformIssues(
  issues: GitLabIssue[],
  projectMap: Map<number, { name: string; path: string }>
): TransformedEvent[] {
  return issues.map((issue) => {
    const project = projectMap.get(issue.project_id);
    const projectName = project?.name ?? `Project ${issue.project_id}`;
    const projectPath = project?.path ?? String(issue.project_id);

    return {
      type: "issue" as const,
      title: issue.title,
      body: issue.description,
      author: issue.author.username,
      authorAvatar: issue.author.avatar_url,
      project: projectName,
      projectId: projectPath,
      labels: issue.labels,
      gitlabEventId: `issue-${issue.id}`,
      gitlabUrl: issue.web_url,
      createdAt: new Date(issue.created_at),
      // Issues are top-level items, no parent
      parentType: null,
      parentEventId: null,
      gitlabParentId: null,
      isSystemNote: false,
      // Issue metadata
      assignees: issue.assignees?.map((a) => a.username) ?? [],
      participants: [], // Will be populated during activity metadata update
      status: issue.state === "opened" ? "open" : "closed",
      lastActivityAt: new Date(issue.updated_at),
      commentCount: issue.user_notes_count ?? 0,
      unresolvedCommentCount: 0, // Will be computed during activity metadata update
      // Cross-references from description
      mentionedInIds: extractMentionedIds(issue.description),
      // Issues don't close other issues
      closesIssueIds: [],
    };
  });
}

/**
 * Transform GitLab merge requests into Event records
 */
export function transformMergeRequests(
  mergeRequests: GitLabMergeRequest[],
  projectMap: Map<number, { name: string; path: string }>
): TransformedEvent[] {
  return mergeRequests.map((mr) => {
    const project = projectMap.get(mr.project_id);
    const projectName = project?.name ?? `Project ${mr.project_id}`;
    const projectPath = project?.path ?? String(mr.project_id);

    return {
      type: "merge_request" as const,
      title: mr.title,
      body: mr.description,
      author: mr.author.username,
      authorAvatar: mr.author.avatar_url,
      project: projectName,
      projectId: projectPath,
      labels: mr.labels,
      gitlabEventId: `mr-${mr.id}`,
      gitlabUrl: mr.web_url,
      createdAt: new Date(mr.created_at),
      // MRs are top-level items, no parent
      parentType: null,
      parentEventId: null,
      gitlabParentId: null,
      isSystemNote: false,
      // MR metadata
      assignees: mr.assignees?.map((a) => a.username) ?? [],
      participants: [], // Will be populated during activity metadata update
      status: mr.state === "opened" ? "open" : mr.state,
      lastActivityAt: new Date(mr.updated_at),
      commentCount: mr.user_notes_count ?? 0,
      unresolvedCommentCount: 0, // Will be computed during activity metadata update
      // Cross-references from description
      mentionedInIds: extractMentionedIds(mr.description),
      // Parse 'closes #N' patterns from MR description
      closesIssueIds: parseClosesIssueIds(mr.description),
    };
  });
}

/**
 * Transform GitLab notes (comments) into Event records
 * Captures parent relationships for work item grouping
 */
export function transformNotes(
  notes: Array<GitLabNote & { project_id: number; web_url: string }>,
  projectMap: Map<number, { name: string; path: string }>
): TransformedEvent[] {
  return notes.map((note) => {
    const project = projectMap.get(note.project_id);
    const projectName = project?.name ?? `Project ${note.project_id}`;
    const projectPath = project?.path ?? String(note.project_id);

    // Extract first line of comment as title
    const firstLine = note.body.split("\n")[0]?.trim() ?? "Comment";
    const title =
      firstLine.length > 100
        ? firstLine.substring(0, 97) + "..."
        : firstLine;

    // Determine parent type from GitLab's noteable_type
    const parentType: "issue" | "merge_request" =
      note.noteable_type === "Issue" ? "issue" : "merge_request";

    // Build parent event ID using the same format as transformIssues/transformMergeRequests
    const parentEventId =
      parentType === "issue"
        ? `issue-${note.noteable_id}`
        : `mr-${note.noteable_id}`;

    return {
      type: "comment" as const,
      title: `Comment: ${title}`,
      body: note.body,
      author: note.author.username,
      authorAvatar: note.author.avatar_url,
      project: projectName,
      projectId: projectPath,
      labels: [], // Notes don't have labels
      gitlabEventId: `note-${note.id}`,
      gitlabUrl: note.web_url,
      createdAt: new Date(note.created_at),
      // Work item grouping: link to parent issue/MR
      parentType,
      parentEventId,
      gitlabParentId: note.noteable_id,
      isSystemNote: note.system ?? false,
      // Comments don't have these fields directly
      assignees: [],
      participants: [], // Not applicable for individual comments
      status: null,
      lastActivityAt: null,
      commentCount: 0,
      unresolvedCommentCount: 0, // Not applicable for individual comments
      // Cross-references from comment body
      mentionedInIds: extractMentionedIds(note.body),
      // Comments don't close issues
      closesIssueIds: [],
    };
  });
}

/**
 * Store transformed events in database with deduplication
 *
 * Uses createMany with skipDuplicates to handle race conditions
 * Returns count of stored, skipped, and error events
 */
export async function storeEvents(
  db: PrismaClient,
  userId: string,
  events: TransformedEvent[]
): Promise<StoreEventsResult> {
  if (events.length === 0) {
    return { stored: 0, skipped: 0, errors: 0 };
  }

  try {
    // Use createMany with skipDuplicates for atomic batch insert
    // This is more efficient than individual upserts
    const result = await db.event.createMany({
      data: events.map((event) => ({
        userId,
        type: event.type,
        title: event.title,
        body: event.body,
        author: event.author,
        authorAvatar: event.authorAvatar,
        project: event.project,
        projectId: event.projectId,
        labels: event.labels,
        gitlabEventId: event.gitlabEventId,
        gitlabUrl: event.gitlabUrl,
        createdAt: event.createdAt,
        // Work item grouping fields
        parentType: event.parentType,
        gitlabParentId: event.gitlabParentId,
        isSystemNote: event.isSystemNote,
        // Issue/MR metadata fields
        assignees: event.assignees,
        participants: event.participants,
        status: event.status,
        lastActivityAt: event.lastActivityAt,
        commentCount: event.commentCount,
        unresolvedCommentCount: event.unresolvedCommentCount,
        // Cross-references
        mentionedInIds: event.mentionedInIds,
        // MR -> Issue closing relationships
        closesIssueIds: event.closesIssueIds,
        // Note: parentEventId is NOT set here - will be resolved in linkParentEvents()
      })),
      skipDuplicates: true, // Skip events with duplicate gitlabEventId
    });

    const stored = result.count;
    const skipped = events.length - stored;

    return {
      stored,
      skipped,
      errors: 0,
    };
  } catch (error) {
    logger.error({ error, eventCount: events.length }, "event-transformer: Failed to store events");

    // Re-throw the error so caller knows the operation failed
    // This prevents silent data loss where lastSyncAt gets updated
    // despite events not being stored
    throw error;
  }
}

/**
 * Link child events (comments) to their parent events (issues/MRs)
 * 
 * After storeEvents, this resolves gitlabParentId references to actual database Event IDs
 * and updates the parentEventId foreign key. This enables hierarchical queries.
 * 
 * Process:
 * 1. Find all events with gitlabParentId set (comments/notes)
 * 2. Build gitlabEventId from parentType + gitlabParentId (e.g., "issue-123")
 * 3. Lookup parent event's database ID
 * 4. Update comment's parentEventId field
 * 
 * @returns Number of relationships linked
 */
export async function linkParentEvents(
  db: PrismaClient,
  userId: string
): Promise<number> {
  try {
    // Find all events that need parent linking (have gitlabParentId but no parentEventId)
    const childEvents = await db.event.findMany({
      where: {
        userId,
        gitlabParentId: { not: null },
        parentEventId: null,
      },
      select: {
        id: true,
        parentType: true,
        gitlabParentId: true,
      },
    });

    if (childEvents.length === 0) {
      return 0;
    }

    logger.info(
      { count: childEvents.length },
      "event-transformer: Linking parent relationships"
    );

    let linkedCount = 0;

    // Process in batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < childEvents.length; i += batchSize) {
      const batch = childEvents.slice(i, i + batchSize);

      // Build parent gitlabEventIds for this batch
      const parentLookups = batch.map((child: { id: string; parentType: string | null; gitlabParentId: number | null }) => ({
        childId: child.id,
        parentGitlabEventId:
          child.parentType === "issue"
            ? `issue-${child.gitlabParentId}`
            : `mr-${child.gitlabParentId}`,
      }));

      // Lookup all parent events in one query
      const parentEvents = await db.event.findMany({
        where: {
          userId,
          gitlabEventId: {
            in: parentLookups.map((p: { parentGitlabEventId: string }) => p.parentGitlabEventId),
          },
        },
        select: {
          id: true,
          gitlabEventId: true,
        },
      });

      // Build map for quick lookup
      const parentMap = new Map(
        parentEvents.map((p: { id: string; gitlabEventId: string }) => [p.gitlabEventId, p.id])
      );

      // Update each child with resolved parent ID
      for (const lookup of parentLookups) {
        const parentId = parentMap.get(lookup.parentGitlabEventId);
        if (parentId) {
          await db.event.update({
            where: { id: lookup.childId },
            data: { parentEventId: parentId },
          });
          linkedCount++;
        } else {
          logger.warn(
            { childId: lookup.childId, parentGitlabEventId: lookup.parentGitlabEventId },
            "event-transformer: Parent event not found for child"
          );
        }
      }
    }

    logger.info(
      { linkedCount },
      "event-transformer: Parent relationships linked"
    );

    return linkedCount;
  } catch (error) {
    logger.error({ error }, "event-transformer: Failed to link parent events");
    throw error;
  }
}

/**
 * Update activity metadata for work items (issues/MRs)
 * 
 * Computes and stores aggregated metadata from child events:
 * - lastActivityAt: Most recent activity timestamp (max of child createdAt)
 * - commentCount: Number of comment-type children (excluding system notes)
 * - participants: Array of unique usernames who commented
 * - unresolvedCommentCount: Set to 0 for now (requires discussion thread API)
 * 
 * This should be called after linkParentEvents to ensure relationships exist.
 * 
 * @returns Number of work items updated
 */
export async function updateActivityMetadata(
  db: PrismaClient,
  userId: string
): Promise<number> {
  try {
    // Find all top-level work items (issues/MRs without parents)
    const workItems = await db.event.findMany({
      where: {
        userId,
        parentEventId: null,
        type: { in: ["issue", "merge_request"] },
      },
      select: {
        id: true,
        author: true, // Include work item author as participant
      },
    });

    if (workItems.length === 0) {
      return 0;
    }

    logger.info(
      { count: workItems.length },
      "event-transformer: Updating activity metadata"
    );

    let updatedCount = 0;

    // Process in batches for performance
    const batchSize = 50;
    for (let i = 0; i < workItems.length; i += batchSize) {
      const batch = workItems.slice(i, i + batchSize);

      for (const workItem of batch) {
        // Query all child comments (non-system notes)
        const children = await db.event.findMany({
          where: {
            userId,
            parentEventId: workItem.id,
            type: "comment",
          },
          select: {
            createdAt: true,
            author: true,
            isSystemNote: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Compute metadata
        const userComments = children.filter((c: { isSystemNote: boolean }) => !c.isSystemNote);
        const commentCount = userComments.length;
        const lastActivityAt =
          children.length > 0 ? children[0]!.createdAt : null;

        // Build participants array: work item author + all comment authors
        const participantSet = new Set<string>([workItem.author]);
        for (const child of userComments) {
          participantSet.add(child.author);
        }
        const participants = Array.from(participantSet);

        // Update work item with computed metadata
        await db.event.update({
          where: { id: workItem.id },
          data: {
            lastActivityAt,
            commentCount,
            participants,
            unresolvedCommentCount: 0, // TODO: Requires GitLab discussion threads API
          },
        });

        updatedCount++;
      }
    }

    logger.info(
      { updatedCount },
      "event-transformer: Activity metadata updated"
    );

    return updatedCount;
  } catch (error) {
    logger.error({ error }, "event-transformer: Failed to update activity metadata");
    throw error;
  }
}

/**
 * Fetch project information for project IDs
 * Returns a map for quick lookup during transformation
 */
export async function getProjectMap(
  db: PrismaClient,
  userId: string,
  projectIds: string[]
): Promise<Map<number, { name: string; path: string }>> {
  const projects = await db.monitoredProject.findMany({
    where: {
      userId,
      gitlabProjectId: { in: projectIds },
    },
    select: {
      gitlabProjectId: true,
      projectName: true,
      projectPath: true,
    },
  });

  const projectMap = new Map<number, { name: string; path: string }>();

  for (const project of projects) {
    const projectId = parseInt(project.gitlabProjectId, 10);
    if (!isNaN(projectId)) {
      projectMap.set(projectId, {
        name: project.projectName,
        path: project.projectPath,
      });
    }
  }

  return projectMap;
}
