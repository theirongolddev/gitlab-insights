/**
 * PostgreSQL Full-Text Search Query Builder
 *
 * Provides FTS search functionality using PostgreSQL's built-in
 * full-text search with GIN indexes for <1s performance on 10k+ events.
 *
 * Uses:
 * - to_tsvector for document indexing
 * - plainto_tsquery for query parsing
 * - ts_rank for relevance scoring
 * - ts_headline for keyword highlighting
 */

import { type PrismaClient } from "../../../generated/prisma";
import { Prisma } from "../../../generated/prisma";
import { logger } from "~/lib/logger";

/**
 * Search result with relevance ranking and highlighted snippets
 */
export interface SearchResultEvent {
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
  rank: number;
  highlightedTitle: string;
  highlightedSnippet: string;
}

export interface SearchResult {
  events: SearchResultEvent[];
  total: number;
}

export interface SearchOptions {
  keyword: string;
  userId: string;
  limit?: number;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * Search events using PostgreSQL Full-Text Search
 *
 * @param db - Prisma client instance
 * @param options - Search options including keyword, userId, and optional limit
 * @returns Search results with events ranked by relevance and highlighted snippets
 */
export async function searchEvents(
  db: PrismaClient,
  options: SearchOptions
): Promise<SearchResult> {
  const { keyword, userId, limit = DEFAULT_LIMIT } = options;
  const effectiveLimit = Math.min(limit, MAX_LIMIT);

  const startTime = Date.now();

  // Use parameterized query with Prisma.sql for SQL injection prevention
  const results = await db.$queryRaw<SearchResultEvent[]>`
    SELECT
      e.id,
      e."userId",
      e.type,
      e.title,
      e.body,
      e.author,
      e."authorAvatar",
      e.project,
      e."projectId",
      e.labels,
      e."gitlabEventId",
      e."gitlabUrl",
      e."createdAt",
      e."updatedAt",
      ts_rank(
        to_tsvector('english', e.title || ' ' || COALESCE(e.body, '')),
        plainto_tsquery('english', ${keyword})
      ) as rank,
      ts_headline(
        'english',
        e.title,
        plainto_tsquery('english', ${keyword}),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10'
      ) as "highlightedTitle",
      ts_headline(
        'english',
        COALESCE(e.body, ''),
        plainto_tsquery('english', ${keyword}),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=100, MinWords=20'
      ) as "highlightedSnippet"
    FROM "Event" e
    WHERE e."userId" = ${userId}
      AND to_tsvector('english', e.title || ' ' || COALESCE(e.body, ''))
          @@ plainto_tsquery('english', ${keyword})
    ORDER BY rank DESC, e."createdAt" DESC
    LIMIT ${effectiveLimit}
  `;

  const duration = Date.now() - startTime;

  logger.info(
    {
      event: "search_executed",
      keyword: keyword.substring(0, 20), // Truncate for privacy
      resultCount: results.length,
      durationMs: duration,
    },
    "FTS search completed"
  );

  return {
    events: results,
    total: results.length,
  };
}

/**
 * Count matching events without fetching full results
 * Useful for sidebar query counts
 *
 * @param db - Prisma client instance
 * @param keyword - Search keyword
 * @param userId - User ID for isolation
 * @returns Count of matching events
 */
export async function countSearchResults(
  db: PrismaClient,
  keyword: string,
  userId: string
): Promise<number> {
  const result = await db.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count
    FROM "Event" e
    WHERE e."userId" = ${userId}
      AND to_tsvector('english', e.title || ' ' || COALESCE(e.body, ''))
          @@ plainto_tsquery('english', ${keyword})
  `;

  return Number(result[0]?.count ?? 0);
}
