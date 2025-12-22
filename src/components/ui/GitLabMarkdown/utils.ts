/**
 * Extracts the project path from a GitLab URL.
 *
 * @example
 * extractProjectPath('https://gitlab.com/group/project/-/issues/123')
 * // Returns: 'group/project'
 *
 * extractProjectPath('https://gitlab.com/group/sub/project/-/merge_requests/456')
 * // Returns: 'group/sub/project'
 *
 * extractProjectPath('https://gitlab.com/user/repo/-/commits/abc123')
 * // Returns: 'user/repo'
 */
export function extractProjectPath(gitlabUrl: string): string | null {
  if (!gitlabUrl) return null;

  try {
    const url = new URL(gitlabUrl);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Find the index of '-' which separates project path from resource
    // GitLab URLs: /group/project/-/issues/123
    const separatorIndex = pathParts.indexOf('-');

    if (separatorIndex > 0) {
      // Everything before '/-/' is the project path
      return pathParts.slice(0, separatorIndex).join('/');
    }

    // Fallback: If no '/-/' found, try to extract from common patterns
    // e.g., /group/project (direct project URL)
    if (pathParts.length >= 2) {
      // Heuristic: take first N parts that look like a path
      // Stop at known GitLab resource keywords
      const stopWords = [
        'issues',
        'merge_requests',
        'commits',
        'pipelines',
        'blob',
        'tree',
        'raw',
      ];
      const projectParts: string[] = [];

      for (const part of pathParts) {
        if (stopWords.includes(part)) break;
        projectParts.push(part);
      }

      return projectParts.length >= 2 ? projectParts.join('/') : null;
    }

    return null;
  } catch {
    // Invalid URL
    return null;
  }
}

/**
 * Extracts the GitLab instance URL from a full GitLab URL.
 *
 * @example
 * extractInstanceUrl('https://gitlab.company.com/group/project/-/issues/123')
 * // Returns: 'https://gitlab.company.com'
 */
export function extractInstanceUrl(gitlabUrl: string): string | null {
  if (!gitlabUrl) return null;

  try {
    const url = new URL(gitlabUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}
