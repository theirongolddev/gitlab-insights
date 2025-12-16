/**
 * Files tRPC Router
 *
 * Provides API endpoints for querying files, their commits, and contributors
 * for the Intelligence Platform expertise features.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const filesRouter = createTRPCRouter({
  /**
   * Get a file by its path within a project
   */
  getByPath: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        path: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const file = await ctx.db.file.findUnique({
        where: {
          userId_projectId_path: {
            userId: ctx.session.user.id,
            projectId: input.projectId,
            path: input.path,
          },
        },
        include: {
          _count: {
            select: { commits: true },
          },
        },
      });

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found",
        });
      }

      // Get last commit date for this file
      const lastCommit = await ctx.db.commitFile.findFirst({
        where: { fileId: file.id },
        include: {
          commit: {
            select: { authoredAt: true },
          },
        },
        orderBy: {
          commit: { authoredAt: "desc" },
        },
      });

      return {
        ...file,
        commitCount: file._count.commits,
        lastModifiedAt: lastCommit?.commit.authoredAt ?? null,
      };
    }),

  /**
   * Get commits that touched a specific file
   */
  getCommits: protectedProcedure
    .input(
      z.object({
        fileId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify file belongs to user
      const file = await ctx.db.file.findUnique({
        where: { id: input.fileId },
        select: { userId: true },
      });

      if (!file || file.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found",
        });
      }

      const commitFiles = await ctx.db.commitFile.findMany({
        where: { fileId: input.fileId },
        include: {
          commit: {
            include: {
              person: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          commit: { authoredAt: "desc" },
        },
        take: input.limit + 1,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      let nextCursor: string | undefined;
      if (commitFiles.length > input.limit) {
        const nextItem = commitFiles.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: commitFiles.map((cf) => ({
          ...cf.commit,
          changeType: cf.changeType,
        })),
        nextCursor,
      };
    }),

  /**
   * Get people who have touched a file, with commit counts
   */
  getContributors: protectedProcedure
    .input(
      z.object({
        fileId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify file belongs to user
      const file = await ctx.db.file.findUnique({
        where: { id: input.fileId },
        select: { userId: true },
      });

      if (!file || file.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found",
        });
      }

      // Get commits for this file grouped by person
      const commits = await ctx.db.commitFile.findMany({
        where: { fileId: input.fileId },
        include: {
          commit: {
            select: {
              personId: true,
              authoredAt: true,
            },
          },
        },
      });

      // Aggregate by person
      const contributorMap = new Map<
        string,
        { personId: string; commitCount: number; lastCommitAt: Date }
      >();

      for (const cf of commits) {
        if (!cf.commit.personId) continue;

        const existing = contributorMap.get(cf.commit.personId);
        if (existing) {
          existing.commitCount++;
          if (cf.commit.authoredAt > existing.lastCommitAt) {
            existing.lastCommitAt = cf.commit.authoredAt;
          }
        } else {
          contributorMap.set(cf.commit.personId, {
            personId: cf.commit.personId,
            commitCount: 1,
            lastCommitAt: cf.commit.authoredAt,
          });
        }
      }

      // Get Person details
      const personIds = Array.from(contributorMap.keys());
      const people = await ctx.db.person.findMany({
        where: {
          id: { in: personIds },
          userId: ctx.session.user.id,
        },
      });

      // Combine with aggregated data
      const contributors = people
        .map((person) => {
          const stats = contributorMap.get(person.id);
          return {
            person,
            commitCount: stats?.commitCount ?? 0,
            lastCommitAt: stats?.lastCommitAt ?? null,
          };
        })
        .sort((a, b) => b.commitCount - a.commitCount);

      return { items: contributors };
    }),

  /**
   * List files in a directory
   */
  listDirectory: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        directory: z.string(),
        limit: z.number().min(1).max(200).default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get files in this directory (not recursive)
      const files = await ctx.db.file.findMany({
        where: {
          userId: ctx.session.user.id,
          projectId: input.projectId,
          directory: input.directory,
        },
        include: {
          _count: {
            select: { commits: true },
          },
        },
        orderBy: { path: "asc" },
        take: input.limit,
      });

      // Get subdirectories (distinct directories that start with this path)
      const allFiles = await ctx.db.file.findMany({
        where: {
          userId: ctx.session.user.id,
          projectId: input.projectId,
          directory: {
            startsWith: input.directory === "/" ? "" : input.directory + "/",
          },
        },
        select: { directory: true },
        distinct: ["directory"],
      });

      // Extract immediate subdirectories
      const prefix = input.directory === "/" ? "" : input.directory + "/";
      const subdirs = new Set<string>();
      for (const file of allFiles) {
        if (file.directory.startsWith(prefix) && file.directory !== input.directory) {
          // Get immediate subdirectory
          const relativePath = file.directory.slice(prefix.length);
          const firstSlash = relativePath.indexOf("/");
          const subdir = firstSlash === -1 ? relativePath : relativePath.slice(0, firstSlash);
          if (subdir) {
            subdirs.add(prefix + subdir);
          }
        }
      }

      return {
        files: files.map((f) => ({
          ...f,
          commitCount: f._count.commits,
        })),
        subdirectories: Array.from(subdirs).sort(),
      };
    }),

  /**
   * Search files by path pattern
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        projectId: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const files = await ctx.db.file.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.projectId && { projectId: input.projectId }),
          OR: [
            { path: { contains: input.query, mode: "insensitive" } },
            { filename: { contains: input.query, mode: "insensitive" } },
          ],
        },
        include: {
          _count: {
            select: { commits: true },
          },
        },
        orderBy: { path: "asc" },
        take: input.limit,
      });

      return {
        items: files.map((f) => ({
          ...f,
          commitCount: f._count.commits,
        })),
      };
    }),
});
