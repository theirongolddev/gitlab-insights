/**
 * Expertise tRPC Router
 *
 * API endpoints for expertise queries - "who knows about X?"
 * Part of the Intelligence Platform (Epic 10)
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { logger } from "~/lib/logger";
import {
  calculateExpertise,
  type ExpertiseResult,
  DEFAULT_DECAY_CONFIG,
} from "~/server/services/expertise-scorer";

export const expertiseRouter = createTRPCRouter({
  /**
   * Find experts for a file, directory, or search term
   *
   * GET /api/trpc/expertise.getExperts
   *
   * Returns ranked list of people with expertise scores and breakdowns
   */
  getExperts: protectedProcedure
    .input(
      z
        .object({
          filePath: z.string().optional(),
          directory: z.string().optional(),
          searchTerm: z.string().optional(),
          limit: z.number().min(1).max(50).default(10),
        })
        .refine(
          (data) => data.filePath || data.directory || data.searchTerm,
          {
            message: "At least one of filePath, directory, or searchTerm must be provided",
          }
        )
    )
    .query(async ({ ctx, input }) => {
      const startTime = Date.now();

      try {
        const results = await calculateExpertise(
          ctx.db,
          ctx.session.user.id,
          {
            filePath: input.filePath,
            directory: input.directory,
            searchTerm: input.searchTerm,
          },
          { limit: input.limit }
        );

        const duration = Date.now() - startTime;

        logger.info(
          {
            userId: ctx.session.user.id,
            filePath: input.filePath,
            directory: input.directory,
            searchTerm: input.searchTerm?.substring(0, 50),
            resultCount: results.length,
            durationMs: duration,
          },
          "expertise.getExperts: Completed"
        );

        return {
          items: results,
          query: {
            filePath: input.filePath,
            directory: input.directory,
            searchTerm: input.searchTerm,
          },
          duration,
        };
      } catch (error) {
        logger.error({ error }, "expertise.getExperts: Error");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to calculate expertise",
        });
      }
    }),

  /**
   * Get expertise areas for a specific person
   *
   * GET /api/trpc/expertise.getPersonExpertise
   *
   * Returns top directories/files where a person has expertise
   */
  getPersonExpertise: protectedProcedure
    .input(
      z.object({
        personId: z.string(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const startTime = Date.now();

      // Get the person to verify access and get username
      const person = await ctx.db.person.findUnique({
        where: {
          id: input.personId,
          userId: ctx.session.user.id,
        },
        select: { id: true, username: true, name: true },
      });

      if (!person) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Person not found",
        });
      }

      // Get directories this person has committed to
      const commitDirectories = await ctx.db.$queryRaw<
        Array<{
          directory: string;
          commitCount: bigint;
          lastCommit: Date;
        }>
      >`
        SELECT 
          f.directory,
          COUNT(DISTINCT c.id) as "commitCount",
          MAX(c."authoredAt") as "lastCommit"
        FROM "Commit" c
        JOIN "CommitFile" cf ON cf."commitId" = c.id
        JOIN "File" f ON f.id = cf."fileId"
        JOIN "Person" p ON p.id = c."personId"
        WHERE p.id = ${input.personId}
          AND c."userId" = ${ctx.session.user.id}
        GROUP BY f.directory
        ORDER BY COUNT(DISTINCT c.id) DESC, MAX(c."authoredAt") DESC
        LIMIT ${input.limit}
      `;

      // Get MRs and issues this person has authored (grouped by project)
      const projectActivity = await ctx.db.$queryRaw<
        Array<{
          project: string;
          mrCount: bigint;
          issueCount: bigint;
          lastActivity: Date;
        }>
      >`
        SELECT 
          e.project,
          COUNT(CASE WHEN e.type = 'merge_request' THEN 1 END) as "mrCount",
          COUNT(CASE WHEN e.type = 'issue' THEN 1 END) as "issueCount",
          MAX(e."createdAt") as "lastActivity"
        FROM "Event" e
        WHERE e."userId" = ${ctx.session.user.id}
          AND e.author = ${person.username}
          AND e.type IN ('merge_request', 'issue')
        GROUP BY e.project
        ORDER BY COUNT(*) DESC, MAX(e."createdAt") DESC
        LIMIT ${input.limit}
      `;

      const duration = Date.now() - startTime;

      logger.info(
        {
          userId: ctx.session.user.id,
          personId: input.personId,
          directoryCount: commitDirectories.length,
          projectCount: projectActivity.length,
          durationMs: duration,
        },
        "expertise.getPersonExpertise: Completed"
      );

      return {
        person: {
          id: person.id,
          username: person.username,
          name: person.name,
        },
        directories: commitDirectories.map((d) => ({
          directory: d.directory,
          commitCount: Number(d.commitCount),
          lastCommit: d.lastCommit,
        })),
        projects: projectActivity.map((p) => ({
          project: p.project,
          mrCount: Number(p.mrCount),
          issueCount: Number(p.issueCount),
          lastActivity: p.lastActivity,
        })),
        duration,
      };
    }),
});
