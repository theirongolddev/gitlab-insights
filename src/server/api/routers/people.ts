/**
 * People tRPC Router
 *
 * Handles person queries and extraction operations for the Intelligence Platform
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { logger } from "~/lib/logger";
import {
  extractPeopleFromEvents,
  upsertPeople,
  type ExtractedPerson,
} from "~/server/services/person-extractor";

export const peopleRouter = createTRPCRouter({
  /**
   * List all people with optional search
   *
   * GET /api/trpc/people.list
   *
   * Returns paginated people with basic activity stats
   */
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().trim().max(200).optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().min(1).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereClause: {
        userId: string;
        OR?: Array<{ username: { contains: string; mode: "insensitive" } } | { name: { contains: string; mode: "insensitive" } }>;
      } = {
        userId: ctx.session.user.id,
      };

      if (input.search) {
        whereClause.OR = [
          { username: { contains: input.search, mode: "insensitive" } },
          { name: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const people = await ctx.db.person.findMany({
        where: whereClause,
        orderBy: [{ username: "asc" }, { id: "asc" }],
        take: input.limit + 1,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      let nextCursor: string | undefined;
      if (people.length > input.limit) {
        const nextItem = people.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: people,
        nextCursor,
      };
    }),

  /**
   * Get single person by ID
   *
   * GET /api/trpc/people.getById
   *
   * Returns person with detailed stats including event counts
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const person = await ctx.db.person.findUnique({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!person) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Person not found",
        });
      }

      // Get activity stats by counting events authored by this person (single query)
      const eventCounts = await ctx.db.event.groupBy({
        by: ["type"],
        where: {
          userId: ctx.session.user.id,
          author: person.username,
          type: { in: ["issue", "merge_request", "comment"] },
        },
        _count: { id: true },
      });

      // Convert grouped results to counts
      const countMap = new Map(
        eventCounts.map((e) => [e.type, e._count.id])
      );
      const issueCount = countMap.get("issue") ?? 0;
      const mrCount = countMap.get("merge_request") ?? 0;
      const commentCount = countMap.get("comment") ?? 0;

      return {
        ...person,
        stats: {
          issueCount,
          mrCount,
          commentCount,
          totalEvents: issueCount + mrCount + commentCount,
        },
      };
    }),

  /**
   * Get person's activity (Events they authored)
   *
   * GET /api/trpc/people.getActivity
   *
   * Returns events where author matches person's username
   */
  getActivity: protectedProcedure
    .input(
      z.object({
        personId: z.string().min(1),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().min(1).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // First get the person to get their username
      const person = await ctx.db.person.findUnique({
        where: {
          id: input.personId,
          userId: ctx.session.user.id,
        },
        select: { username: true },
      });

      if (!person) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Person not found",
        });
      }

      const events = await ctx.db.event.findMany({
        where: {
          userId: ctx.session.user.id,
          author: person.username,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: input.limit + 1,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      let nextCursor: string | undefined;
      if (events.length > input.limit) {
        const nextItem = events.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: events,
        nextCursor,
      };
    }),

  /**
   * Trigger extraction of people from existing Events
   *
   * POST /api/trpc/people.extractFromEvents
   *
   * Scans existing events and extracts unique people
   * Note: This is limited since Events only store username, not gitlabId
   */
  extractFromEvents: protectedProcedure.mutation(async ({ ctx }) => {
    const startTime = Date.now();

    try {
      const result = await extractPeopleFromEvents(ctx.db, ctx.session.user.id);
      const duration = Date.now() - startTime;

      logger.info(
        {
          userId: ctx.session.user.id,
          ...result,
          durationMs: duration,
        },
        "people.extractFromEvents: Completed"
      );

      return {
        success: true,
        ...result,
        duration,
      };
    } catch (error) {
      logger.error({ error }, "people.extractFromEvents: Error");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to extract people from events",
      });
    }
  }),

  /**
   * Bulk upsert people from GitLab API data
   *
   * POST /api/trpc/people.upsertFromGitLab
   *
   * Used during sync to create/update Person records from GitLab author data
   */
  upsertFromGitLab: protectedProcedure
    .input(
      z.object({
        people: z.array(
          z.object({
            gitlabId: z.number(),
            username: z.string(),
            name: z.string().nullable(),
            avatarUrl: z.string().nullable(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const startTime = Date.now();

      try {
        const result = await upsertPeople(
          ctx.db,
          ctx.session.user.id,
          input.people as ExtractedPerson[]
        );

        const duration = Date.now() - startTime;

        logger.info(
          {
            userId: ctx.session.user.id,
            ...result,
            durationMs: duration,
          },
          "people.upsertFromGitLab: Completed"
        );

        return {
          success: true,
          ...result,
          duration,
        };
      } catch (error) {
        logger.error({ error }, "people.upsertFromGitLab: Error");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upsert people",
        });
      }
    }),

  /**
   * Find people who have touched Events matching a search query
   *
   * GET /api/trpc/people.whoTouched
   *
   * Searches Events using FTS and groups results by author,
   * returning ranked people with match counts
   */
  whoTouched: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const startTime = Date.now();

      // Search events matching the query and group by author
      // Using raw SQL for efficient aggregation
      const results = await ctx.db.$queryRaw<
        Array<{
          author: string;
          matchCount: bigint;
          recentEventId: string;
          recentEventTitle: string;
          recentEventType: string;
          recentEventCreatedAt: Date;
        }>
      >`
        WITH matching_events AS (
          SELECT
            e.id,
            e.author,
            e.title,
            e.type,
            e."createdAt",
            ROW_NUMBER() OVER (PARTITION BY e.author ORDER BY e."createdAt" DESC) as rn
          FROM "Event" e
          WHERE e."userId" = ${ctx.session.user.id}
            AND (
              e.title ILIKE ${"%" + input.query + "%"}
              OR e.body ILIKE ${"%" + input.query + "%"}
              OR e.project ILIKE ${"%" + input.query + "%"}
            )
        )
        SELECT
          me.author,
          COUNT(*) as "matchCount",
          MAX(CASE WHEN me.rn = 1 THEN me.id END) as "recentEventId",
          MAX(CASE WHEN me.rn = 1 THEN me.title END) as "recentEventTitle",
          MAX(CASE WHEN me.rn = 1 THEN me.type END) as "recentEventType",
          MAX(CASE WHEN me.rn = 1 THEN me."createdAt" END) as "recentEventCreatedAt"
        FROM matching_events me
        GROUP BY me.author
        ORDER BY COUNT(*) DESC, MAX(me."createdAt") DESC
        LIMIT ${input.limit}
      `;

      // Get Person records for the matching authors
      const authors = results.map((r) => r.author);
      const people = await ctx.db.person.findMany({
        where: {
          userId: ctx.session.user.id,
          username: { in: authors },
        },
      });

      // Build person lookup map
      const personMap = new Map(people.map((p) => [p.username, p]));

      // Combine results with Person data
      const enrichedResults = results.map((r) => ({
        person: personMap.get(r.author) ?? {
          id: `unknown-${r.author}`,
          gitlabId: 0,
          username: r.author,
          name: null,
          avatarUrl: null,
          userId: ctx.session.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        matchCount: Number(r.matchCount),
        recentEvent: {
          id: r.recentEventId,
          title: r.recentEventTitle,
          type: r.recentEventType,
          createdAt: r.recentEventCreatedAt,
        },
      }));

      const duration = Date.now() - startTime;

      logger.info(
        {
          userId: ctx.session.user.id,
          query: input.query.substring(0, 50),
          resultCount: enrichedResults.length,
          durationMs: duration,
        },
        "people.whoTouched: Completed"
      );

      return {
        items: enrichedResults,
        query: input.query,
        duration,
      };
    }),
});
