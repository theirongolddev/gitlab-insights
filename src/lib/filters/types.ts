/**
 * Query Filters Schema and Types
 *
 * Story 2.7a: Defines the schema for saved query filters.
 *
 * Tech Spec Deviation Note:
 * Original spec used single `keyword: string`. Updated to `keywords: string[]`
 * to match Story 2.6's SearchContext multi-keyword implementation (tag-pill UI).
 */

import { z } from "zod";

/**
 * QueryFiltersSchema - Zod schema for validating query filter input
 *
 * AC 2.7a.2: Input validated with Zod schema
 * - keywords: Array of search terms (1-100 chars each, at least 1 required)
 */
export const QueryFiltersSchema = z.object({
  keywords: z
    .array(z.string().min(1, "Keyword cannot be empty").max(100, "Keyword too long"))
    .min(1, "At least one keyword is required"),
});

/**
 * QueryFilters type - TypeScript type inferred from Zod schema
 * Use this for type-safe filter handling across the application
 */
export type QueryFilters = z.infer<typeof QueryFiltersSchema>;
