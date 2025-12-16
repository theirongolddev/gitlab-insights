/**
 * Commit Transformer Service
 *
 * Transforms GitLab commit API responses into our database models,
 * handles file extraction from diffs, and stores commits with deduplication.
 */

import { type PrismaClient } from "../../../generated/prisma";
import { logger } from "~/lib/logger";
import {
  type GitLabCommit,
  type GitLabCommitDiff,
} from "./gitlab-client";

export interface TransformResult {
  commit: {
    sha: string;
    shortSha: string;
    message: string;
    title: string;
    authoredAt: Date;
    authorName: string;
    authorEmail: string;
    projectId: string;
    webUrl: string;
    additions: number;
    deletions: number;
  };
  files: Array<{
    path: string;
    changeType: "added" | "modified" | "deleted" | "renamed";
  }>;
}

/**
 * Determine the change type from a GitLab diff entry
 */
export function getChangeType(
  diff: GitLabCommitDiff
): "added" | "modified" | "deleted" | "renamed" {
  if (diff.new_file) return "added";
  if (diff.deleted_file) return "deleted";
  if (diff.renamed_file) return "renamed";
  return "modified";
}

/**
 * Parse a file path to extract directory, filename, and extension
 */
export function parseFilePath(fullPath: string): {
  directory: string;
  filename: string;
  extension: string | null;
} {
  const parts = fullPath.split("/");
  const filename = parts.pop() ?? "";
  const directory = parts.join("/") || "/";
  const extMatch = filename.match(/\.([^.]+)$/);
  const extension = extMatch?.[1] ?? null;
  return { directory, filename, extension };
}

/**
 * Transform a GitLab commit with its diff into our format
 */
export function transformCommit(
  gitlabCommit: GitLabCommit,
  diff: GitLabCommitDiff[],
  projectId: string
): TransformResult {
  return {
    commit: {
      sha: gitlabCommit.id,
      shortSha: gitlabCommit.short_id,
      message: gitlabCommit.message,
      title: gitlabCommit.title,
      authoredAt: new Date(gitlabCommit.authored_date),
      authorName: gitlabCommit.author_name,
      authorEmail: gitlabCommit.author_email,
      projectId,
      webUrl: gitlabCommit.web_url,
      additions: gitlabCommit.stats?.additions ?? 0,
      deletions: gitlabCommit.stats?.deletions ?? 0,
    },
    files: diff.map((d) => ({
      // Use new_path for renamed files, otherwise use the path that exists
      path: d.renamed_file ? d.new_path : d.new_file ? d.new_path : d.old_path,
      changeType: getChangeType(d),
    })),
  };
}

/**
 * Store commits with their files, handling deduplication
 *
 * @param db - Prisma client
 * @param userId - User ID for data isolation
 * @param commits - Transformed commits to store
 * @returns Count of stored and skipped commits
 */
