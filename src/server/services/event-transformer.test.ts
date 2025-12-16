/**
 * Event Transformer Tests
 * 
 * Task 1.5: Validate relationship accuracy in event transformation
 * Tests extraction of:
 * - Parent/child relationships (comments → issues/MRs)
 * - "Closes #N" patterns in MR descriptions
 * - Cross-references (#123, !456) in text
 */

import { describe, it, expect } from "vitest";
import {
  extractMentionedIds,
  parseClosesIssueIds,
  transformIssues,
  transformMergeRequests,
  transformNotes,
} from "./event-transformer";
import type { GitLabIssue, GitLabMergeRequest, GitLabNote } from "./gitlab-client";

describe("extractMentionedIds", () => {
  it("extracts issue references (#123)", () => {
    const text = "This relates to #123 and #456";
    expect(extractMentionedIds(text)).toEqual([123, 456]);
  });

  it("extracts MR references (!123)", () => {
    const text = "See !100 for implementation";
    expect(extractMentionedIds(text)).toEqual([100]);
  });

  it("extracts mixed issue and MR references", () => {
    const text = "Related to #10, !20, and #30";
    expect(extractMentionedIds(text)).toEqual([10, 20, 30]);
  });

  it("returns empty array for null input", () => {
    expect(extractMentionedIds(null)).toEqual([]);
  });

  it("returns empty array for text without references", () => {
    expect(extractMentionedIds("No references here")).toEqual([]);
  });

  it("deduplicates repeated references", () => {
    const text = "See #123, then #123 again, and #123";
    expect(extractMentionedIds(text)).toEqual([123]);
  });

  it("handles references at start and end of text", () => {
    const text = "#1 at start and at end #99";
    expect(extractMentionedIds(text)).toEqual([1, 99]);
  });

  it("handles references in markdown links", () => {
    const text = "Check out [issue #42](url) for details";
    expect(extractMentionedIds(text)).toEqual([42]);
  });

  it("ignores non-numeric patterns", () => {
    const text = "#abc and !def are not valid";
    expect(extractMentionedIds(text)).toEqual([]);
  });
});

describe("parseClosesIssueIds", () => {
  describe("closes keyword variations", () => {
    it("parses 'closes #N'", () => {
      expect(parseClosesIssueIds("closes #123")).toEqual([123]);
    });

    it("parses 'close #N'", () => {
      expect(parseClosesIssueIds("close #456")).toEqual([456]);
    });

    it("parses 'closed #N'", () => {
      expect(parseClosesIssueIds("closed #789")).toEqual([789]);
    });
  });

  describe("fixes keyword variations", () => {
    it("parses 'fixes #N'", () => {
      expect(parseClosesIssueIds("fixes #100")).toEqual([100]);
    });

    it("parses 'fix #N'", () => {
      expect(parseClosesIssueIds("fix #200")).toEqual([200]);
    });

    it("parses 'fixed #N'", () => {
      expect(parseClosesIssueIds("fixed #300")).toEqual([300]);
    });
  });

  describe("resolves keyword variations", () => {
    it("parses 'resolves #N'", () => {
      expect(parseClosesIssueIds("resolves #111")).toEqual([111]);
    });

    it("parses 'resolve #N'", () => {
      expect(parseClosesIssueIds("resolve #222")).toEqual([222]);
    });

    it("parses 'resolved #N'", () => {
      expect(parseClosesIssueIds("resolved #333")).toEqual([333]);
    });
  });

  describe("case insensitivity", () => {
    it("parses uppercase 'CLOSES #N'", () => {
      expect(parseClosesIssueIds("CLOSES #42")).toEqual([42]);
    });

    it("parses mixed case 'Fixes #N'", () => {
      expect(parseClosesIssueIds("Fixes #99")).toEqual([99]);
    });
  });

  describe("edge cases", () => {
    it("returns empty array for null input", () => {
      expect(parseClosesIssueIds(null)).toEqual([]);
    });

    it("returns empty array for text without closing references", () => {
      expect(parseClosesIssueIds("This mentions #123 but doesnt close it")).toEqual([]);
    });

    it("extracts multiple closing references", () => {
      const text = "closes #1, fixes #2, and resolves #3";
      expect(parseClosesIssueIds(text)).toEqual([1, 2, 3]);
    });

    it("deduplicates repeated closing references", () => {
      const text = "closes #5 and also closes #5";
      expect(parseClosesIssueIds(text)).toEqual([5]);
    });

    it("handles closing references in MR description format", () => {
      const description = `
## Summary
This MR implements the new feature.

## Related Issues
Closes #100
Fixes #200

## Testing
Tested manually.
      `;
      expect(parseClosesIssueIds(description)).toEqual([100, 200]);
    });
  });
});

