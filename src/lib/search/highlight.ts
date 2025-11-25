/**
 * XSS-safe highlight rendering utility for search results
 *
 * Sanitizes HTML output from PostgreSQL ts_headline() before rendering.
 * Only allows <mark> tags to prevent XSS attacks.
 *
 * @see AC 2.5.5 - No XSS vulnerabilities in highlight rendering
 */

import DOMPurify from "dompurify";

/**
 * Type for React's dangerouslySetInnerHTML prop
 */
export type SanitizedHtml = { __html: string };

/**
 * Sanitize HTML from ts_headline() for safe rendering
 *
 * @param rawHtml - Raw HTML string from PostgreSQL ts_headline() containing <mark> tags
 * @returns Sanitized HTML object safe for dangerouslySetInnerHTML
 *
 * @example
 * const highlighted = renderHighlightedText("Fix <mark>auth</mark> bug");
 * // Returns: { __html: "Fix <mark>auth</mark> bug" }
 *
 * @example
 * // XSS attempt is sanitized
 * const xss = renderHighlightedText("<script>alert(1)</script>Test");
 * // Returns: { __html: "Test" }
 */
export function renderHighlightedText(rawHtml: string): SanitizedHtml {
  // Only allow <mark> tags, strip everything else including attributes
  const sanitized = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ["mark"],
    ALLOWED_ATTR: [],
  });

  return { __html: sanitized };
}
