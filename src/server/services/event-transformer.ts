/**
 * Event Transformer Service
 *
 * Transforms GitLab API responses into database Event records
 * Handles deduplication and determines which events are new
 */

import type { PrismaClient } from "../../../generated/prisma";
import type {
  GitLabIssue,
  GitLabMergeRequest,
  GitLabNote,
  WorkItemWithActivity,
} from "./gitlab-client";
import { logger } from "~/lib/logger";
import {
  generateEmbedding,
  prepareTextForEmbedding,
} from "./embedding-generator";

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

    // Extract first non-empty line of comment as title
    const firstLine = note.body.split("\n").find(line => line.trim())?.trim() || "Comment";
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

// Maximum events to process in a single batch to prevent long-running operations
const STORE_BATCH_SIZE = 500;

// Database operation timeouts (consistent with person-extractor)
const DB_TIMEOUT = 30000; // 30 second timeout for batch operations
const DB_MAX_WAIT = 5000; // 5 second max wait to acquire connection

/**
 * Store transformed events in database with deduplication
 *
 * Uses createMany with skipDuplicates to handle race conditions
 * Returns count of stored, skipped, and error events
 * 
 * @deprecated Use storeWorkItemBundles() instead for zero-orphan guarantees.
 * This function stores events without immediate parent linking, leading to 87% orphan rate.
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
    let totalStored = 0;
    let totalSkipped = 0;

    // Process in batches to prevent long-running transactions
    for (let i = 0; i < events.length; i += STORE_BATCH_SIZE) {
      const batch = events.slice(i, i + STORE_BATCH_SIZE);

      // Use transaction with timeout for reliability
      const result = await db.$transaction(
        async (tx) => {
          return tx.event.createMany({
            data: batch.map((event) => ({
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
        },
        {
          timeout: DB_TIMEOUT,
          maxWait: DB_MAX_WAIT,
        }
      );

      totalStored += result.count;
      totalSkipped += batch.length - result.count;
    }

    return {
      stored: totalStored,
      skipped: totalSkipped,
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
 * @deprecated No longer needed - storeWorkItemBundle() sets parentEventId at insert time.
 * This post-hoc linking approach has only 13% success rate due to missing parents.
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

      // Wrap batch operations in transaction with timeout
      const batchLinked = await db.$transaction(
        async (tx) => {
          // Lookup all parent events in one query
          const parentEvents = await tx.event.findMany({
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

          let count = 0;
          // Update each child with resolved parent ID
          for (const lookup of parentLookups) {
            const parentId = parentMap.get(lookup.parentGitlabEventId);
            if (parentId) {
              await tx.event.update({
                where: { id: lookup.childId },
                data: { parentEventId: parentId },
              });
              count++;
            } else {
              logger.warn(
                { childId: lookup.childId, parentGitlabEventId: lookup.parentGitlabEventId },
                "event-transformer: Parent event not found for child"
              );
            }
          }
          return count;
        },
        {
          timeout: DB_TIMEOUT,
          maxWait: DB_MAX_WAIT,
        }
      );

      linkedCount += batchLinked;
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
 * @deprecated No longer needed - storeWorkItemBundle() computes and stores activity metadata atomically.
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
        lastActivityAt: true, // Preserve original value when no children
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

    // Process in batches for performance with transaction timeout protection
    const batchSize = 50;
    for (let i = 0; i < workItems.length; i += batchSize) {
      const batch = workItems.slice(i, i + batchSize);

      const batchUpdated = await db.$transaction(
        async (tx) => {
          let count = 0;

          for (const workItem of batch) {
            // Query all child comments (non-system notes)
            const children = await tx.event.findMany({
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
            // Use most recent child createdAt, or preserve original lastActivityAt if no children
            const lastActivityAt =
              children.length > 0 ? children[0]!.createdAt : workItem.lastActivityAt;

            // Build participants array: work item author + all comment authors
            const participantSet = new Set<string>([workItem.author]);
            for (const child of userComments) {
              participantSet.add(child.author);
            }
            const participants = Array.from(participantSet);

            // Update work item with computed metadata
            await tx.event.update({
              where: { id: workItem.id },
              data: {
                lastActivityAt,
                commentCount,
                participants,
                unresolvedCommentCount: 0, // TODO: Requires GitLab discussion threads API
              },
            });

            count++;
          }

          return count;
        },
        {
          timeout: DB_TIMEOUT,
          maxWait: DB_MAX_WAIT,
        }
      );

      updatedCount += batchUpdated;
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
 * 
 * @deprecated No longer needed - storeWorkItemBundle() uses projectId directly from bundles.
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

/**
 * MR file change type for storing in database
 */
