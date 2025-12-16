/**
 * GitLab API Client Service
 *
 * Fetches issues, merge requests, and comments from GitLab API v4
 * Handles pagination, rate limiting, and error conditions
 */

import { z } from "zod";
import { env } from "~/env";
import { logger } from "~/lib/logger";

/**
 * Simple concurrency limiter to prevent API rate limit exhaustion.
 * Limits concurrent promises to avoid overwhelming GitLab API.
 */
function createConcurrencyLimiter(maxConcurrent: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  return async <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      const run = async () => {
        active++;
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          active--;
          if (queue.length > 0) {
            const next = queue.shift();
            next?.();
          }
        }
      };

      if (active < maxConcurrent) {
        void run();
      } else {
        queue.push(run);
      }
    });
  };
}

// Limit concurrent project fetches to prevent rate limit exhaustion
const projectConcurrencyLimit = createConcurrencyLimiter(3);
// Limit concurrent note fetches per batch
const noteConcurrencyLimit = createConcurrencyLimiter(5);

// Zod schemas for GitLab API response validation
const GitLabAuthorSchema = z.object({
  id: z.number(),
  username: z.string(),
  name: z.string().optional(),
  avatar_url: z.string(),
});

const GitLabIssueSchema = z.object({
  id: z.number(),
  iid: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  author: GitLabAuthorSchema,
  assignees: z.array(z.object({ username: z.string() })),
  project_id: z.number(),
  labels: z.array(z.string()),
  state: z.enum(["opened", "closed"]),
  user_notes_count: z.number(),
  web_url: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

const GitLabMergeRequestSchema = z.object({
  id: z.number(),
  iid: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  author: GitLabAuthorSchema,
  assignees: z.array(z.object({ username: z.string() })),
  project_id: z.number(),
  labels: z.array(z.string()),
  state: z.enum(["opened", "closed", "merged"]),
  user_notes_count: z.number(),
  web_url: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

const GitLabNoteSchema = z.object({
  id: z.number(),
  body: z.string(),
  author: GitLabAuthorSchema,
  noteable_id: z.number(),
  noteable_iid: z.number(),
  noteable_type: z.enum(["Issue", "MergeRequest"]),
  system: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

const GitLabCommitSchema = z.object({
  id: z.string(),
  short_id: z.string(),
  title: z.string(),
  message: z.string(),
  author_name: z.string(),
  author_email: z.string(),
  authored_date: z.string(),
  web_url: z.string(),
  stats: z.object({
    additions: z.number(),
    deletions: z.number(),
    total: z.number(),
  }).optional(),
});

const GitLabCommitDiffSchema = z.object({
  old_path: z.string(),
  new_path: z.string(),
  new_file: z.boolean(),
  renamed_file: z.boolean(),
  deleted_file: z.boolean(),
});

// GitLab API response types
export interface GitLabIssue {
  id: number;
  iid: number;
  title: string;
  description: string | null;
  author: {
    id: number;
    username: string;
    name?: string;
    avatar_url: string;
  };
  assignees: Array<{ username: string }>;
  project_id: number;
  labels: string[];
  state: "opened" | "closed";
  user_notes_count: number;
  web_url: string;
  created_at: string;
  updated_at: string;
}

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  description: string | null;
  author: {
    id: number;
    username: string;
    name?: string;
    avatar_url: string;
  };
  assignees: Array<{ username: string }>;
  project_id: number;
  labels: string[];
  state: "opened" | "closed" | "merged";
  user_notes_count: number;
  web_url: string;
  created_at: string;
  updated_at: string;
}

export interface GitLabNote {
  id: number;
  body: string;
  author: {
    id: number;
    username: string;
    name?: string;
    avatar_url: string;
  };
  noteable_id: number;
  noteable_iid: number;
  noteable_type: "Issue" | "MergeRequest";
  system: boolean;
  created_at: string;
  updated_at: string;
}

export interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
}

export interface GitLabCommit {
  id: string;           // Full SHA
  short_id: string;     // Short SHA (8 chars)
  title: string;        // First line of message
  message: string;      // Full commit message
  author_name: string;
  author_email: string;
  authored_date: string;
  web_url: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface GitLabCommitDiff {
  old_path: string;
  new_path: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
}

export interface FetchEventsResult {
  issues: GitLabIssue[];
  mergeRequests: GitLabMergeRequest[];
  notes: Array<GitLabNote & { project_id: number; web_url: string }>;
}

export class GitLabAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isRateLimit: boolean = false
  ) {
    super(message);
    this.name = "GitLabAPIError";
  }
}

/**
 * GitLab API Client
 *
 * Provides methods to fetch events from GitLab API v4
 */
export class GitLabClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly timeout: number = 5000; // 5 second timeout per AC10

  constructor(accessToken: string) {
    this.baseUrl = `${env.GITLAB_INSTANCE_URL}/api/v4`;
    this.accessToken = accessToken;
  }

  /**
   * Fetch all events (issues, MRs, notes) for monitored projects
   *
   * @param projectIds - Array of GitLab project IDs to fetch from
   * @param updatedAfter - Optional ISO date string to fetch only events updated after this time
   * @returns Combined issues, merge requests, and notes
   */
  async fetchEvents(
    projectIds: string[],
    updatedAfter?: string
  ): Promise<FetchEventsResult> {
    const issues: GitLabIssue[] = [];
    const mergeRequests: GitLabMergeRequest[] = [];
    const notes: Array<GitLabNote & { project_id: number; web_url: string }> = [];

    // Fetch events for each project with concurrency limiting
    // Prevents API rate limit exhaustion by limiting concurrent requests
    const projectPromises = projectIds.map((projectId) =>
      projectConcurrencyLimit(async () => {
      // First fetch issues and MRs
      const [projectIssues, projectMRs] = await Promise.all([
        this.fetchIssues(projectId, updatedAfter),
        this.fetchMergeRequests(projectId, updatedAfter),
      ]);

      // Then fetch notes using the already-fetched issues/MRs
      const projectNotes = await this.fetchNotesForItems(
        projectId,
        projectIssues,
        projectMRs
      );

      return {
        issues: projectIssues,
        mergeRequests: projectMRs,
        notes: projectNotes,
      };
    }));

    // Use allSettled to preserve partial results when some projects fail
    const settledResults = await Promise.allSettled(projectPromises);

    // Combine successful results, log failures
    let failedCount = 0;
    settledResults.forEach((result, i) => {
      if (result.status === "fulfilled") {
        issues.push(...result.value.issues);
        mergeRequests.push(...result.value.mergeRequests);
        notes.push(...result.value.notes);
      } else {
        failedCount++;
        logger.error(
          { error: result.reason, projectId: projectIds[i] },
          "GitLabClient: Failed to fetch events for project"
        );
      }
    });

    logger.info(
      { issueCount: issues.length, mrCount: mergeRequests.length, noteCount: notes.length, failedProjects: failedCount },
      "GitLabClient: Fetched events"
    );

    return { issues, mergeRequests, notes };
  }

  /**
   * Fetch issues for a single project
   */
  private async fetchIssues(
    projectId: string,
    updatedAfter?: string
  ): Promise<GitLabIssue[]> {
    const params = new URLSearchParams({
      per_page: "50", // Balanced - not too heavy
      scope: "all",
      order_by: "updated_at",
      sort: "desc",
    });

    if (updatedAfter) {
      params.set("updated_after", updatedAfter);
    }

    const url = `${this.baseUrl}/projects/${encodeURIComponent(projectId)}/issues?${params}`;
    const data = await this.fetchPaginated<GitLabIssue>(url, 2); // 2 pages = up to 100 issues
    return z.array(GitLabIssueSchema).parse(data) as GitLabIssue[];
  }

  /**
   * Fetch merge requests for a single project
   */
  private async fetchMergeRequests(
    projectId: string,
    updatedAfter?: string
  ): Promise<GitLabMergeRequest[]> {
    const params = new URLSearchParams({
      per_page: "50", // Balanced - not too heavy
      scope: "all",
      order_by: "updated_at",
      sort: "desc",
    });

    if (updatedAfter) {
      params.set("updated_after", updatedAfter);
    }

    const url = `${this.baseUrl}/projects/${encodeURIComponent(projectId)}/merge_requests?${params}`;
    const data = await this.fetchPaginated<GitLabMergeRequest>(url, 2); // 2 pages = up to 100 MRs
    return z.array(GitLabMergeRequestSchema).parse(data) as GitLabMergeRequest[];
  }

  /**
   * Fetch notes (comments) for a single project using already-fetched issues/MRs
   * This avoids duplicate API calls since issues/MRs are already fetched in fetchEvents
   */
  private async fetchNotesForItems(
    projectId: string,
    issues: GitLabIssue[],
    mergeRequests: GitLabMergeRequest[]
  ): Promise<Array<GitLabNote & { project_id: number; web_url: string }>> {
    // Fetch notes from issues and MRs separately, then combine
    const [issueNotes, mrNotes] = await Promise.all([
      this.fetchIssueNotesForItems(projectId, issues),
      this.fetchMRNotesForItems(projectId, mergeRequests),
    ]);

    return [...issueNotes, ...mrNotes];
  }

  /**
   * Fetch notes from provided issues (avoids re-fetching issues)
   */
  private async fetchIssueNotesForItems(
    projectId: string,
    issues: GitLabIssue[]
  ): Promise<Array<GitLabNote & { project_id: number; web_url: string }>> {
    // Fetch notes for first 30 issues (most recently updated)
    const limitedIssues = issues.slice(0, 30);

    // Fetch notes for each issue with error handling to preserve partial results
    const notePromises = limitedIssues.map(async (issue) => {
      try {
        const url = `${this.baseUrl}/projects/${encodeURIComponent(projectId)}/issues/${issue.iid}/notes?per_page=20&order_by=created_at&sort=desc`;
        const rawNotes = await this.fetchPaginated<GitLabNote>(url, 1); // 20 most recent notes per issue
        const notes = z.array(GitLabNoteSchema).parse(rawNotes) as GitLabNote[];

        // Attach project_id and construct web_url for each note
        return notes.map((note) => ({
          ...note,
          project_id: issue.project_id,
          web_url: `${issue.web_url}#note_${note.id}`,
          noteable_type: "Issue" as const,
        }));
      } catch (error) {
        logger.warn(
          { error, projectId, issueIid: issue.iid },
          "GitLabClient: Failed to fetch notes for issue"
        );
        return [];
      }
    });

    const allNotes = await Promise.all(notePromises);
    return allNotes.flat() as Array<GitLabNote & { project_id: number; web_url: string }>;
  }

  /**
   * Fetch notes from provided merge requests (avoids re-fetching MRs)
   */
  private async fetchMRNotesForItems(
    projectId: string,
    mergeRequests: GitLabMergeRequest[]
  ): Promise<Array<GitLabNote & { project_id: number; web_url: string }>> {
    // Fetch notes for first 30 MRs (most recently updated)
    const limitedMRs = mergeRequests.slice(0, 30);

    // Fetch notes for each MR with error handling to preserve partial results
    const notePromises = limitedMRs.map(async (mr) => {
      try {
        const url = `${this.baseUrl}/projects/${encodeURIComponent(projectId)}/merge_requests/${mr.iid}/notes?per_page=20&order_by=created_at&sort=desc`;
        const rawNotes = await this.fetchPaginated<GitLabNote>(url, 1); // 20 most recent notes per MR
        const notes = z.array(GitLabNoteSchema).parse(rawNotes) as GitLabNote[];

        // Attach project_id and construct web_url for each note
        return notes.map((note) => ({
          ...note,
          project_id: mr.project_id,
          web_url: `${mr.web_url}#note_${note.id}`,
          noteable_type: "MergeRequest" as const,
        }));
      } catch (error) {
        logger.warn(
          { error, projectId, mrIid: mr.iid },
          "GitLabClient: Failed to fetch notes for MR"
        );
        return [];
      }
    });

    const allNotes = await Promise.all(notePromises);
    return allNotes.flat() as Array<GitLabNote & { project_id: number; web_url: string }>;
  }

  /**
   * Generic paginated fetch with automatic page handling
   * GitLab uses Link header for pagination
   *
   * @param url - The URL to fetch
   * @param maxPages - Maximum number of pages to fetch (default: unlimited)
   */
  private async fetchPaginated<T>(url: string, maxPages?: number): Promise<T[]> {
    const results: T[] = [];
    let nextUrl: string | null = url;
    let pageCount = 0;

    while (nextUrl && (!maxPages || pageCount < maxPages)) {
      const response = await this.fetchWithRetry(nextUrl);

      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }

      const data = (await response.json()) as unknown;
      // Validate response is an array before pushing
      if (!Array.isArray(data)) {
        throw new GitLabAPIError("Invalid API response: expected array", 500);
      }
      results.push(...(data as T[]));
      pageCount++;

      // Check for next page in Link header
      nextUrl = this.getNextPageUrl(response.headers.get("Link"));

      // Stop if we've hit the max pages limit
      if (maxPages && pageCount >= maxPages) {
        logger.debug({ maxPages, url }, "GitLabClient: Reached max pages limit");
        break;
      }
    }

    return results;
  }

  /**
   * Fetch with exponential backoff retry on transient errors
   * Handles 5xx errors, network errors, and 429 rate limits
   */
  private async fetchWithRetry(
    url: string,
    retries = 2
  ): Promise<Response> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(this.timeout),
        });

        // Retry on 5xx errors
        if (response.status >= 500 && attempt < retries) {
          const backoff = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        // Story 6.3: Handle 429 rate limit with Retry-After header
        if (response.status === 429 && attempt < retries) {
          const retryAfter = this.parseRetryAfter(response.headers.get("Retry-After"));
          const backoff = retryAfter ?? Math.pow(2, attempt) * 1000;
          logger.warn({ attempt, backoffMs: backoff, url }, "GitLabClient: Rate limited, retrying");
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        return response;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new GitLabAPIError("Request timeout", 408);
        }

        // Retry on network errors
        if (attempt < retries) {
          const backoff = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        throw error;
      }
    }

    // Should never reach here
    throw new Error("Unexpected error in fetchWithRetry");
  }

  /**
   * Parse Retry-After header from GitLab 429 response
   * Can be seconds (integer) or HTTP-date format
   * Returns milliseconds to wait, or null if header missing/invalid
   */
  private parseRetryAfter(retryAfter: string | null): number | null {
    if (!retryAfter) return null;

    // Minimum backoff to avoid tight retry loops when Retry-After is 0
    const MIN_BACKOFF_MS = 100;

    // Try parsing as integer (seconds)
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds) && seconds >= 0) {
      // If server says retry immediately (0), use minimum backoff
      return Math.max(seconds * 1000, MIN_BACKOFF_MS);
    }

    // Try parsing as HTTP-date
    const date = Date.parse(retryAfter);
    if (!isNaN(date)) {
      const waitMs = date - Date.now();
      return waitMs > 0 ? waitMs : MIN_BACKOFF_MS;
    }

    return null;
  }

  /**
   * Handle GitLab API error responses
   */
  private async handleErrorResponse(response: Response): Promise<GitLabAPIError> {
    const isRateLimit = response.status === 429;

    let message = `GitLab API error: ${response.status} ${response.statusText}`;

    try {
      const errorBody = await response.json();
      if (errorBody && typeof errorBody === "object" && "message" in errorBody) {
        message = String(errorBody.message);
      }
    } catch {
      // Ignore JSON parse errors
    }

    return new GitLabAPIError(message, response.status, isRateLimit);
  }

  /**
   * Parse GitLab Link header to get next page URL
   * Example: <https://gitlab.com/api/v4/projects/123/issues?page=2>; rel="next"
   */
  private getNextPageUrl(linkHeader: string | null): string | null {
    if (!linkHeader) return null;

    const links = linkHeader.split(",");
    for (const link of links) {
      const [urlPart, relPart] = link.split(";");
      if (relPart?.includes('rel="next"')) {
        const match = urlPart?.match(/<(.+)>/);
        return match?.[1] ?? null;
      }
    }

    return null;
  }

  /**
   * Fetch commits for a project
   *
   * @param projectId - GitLab project ID
   * @param options - Optional filters for commits
   * @returns Array of commits with stats
   */
  async fetchCommits(
    projectId: string,
    options?: {
      since?: string;      // ISO date - only commits after this date
      until?: string;      // ISO date - only commits before this date
      refName?: string;    // Branch name (default: default branch)
      perPage?: number;    // Results per page (default: 100)
      maxPages?: number;   // Max pages to fetch (default: 2 = 200 commits)
    }
  ): Promise<GitLabCommit[]> {
    const params = new URLSearchParams({
      per_page: String(options?.perPage ?? 100),
      with_stats: "true",  // Include additions/deletions stats
    });

    if (options?.since) {
      params.set("since", options.since);
    }
    if (options?.until) {
      params.set("until", options.until);
    }
    if (options?.refName) {
      params.set("ref_name", options.refName);
    }

    const url = `${this.baseUrl}/projects/${encodeURIComponent(projectId)}/repository/commits?${params}`;
    const maxPages = options?.maxPages ?? 2; // Default: 200 commits max

    logger.debug({ projectId, maxPages }, "GitLabClient: Fetching commits");

    const rawCommits = await this.fetchPaginated<GitLabCommit>(url, maxPages);
    const commits = z.array(GitLabCommitSchema).parse(rawCommits) as GitLabCommit[];

    logger.info(
      { projectId, commitCount: commits.length },
      "GitLabClient: Fetched commits"
    );

    return commits;
  }

  /**
   * Fetch the diff (files changed) for a specific commit
   *
   * @param projectId - GitLab project ID
   * @param sha - Commit SHA
   * @returns Array of file diffs showing what changed
   */
  async fetchCommitDiff(
    projectId: string,
    sha: string
  ): Promise<GitLabCommitDiff[]> {
    const url = `${this.baseUrl}/projects/${encodeURIComponent(projectId)}/repository/commits/${sha}/diff`;

    logger.debug({ projectId, sha: sha.substring(0, 8) }, "GitLabClient: Fetching commit diff");

    const response = await this.fetchWithRetry(url);

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    const rawDiffs = (await response.json()) as unknown;
    const diffs = z.array(GitLabCommitDiffSchema).parse(rawDiffs) as GitLabCommitDiff[];

    logger.debug(
      { projectId, sha: sha.substring(0, 8), fileCount: diffs.length },
      "GitLabClient: Fetched commit diff"
    );

    return diffs;
  }

  /**
   * Fetch commits with their diffs for a project
   * Combines fetchCommits and fetchCommitDiff for convenience
   * Uses concurrency limiting to avoid rate limits
   *
   * @param projectId - GitLab project ID
   * @param options - Optional filters
   * @returns Commits with their file diffs attached
   */
  async fetchCommitsWithDiffs(
    projectId: string,
    options?: {
      since?: string;
      until?: string;
      refName?: string;
      maxCommits?: number;  // Limit how many commits to fetch diffs for
    }
  ): Promise<Array<GitLabCommit & { diffs: GitLabCommitDiff[] }>> {
    const commits = await this.fetchCommits(projectId, {
      since: options?.since,
      until: options?.until,
      refName: options?.refName,
      maxPages: 2,
    });

    // Limit commits to fetch diffs for (diffs are expensive)
    const commitsToProcess = commits.slice(0, options?.maxCommits ?? 50);

    // Fetch diffs with concurrency limiting
    const commitsWithDiffs = await Promise.all(
      commitsToProcess.map((commit) =>
        noteConcurrencyLimit(async () => {
          try {
            const diffs = await this.fetchCommitDiff(projectId, commit.id);
            return { ...commit, diffs };
          } catch (error) {
            logger.warn(
              { error, sha: commit.short_id },
              "GitLabClient: Failed to fetch diff for commit"
            );
            return { ...commit, diffs: [] };
          }
        })
      )
    );

    logger.info(
      { projectId, commitCount: commitsWithDiffs.length },
      "GitLabClient: Fetched commits with diffs"
    );

    return commitsWithDiffs;
  }
}