export async function storeCommits(
  db: PrismaClient,
  userId: string,
  commits: TransformResult[]
): Promise<{ stored: number; skipped: number }> {
  let stored = 0;
  let skipped = 0;

  for (const { commit, files } of commits) {
    try {
      // Check if commit already exists
      const existing = await db.commit.findUnique({
        where: {
          userId_sha: {
            userId,
            sha: commit.sha,
          },
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Create or get File records for each file in the diff
      const fileRecords = await Promise.all(
        files.map(async (file) => {
          const parsed = parseFilePath(file.path);
          
          // Upsert file record
          const fileRecord = await db.file.upsert({
            where: {
              userId_projectId_path: {
                userId,
                projectId: commit.projectId,
                path: file.path,
              },
            },
            create: {
              userId,
              projectId: commit.projectId,
              path: file.path,
              directory: parsed.directory,
              filename: parsed.filename,
              extension: parsed.extension,
            },
            update: {
              // Update directory/filename/extension in case they changed
              directory: parsed.directory,
              filename: parsed.filename,
              extension: parsed.extension,
            },
          });

          return { fileId: fileRecord.id, changeType: file.changeType };
        })
      );

      // Create the commit with file relationships
      await db.commit.create({
        data: {
          userId,
          sha: commit.sha,
          shortSha: commit.shortSha,
          message: commit.message,
          title: commit.title,
          authoredAt: commit.authoredAt,
          projectId: commit.projectId,
          webUrl: commit.webUrl,
          additions: commit.additions,
          deletions: commit.deletions,
          files: {
            create: fileRecords.map((f) => ({
              fileId: f.fileId,
              changeType: f.changeType,
            })),
          },
        },
      });

      stored++;
    } catch (error) {
      logger.warn(
        { error, sha: commit.shortSha },
        "commit-transformer: Failed to store commit"
      );
    }
  }

  logger.info(
    { stored, skipped, total: commits.length },
    "commit-transformer: Finished storing commits"
  );

  return { stored, skipped };
}

/**
 * Store commits and link them to Person records by matching author email/name
 *
 * @param db - Prisma client
 * @param userId - User ID for data isolation
 * @param commits - Transformed commits to store
 * @returns Count of stored and skipped commits
 */
export async function storeCommitsWithPersonLinks(
  db: PrismaClient,
  userId: string,
  commits: TransformResult[]
): Promise<{ stored: number; skipped: number; linked: number }> {
  let stored = 0;
  let skipped = 0;
  let linked = 0;

  // Build a cache of people by email for efficient lookup
  const people = await db.person.findMany({
    where: { userId },
    select: { id: true, username: true, email: true },
  });

  // Create lookup maps
  const personByEmail = new Map<string, string>();
  const personByUsername = new Map<string, string>();
  for (const person of people) {
    if (person.email) {
      personByEmail.set(person.email.toLowerCase(), person.id);
    }
    personByUsername.set(person.username.toLowerCase(), person.id);
  }

  for (const { commit, files } of commits) {
    try {
      // Check if commit already exists
      const existing = await db.commit.findUnique({
        where: {
          userId_sha: {
            userId,
            sha: commit.sha,
          },
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Try to find matching Person by email or author name
      let personId: string | null = null;
      if (commit.authorEmail) {
        personId = personByEmail.get(commit.authorEmail.toLowerCase()) ?? null;
      }
      if (!personId && commit.authorName) {
        // Try matching by username (author name might be username)
        personId = personByUsername.get(commit.authorName.toLowerCase()) ?? null;
      }

      if (personId) {
        linked++;
      }

      // Create or get File records for each file in the diff
      const fileRecords = await Promise.all(
        files.map(async (file) => {
          const parsed = parseFilePath(file.path);
          
          const fileRecord = await db.file.upsert({
            where: {
              userId_projectId_path: {
                userId,
                projectId: commit.projectId,
                path: file.path,
              },
            },
            create: {
              userId,
              projectId: commit.projectId,
              path: file.path,
              directory: parsed.directory,
              filename: parsed.filename,
              extension: parsed.extension,
            },
            update: {
              directory: parsed.directory,
              filename: parsed.filename,
              extension: parsed.extension,
            },
          });

          return { fileId: fileRecord.id, changeType: file.changeType };
        })
      );

      // Create the commit with file relationships and optional person link
      await db.commit.create({
        data: {
          userId,
          sha: commit.sha,
          shortSha: commit.shortSha,
          message: commit.message,
          title: commit.title,
          authoredAt: commit.authoredAt,
          projectId: commit.projectId,
          webUrl: commit.webUrl,
          additions: commit.additions,
          deletions: commit.deletions,
          personId,
          files: {
            create: fileRecords.map((f) => ({
              fileId: f.fileId,
              changeType: f.changeType,
            })),
          },
        },
      });

      stored++;
    } catch (error) {
      logger.warn(
        { error, sha: commit.shortSha },
        "commit-transformer: Failed to store commit"
      );
    }
  }

  logger.info(
    { stored, skipped, linked, total: commits.length },
    "commit-transformer: Finished storing commits with person links"
  );

  return { stored, skipped, linked };
}