export interface MRFileChangeInput {
  filePath: string;
  changeType: "added" | "modified" | "deleted" | "renamed";
}

/**
 * Convert GitLab MR change flags to change type string
 */
function getChangeType(change: {
  new_file: boolean;
  deleted_file: boolean;
  renamed_file: boolean;
}): MRFileChangeInput["changeType"] {
  if (change.new_file) return "added";
  if (change.deleted_file) return "deleted";
  if (change.renamed_file) return "renamed";
  return "modified";
}

/**
 * Store MR file changes in database
 *
 * Upserts file changes for MRs, using eventId as the link.
 * Called after storeEvents to populate file change data.
 *
 * @param db - Prisma client
 * @param mrChanges - Map of MR gitlabEventId to file changes from GitLab API
 * @returns Number of file changes stored
 */
export async function storeMRFileChanges(
  db: PrismaClient,
  mrChanges: Map<
    string,
    Array<{
      old_path: string;
      new_path: string;
      new_file: boolean;
      renamed_file: boolean;
      deleted_file: boolean;
    }>
  >
): Promise<number> {
  if (mrChanges.size === 0) {
    return 0;
  }

  try {
    // Get all event IDs for the MRs we have changes for
    const gitlabEventIds = Array.from(mrChanges.keys());
    const events = await db.event.findMany({
      where: {
        gitlabEventId: { in: gitlabEventIds },
        type: "merge_request",
      },
      select: {
        id: true,
        gitlabEventId: true,
      },
    });

    // Build a map of gitlabEventId -> database event ID
    const eventIdMap = new Map(events.map((e) => [e.gitlabEventId, e.id]));

    // Prepare all file change records
    const fileChangeRecords: Array<{
      eventId: string;
      filePath: string;
      changeType: string;
    }> = [];

    for (const [gitlabEventId, changes] of mrChanges) {
      const eventId = eventIdMap.get(gitlabEventId);
      if (!eventId) {
        logger.warn(
          { gitlabEventId },
          "event-transformer: MR event not found for file changes"
        );
        continue;
      }

      for (const change of changes) {
        // Use new_path as the file path (handles renames)
        fileChangeRecords.push({
          eventId,
          filePath: change.new_path,
          changeType: getChangeType(change),
        });
      }
    }

    if (fileChangeRecords.length === 0) {
      return 0;
    }

    // Delete existing file changes for these events (to handle updates)
    const eventIds = [...new Set(fileChangeRecords.map((r) => r.eventId))];
    await db.mRFileChange.deleteMany({
      where: {
        eventId: { in: eventIds },
      },
    });

    // Insert new file changes using transaction with timeout
    const result = await db.$transaction(
      async (tx) => {
        return tx.mRFileChange.createMany({
          data: fileChangeRecords,
        });
      },
      {
        timeout: DB_TIMEOUT,
        maxWait: DB_MAX_WAIT,
      }
    );

    logger.info(
      { storedCount: result.count, mrCount: mrChanges.size },
      "event-transformer: Stored MR file changes"
    );

    return result.count;
  } catch (error) {
    logger.error({ error }, "event-transformer: Failed to store MR file changes");
    throw error;
  }
}

/**
 * Result of storing a work item bundle
 */
export interface StoreWorkItemBundleResult {
  parentId: string;
  notesStored: number;
}

/**
 * Atomically store a work item bundle (parent + all notes) in one transaction.
 * 
 * This is the core storage method for work-item-centric fetching:
 * 1. Upserts the parent (issue/MR) first
 * 2. Upserts all notes with parentEventId set IMMEDIATELY (not post-hoc)
 * 3. Updates activity metadata (commentCount, participants, lastActivityAt)
 * 
 * The transaction ensures atomicity - either all records are stored or none.
 * 
 * @param db - Prisma client
 * @param userId - User ID to associate with the events
 * @param bundle - Work item with all its notes
 * @returns Object with parentId and count of notes stored
 */