describe("transformNotes", () => {
  const mockProjectMap = new Map([
    [1, { name: "Test Project", path: "test-project" }],
  ]);

  const createMockNote = (
    overrides: Partial<GitLabNote & { project_id: number; web_url: string }> = {}
  ): GitLabNote & { project_id: number; web_url: string } => ({
    id: 1,
    body: "Test comment",
    author: { id: 1, username: "testuser", avatar_url: "https://avatar.url" },
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    noteable_type: "Issue",
    noteable_id: 100,
    noteable_iid: 10,
    system: false,
    project_id: 1,
    web_url: "https://gitlab.com/project/issues/10#note_1",
    ...overrides,
  });

  describe("parent relationship linking", () => {
    it("links note to parent issue", () => {
      const note = createMockNote({
        noteable_type: "Issue",
        noteable_id: 42,
      });
      const [transformed] = transformNotes([note], mockProjectMap);

      expect(transformed?.parentType).toBe("issue");
      expect(transformed?.parentEventId).toBe("issue-42");
      expect(transformed?.gitlabParentId).toBe(42);
    });

    it("links note to parent merge request", () => {
      const note = createMockNote({
        noteable_type: "MergeRequest",
        noteable_id: 99,
      });
      const [transformed] = transformNotes([note], mockProjectMap);

      expect(transformed?.parentType).toBe("merge_request");
      expect(transformed?.parentEventId).toBe("mr-99");
      expect(transformed?.gitlabParentId).toBe(99);
    });
  });

  describe("cross-reference extraction", () => {
    it("extracts mentioned IDs from note body", () => {
      const note = createMockNote({
        body: "This relates to #10 and !20",
      });
      const [transformed] = transformNotes([note], mockProjectMap);

      expect(transformed?.mentionedInIds).toEqual([10, 20]);
    });
  });

  describe("system note handling", () => {
    it("marks system notes correctly", () => {
      const systemNote = createMockNote({ system: true });
      const userNote = createMockNote({ system: false });

      const [transformedSystem] = transformNotes([systemNote], mockProjectMap);
      const [transformedUser] = transformNotes([userNote], mockProjectMap);

      expect(transformedSystem?.isSystemNote).toBe(true);
      expect(transformedUser?.isSystemNote).toBe(false);
    });
  });

  describe("metadata transformation", () => {
    it("sets type to comment", () => {
      const note = createMockNote();
      const [transformed] = transformNotes([note], mockProjectMap);

      expect(transformed?.type).toBe("comment");
    });

    it("creates title from first line of body", () => {
      const note = createMockNote({
        body: "First line summary\n\nMore details here",
      });
      const [transformed] = transformNotes([note], mockProjectMap);

      expect(transformed?.title).toBe("Comment: First line summary");
    });

    it("truncates long titles", () => {
      const longFirstLine = "A".repeat(150);
      const note = createMockNote({ body: longFirstLine });
      const [transformed] = transformNotes([note], mockProjectMap);

      expect(transformed?.title.length).toBeLessThanOrEqual(111); // "Comment: " + 100 chars + "..."
      expect(transformed?.title.endsWith("...")).toBe(true);
    });
  });
});

