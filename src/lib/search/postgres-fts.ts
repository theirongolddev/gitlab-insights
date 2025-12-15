/**
 * PostgreSQL Full-Text Search Query Builder
 *
 * Provides FTS search functionality using PostgreSQL's built-in
 * full-text search with GIN indexes for <1s performance on 10k+ events.
 *
 * Uses:
 * - to_tsvector for document indexing
 * - to_tsquery for query parsing (supports AND with &)
 * - ts_rank for relevance scoring
 * - ts_headline for keyword highlighting
 *
 * Story 2.6: Updated to support multiple keyword tags with AND logic
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
  /** Array of keyword tags to AND together */
  keywords: string[];
  userId: string;
  limit?: number;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * Sanitize a keyword for use in to_tsquery
 * Removes special characters that could break the query syntax
 */
function sanitizeKeyword(keyword: string): string {
  // Remove FTS special characters: & | ! ( ) : * '
  // Keep alphanumeric, spaces, and common punctuation
  return keyword
    .replace(/[&|!():*'\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build a Prisma.sql fragment for combining multiple keywords with AND logic.
 * 
 * IMPORTANT: plainto_tsquery ignores operators like & in the input string.
 * To get true AND logic with multiple keywords, we must:
 * 1. Call plainto_tsquery separately for each keyword
 * 2. Combine them using PostgreSQL's && operator on tsquery values
 * 
 * Example for ["auth", "login"]:
 *   (plainto_tsquery('english', 'auth') && plainto_tsquery('english', 'login'))
 */
function buildCombinedTsQuerySql(keywords: string[]): Prisma.Sql {
  const sanitized = keywords
    .map(sanitizeKeyword)
    .filter((k) => k.length > 0);

  if (sanitized.length === 0) {
    // Return a query that matches nothing
    return Prisma.sql`plainto_tsquery('english', '')`;
  }

  if (sanitized.length === 1) {
    // Single keyword - simple case
    return Prisma.sql`plainto_tsquery('english', ${sanitized[0]})`;
  }

  // Multiple keywords - AND them together using &&
  // Build: (plainto_tsquery('english', $1) && plainto_tsquery('english', $2) && ...)
  const parts = sanitized.map(
    (keyword) => Prisma.sql`plainto_tsquery('english', ${keyword})`
  );

  // Join with && operator
  let combined = parts[0]!;
  for (let i = 1; i < parts.length; i++) {
    combined = Prisma.sql`${combined} && ${parts[i]}`;
  }

  return combined;
}

/**
 * Search events using PostgreSQL Full-Text Search
 *
 * Story 2.6: Supports multiple keyword tags with AND logic
 * All keywords must match for a result to be included
 *
 * @param db - Prisma client instance
 * @param options - Search options including keywords array, userId, and optional limit
 * @returns Search results with events ranked by relevance and highlighted snippets
 */
export async function searchEvents(
  db: PrismaClient,
  options: SearchOptions
): Promise<SearchResult> {
  const { keywords, userId, limit = DEFAULT_LIMIT } = options;
  const effectiveLimit = Math.min(limit, MAX_LIMIT);

  // Filter empty keywords and build query string
  const validKeywords = keywords.filter((k) => k.trim().length > 0);
  if (validKeywords.length === 0) {
    return { events: [], total: 0 };
  }

  const startTime = Date.now();

  // Build combined tsquery with proper AND logic for multiple keywords
  const tsQuery = buildCombinedTsQuerySql(validKeywords);

  // Use parameterized query with Prisma.sql for SQL injection prevention
  // Each keyword gets its own plainto_tsquery call, combined with &&
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
        ${tsQuery}
      ) as rank,
      ts_headline(
        'english',
        e.title,
        ${tsQuery},
        'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10'
      ) as "highlightedTitle",
      ts_headline(
        'english',
        COALESCE(e.body, ''),
        ${tsQuery},
        'StartSel=<mark>, StopSel=</mark>, MaxWords=100, MinWords=20'
      ) as "highlightedSnippet"
    FROM "Event" e
    WHERE e."userId" = ${userId}
      AND to_tsvector('english', e.title || ' ' || COALESCE(e.body, ''))
          @@ ${tsQuery}
    ORDER BY rank DESC, e."createdAt" DESC
    LIMIT ${effectiveLimit}
  `;

  const duration = Date.now() - startTime;

  logger.info(
    {
      event: "search_executed",
      keywordCount: validKeywords.length,
      keywords: validKeywords.map((k) => k.substring(0, 20)), // Truncate for privacy
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
 * Story 2.6: Updated to support multiple keywords with AND logic
 *
 * @param db - Prisma client instance
 * @param keywords - Array of search keywords
 * @param userId - User ID for isolation
 * @returns Count of matching events
 */
export async function countSearchResults(
  db: PrismaClient,
  keywords: string[],
  userId: string
): Promise<number> {
  const validKeywords = keywords.filter((k) => k.trim().length > 0);
  if (validKeywords.length === 0) {
    return 0;
  }

  // Build combined tsquery with proper AND logic for multiple keywords
  const tsQuery = buildCombinedTsQuerySql(validKeywords);

  const result = await db.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count
    FROM "Event" e
    WHERE e."userId" = ${userId}
      AND to_tsvector('english', e.title || ' ' || COALESCE(e.body, ''))
          @@ ${tsQuery}
  `;

  return Number(result[0]?.count ?? 0);
}
