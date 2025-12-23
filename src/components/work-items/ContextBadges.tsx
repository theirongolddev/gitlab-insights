"use client";

import { memo } from "react";

interface ContextBadgesProps {
  repositoryName?: string;
  component?: string;
  keywords?: string[];
  className?: string;
}

/**
 * ContextBadges - Display context signal badges for work items
 *
 * Provides visual cues for organizational relevance:
 * - Repository badge (blue): Which repo this belongs to
 * - Component badge (purple): Which component/area of code
 * - Keyword badges (gray): Extracted keywords for quick scanning
 *
 * Design specs:
 * - 11px text (text-xs), medium weight (500)
 * - 2px 8px padding, 4px border-radius
 * - Flex wrap with 8px gap
 */
export const ContextBadges = memo(function ContextBadges({
  repositoryName,
  component,
  keywords = [],
  className = "",
}: ContextBadgesProps) {
  const hasContent = repositoryName || component || keywords.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {repositoryName && <RepoBadge name={repositoryName} />}
      {component && <ComponentBadge name={component} />}
      {keywords.map((keyword) => (
        <KeywordBadge key={keyword} keyword={keyword} />
      ))}
    </div>
  );
});

interface RepoBadgeProps {
  name: string;
}

/**
 * Repository badge - blue tint
 * Background: hsl(199, 50%, 30%)
 * Text: hsl(199, 92%, 80%)
 */
function RepoBadge({ name }: RepoBadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
      style={{
        backgroundColor: "hsl(199, 50%, 30%)",
        color: "hsl(199, 92%, 80%)",
      }}
    >
      {name}
    </span>
  );
}

interface ComponentBadgeProps {
  name: string;
}

/**
 * Component badge - purple tint
 * Background: hsl(280, 50%, 30%)
 * Text: hsl(280, 67%, 80%)
 */
function ComponentBadge({ name }: ComponentBadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
      style={{
        backgroundColor: "hsl(280, 50%, 30%)",
        color: "hsl(280, 67%, 80%)",
      }}
    >
      {name}
    </span>
  );
}

interface KeywordBadgeProps {
  keyword: string;
}

/**
 * Keyword badge - gray
 * Background: hsl(0, 0%, 25%)
 * Text: hsl(0, 0%, 75%)
 */
function KeywordBadge({ keyword }: KeywordBadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
      style={{
        backgroundColor: "hsl(0, 0%, 25%)",
        color: "hsl(0, 0%, 75%)",
      }}
    >
      {keyword}
    </span>
  );
}

/**
 * Combined regex pattern for keyword extraction
 * Using a single pattern is more efficient than iterating through 12 separate patterns
 * This reduces regex operations from O(12 * text.length) to O(text.length)
 */
const KEYWORD_PATTERN =
  /\b(auth|authentication|login|logout|session|api|endpoint|rest|graphql|ui|ux|design|layout|style|bug|fix|hotfix|patch|feature|enhancement|improvement|test|spec|e2e|unit|config|configuration|setup|init|database|db|migration|schema|security|vulnerability|cve|performance|perf|optimization|speed|refactor|cleanup|technical-debt|docs|documentation|readme)\b/gi;

/**
 * Utility to extract keywords from title/description
 * Looks for common patterns like feature names, bug types, etc.
 *
 * Performance: Uses a single combined regex pattern instead of iterating
 * through multiple patterns. With 50 work items visible, this reduces
 * regex operations significantly.
 */
export function extractKeywords(text: string): string[] {
  const matches = text.match(KEYWORD_PATTERN);
  if (!matches) return [];

  // Deduplicate and normalize to lowercase
  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const match of matches) {
    const normalized = match.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      keywords.push(normalized);
      // Early exit once we have 3 keywords
      if (keywords.length >= 3) break;
    }
  }

  return keywords;
}
