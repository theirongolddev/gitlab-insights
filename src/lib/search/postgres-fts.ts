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
 * Build a tsquery string from multiple keywords with AND logic
 * Each keyword is wrapped in plainto_tsquery for safe parsing, then ANDed
 */
function buildTsQueryString(keywords: string[]): string {
  const sanitized = keywords
    .map(sanitizeKeyword)
    .filter((k) => k.length > 0);

  if (sanitized.length === 0) return "";
  if (sanitized.length === 1) return sanitized[0]!;

  // Join with & for AND logic
  return sanitized.join(" & ");
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

  // For single keyword, use plainto_tsquery (simpler, handles phrases)
  // For multiple keywords, use to_tsquery with & for AND logic
  const queryString = buildTsQueryString(validKeywords);

  // Use parameterized query with Prisma.sql for SQL injection prevention
  // Note: We use plainto_tsquery for each keyword segment which handles
  // special characters safely, then combine with &
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
        plainto_tsquery('english', ${queryString})
      ) as rank,
      ts_headline(
        'english',
        e.title,
        plainto_tsquery('english', ${queryString}),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10'
      ) as "highlightedTitle",
      ts_headline(
        'english',
        COALESCE(e.body, ''),
        plainto_tsquery('english', ${queryString}),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=100, MinWords=20'
      ) as "highlightedSnippet"
    FROM "Event" e
    WHERE e."userId" = ${userId}
      AND to_tsvector('english', e.title || ' ' || COALESCE(e.body, ''))
          @@ plainto_tsquery('english', ${queryString})
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

  const queryString = buildTsQueryString(validKeywords);

  const result = await db.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count
    FROM "Event" e
    WHERE e."userId" = ${userId}
      AND to_tsvector('english', e.title || ' ' || COALESCE(e.body, ''))
          @@ plainto_tsquery('english', ${queryString})
  `;

  return Number(result[0]?.count ?? 0);
}