describe("transformIssues", () => {
  const mockProjectMap = new Map([
    [1, { name: "Test Project", path: "test-project" }],
  ]);

  const createMockIssue = (overrides: Partial<GitLabIssue> = {}): GitLabIssue => ({
    id: 1,
    iid: 10,
    title: "Test Issue",
    description: "Issue description",
    author: { id: 1, username: "testuser", avatar_url: "https://avatar.url" },
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T12:00:00Z",
    project_id: 1,
    web_url: "https://gitlab.com/project/issues/10",
    state: "opened",
    labels: ["bug", "priority"],
    assignees: [{ username: "assignee1" }],
    user_notes_count: 5,
    ...overrides,
  });

  describe("cross-reference extraction", () => {
    it("extracts mentioned IDs from description", () => {
      const issue = createMockIssue({
        description: "Related to #5 and MR !10",
      });
      const [transformed] = transformIssues([issue], mockProjectMap);

      expect(transformed?.mentionedInIds).toEqual([5, 10]);
    });

    it("returns empty array when no references", () => {
      const issue = createMockIssue({
        description: "No references here",
      });
      const [transformed] = transformIssues([issue], mockProjectMap);

      expect(transformed?.mentionedInIds).toEqual([]);
    });
  });

  describe("status mapping", () => {
    it("maps 'opened' state to 'open'", () => {
      const issue = createMockIssue({ state: "opened" });
      const [transformed] = transformIssues([issue], mockProjectMap);

      expect(transformed?.status).toBe("open");
    });

    it("maps 'closed' state to 'closed'", () => {
      const issue = createMockIssue({ state: "closed" });
      const [transformed] = transformIssues([issue], mockProjectMap);

      expect(transformed?.status).toBe("closed");
    });
  });

  describe("metadata extraction", () => {
    it("extracts assignees", () => {
      const issue = createMockIssue({
        assignees: [{ username: "user1" }, { username: "user2" }],
      });
      const [transformed] = transformIssues([issue], mockProjectMap);

      expect(transformed?.assignees).toEqual(["user1", "user2"]);
    });

    it("extracts comment count", () => {
      const issue = createMockIssue({ user_notes_count: 42 });
      const [transformed] = transformIssues([issue], mockProjectMap);

      expect(transformed?.commentCount).toBe(42);
    });

    it("sets issues as top-level (no parent)", () => {
      const issue = createMockIssue();
      const [transformed] = transformIssues([issue], mockProjectMap);

      expect(transformed?.parentType).toBeNull();
      expect(transformed?.parentEventId).toBeNull();
      expect(transformed?.gitlabParentId).toBeNull();
    });

    it("issues do not close other issues", () => {
      const issue = createMockIssue({
        description: "closes #999", // This should NOT be parsed for issues
      });
      const [transformed] = transformIssues([issue], mockProjectMap);

      expect(transformed?.closesIssueIds).toEqual([]);
    });
  });
});

