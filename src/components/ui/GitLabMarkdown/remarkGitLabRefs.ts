import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Text, Link, PhrasingContent } from 'mdast';
import type { Parent } from 'unist';
import type { RemarkGitLabRefsOptions, GitLabRefMatch } from './types';

/**
 * Remark plugin that transforms GitLab reference patterns into clickable links.
 *
 * Supported patterns:
 * - #123 - Local issue reference
 * - !456 - Local merge request reference
 * - @username - User mention
 * - group/project#123 - Cross-project issue
 * - group/project!456 - Cross-project MR
 */
export const remarkGitLabRefs: Plugin<[RemarkGitLabRefsOptions]> = (
  options
) => {
  const { gitlabInstanceUrl, projectPath } = options;

  // Normalize URL (remove trailing slash)
  const baseUrl = gitlabInstanceUrl.replace(/\/$/, '');

  return (tree) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;

      // Skip if we're inside a link already
      if (isInsideLink(parent)) return;

      const value = node.value;
      const replacements = processText(value, baseUrl, projectPath ?? null);

      if (replacements.length > 1 || replacements[0]?.type === 'link') {
        // Replace the text node with our new nodes
        (parent as Parent).children.splice(
          index,
          1,
          ...(replacements as PhrasingContent[])
        );
        return index + replacements.length;
      }
    });
  };
};

/**
 * Check if the parent node is a link (to avoid double-linking)
 */
function isInsideLink(parent: Parent): boolean {
  return parent.type === 'link';
}

/**
 * Process text and return array of text and link nodes
 */
function processText(
  value: string,
  baseUrl: string,
  projectPath: string | null
): Array<Text | Link> {
  // Collect ALL matches with their positions
  const allMatches: GitLabRefMatch[] = [
    ...findCrossProjectRefs(value, baseUrl),
    ...findLocalRefs(value, baseUrl, projectPath),
    ...findUserMentions(value, baseUrl),
  ].sort((a, b) => a.index - b.index);

  // Remove overlapping matches (keep first)
  const filtered = removeOverlaps(allMatches);

  if (filtered.length === 0) {
    return [{ type: 'text', value }];
  }

  // Build replacement nodes
  const result: Array<Text | Link> = [];
  let lastIndex = 0;

  for (const match of filtered) {
    // Add text before this match
    if (match.index > lastIndex) {
      result.push({ type: 'text', value: value.slice(lastIndex, match.index) });
    }

    // Add the link
    result.push({
      type: 'link',
      url: match.url,
      children: [{ type: 'text', value: match.text }],
    });

    lastIndex = match.index + match.length;
  }

  // Add remaining text after last match
  if (lastIndex < value.length) {
    result.push({ type: 'text', value: value.slice(lastIndex) });
  }

  return result;
}

/**
 * Find cross-project references like group/project#123 or group/sub/project!456
 */
function findCrossProjectRefs(
  value: string,
  baseUrl: string
): GitLabRefMatch[] {
  const matches: GitLabRefMatch[] = [];
  // Match: group/project#123 or group/sub/project!456
  const regex = /((?:[\w.-]+\/)+[\w.-]+)([#!])(\d+)/g;

  for (const match of value.matchAll(regex)) {
    const [fullMatch, project, refType, number] = match;
    const resourceType = refType === '#' ? 'issues' : 'merge_requests';

    matches.push({
      index: match.index,
      length: fullMatch.length,
      url: `${baseUrl}/${project}/-/${resourceType}/${number}`,
      text: fullMatch,
      type: refType === '#' ? 'issue' : 'merge_request',
    });
  }

  return matches;
}

/**
 * Find local references like #123 or !456
 * Only works if projectPath is provided
 */
function findLocalRefs(
  value: string,
  baseUrl: string,
  projectPath: string | null
): GitLabRefMatch[] {
  if (!projectPath) return [];

  const matches: GitLabRefMatch[] = [];
  // Match #123 or !456 that are NOT preceded by word char, /, #, or !
  // and NOT followed by word chars (to avoid #fff color codes)
  const regex = /(?:^|[^\w\/#!])([#!])(\d+)(?!\w)/g;

  for (const match of value.matchAll(regex)) {
    const [fullMatch, refType, number] = match;
    // Skip if capture groups are missing (shouldn't happen with valid regex)
    if (!refType || !number) continue;

    const resourceType = refType === '#' ? 'issues' : 'merge_requests';

    // Adjust index to account for the non-capturing prefix
    const prefixLength = fullMatch.length - refType.length - number.length;
    const actualIndex = match.index + prefixLength;

    matches.push({
      index: actualIndex,
      length: refType.length + number.length,
      url: `${baseUrl}/${projectPath}/-/${resourceType}/${number}`,
      text: `${refType}${number}`,
      type: refType === '#' ? 'issue' : 'merge_request',
    });
  }

  return matches;
}

/**
 * Find user mentions like @username
 */
function findUserMentions(value: string, baseUrl: string): GitLabRefMatch[] {
  const matches: GitLabRefMatch[] = [];
  // Match @username that is NOT part of an email and NOT followed by @
  const regex = /(?:^|[^\w\/@])@([\w.-]+)(?![\w.-]*@)/g;

  for (const match of value.matchAll(regex)) {
    const [fullMatch, username] = match;
    // Skip if capture group is missing (shouldn't happen with valid regex)
    if (!username) continue;

    // Adjust index to account for the non-capturing prefix
    const prefixLength = fullMatch.length - username.length - 1; // -1 for @
    const actualIndex = match.index + prefixLength;

    matches.push({
      index: actualIndex,
      length: username.length + 1, // +1 for @
      url: `${baseUrl}/${username}`,
      text: `@${username}`,
      type: 'user',
    });
  }

  return matches;
}

/**
 * Remove overlapping matches, keeping the first one
 */
function removeOverlaps(matches: GitLabRefMatch[]): GitLabRefMatch[] {
  if (matches.length <= 1) return matches;

  const result: GitLabRefMatch[] = [];
  let lastEnd = 0;

  for (const match of matches) {
    if (match.index >= lastEnd) {
      result.push(match);
      lastEnd = match.index + match.length;
    }
  }

  return result;
}
