/**
 * File Query Helpers
 *
 * Efficient database queries for file path operations using
 * the text_pattern_ops indexes for prefix matching.
 */

import { type PrismaClient } from "../../../generated/prisma";

/**
 * Find all files matching a path prefix within a project
 * Uses the idx_file_path_prefix index for efficient prefix queries
 *
 * @param db - Prisma client
 * @param userId - User ID for data isolation
 * @param projectId - GitLab project ID
 * @param pathPrefix - Path prefix to match (e.g., "src/components/")
 * @returns Files matching the prefix
 */
export async function findFilesByPathPrefix(
  db: PrismaClient,
  userId: string,
  projectId: string,
  pathPrefix: string
) {
  return db.file.findMany({
    where: {
      userId,
      projectId,
      path: {
        startsWith: pathPrefix,
      },
    },
    orderBy: { path: "asc" },
  });
}

/**
 * Find all files in a specific directory (not recursive)
 * Uses the idx_file_directory_lookup index
 *
 * @param db - Prisma client
 * @param userId - User ID for data isolation
 * @param projectId - GitLab project ID
 * @param directory - Exact directory to match
 * @returns Files in the directory
 */
export async function findFilesInDirectory(
  db: PrismaClient,
  userId: string,
  projectId: string,
  directory: string
) {
  return db.file.findMany({
    where: {
      userId,
      projectId,
      directory,
    },
    orderBy: { filename: "asc" },
  });
}

/**
 * Find all files with a specific extension
 * Uses the idx_file_extension index
 *
 * @param db - Prisma client
 * @param userId - User ID for data isolation
 * @param extension - File extension to match (e.g., "ts", "tsx")
 * @param projectId - Optional project filter
 * @returns Files with the extension
 */
export async function findFilesByExtension(
  db: PrismaClient,
  userId: string,
  extension: string,
  projectId?: string
) {
  return db.file.findMany({
    where: {
      userId,
      extension,
      ...(projectId && { projectId }),
    },
    orderBy: { path: "asc" },
  });
}

/**
 * Get all unique directories in a project
 *
 * @param db - Prisma client
 * @param userId - User ID for data isolation
 * @param projectId - GitLab project ID
 * @returns Unique directory paths
 */
export async function getProjectDirectories(
  db: PrismaClient,
  userId: string,
  projectId: string
): Promise<string[]> {
  const files = await db.file.findMany({
    where: { userId, projectId },
    select: { directory: true },
    distinct: ["directory"],
    orderBy: { directory: "asc" },
  });

  return files.map((f) => f.directory);
}
