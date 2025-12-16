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
import { logger } from "~/lib/logger";
import { decodeCursor, createCursorFromRecord, type CursorData } from "~/utils/cursor";

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
  /** Number of events returned in this page (not total matching) */
  count: number;
  /** Whether there are more results available */
  hasMore: boolean;
  /** Cursor for next page, null if no more results */
  nextCursor: string | null;
}

export interface SearchOptions {
  /** Array of keyword tags to AND together */
  keywords: string[];
  userId: string;
  limit?: number;
  /** Cursor for pagination (from previous result's nextCursor) */
  cursor?: string | null;
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
 * Build a search string for to_tsquery with AND logic.
 *
 * Returns a string like "word1 & word2 & word3" that can be passed
 * directly to to_tsquery('english', ...) in SQL.
 *
 * Note: We use to_tsquery (not plainto_tsquery) because plainto_tsquery
 * ignores the & operator. to_tsquery interprets & as AND.
 */
function buildTsQueryString(keywords: string[]): string {
  const sanitized = keywords
    .map(sanitizeKeyword)
    .filter((k) => k.length > 0);

  if (sanitized.length === 0) {
    return "";
  }

  // Join with & for AND logic in to_tsquery
  // Each keyword needs to be a single lexeme, so we use :* for prefix matching
  // to handle multi-word keywords properly
  return sanitized.map((k) => k.split(/\s+/).join(" & ")).join(" & ");
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
  const { keywords, userId, limit = DEFAULT_LIMIT, cursor } = options;
  const effectiveLimit = Math.min(limit, MAX_LIMIT);

  // Filter empty keywords and build query string
  const validKeywords = keywords.filter((k) => k.trim().length > 0);
  if (validKeywords.length === 0) {
    return { events: [], count: 0, hasMore: false, nextCursor: null };
  }

  // Parse cursor if provided
  let cursorData: CursorData | null = null;
  if (cursor) {
    cursorData = decodeCursor(cursor);
  }

  const startTime = Date.now();

  // Build tsquery string with AND logic for multiple keywords
  // Pass as string parameter to to_tsquery() in SQL
  const tsQueryString = buildTsQueryString(validKeywords);

  // NOTE: Search results are ordered by rank DESC, then createdAt DESC, then id DESC.
  // Cursor pagination filters by createdAt+id (ignoring rank) which may cause minor
  // ordering inconsistencies at page boundaries - items with same createdAt but different
  // ranks could appear on unexpected pages. This is an acceptable tradeoff per task spec
  // (bd-wdwx) to avoid complexity of rank-based cursors which would require storing
  // the rank value in the cursor and handling rank ties.

  // Use separate queries for cursor vs non-cursor cases because Prisma's template
  // literal system assigns parameter numbers at parse time, not runtime.
  let results: SearchResultEvent[];

  if (cursorData) {
    const cursorDate = new Date(cursorData.createdAt);
    results = await db.$queryRaw<SearchResultEvent[]>`
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
          to_tsquery('english', ${tsQueryString})
        ) as rank,
        ts_headline(
          'english',
          e.title,
          to_tsquery('english', ${tsQueryString}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10'
        ) as "highlightedTitle",
        ts_headline(
          'english',
          COALESCE(e.body, ''),
          to_tsquery('english', ${tsQueryString}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=100, MinWords=20'
        ) as "highlightedSnippet"
      FROM "Event" e
      WHERE e."userId" = ${userId}
        AND to_tsvector('english', e.title || ' ' || COALESCE(e.body, ''))
            @@ to_tsquery('english', ${tsQueryString})
        AND (e."createdAt" < ${cursorDate}
            OR (e."createdAt" = ${cursorDate} AND e.id < ${cursorData.id}))
      ORDER BY rank DESC, e."createdAt" DESC, e.id DESC
      LIMIT ${effectiveLimit + 1}
    `;
  } else {
    results = await db.$queryRaw<SearchResultEvent[]>`
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
          to_tsquery('english', ${tsQueryString})
        ) as rank,
        ts_headline(
          'english',
          e.title,
          to_tsquery('english', ${tsQueryString}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10'
        ) as "highlightedTitle",
        ts_headline(
          'english',
          COALESCE(e.body, ''),
          to_tsquery('english', ${tsQueryString}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=100, MinWords=20'
        ) as "highlightedSnippet"
      FROM "Event" e
      WHERE e."userId" = ${userId}
        AND to_tsvector('english', e.title || ' ' || COALESCE(e.body, ''))
            @@ to_tsquery('english', ${tsQueryString})
      ORDER BY rank DESC, e."createdAt" DESC, e.id DESC
      LIMIT ${effectiveLimit + 1}
    `;
  }

  const duration = Date.now() - startTime;

  // Determine if there are more results
  const hasMore = results.length > effectiveLimit;
  const eventsToReturn = hasMore ? results.slice(0, effectiveLimit) : results;

  // Create next cursor from last event if there are more results
  const lastEvent = eventsToReturn[eventsToReturn.length - 1];
  const nextCursor = hasMore && lastEvent
    ? createCursorFromRecord(lastEvent)
    : null;

  logger.info(
    {
      event: "search_executed",
      keywordCount: validKeywords.length,
      keywords: validKeywords.map((k) => k.substring(0, 20)), // Truncate for privacy
      resultCount: eventsToReturn.length,
      hasMore,
      durationMs: duration,
    },
    "FTS search completed"
  );

  return {
    events: eventsToReturn,
    count: eventsToReturn.length,
    hasMore,
    nextCursor,
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

  // Build tsquery string with AND logic
  const tsQueryString = buildTsQueryString(validKeywords);

  const result = await db.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count
    FROM "Event" e
    WHERE e."userId" = ${userId}
      AND to_tsvector('english', e.title || ' ' || COALESCE(e.body, ''))
          @@ to_tsquery('english', ${tsQueryString})
  `;

  return Number(result[0]?.count ?? 0);
}
