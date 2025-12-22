'use client';

import { useMemo, type ReactElement } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'dompurify';
import { remarkGitLabRefs } from './remarkGitLabRefs';
import type { GitLabMarkdownProps } from './types';
import type { Components } from 'react-markdown';

/**
 * Safe HTML tags allowed in GitLab Flavored Markdown
 * These are commonly used in GitLab issues/MRs and are safe to render
 */
const ALLOWED_HTML_TAGS = [
  // Collapsible sections (GitLab-specific)
  'details',
  'summary',
  // Keyboard shortcuts
  'kbd',
  // Text formatting
  'sub',
  'sup',
  'mark',
  'abbr',
  'ins',
  'del',
  // Structural (for nested markdown)
  'div',
  'span',
  'br',
  'hr',
  // Media (with sanitized attributes)
  'img',
  'video',
  'source',
  // Headings (in case they're in HTML)
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  // Lists
  'ul',
  'ol',
  'li',
  // Text containers
  'p',
  'blockquote',
  'pre',
  'code',
  // Tables
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  // Links (sanitized)
  'a',
];

const ALLOWED_HTML_ATTRS = [
  'href',
  'src',
  'alt',
  'title',
  'class',
  'id',
  'open', // for <details open>
  'colspan',
  'rowspan',
  'align',
];

/**
 * GitLabMarkdown component renders markdown content with GitLab reference support.
 *
 * Features:
 * - GFM support (tables, task lists, strikethrough)
 * - GitLab refs transformed to clickable links (#123, !456, @username)
 * - HTML tags support (details/summary, kbd, etc.)
 * - Syntax highlighting for code blocks
 * - XSS protection via DOMPurify
 */
export function GitLabMarkdown({
  content,
  gitlabInstanceUrl,
  projectPath,
  projectId,
  className = '',
  enableSyntaxHighlight = true,
}: GitLabMarkdownProps): ReactElement | null {
  // Memoize sanitized content to avoid re-sanitizing on every render
  // Allow safe HTML tags used in GitLab Flavored Markdown (details, summary, kbd, etc.)
  // NOTE: All hooks must be called unconditionally before any returns (Rules of Hooks)
  const sanitizedContent = useMemo(() => {
    if (!content?.trim()) return '';
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ALLOWED_HTML_TAGS,
      ALLOWED_ATTR: ALLOWED_HTML_ATTRS,
      // Disallow data-* attributes (not needed, reduces attack surface)
      ALLOW_DATA_ATTR: false,
    });
  }, [content]);

  // Memoize plugin configuration
  const remarkPluginsConfig = useMemo(
    () => ({
      gitlabInstanceUrl,
      projectPath: projectPath ?? null,
    }),
    [gitlabInstanceUrl, projectPath]
  );

  // Memoize rehype plugins array
  // rehype-raw must come before rehype-highlight to process HTML first
  const rehypePlugins = useMemo(
    () => {
      const plugins: Array<typeof rehypeRaw | typeof rehypeHighlight> = [rehypeRaw];
      if (enableSyntaxHighlight) {
        plugins.push(rehypeHighlight);
      }
      return plugins;
    },
    [enableSyntaxHighlight]
  );

  // Custom components for rendering
  const components: Components = useMemo(
    () => ({
      // Smart link behavior - external links open in new tab
      a: ({ href, children, ...props }) => {
        if (!href) {
          return <span {...props}>{children}</span>;
        }

        // Determine if link is external
        const isExternal =
          href.startsWith('http://') || href.startsWith('https://');
        
        // Check if link is to our GitLab instance (compare hostnames, not substrings)
        const isGitLabLink = (() => {
          if (!isExternal) return false;
          try {
            const linkUrl = new URL(href);
            const gitlabUrl = new URL(gitlabInstanceUrl);
            return linkUrl.host === gitlabUrl.host;
          } catch {
            return false;
          }
        })();

        // External links open in new tab
        if (isExternal) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={
                isGitLabLink
                  ? 'text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline'
                  : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline'
              }
              {...props}
            >
              {children}
            </a>
          );
        }

        // Internal/relative links - no new tab
        return (
          <a href={href} className="text-primary-600 hover:underline" {...props}>
            {children}
          </a>
        );
      },

      // Inline vs block code styling
      code: ({ className: codeClassName, children, ...props }) => {
        const isInline = !codeClassName;
        if (isInline) {
          return (
            <code
              className="bg-default-100 dark:bg-default-800 px-1.5 py-0.5 rounded text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        }
        return (
          <code className={codeClassName} {...props}>
            {children}
          </code>
        );
      },

      // Responsive tables
      table: ({ children, ...props }) => (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full" {...props}>
            {children}
          </table>
        </div>
      ),

      // Pre blocks for code
      pre: ({ children, ...props }) => (
        <pre className="rounded-lg overflow-x-auto my-4 p-4 bg-default-100 dark:bg-default-800" {...props}>
          {children}
        </pre>
      ),

      // Collapsible details/summary (GitLab-specific)
      details: ({ children, ...props }) => (
        <details
          className="my-3 rounded-lg border border-default-200 dark:border-default-700 overflow-hidden"
          {...props}
        >
          {children}
        </details>
      ),

      // Collapsible summary with theme-appropriate colors
      summary: ({ children, ...props }) => (
        <summary
          className="cursor-pointer px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-medium select-none list-none [&::-webkit-details-marker]:hidden text-gray-900 dark:text-gray-50"
          {...props}
        >
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {children}
          </span>
        </summary>
      ),

      // Keyboard shortcut styling
      kbd: ({ children, ...props }) => (
        <kbd
          className="px-1.5 py-0.5 text-xs font-mono bg-default-100 dark:bg-default-800 border border-default-300 dark:border-default-600 rounded shadow-sm"
          {...props}
        >
          {children}
        </kbd>
      ),

      // Image component - resolve relative URLs to full GitLab URLs
      img: ({ src, alt, ...props }) => {
        // Resolve relative URLs to full GitLab URLs
        let resolvedSrc = src;
        if (typeof src === 'string' && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:')) {
          const baseUrl = gitlabInstanceUrl.replace(/\/$/, '');
          // Check for uploads path (with or without leading slash)
          const isUploadPath = src.startsWith('/uploads/') || src.startsWith('uploads/');
          if (isUploadPath && projectId) {
            // GitLab uploads: {instance}/-/project/{id}/uploads/...
            const uploadPath = src.startsWith('/') ? src : `/${src}`;
            resolvedSrc = `${baseUrl}/-/project/${projectId}${uploadPath}`;
          } else if (src.startsWith('/')) {
            resolvedSrc = `${baseUrl}${src}`;
          } else {
            resolvedSrc = `${baseUrl}/${src}`;
          }
        }

        return (
          <img
            src={resolvedSrc}
            alt={alt ?? ''}
            className="max-w-full h-auto rounded"
            loading="lazy"
            {...props}
          />
        );
      },
    }),
    [gitlabInstanceUrl, projectId]
  );

  // Handle empty/null content gracefully - return null AFTER all hooks
  if (!sanitizedContent) {
    return null;
  }

  return (
    <div
      className={`gitlab-markdown prose prose-sm max-w-none dark:prose-invert ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkGitLabRefs, remarkPluginsConfig]]}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
