/**
 * Events tRPC Router
 *
 * Handles event fetching and manual refresh operations
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { GitLabClient, GitLabAPIError } from "~/server/services/gitlab-client";
import {
  transformIssues,
  transformMergeRequests,
  transformNotes,
  storeEvents,
  getProjectMap,
} from "~/server/services/event-transformer";

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
  manualRefresh: protectedProcedure.mutation(async ({ ctx }) => {
    const startTime = Date.now();

    try {
      // 1. Get user's GitLab access token
      const account = await ctx.db.account.findFirst({
        where: {
          userId: ctx.session.user.id,
          providerId: "gitlab",
        },
        select: {
          accessToken: true,
        },
      });

      if (!account?.accessToken) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "GitLab access token not found. Please re-authenticate.",
        });
      }

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
      const gitlabClient = new GitLabClient(account.accessToken);

      // Get last sync time for incremental updates (optional optimization)
      const lastSync = await ctx.db.lastSync.findUnique({
        where: { userId: ctx.session.user.id },
      });

      const updatedAfter = lastSync?.lastSyncAt.toISOString();

      console.log("[events.manualRefresh] Fetching events", {
        userId: ctx.session.user.id,
        projectCount: projectIds.length,
        updatedAfter: updatedAfter ?? "all time",
      });

      const { issues, mergeRequests, notes } = await gitlabClient.fetchEvents(
        projectIds,
        updatedAfter
      );

      console.log("[events.manualRefresh] Fetched from GitLab", {
        issues: issues.length,
        mergeRequests: mergeRequests.length,
        notes: notes.length,
      });

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

      console.log("[events.manualRefresh] Completed", {
        duration: `${duration}ms`,
        stored: storeResult.stored,
        skipped: storeResult.skipped,
        errors: storeResult.errors,
      });

      // 6. Return summary
      return {
        success: true,
        stored: storeResult.stored,
        skipped: storeResult.skipped,
        errors: storeResult.errors,
        duration,
        lastSyncAt: new Date(),
      };
    } catch (error) {
      console.error("[events.manualRefresh] Error:", error);

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

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // Handle other errors
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("[events.manualRefresh] Unexpected error:", error);
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

      // Build where clause - only add label filter if provided
      const whereClause: { userId: string; labels?: { has: string } } = {
        userId: ctx.session.user.id,
      };

      if (filterLabel) {
        whereClause.labels = { has: filterLabel };
      }

      // Fetch events, limited to 150 (50 * 3 sections max)
      const events = await ctx.db.event.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        take: 150,
      });

      // Group by type and limit to 50 per section
      const issues = events
        .filter((e) => e.type === "issue")
        .slice(0, 50);
      const mergeRequests = events
        .filter((e) => e.type === "merge_request")
        .slice(0, 50);
      const comments = events
        .filter((e) => e.type === "comment")
        .slice(0, 50);

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
});
