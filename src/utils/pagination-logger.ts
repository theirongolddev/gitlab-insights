/**
 * Structured logging utility for pagination endpoints.
 * Provides consistent logging format for debugging infinite scroll behavior.
 */

import { logger } from "~/lib/logger";

export interface PaginationLogData {
  userId: string | null;
  endpoint: string;
  cursorProvided: boolean;
  itemsReturned: number;
  hasMore: boolean;
  durationMs: number;
  filters?: Record<string, unknown>;
}

/**
 * Logs pagination request details in a structured format.
 * Place before return statement in pagination endpoints.
 *
 * @example
 * const startTime = Date.now();
 * // ... fetch data ...
 * logPagination({
 *   userId: ctx.session?.user?.id ?? null,
 *   endpoint: "getRecent",
 *   cursorProvided: !!input.cursor,
 *   itemsReturned: events.length,
 *   hasMore: events.length === limit,
 *   durationMs: Date.now() - startTime,
 * });
 */
export function logPagination(data: PaginationLogData): void {
  logger.info(
    {
      type: "pagination",
      ...data,
    },
    `Pagination: ${data.endpoint}`
  );
}

/**
 * Creates a timer for measuring pagination request duration.
 *
 * @example
 * const timer = createPaginationTimer();
 * // ... do work ...
 * const durationMs = timer.elapsed();
 */
export function createPaginationTimer(): { elapsed: () => number } {
  const startTime = Date.now();
  return {
    elapsed: () => Date.now() - startTime,
  };
}

/**
 * Helper to create pagination log data from common endpoint patterns.
 *
 * @example
 * const logData = buildPaginationLogData({
 *   userId: ctx.session?.user?.id,
 *   endpoint: "getForDashboard",
 *   cursor: input.cursor,
 *   results: events,
 *   limit: input.limit ?? 50,
 *   timer,
 *   filters: { groupId: input.groupId },
 * });
 * logPagination(logData);
 */
export function buildPaginationLogData<T>(params: {
  userId: string | undefined | null;
  endpoint: string;
  cursor: string | undefined | null;
  results: T[];
  limit: number;
  timer: { elapsed: () => number };
  filters?: Record<string, unknown>;
  /** Override hasMore detection. Use when fetching limit+1 to detect more results. */
  hasMore?: boolean;
}): PaginationLogData {
  return {
    userId: params.userId ?? null,
    endpoint: params.endpoint,
    cursorProvided: !!params.cursor,
    itemsReturned: params.results.length,
    // If hasMore explicitly provided, use it; otherwise infer from results.length === limit
    hasMore: params.hasMore ?? params.results.length === params.limit,
    durationMs: params.timer.elapsed(),
    filters: params.filters,
  };
}
