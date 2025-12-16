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
 * Highlight keywords in event title and body using client-side highlighting
 *
 * Note: Originally used PostgreSQL ts_headline(), but that function is designed
 * for creating search result snippets (truncates content). For detail view, we need
 * FULL content with highlights, so switched to client-side regex-based highlighting.
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
  // Get full event content from DB for client-side highlighting
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { title: true, body: true },
  });

  if (!event) {
    return {
      titleHighlighted: "",
      bodyHighlighted: null,
    };
  }

  // Simple client-side highlighting: wrap each search term with <mark> tags
  // Case-insensitive matching using placeholder tokens to avoid ReDoS and nested tags
  const highlightText = (text: string | null): string | null => {
    if (!text) return null;

    // First, escape HTML entities to prevent XSS from DB content
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Sort terms by length (longest first) to handle overlapping matches correctly
    const sortedTerms = [...searchTerms]
      .map(t => t.trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    // Use placeholder tokens that won't appear in normal text
    const MARK_START = '\u0000MARK_START\u0000';
    const MARK_END = '\u0000MARK_END\u0000';

    let highlighted = escaped;
    for (const term of sortedTerms) {
      // Escape special regex characters in the search term
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Simple case-insensitive match without complex lookaheads (prevents ReDoS)
      const regex = new RegExp(`(${escapedTerm})`, 'gi');
      highlighted = highlighted.replace(regex, `${MARK_START}$1${MARK_END}`);
    }

    // Replace placeholders with actual tags, collapsing adjacent markers
    highlighted = highlighted
      .replace(new RegExp(`${MARK_END}${MARK_START}`, 'g'), '')
      .replace(new RegExp(MARK_START, 'g'), '<mark>')
      .replace(new RegExp(MARK_END, 'g'), '</mark>');

    return highlighted;
  };

  return {
    titleHighlighted: highlightText(event.title) ?? "",
    bodyHighlighted: highlightText(event.body),
  };
}