describe("transformMergeRequests", () => {
  const mockProjectMap = new Map([
    [1, { name: "Test Project", path: "test-project" }],
  ]);

  const createMockMR = (overrides: Partial<GitLabMergeRequest> = {}): GitLabMergeRequest => ({
    id: 1,
    iid: 10,
    title: "Test MR",
    description: "MR description",
    author: { id: 1, username: "testuser", avatar_url: "https://avatar.url" },
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T12:00:00Z",
    project_id: 1,
    web_url: "https://gitlab.com/project/merge_requests/10",
    state: "opened",
    labels: ["feature"],
    assignees: [],
    user_notes_count: 3,
    ...overrides,
  });

  describe("closes issue extraction", () => {
    it("extracts closing references from description", () => {
      const mr = createMockMR({
        description: "This MR closes #100 and fixes #200",
      });
      const [transformed] = transformMergeRequests([mr], mockProjectMap);

      expect(transformed?.closesIssueIds).toEqual([100, 200]);
    });

    it("returns empty array when no closing references", () => {
      const mr = createMockMR({
        description: "This mentions #100 but doesnt close it",
      });
      const [transformed] = transformMergeRequests([mr], mockProjectMap);

      expect(transformed?.closesIssueIds).toEqual([]);
    });
  });

  describe("cross-reference extraction", () => {
    it("extracts mentioned IDs from description", () => {
      const mr = createMockMR({
        description: "Related to #5 and issue #15",
      });
      const [transformed] = transformMergeRequests([mr], mockProjectMap);

      expect(transformed?.mentionedInIds).toEqual([5, 15]);
    });
  });

  describe("status mapping", () => {
    it("maps 'opened' state to 'open'", () => {
      const mr = createMockMR({ state: "opened" });
      const [transformed] = transformMergeRequests([mr], mockProjectMap);

      expect(transformed?.status).toBe("open");
    });

    it("maps 'merged' state to 'merged'", () => {
      const mr = createMockMR({ state: "merged" });
      const [transformed] = transformMergeRequests([mr], mockProjectMap);

      expect(transformed?.status).toBe("merged");
    });

    it("maps 'closed' state to 'closed'", () => {
      const mr = createMockMR({ state: "closed" });
      const [transformed] = transformMergeRequests([mr], mockProjectMap);

      expect(transformed?.status).toBe("closed");
    });
  });

  describe("metadata extraction", () => {
    it("sets MRs as top-level (no parent)", () => {
      const mr = createMockMR();
      const [transformed] = transformMergeRequests([mr], mockProjectMap);

      expect(transformed?.parentType).toBeNull();
      expect(transformed?.parentEventId).toBeNull();
      expect(transformed?.gitlabParentId).toBeNull();
    });

    it("generates correct gitlabEventId format", () => {
      const mr = createMockMR({ id: 999 });
      const [transformed] = transformMergeRequests([mr], mockProjectMap);

      expect(transformed?.gitlabEventId).toBe("mr-999");
    });
  });
});

describe("relationship consistency", () => {
  const mockProjectMap = new Map([
    [1, { name: "Test Project", path: "test-project" }],
  ]);

  it("note parentEventId matches issue gitlabEventId format", () => {
    const issue: GitLabIssue = {
      id: 42,
      iid: 10,
      title: "Test Issue",
      description: null,
      author: { id: 1, username: "testuser", avatar_url: "" },
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T12:00:00Z",
      project_id: 1,
      web_url: "https://gitlab.com/issues/10",
      state: "opened",
      labels: [],
      assignees: [],
      user_notes_count: 0,
    };

    const note: GitLabNote & { project_id: number; web_url: string } = {
      id: 1,
      body: "Comment on issue",
      author: { id: 2, username: "commenter", avatar_url: "" },
      created_at: "2024-01-15T11:00:00Z",
      updated_at: "2024-01-15T11:00:00Z",
      noteable_type: "Issue",
      noteable_id: 42, // Must match issue.id
      noteable_iid: 10,
      system: false,
      project_id: 1,
      web_url: "https://gitlab.com/issues/10#note_1",
    };

    const [transformedIssue] = transformIssues([issue], mockProjectMap);
    const [transformedNote] = transformNotes([note], mockProjectMap);

    expect(transformedNote?.parentEventId).toBe(transformedIssue?.gitlabEventId);
  });

  it("note parentEventId matches MR gitlabEventId format", () => {
    const mr: GitLabMergeRequest = {
      id: 99,
      iid: 5,
      title: "Test MR",
      description: null,
      author: { id: 1, username: "testuser", avatar_url: "" },
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T12:00:00Z",
      project_id: 1,
      web_url: "https://gitlab.com/merge_requests/5",
      state: "opened",
      labels: [],
      assignees: [],
      user_notes_count: 0,
    };

    const note: GitLabNote & { project_id: number; web_url: string } = {
      id: 2,
      body: "Comment on MR",
      author: { id: 3, username: "reviewer", avatar_url: "" },
      created_at: "2024-01-15T11:00:00Z",
      updated_at: "2024-01-15T11:00:00Z",
      noteable_type: "MergeRequest",
      noteable_id: 99, // Must match mr.id
      noteable_iid: 5,
      system: false,
      project_id: 1,
      web_url: "https://gitlab.com/merge_requests/5#note_2",
    };

    const [transformedMR] = transformMergeRequests([mr], mockProjectMap);
    const [transformedNote] = transformNotes([note], mockProjectMap);

    expect(transformedNote?.parentEventId).toBe(transformedMR?.gitlabEventId);
  });
});
