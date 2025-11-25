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
    };
  });
}

/**
 * Transform GitLab notes (comments) into Event records
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
    console.error("[event-transformer] Failed to store events:", error);

    // Return error count
    return {
      stored: 0,
      skipped: 0,
      errors: events.length,
    };
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
