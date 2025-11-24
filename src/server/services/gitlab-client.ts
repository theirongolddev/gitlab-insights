/**
 * GitLab API Client Service
 *
 * Fetches issues, merge requests, and comments from GitLab API v4
 * Handles pagination, rate limiting, and error conditions
 */

import { env } from "~/env";

// GitLab API response types
export interface GitLabIssue {
  id: number;
  iid: number;
  title: string;
  description: string | null;
  author: {
    username: string;
    avatar_url: string;
  };
  project_id: number;
  labels: string[];
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
    username: string;
    avatar_url: string;
  };
  project_id: number;
  labels: string[];
  web_url: string;
  created_at: string;
  updated_at: string;
}

export interface GitLabNote {
  id: number;
  body: string;
  author: {
    username: string;
    avatar_url: string;
  };
  noteable_id: number;
  noteable_type: "Issue" | "MergeRequest";
  created_at: string;
  updated_at: string;
}

export interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
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

    // Fetch events for each project in parallel
    // Notes re-enabled with strict limits (10 notes per issue/MR, max 20 issues/MRs)
    const projectPromises = projectIds.map(async (projectId) => {
      const [projectIssues, projectMRs, projectNotes] = await Promise.all([
        this.fetchIssues(projectId, updatedAfter),
        this.fetchMergeRequests(projectId, updatedAfter),
        this.fetchNotes(projectId, updatedAfter),
      ]);

      return {
        issues: projectIssues,
        mergeRequests: projectMRs,
        notes: projectNotes,
      };
    });

    const results = await Promise.all(projectPromises);

    // Combine results from all projects
    for (const result of results) {
      issues.push(...result.issues);
      mergeRequests.push(...result.mergeRequests);
      notes.push(...result.notes);
    }

    console.log(`[GitLabClient] Fetched ${issues.length} issues, ${mergeRequests.length} MRs, ${notes.length} comments`);

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
    return this.fetchPaginated<GitLabIssue>(url, 2); // 2 pages = up to 100 issues
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
    return this.fetchPaginated<GitLabMergeRequest>(url, 2); // 2 pages = up to 100 MRs
  }

  /**
   * Fetch notes (comments) for a single project
   * Notes on both issues and merge requests
   */
  private async fetchNotes(
    projectId: string,
    updatedAfter?: string
  ): Promise<Array<GitLabNote & { project_id: number; web_url: string }>> {
    // Fetch notes from issues and MRs separately, then combine
    const [issueNotes, mrNotes] = await Promise.all([
      this.fetchIssueNotes(projectId, updatedAfter),
      this.fetchMRNotes(projectId, updatedAfter),
    ]);

    return [...issueNotes, ...mrNotes];
  }

  /**
   * Fetch notes from all issues in a project
   */
  private async fetchIssueNotes(
    projectId: string,
    updatedAfter?: string
  ): Promise<Array<GitLabNote & { project_id: number; web_url: string }>> {
    // First fetch issues to get their IIDs
    // Issues are already sorted by updated_at desc, so recent comments bump issues up
    const issues = await this.fetchIssues(projectId, updatedAfter);

    // Fetch notes for first 30 issues (increased to catch more recent activity)
    const limitedIssues = issues.slice(0, 30);

    // Then fetch notes for each issue
    const notePromises = limitedIssues.map(async (issue) => {
      const url = `${this.baseUrl}/projects/${encodeURIComponent(projectId)}/issues/${issue.iid}/notes?per_page=20&order_by=created_at&sort=desc`;
      const notes = await this.fetchPaginated<GitLabNote>(url, 1); // 20 most recent notes per issue

      // Attach project_id and construct web_url for each note
      return notes.map((note) => ({
        ...note,
        project_id: issue.project_id,
        web_url: `${issue.web_url}#note_${note.id}`,
        noteable_type: "Issue" as const,
      }));
    });

    const allNotes = await Promise.all(notePromises);
    return allNotes.flat();
  }

  /**
   * Fetch notes from all merge requests in a project
   */
  private async fetchMRNotes(
    projectId: string,
    updatedAfter?: string
  ): Promise<Array<GitLabNote & { project_id: number; web_url: string }>> {
    // First fetch MRs to get their IIDs
    // MRs are already sorted by updated_at desc, so recent comments bump MRs up
    const mrs = await this.fetchMergeRequests(projectId, updatedAfter);

    // Fetch notes for first 30 MRs (increased to catch more recent activity)
    const limitedMRs = mrs.slice(0, 30);

    // Then fetch notes for each MR
    const notePromises = limitedMRs.map(async (mr) => {
      const url = `${this.baseUrl}/projects/${encodeURIComponent(projectId)}/merge_requests/${mr.iid}/notes?per_page=20&order_by=created_at&sort=desc`;
      const notes = await this.fetchPaginated<GitLabNote>(url, 1); // 20 most recent notes per MR

      // Attach project_id and construct web_url for each note
      return notes.map((note) => ({
        ...note,
        project_id: mr.project_id,
        web_url: `${mr.web_url}#note_${note.id}`,
        noteable_type: "MergeRequest" as const,
      }));
    });

    const allNotes = await Promise.all(notePromises);
    return allNotes.flat();
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

      const data = (await response.json()) as T[];
      results.push(...data);
      pageCount++;

      // Check for next page in Link header
      nextUrl = this.getNextPageUrl(response.headers.get("Link"));

      // Stop if we've hit the max pages limit
      if (maxPages && pageCount >= maxPages) {
        console.log(`[GitLabClient] Reached max pages limit (${maxPages}) for ${url}`);
        break;
      }
    }

    return results;
  }

  /**
   * Fetch with exponential backoff retry on transient errors
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
}
