/**
 * Event Content Highlighting Utility
 *
 * Story 4.4: Keyword highlighting in detail view
 * Highlights keywords in event title and body using PostgreSQL ts_headline()
 * Uses same pattern as searchEvents() from Story 2.5
 */

import type { PrismaClient } from "../../../generated/prisma";

interface HighlightResult {
  titleHighlighted: string;
  bodyHighlighted: string | null;
}

/**
 * Highlight keywords in event title and body using PostgreSQL ts_headline()
 *
 * @param db - Prisma client instance
 * @param eventId - ID of the event to highlight
 * @param searchTerms - Array of keywords to highlight
 * @returns Highlighted title and body with <mark> tags
 */
export async function highlightEventContent(
  db: PrismaClient,
  eventId: string,
  searchTerms: string[]
): Promise<HighlightResult> {
  // Build tsquery from search terms (AND logic)
  // Example: ["auth", "error"] → "auth & error"
  // Defense-in-depth: Filter suspicious characters (though Prisma + plainto_tsquery provide protection)
  const tsquery = searchTerms
    .map((term) => term.trim())
    .filter(Boolean)
    .filter((term) => !term.includes(";") && !term.includes("--"))
    .join(" & ");

  // If all terms were filtered out, return empty highlights
  if (searchTerms.length > 0 && tsquery === "") {
    return {
      titleHighlighted: "",
      bodyHighlighted: null,
    };
  }

  // Raw SQL query using ts_headline() for highlighting
  // Pattern from postgres-fts.ts searchEvents() function
  const result = await db.$queryRaw<
    Array<{
      title_highlighted: string;
      body_highlighted: string | null;
    }>
  >`
    SELECT
      ts_headline(
        'english',
        title,
        plainto_tsquery('english', ${tsquery}),
        'StartSel=<mark>, StopSel=</mark>'
      ) as title_highlighted,
      ts_headline(
        'english',
        COALESCE(body, ''),
        plainto_tsquery('english', ${tsquery}),
        'StartSel=<mark>, StopSel=</mark>'
      ) as body_highlighted
    FROM "Event"
    WHERE id = ${eventId}
    LIMIT 1
  `;

  if (!result[0]) {
    // Fallback - should never happen since event exists
    return {
      titleHighlighted: "",
      bodyHighlighted: null,
    };
  }

  return {
    titleHighlighted: result[0].title_highlighted,
    bodyHighlighted: result[0].body_highlighted,
  };
}