export async function storeWorkItemBundle(
  db: PrismaClient,
  userId: string,
  bundle: WorkItemWithActivity
): Promise<StoreWorkItemBundleResult> {
  const { parent, notes, type, projectId } = bundle;

  // Build gitlabEventId for parent
  const parentGitlabEventId = type === "issue" 
    ? `issue-${parent.id}` 
    : `mr-${parent.id}`;

  // Determine status based on type
  const status = type === "issue"
    ? (parent.state === "opened" ? "open" : "closed")
    : (parent.state === "opened" ? "open" : parent.state as "closed" | "merged");

  return await db.$transaction(
    async (tx) => {
      // 1. Upsert parent (issue/MR) first
      const parentRecord = await tx.event.upsert({
        where: {
          gitlabEventId: parentGitlabEventId,
        },
        create: {
          userId,
          type,
          title: parent.title,
          body: parent.description,
          author: parent.author.username,
          authorAvatar: parent.author.avatar_url,
          project: parent.project_id.toString(), // Will be updated with actual name
          projectId,
          labels: parent.labels,
          gitlabEventId: parentGitlabEventId,
          gitlabUrl: parent.web_url,
          createdAt: new Date(parent.created_at),
          parentType: null,
          gitlabParentId: null,
          isSystemNote: false,
          assignees: parent.assignees?.map((a) => a.username) ?? [],
          participants: [], // Will be computed below
          status,
          lastActivityAt: new Date(parent.updated_at), // Will be updated below
          commentCount: 0, // Will be computed below
          unresolvedCommentCount: 0,
          mentionedInIds: extractMentionedIds(parent.description),
          closesIssueIds: type === "merge_request" 
            ? parseClosesIssueIds(parent.description) 
            : [],
        },
        update: {
          title: parent.title,
          body: parent.description,
          author: parent.author.username,
          authorAvatar: parent.author.avatar_url,
          labels: parent.labels,
          gitlabUrl: parent.web_url,
          assignees: parent.assignees?.map((a) => a.username) ?? [],
          status,
          mentionedInIds: extractMentionedIds(parent.description),
          closesIssueIds: type === "merge_request" 
            ? parseClosesIssueIds(parent.description) 
            : [],
        },
      });

      // 2. Upsert all notes with parentEventId set IMMEDIATELY
      let notesStored = 0;
      const participantSet = new Set<string>([parent.author.username]);
      let latestActivityAt = new Date(parent.updated_at);
      let userCommentCount = 0;

      for (const note of notes) {
        const noteGitlabEventId = `note-${note.id}`;
        const noteCreatedAt = new Date(note.created_at);

        // Track participants and activity
        if (!note.system) {
          participantSet.add(note.author.username);
          userCommentCount++;
        }
        if (noteCreatedAt > latestActivityAt) {
          latestActivityAt = noteCreatedAt;
        }

        // Extract first line as title
        const firstLine = note.body.split("\n").find(line => line.trim())?.trim() || "Comment";
        const noteTitle = firstLine.length > 100
          ? firstLine.substring(0, 97) + "..."
          : firstLine;

        await tx.event.upsert({
          where: {
            gitlabEventId: noteGitlabEventId,
          },
          create: {
            userId,
            type: "comment",
            title: `Comment: ${noteTitle}`,
            body: note.body,
            author: note.author.username,
            authorAvatar: note.author.avatar_url,
            project: parent.project_id.toString(),
            projectId,
            labels: [],
            gitlabEventId: noteGitlabEventId,
            gitlabUrl: note.web_url,
            createdAt: noteCreatedAt,
            parentType: type,
            parentEventId: parentRecord.id, // Set IMMEDIATELY!
            gitlabParentId: note.noteable_id,
            isSystemNote: note.system,
            assignees: [],
            participants: [],
            status: null,
            lastActivityAt: null,
            commentCount: 0,
            unresolvedCommentCount: 0,
            mentionedInIds: extractMentionedIds(note.body),
            closesIssueIds: [],
          },
          update: {
            title: `Comment: ${noteTitle}`,
            body: note.body,
            author: note.author.username,
            authorAvatar: note.author.avatar_url,
            gitlabUrl: note.web_url,
            parentEventId: parentRecord.id, // Ensure link is correct
            isSystemNote: note.system,
            mentionedInIds: extractMentionedIds(note.body),
          },
        });

        notesStored++;
      }

      // 3. Update activity metadata on parent
      await tx.event.update({
        where: { id: parentRecord.id },
        data: {
          lastActivityAt: latestActivityAt,
          commentCount: userCommentCount,
          participants: Array.from(participantSet),
        },
      });

      logger.info(
        { 
          parentId: parentRecord.id, 
          gitlabEventId: parentGitlabEventId,
          notesStored,
          commentCount: userCommentCount,
          participants: participantSet.size,
        },
        "event-transformer: Stored work item bundle"
      );

      return { parentId: parentRecord.id, notesStored };
    },
    {
      timeout: DB_TIMEOUT,
      maxWait: DB_MAX_WAIT,
    }
  );
}

