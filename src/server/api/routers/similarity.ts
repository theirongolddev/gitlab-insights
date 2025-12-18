/**
 * Similarity tRPC Router
 *
 * Endpoints for finding similar Events using combined scoring
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { logger } from "~/lib/logger";
import {
  findSimilarWithCombinedScore,
  arePotentialDuplicates,
  type SimilarityBreakdown,
} from "~/server/services/similarity-scorer";
import {
  findSimilarEvents,
  generateEmbedding,
  prepareTextForEmbedding,
} from "~/server/services/embedding-generator";

export const similarityRouter = createTRPCRouter({
  /**
   * Find similar items to an existing Event
   *
   * Uses combined scoring (embeddings + labels + files) to find similar events.
   *
   * @param eventId - The source event to find similar items for
   * @param limit - Maximum number of results (default 10)
   * @param threshold - Minimum similarity score 0-1 (default 0.5)
   * @param types - Optional filter by event types
   */
  getSimilar: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        limit: z.number().min(1).max(50).default(10),
        threshold: z.number().min(0).max(1).default(0.5),
        types: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      logger.info(
        { eventId: input.eventId, limit: input.limit, threshold: input.threshold },
        "similarity.getSimilar: Finding similar events"
      );

      // Verify the event exists and belongs to the user
      const sourceEvent = await ctx.db.event.findUnique({
        where: { id: input.eventId },
        select: { id: true, userId: true, title: true },
      });

      if (!sourceEvent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      if (sourceEvent.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this event",
        });
      }

      try {
        // Get similar events with combined scoring
        const results = await findSimilarWithCombinedScore(
          ctx.db,
          input.eventId,
          input.limit,
          input.threshold
        );

        // Fetch event details for the results
        const eventIds = results.map((r) => r.eventId);
        const events = await ctx.db.event.findMany({
          where: {
            id: { in: eventIds },
            ...(input.types ? { type: { in: input.types } } : {}),
          },
          select: {
            id: true,
            type: true,
            title: true,
            project: true,
            author: true,
            gitlabUrl: true,
            labels: true,
            status: true,
            createdAt: true,
          },
        });

        // Combine events with their similarity scores
        const eventMap = new Map(events.map((e) => [e.id, e]));
        const enrichedResults = results
          .filter((r) => eventMap.has(r.eventId))
          .map((r) => ({
            event: eventMap.get(r.eventId)!,
            similarity: r.similarity,
          }));

        logger.info(
          { eventId: input.eventId, resultCount: enrichedResults.length },
          "similarity.getSimilar: Found similar events"
        );

        return {
          sourceEvent: {
            id: sourceEvent.id,
            title: sourceEvent.title,
          },
          results: enrichedResults,
        };
      } catch (error) {
        logger.error({ error, eventId: input.eventId }, "similarity.getSimilar: Error");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to find similar events",
        });
      }
    }),

  /**
   * Search for similar items by text
   *
   * Useful for checking if a similar issue already exists before creating a new one.
   * Uses embedding similarity only (no label/file overlap since we don't have those yet).
   *
   * @param title - The title of the potential new issue
   * @param body - Optional description
   * @param limit - Maximum number of results (default 5)
   * @param threshold - Minimum similarity score 0-1 (default 0.7)
   * @param types - Optional filter by event types
   */
  searchSimilar: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        body: z.string().optional(),
        limit: z.number().min(1).max(20).default(5),
        threshold: z.number().min(0).max(1).default(0.7),
        types: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      logger.info(
        { titleLength: input.title.length, limit: input.limit, threshold: input.threshold },
        "similarity.searchSimilar: Searching for similar events"
      );

      try {
        // Prepare text and find similar events
        const text = prepareTextForEmbedding(input.title, input.body ?? null);
        const results = await findSimilarEvents(
          ctx.db,
          text,
          ctx.session.user.id,
          input.limit * 2, // Get more initially, filter by type later
          input.threshold
        );

        // Fetch event details
        const eventIds = results.map((r) => r.id);
        const events = await ctx.db.event.findMany({
          where: {
            id: { in: eventIds },
            ...(input.types ? { type: { in: input.types } } : {}),
          },
          select: {
            id: true,
            type: true,
            title: true,
            project: true,
            author: true,
            gitlabUrl: true,
            labels: true,
            status: true,
            createdAt: true,
          },
        });

        // Combine events with their similarity scores
        const eventMap = new Map(events.map((e) => [e.id, e]));
        const enrichedResults = results
          .filter((r) => eventMap.has(r.id))
          .map((r) => ({
            event: eventMap.get(r.id)!,
            similarity: r.similarity,
          }))
          .slice(0, input.limit);

        logger.info(
          { resultCount: enrichedResults.length },
          "similarity.searchSimilar: Found similar events"
        );

        return {
          query: {
            title: input.title,
            body: input.body,
          },
          results: enrichedResults,
        };
      } catch (error) {
        logger.error({ error }, "similarity.searchSimilar: Error");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search for similar events",
        });
      }
    }),

  /**
   * Check if two events are potential duplicates
   *
   * @param eventIdA - First event ID
   * @param eventIdB - Second event ID
   * @returns Whether the events are likely duplicates and their similarity breakdown
   */
  checkDuplicate: protectedProcedure
    .input(
      z.object({
        eventIdA: z.string(),
        eventIdB: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify both events belong to the user
      const events = await ctx.db.event.findMany({
        where: {
          id: { in: [input.eventIdA, input.eventIdB] },
          userId: ctx.session.user.id,
        },
        select: { id: true },
      });

      if (events.length !== 2) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or both events not found or not accessible",
        });
      }

      try {
        const result = await arePotentialDuplicates(
          ctx.db,
          input.eventIdA,
          input.eventIdB
        );

        return result;
      } catch (error) {
        logger.error({ error, input }, "similarity.checkDuplicate: Error");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check for duplicates",
        });
      }
    }),
});
