/**
 * Events tRPC Router
 *
 * Handles event fetching and manual refresh operations
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { GitLabClient, GitLabAPIError } from "~/server/services/gitlab-client";
import { getGitLabAccessToken } from "~/server/services/gitlab-token";
import { logger } from "~/lib/logger";
import {
  transformIssues,
  transformMergeRequests,
  transformNotes,
  storeEvents,
  getProjectMap,
} from "~/server/services/event-transformer";
import {
  transformCommit,
  storeCommitsWithPersonLinks,
} from "~/server/services/commit-transformer";
import { searchEvents } from "~/lib/search/postgres-fts";

export const eventsRouter = createTRPCRouter({
  /**
   * Manual Refresh - Fetch latest events from GitLab and store them
   *
   * POST /api/trpc/events.manualRefresh
   *
   * Flow:
   * 1. Get user's GitLab access token
   * 2. Get user's monitored projects
   * 3. Fetch events from GitLab API (issues, MRs, notes)
   * 4. Transform and store events in database
   * 5. Update lastSync timestamp
   * 6. Return summary
   */
  manualRefresh: protectedProcedure
    .input(
      z.object({
        includeCommits: z.boolean().default(true),
        commitDepth: z.number().min(10).max(500).default(100),
      }).optional()
    )
    .mutation(async ({ ctx, input }) => {
      const includeCommits = input?.includeCommits ?? true;
      const commitDepth = input?.commitDepth ?? 100;
    const startTime = Date.now();

    try {
      // Rate limit: Allow at most one manual refresh per minute per user
      const lastSync = await ctx.db.lastSync.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (lastSync) {
        const timeSinceLastSync = Date.now() - lastSync.lastSyncAt.getTime();
        const RATE_LIMIT_MS = 60000; // 1 minute cooldown
        if (timeSinceLastSync < RATE_LIMIT_MS) {
          const waitSeconds = Math.ceil((RATE_LIMIT_MS - timeSinceLastSync) / 1000);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Please wait ${waitSeconds} seconds before refreshing again.`,
          });
        }
      }

      // 1. Get user's GitLab access token (auto-refreshes if expired)
      const { accessToken } = await getGitLabAccessToken(ctx.session.user.id);

      // 2. Get user's monitored projects
      const monitoredProjects = await ctx.db.monitoredProject.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        select: {
          gitlabProjectId: true,
          projectName: true,
          projectPath: true,
        },
      });

      if (monitoredProjects.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No monitored projects found. Please select projects to monitor.",
        });
      }

      const projectIds = monitoredProjects.map((p) => p.gitlabProjectId);

      // 3. Fetch events from GitLab API
      const gitlabClient = new GitLabClient(accessToken);

      // Reuse lastSync from rate limit check for incremental updates
      const updatedAfter = lastSync?.lastSyncAt.toISOString();

      logger.info({
        userId: ctx.session.user.id,
        projectCount: projectIds.length,
        updatedAfter: updatedAfter ?? "all time",
      }, "events.manualRefresh: Fetching events");

      const { issues, mergeRequests, notes } = await gitlabClient.fetchEvents(
        projectIds,
        updatedAfter
      );

      logger.info({
        issueCount: issues.length,
        mrCount: mergeRequests.length,
        noteCount: notes.length,
      }, "events.manualRefresh: Fetched from GitLab");

      // 4. Transform and store events
      const projectMap = await getProjectMap(ctx.db, ctx.session.user.id, projectIds);

      const transformedIssues = transformIssues(issues, projectMap);
      const transformedMRs = transformMergeRequests(mergeRequests, projectMap);
      const transformedNotes = transformNotes(notes, projectMap);

      const allEvents = [
        ...transformedIssues,
        ...transformedMRs,
        ...transformedNotes,
      ];

      const storeResult = await storeEvents(
        ctx.db,
        ctx.session.user.id,
        allEvents
      );

      // 4b. Fetch and store commits (if enabled)
      let commitStats = { stored: 0, skipped: 0, linked: 0 };
      if (includeCommits) {
        logger.info(
          { projectCount: projectIds.length, commitDepth },
          "events.manualRefresh: Fetching commits"
        );

        for (const project of monitoredProjects) {
          try {
            const commitsWithDiffs = await gitlabClient.fetchCommitsWithDiffs(
              project.gitlabProjectId,
              {
                since: updatedAfter,
                maxCommits: commitDepth,
              }
            );

            // Transform commits
            const transformedCommits = commitsWithDiffs.map((c) =>
              transformCommit(c, c.diffs, project.gitlabProjectId)
            );

            // Store commits with person links
            const projectCommitStats = await storeCommitsWithPersonLinks(
              ctx.db,
              ctx.session.user.id,
              transformedCommits
            );

            commitStats.stored += projectCommitStats.stored;
            commitStats.skipped += projectCommitStats.skipped;
            commitStats.linked += projectCommitStats.linked;
          } catch (error) {
            logger.warn(
              { error, projectId: project.gitlabProjectId },
              "events.manualRefresh: Failed to fetch commits for project"
            );
          }
        }

        logger.info(commitStats, "events.manualRefresh: Finished storing commits");
      }

      // 5. Update lastSync timestamp
      await ctx.db.lastSync.upsert({
        where: { userId: ctx.session.user.id },
        create: {
          userId: ctx.session.user.id,
          lastSyncAt: new Date(),
        },
        update: {
          lastSyncAt: new Date(),
        },
      });

      const duration = Date.now() - startTime;

      logger.info({
        durationMs: duration,
        stored: storeResult.stored,
        skipped: storeResult.skipped,
        errors: storeResult.errors,
      }, "events.manualRefresh: Completed");

      // 6. Return summary
      return {
        success: true,
        stored: storeResult.stored,
        skipped: storeResult.skipped,
        errors: storeResult.errors,
        commits: commitStats,
        duration,
        lastSyncAt: new Date(),
      };
    } catch (error) {
      logger.error({ error }, "events.manualRefresh: Error");

      // Handle GitLab API errors
      if (error instanceof GitLabAPIError) {
        if (error.isRateLimit) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "GitLab rate limit exceeded. Please try again in a few minutes.",
          });
        }

        if (error.statusCode === 401) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "GitLab authentication expired. Please log in again.",
          });
        }

        if (error.statusCode === 502 || error.statusCode === 503) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "GitLab server is temporarily unavailable. Please try again in a moment.",
          });
        }

        logger.error({
          error: error.message,
          statusCode: error.statusCode,
          userId: ctx.session.user.id,
        }, "events.manualRefresh: GitLab API error");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while communicating with GitLab. Please try again.",
        });
      }

      // Handle other errors
      if (error instanceof TRPCError) {
        throw error;
      }

      logger.error({ error }, "events.manualRefresh: Unexpected error");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to refresh events. Please try again.",
      });
    }
  }),

  /**
   * Get recent events for dashboard
   *
   * GET /api/trpc/events.getRecent
   *
   * Returns events sorted by creation date (newest first)
   * Supports pagination with cursor-based approach
   */
  getRecent: protectedProcedure.query(async ({ ctx }) => {
    const events = await ctx.db.event.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Return most recent 50 events
    });

    return events;
  }),

  /**
   * Get events for dashboard with optional label filter
   *
   * GET /api/trpc/events.getForDashboard
   *
   * Returns events optionally filtered by label, grouped by type
   * AC-11: PostgreSQL array containment (Prisma: has)
   * AC-12: Returns { issues: [], mergeRequests: [], comments: [] }
   * AC-13: Limit 50 per section, ordered by createdAt DESC
   */
  getForDashboard: protectedProcedure
    .input(
      z.object({
        filterLabel: z.string().nullable().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const filterLabel = input?.filterLabel;

      // Build base where clause
      const baseWhere: { userId: string; labels?: { has: string } } = {
        userId: ctx.session.user.id,
      };

      if (filterLabel) {
        baseWhere.labels = { has: filterLabel };
      }

      // Run 3 separate queries in parallel - more efficient than fetching 150 and filtering
      const [issues, mergeRequests, comments] = await Promise.all([
        ctx.db.event.findMany({
          where: { ...baseWhere, type: "issue" },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        ctx.db.event.findMany({
          where: { ...baseWhere, type: "merge_request" },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        ctx.db.event.findMany({
          where: { ...baseWhere, type: "comment" },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
      ]);

      return { issues, mergeRequests, comments };
    }),

  /**
   * Get last sync timestamp
   *
   * GET /api/trpc/events.getLastSync
   *
   * Returns when the user last synced with GitLab
   */
  getLastSync: protectedProcedure.query(async ({ ctx }) => {
    const lastSync = await ctx.db.lastSync.findUnique({
      where: { userId: ctx.session.user.id },
    });

    return {
      lastSyncAt: lastSync?.lastSyncAt ?? null,
    };
  }),

  /**
   * Get event by ID
   *
   * GET /api/trpc/events.getById
   *
   * Returns a single event with full details for the detail pane (Story 4.2)
   * Story 4.4: Extended to support keyword highlighting in detail view
   */
  getById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        searchTerms: z.array(z.string()).optional(), // Story 4.4: Highlight support
      })
    )
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: {
          id: input.id,
          userId: ctx.session.user.id, // Ensure user owns this event
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Story 4.4: Apply highlighting if search terms provided
      if (input.searchTerms && input.searchTerms.length > 0) {
        const { highlightEventContent } = await import(
          "~/lib/search/highlight-event"
        );
        const highlighted = await highlightEventContent(
          ctx.db,
          event.id,
          input.searchTerms
        );

        return {
          ...event,
          titleHighlighted: highlighted.titleHighlighted,
          bodyHighlighted: highlighted.bodyHighlighted,
        };
      }

      // No search terms → return event without highlights
      return event;
    }),

  /**
   * Search events using PostgreSQL Full-Text Search
   *
   * GET /api/trpc/events.search
   *
   * Features:
   * - GIN index for <1s performance on 10k+ events (AC: 2.3.2)
   * - Results ranked by relevance using ts_rank (AC: 2.3.3)
   * - Returns events across all types: issues, MRs, comments (AC: 2.3.4)
   * - Highlighted title and snippet using ts_headline
   * - User isolation via userId filter
   */
  search: protectedProcedure
    .input(
      z.object({
        // Story 2.6: Changed from single keyword to array for multi-tag AND search
        keywords: z.array(z.string().max(100)).min(1, "At least one keyword is required").max(10),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const startTime = Date.now();

      try {
        const result = await searchEvents(ctx.db, {
          keywords: input.keywords,
          userId: ctx.session.user.id,
          limit: input.limit,
        });

        const duration = Date.now() - startTime;

        logger.info(
          {
            userId: ctx.session.user.id,
            keywordCount: input.keywords.length,
            keywords: input.keywords.map((k) => k.substring(0, 20)),
            resultCount: result.count,
            durationMs: duration,
          },
          "events.search: Query completed"
        );

        return result;
      } catch (error) {
        logger.error({ error }, "events.search: Error executing search");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to execute search. Please try again.",
        });
      }
    }),
});