/**
 * Result of storing multiple work item bundles
 */
export interface StoreWorkItemBundlesResult {
  stored: number;
  failed: number;
  totalNotes: number;
}

/**
 * Store multiple work item bundles with progress tracking and error isolation.
 * 
 * Each bundle is stored independently - if one fails, others continue.
 * This prevents a single problematic work item from blocking the entire sync.
 * 
 * @param db - Prisma client
 * @param userId - User ID to associate with the events
 * @param bundles - Array of work item bundles to store
 * @returns Object with counts of stored, failed, and total notes
 */
export async function storeWorkItemBundles(
  db: PrismaClient,
  userId: string,
  bundles: WorkItemWithActivity[]
): Promise<StoreWorkItemBundlesResult> {
  let stored = 0;
  let failed = 0;
  let totalNotes = 0;

  if (bundles.length === 0) {
    return { stored: 0, failed: 0, totalNotes: 0 };
  }

  logger.info(
    { bundleCount: bundles.length, userId },
    "event-transformer: Storing work item bundles"
  );

  for (const bundle of bundles) {
    try {
      const result = await storeWorkItemBundle(db, userId, bundle);
      stored++;
      totalNotes += result.notesStored;
    } catch (error) {
      failed++;
      const gitlabEventId = bundle.type === "issue"
        ? `issue-${bundle.parent.id}`
        : `mr-${bundle.parent.id}`;
      logger.error(
        { error, gitlabEventId, type: bundle.type },
        "event-transformer: Failed to store work item bundle"
      );
    }
  }

  logger.info(
    { stored, failed, totalNotes, userId },
    "event-transformer: Finished storing work item bundles"
  );

  return { stored, failed, totalNotes };
}

// Batch size for embedding generation
const EMBEDDING_BATCH_SIZE = 20;

/**
 * Generate embeddings for events without them
 *
 * Queries for issues and MRs without embeddings and generates them in batches.
 * Comments are excluded as they are represented by their parent's embedding.
 *
 * This function is designed to be called after event storage and runs
 * asynchronously (fire-and-forget) so it doesn't block the sync process.
 *
 * @param db - Prisma client
 * @param userId - User ID to scope the query
 * @param limit - Maximum number of events to process (default 100)
 * @returns Promise with count of embeddings generated
 */
export async function generateEmbeddingsForNewEvents(
  db: PrismaClient,
  userId: string,
  limit = 100
): Promise<{ generated: number; failed: number }> {
  try {
    // Find issues and MRs without embeddings
    const events = await db.$queryRaw<
      Array<{ id: string; title: string; body: string | null }>
    >`
      SELECT id, title, body
      FROM "Event"
      WHERE "userId" = ${userId}
        AND type IN ('issue', 'merge_request')
        AND embedding IS NULL
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `;

    if (events.length === 0) {
      return { generated: 0, failed: 0 };
    }

    logger.info(
      { eventCount: events.length, userId },
      "event-transformer: Generating embeddings for new events"
    );

    let generated = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < events.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = events.slice(i, i + EMBEDDING_BATCH_SIZE);

      for (const event of batch) {
        try {
          const text = prepareTextForEmbedding(event.title, event.body);
          const embedding = await generateEmbedding(text);
          const vectorString = `[${embedding.join(",")}]`;

          await db.$executeRaw`
            UPDATE "Event"
            SET embedding = ${vectorString}::vector
            WHERE id = ${event.id}
          `;

          generated++;
        } catch (error) {
          failed++;
          logger.warn(
            { eventId: event.id, error },
            "event-transformer: Failed to generate embedding for event"
          );
        }
      }
    }

    logger.info(
      { generated, failed, userId },
      "event-transformer: Embedding generation complete"
    );

    return { generated, failed };
  } catch (error) {
    logger.error(
      { error, userId },
      "event-transformer: Failed to generate embeddings"
    );
    return { generated: 0, failed: 0 };
  }
}

/**
 * Fire-and-forget wrapper for embedding generation
 *
 * Calls generateEmbeddingsForNewEvents without awaiting, so it doesn't
 * block the sync process. Errors are logged but not propagated.
 *
 * @param db - Prisma client
 * @param userId - User ID to scope the query
 */
export function queueEmbeddingGeneration(
  db: PrismaClient,
  userId: string
): void {
  // Fire and forget - don't await
  generateEmbeddingsForNewEvents(db, userId).catch((error) => {
    logger.error(
      { error, userId },
      "event-transformer: Background embedding generation failed"
    );
  });
}
