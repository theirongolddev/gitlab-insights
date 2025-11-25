"use client";

import { renderHighlightedText } from "~/lib/search/highlight";

interface HighlightedTextProps {
  /** Raw HTML from ts_headline() containing <mark> tags */
  html: string;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Component for rendering search result text with keyword highlights
 *
 * Sanitizes HTML via DOMPurify to prevent XSS before rendering.
 * Highlights are styled via global CSS for the <mark> tag.
 *
 * @see AC 2.5.1 - Keywords highlighted with olive background
 * @see AC 2.5.4 - Maintains 4.5:1 contrast ratio
 * @see AC 2.5.5 - XSS safe via DOMPurify sanitization
 */
export function HighlightedText({ html, className = "" }: HighlightedTextProps) {
  const sanitized = renderHighlightedText(html);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={sanitized}
    />
  );
}
