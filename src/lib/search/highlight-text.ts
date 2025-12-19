/**
 * Text Highlighting Utility
 *
 * Provides XSS-safe text highlighting for search results.
 * Wraps matched terms with <mark> tags for styling.
 *
 * Used by:
 * - Work items API (for card view highlighting)
 * - Event detail view (for keyword highlighting)
 */

/**
 * Highlight search terms in text with <mark> tags
 *
 * Features:
 * - XSS-safe: HTML-escapes input before highlighting
 * - Case-insensitive matching
 * - Handles overlapping matches (longest first)
 * - Uses placeholder tokens to prevent nested tags
 *
 * @param text - The text to highlight
 * @param searchTerm - The search term(s) to highlight (space-separated for multiple terms)
 * @returns HTML string with <mark> tags around matched terms
 */
export function highlightText(text: string, searchTerm: string): string {
  if (!text || !searchTerm) return text ?? "";

  // Split search term into individual words for multi-term highlighting
  const searchTerms = searchTerm
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (searchTerms.length === 0) return text;

  // First, escape HTML entities to prevent XSS from DB content
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Sort terms by length (longest first) to handle overlapping matches correctly
  const sortedTerms = [...searchTerms].sort((a, b) => b.length - a.length);

  // Use placeholder tokens that won't appear in normal text
  const MARK_START = "\u0000MARK_START\u0000";
  const MARK_END = "\u0000MARK_END\u0000";

  let highlighted = escaped;
  for (const term of sortedTerms) {
    // Escape special regex characters in the search term
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Simple case-insensitive match without complex lookaheads (prevents ReDoS)
    const regex = new RegExp(`(${escapedTerm})`, "gi");
    highlighted = highlighted.replace(regex, `${MARK_START}$1${MARK_END}`);
  }

  // Replace placeholders with actual tags, collapsing adjacent markers
  highlighted = highlighted
    .replace(new RegExp(`${MARK_END}${MARK_START}`, "g"), "")
    .replace(new RegExp(MARK_START, "g"), "<mark>")
    .replace(new RegExp(MARK_END, "g"), "</mark>");

  return highlighted;
}
