/**
 * Queries tRPC Router
 *
 * Story 2.7a: Backend for creating and listing saved queries
 * Story 2.7b: Backend for updating and deleting saved queries
 * Story 2.8: Sidebar navigation with query counts
 *
 * Handles:
 * - queries.create: Save a new query with filters (AC 2.7a.1, 2.7a.3, 2.7a.4)
 * - queries.list: Fetch user's saved queries with FTS counts (AC 2.8.2)
 * - queries.getById: Fetch single query by ID with authorization (AC 2.8.3)
 * - queries.update: Update existing query name/filters (AC 2.7b.1, 2.7b.3-5, 2.7b.7)
 * - queries.delete: Remove a saved query (AC 2.7b.2-4, 2.7b.6-7)
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { QueryFiltersSchema, type QueryFilters } from "~/lib/filters/types";

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
      // Check if query with same name already exists for this user
      const existing = await ctx.db.userQuery.findFirst({
        where: {
          userId: ctx.session.user.id,
          name: input.name,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A query with this name already exists",
        });
      }

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
   * List user's saved queries with FTS match counts
   *
   * GET /api/trpc/queries.list
   *
   * Story 2.8: Sidebar Navigation (AC 2.8.2)
   * Returns queries ordered by creation date (newest first) with count of matching events
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

    // AC 2.8.2: Get FTS counts for each query's keywords
    const queriesWithCounts = await Promise.all(
      queries.map(async (query) => {
        const filters = query.filters as QueryFilters;
        const searchTerms = filters.keywords.join(" ");

        // Use PostgreSQL FTS to count matching events for this user
        const countResult = await ctx.db.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM "Event"
          WHERE "userId" = ${ctx.session.user.id}
            AND to_tsvector('english', title || ' ' || COALESCE(body, ''))
                @@ plainto_tsquery('english', ${searchTerms})
        `;

        return { ...query, count: Number(countResult[0]?.count ?? 0) };
      })
    );

    return queriesWithCounts;
  }),

  /**
   * Get a single query by ID with authorization
   *
   * GET /api/trpc/queries.getById
   *
   * Story 2.8: Sidebar Navigation (AC 2.8.3)
   * Returns query with count, or throws NOT_FOUND/FORBIDDEN
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const query = await ctx.db.userQuery.findUnique({
        where: { id: input.id },
      });

      if (!query) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Query not found",
        });
      }

      if (query.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view this query",
        });
      }

      // Get FTS count for this query
      const filters = query.filters as QueryFilters;
      const searchTerms = filters.keywords.join(" ");

      const countResult = await ctx.db.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "Event"
        WHERE "userId" = ${ctx.session.user.id}
          AND to_tsvector('english', title || ' ' || COALESCE(body, ''))
              @@ plainto_tsquery('english', ${searchTerms})
      `;

      return { ...query, count: Number(countResult[0]?.count ?? 0) };
    }),

  /**
   * Update an existing saved query
   *
   * PUT /api/trpc/queries.update
   *
   * AC 2.7b.1: queries.update mutation updates query name and/or filters in database
   * AC 2.7b.3: Authorization check prevents modifying queries not owned by current user
   * AC 2.7b.4: Returns TRPCError (FORBIDDEN) for unauthorized access
   * AC 2.7b.5: Input validated with Zod schema (id required, name/filters optional)
   * AC 2.7b.7: Returns TRPCError (NOT_FOUND) when query id doesn't exist
   *
   * Partial update semantics: undefined fields unchanged, provided fields replace entirely
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z
          .string()
          .min(1, "Query name is required")
          .max(100, "Query name too long")
          .optional(),
        filters: QueryFiltersSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch existing query
      const existing = await ctx.db.userQuery.findUnique({
        where: { id: input.id },
      });

      // AC 2.7b.7: NOT_FOUND if query doesn't exist
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Query not found",
        });
      }

      // AC 2.7b.3, 2.7b.4: Authorization check
      if (existing.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to modify this query",
        });
      }

      // If name is being changed, check for duplicates
      if (input.name !== undefined && input.name !== existing.name) {
        const duplicate = await ctx.db.userQuery.findFirst({
          where: {
            userId: ctx.session.user.id,
            name: input.name,
          },
        });

        if (duplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A query with this name already exists",
          });
        }
      }

      // AC 2.7b.1: Update with provided fields (undefined fields unchanged)
      const updated = await ctx.db.userQuery.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.filters !== undefined && { filters: input.filters }),
        },
      });

      return updated;
    }),

  /**
   * Delete a saved query
   *
   * DELETE /api/trpc/queries.delete
   *
   * AC 2.7b.2: queries.delete mutation removes query from database
   * AC 2.7b.3: Authorization check prevents deleting queries not owned by current user
   * AC 2.7b.4: Returns TRPCError (FORBIDDEN) for unauthorized access
   * AC 2.7b.6: Returns success confirmation ({ success: true })
   * AC 2.7b.7: Returns TRPCError (NOT_FOUND) when query id doesn't exist
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch existing query
      const existing = await ctx.db.userQuery.findUnique({
        where: { id: input.id },
      });

      // AC 2.7b.7: NOT_FOUND if query doesn't exist
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Query not found",
        });
      }

      // AC 2.7b.3, 2.7b.4: Authorization check
      if (existing.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this query",
        });
      }

      // AC 2.7b.2: Delete the query
      await ctx.db.userQuery.delete({
        where: { id: input.id },
      });

      // AC 2.7b.6: Return success confirmation
      return { success: true };
    }),

  /**
   * Get new items for a query since last visit
   *
   * GET /api/trpc/queries.getNewItems
   *
   * Story 3.1: Catch-Up Mode Backend - "New Since Last Visit" Logic
   * AC 3.1.3: Returns events created after query.lastVisitedAt
   * AC 3.1.4: When user has never visited query, returns all matching events
   * AC 3.1.5: When user visited query 1 second ago, returns empty array
   * AC 3.1.7: Response includes queryId, queryName, newCount, events array
   * AC 3.1.8: Query filters combined with "new since" filter using AND logic
   */
  getNewItems: protectedProcedure
    .input(z.object({ queryId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Fetch query and authorize
      const query = await ctx.db.userQuery.findUnique({
        where: { id: input.queryId },
      });

      // AC: Handle query not found
      if (!query) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Query not found",
        });
      }

      // AC: Authorization check (FORBIDDEN for wrong user)
      if (query.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to access this query",
        });
      }

      // AC 3.1.4: Determine last visited (epoch if never visited = NULL)
      // Note: Prisma Client uses camelCase (lastVisitedAt), PostgreSQL uses snake_case (last_visited_at)
      const lastVisited = query.lastVisitedAt ?? new Date(0);

      // AC 3.1.8: Extract keywords from filters for FTS query
      const filters = query.filters as QueryFilters;
      const searchTerms = filters.keywords.join(" ");

      // AC 3.1.3, 3.1.8: Query events using FTS + date filter (AND logic)
      // AC 3.1.5: If lastVisited is very recent (1 second ago), createdAt > lastVisited returns empty
      interface EventRow {
        id: string;
        userId: string;
        type: string;
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
        updatedAt: Date;
      }

      const events = await ctx.db.$queryRaw<EventRow[]>`
        SELECT * FROM "Event"
        WHERE "userId" = ${ctx.session.user.id}
          AND to_tsvector('english', title || ' ' || COALESCE(body, ''))
              @@ plainto_tsquery('english', ${searchTerms})
          AND "createdAt" > ${lastVisited}
        ORDER BY "createdAt" DESC
      `;

      // AC 3.1.7: Return response with queryId, queryName, newCount, events
      return {
        queryId: query.id,
        queryName: query.name,
        newCount: events.length,
        events,
      };
    }),
});
