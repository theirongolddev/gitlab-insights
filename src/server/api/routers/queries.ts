/**
 * Queries tRPC Router
 *
 * Story 2.7a: Backend for creating and listing saved queries
 *
 * Handles:
 * - queries.create: Save a new query with filters (AC 2.7a.1, 2.7a.3, 2.7a.4)
 * - queries.list: Fetch user's saved queries (enabler for Story 2.8)
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { QueryFiltersSchema } from "~/lib/filters/types";

export const queriesRouter = createTRPCRouter({
  /**
   * Create a new saved query
   *
   * POST /api/trpc/queries.create
   *
   * AC 2.7a.1: queries.create mutation saves query to database
   * AC 2.7a.2: Input validated with Zod schema (name: 1-100 chars, filters: QueryFiltersSchema)
   * AC 2.7a.3: Query associated with current user's ID (userId from session)
   * AC 2.7a.4: Returns created query with ID
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(1, "Query name is required")
          .max(100, "Query name too long"),
        filters: QueryFiltersSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const query = await ctx.db.userQuery.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          filters: input.filters,
        },
      });

      return query;
    }),

  /**
   * List user's saved queries
   *
   * GET /api/trpc/queries.list
   *
   * Enabler for Story 2.8 (Sidebar Navigation)
   * Returns queries ordered by creation date (newest first)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const queries = await ctx.db.userQuery.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return queries;
  }),
});
