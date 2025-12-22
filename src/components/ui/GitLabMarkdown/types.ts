/**
 * Props for the GitLabMarkdown component
 */
export interface GitLabMarkdownProps {
  /** Raw markdown content to render */
  content: string;
  /** GitLab instance URL (e.g., 'https://gitlab.com') */
  gitlabInstanceUrl: string;
  /** Project path for resolving relative refs like #123 (e.g., 'group/project') */
  projectPath?: string;
  /** Project ID for resolving image uploads (e.g., 595) */
  projectId?: number;
  /** Optional className for styling the container */
  className?: string;
  /** Whether to enable syntax highlighting for code blocks (default: true) */
  enableSyntaxHighlight?: boolean;
}

/**
 * Context passed to the remark plugin for GitLab reference resolution
 */
export interface GitLabRefContext {
  gitlabInstanceUrl: string;
  projectPath: string | null;
}

/**
 * Represents a matched GitLab reference in text
 */
export interface GitLabRefMatch {
  /** Start index in the original string */
  index: number;
  /** Length of the matched text */
  length: number;
  /** Generated URL for the reference */
  url: string;
  /** Display text for the link */
  text: string;
  /** Type of reference */
  type: 'issue' | 'merge_request' | 'user';
}

/**
 * Options for the remarkGitLabRefs plugin
 */
export interface RemarkGitLabRefsOptions {
  gitlabInstanceUrl: string;
  projectPath?: string | null;
}
