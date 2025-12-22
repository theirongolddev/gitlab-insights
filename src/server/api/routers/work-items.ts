/**
 * Work Items tRPC Router
 *
 * Handles work-item-centric grouped queries for the catch-up view.
 * Returns top-level issues/MRs with activity summaries and unread counts.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type {
  WorkItem,
  ActivitySummary,
  ActivityItem,
  ThreadedActivityItem,
  GroupedWorkItems,
  GetWorkItemsGroupedResponse,
  GetWorkItemWithActivityResponse,
  Participant,
  Reaction,
} from "~/types/work-items";
import { highlightText } from "~/lib/search/highlight-text";
import { GitLabClient } from "~/server/services/gitlab-client";

/**
 * Extract the IID (issue/MR number) from a GitLab URL
 *
 * GitLab URLs have format: https://gitlab.com/group/project/-/issues/123
 * or: https://gitlab.com/group/project/-/merge_requests/456
 * or: https://gitlab.com/group/project/-/work_items/789
 *
 * The IID is the human-readable number (123, 456), NOT the internal database ID.
 */
function extractIidFromUrl(gitlabUrl: string): number {
  const match = gitlabUrl.match(/(?:issues|merge_requests|work_items)\/(\d+)/);
  return match?.[1] ? parseInt(match[1], 10) : 0;
}

const workItemFiltersSchema = z.object({
  status: z.array(z.enum(["open", "closed", "merged"])).optional(),
  type: z.array(z.enum(["issue", "merge_request"])).optional(),
  repository: z.array(z.string()).optional(),
  unreadOnly: z.boolean().optional(),
  search: z.string().optional(),
});

const cursorSchema = z.object({
  lastActivityAt: z.date(),
  id: z.string(),
});

export const workItemsRouter = createTRPCRouter({
  /**
   * Get work items grouped by type with activity summaries
   *
   * Returns top-level issues and MRs (items where parentEventId IS NULL)
   * with computed activity summaries and unread status.
   *
   * Sorting: Unread items first, then by lastActivityAt descending
   */
  getGrouped: protectedProcedure
    .input(
      z.object({
        filters: workItemFiltersSchema.optional(),
        cursor: cursorSchema.optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }): Promise<GetWorkItemsGroupedResponse> => {
      const userId = ctx.session.user.id;
      const { filters, cursor, limit } = input;

      // Build where clause for top-level work items only
      const where: Record<string, unknown> = {
        userId,
        parentEventId: null, // Only top-level items (not comments)
        type: {
          in: filters?.type ?? ["issue", "merge_request"],
        },
      };

      // Status filter
      if (filters?.status && filters.status.length > 0) {
        where.status = { in: filters.status };
      }

      // Repository filter
      if (filters?.repository && filters.repository.length > 0) {
        where.projectId = { in: filters.repository };
      }

      // Search filter (basic title/body search)
      if (filters?.search) {
        where.OR = [
          { title: { contains: filters.search, mode: "insensitive" } },
          { body: { contains: filters.search, mode: "insensitive" } },
          // Search in child comments (events with parentEventId pointing to this work item)
          {
            children: {
              some: {
                OR: [
                  { title: { contains: filters.search, mode: "insensitive" } },
                  { body: { contains: filters.search, mode: "insensitive" } },
                ],
              },
            },
          },
        ];
      }

      // Cursor-based pagination - use AND to combine with existing filters
      // This fixes the bug where cursor OR was overwriting search OR
      if (cursor) {
        where.AND = [
          {
            OR: [
              { lastActivityAt: { lt: cursor.lastActivityAt } },
              {
                lastActivityAt: cursor.lastActivityAt,
                id: { lt: cursor.id },
              },
            ],
          },
        ];
      }

      // Fetch monitored projects to get path/ID -> numeric ID mapping
      const monitoredProjects = await ctx.db.monitoredProject.findMany({
        where: { userId },
        select: { projectPath: true, gitlabProjectId: true },
      });
      const projectIdMap = new Map<string, number>();
      for (const p of monitoredProjects) {
        const numericId = parseInt(p.gitlabProjectId, 10);
        if (!isNaN(numericId)) {
          projectIdMap.set(p.projectPath, numericId);      // by path
          projectIdMap.set(p.gitlabProjectId, numericId);  // by numeric ID string
        }
      }

      // Fetch work items with children (comments) and read status
      const events = await ctx.db.event.findMany({
        where,
        include: {
          children: {
            select: {
              id: true,
              author: true,
              authorAvatar: true,
              body: true,
              createdAt: true,
              isSystemNote: true,
              gitlabUrl: true,
            },
            orderBy: { createdAt: "desc" },
          },
          readBy: {
            where: { userId },
            select: { readAt: true },
          },
        },
        orderBy: [{ lastActivityAt: "desc" }, { id: "desc" }],
        take: limit + 1, // Fetch one extra to check if there are more
      });

      // Check if there are more results
      const hasMore = events.length > limit;
      const items = hasMore ? events.slice(0, limit) : events;

      // Transform to WorkItem type
      const workItems: WorkItem[] = items.map((event) => {
        const lastReadAt = event.readBy[0]?.readAt ?? null;

        // Compute activity summary
        const children = event.children;
        const newChildren = lastReadAt
          ? children.filter((c) => c.createdAt > lastReadAt)
          : children;

        // Get unique participants (including work item author)
        const participantMap = new Map<string, Participant>();
        
        // Add the work item author first
        participantMap.set(event.author, {
          username: event.author,
          avatarUrl: event.authorAvatar,
        });
        
        // Add comment authors
        for (const child of children) {
          if (!participantMap.has(child.author)) {
            participantMap.set(child.author, {
              username: child.author,
              avatarUrl: child.authorAvatar,
            });
          }
        }

        const latestChild = children[0];
        const activitySummary: ActivitySummary = {
          totalCount: event.commentCount,
          newCount: newChildren.length,
          latestActivity: latestChild
            ? {
                author: latestChild.author,
                authorAvatar: latestChild.authorAvatar,
                timestamp: latestChild.createdAt,
                preview: latestChild.body?.slice(0, 100) ?? "",
              }
            : null,
          participants: Array.from(participantMap.values()),
        };

        // Determine unread status
        const isUnread = lastReadAt
          ? event.lastActivityAt
            ? event.lastActivityAt > lastReadAt
            : false
          : true; // Never read = unread

        // Transform children to ActivityItem[] for card expansion
        const activities: ActivityItem[] = children.map((child) => {
          const activity: ActivityItem = {
            id: child.id,
            type: child.isSystemNote ? "system" : "comment",
            author: child.author,
            authorAvatar: child.authorAvatar,
            body: child.body,
            timestamp: child.createdAt,
            isSystemNote: child.isSystemNote,
            isUnread: lastReadAt ? child.createdAt > lastReadAt : true,
            gitlabUrl: child.gitlabUrl,
          };

          // Apply highlighting to activity body when search is active
          if (filters?.search && child.body) {
            activity.highlightedBody = highlightText(child.body, filters.search);
          }

          return activity;
        });

        // Use stored IID if available, otherwise extract from URL (fallback for old data)
        const number = event.iid ?? extractIidFromUrl(event.gitlabUrl);

        const workItem: WorkItem = {
          id: event.id,
          gitlabEventId: event.gitlabEventId,
          type: event.type as "issue" | "merge_request",
          status: (event.status as "open" | "closed" | "merged") ?? "open",
          title: event.title,
          body: event.body,
          number,
          repositoryName: event.project,
          repositoryPath: event.projectId,
          projectId: projectIdMap.get(event.projectId) ?? 0,
          labels: event.labels,
          author: event.author,
          authorAvatar: event.authorAvatar,
          assignees: event.assignees,
          createdAt: event.createdAt,
          lastActivityAt: event.lastActivityAt ?? event.createdAt,
          gitlabUrl: event.gitlabUrl,
          closesIssueIds: event.closesIssueIds,
          closedByMRIds: [], // TODO: Compute from other MRs' closesIssueIds
          mentionedInIds: event.mentionedInIds,
          activitySummary,
          activities,
          isUnread,
          lastReadAt,
        };

        // Apply highlighting to work item when search is active
        if (filters?.search) {
          workItem.highlightedTitle = highlightText(event.title, filters.search);
          if (event.body) {
            workItem.highlightedSnippet = highlightText(event.body, filters.search);
          }

          // Check if match is in title/body, if not find first matching child
          const searchLower = filters.search.toLowerCase();
          const titleHasMatch = event.title.toLowerCase().includes(searchLower);
          const bodyHasMatch = event.body?.toLowerCase().includes(searchLower) ?? false;

          if (!titleHasMatch && !bodyHasMatch) {
            // Find first child with a match and show its snippet
            for (const child of children) {
              const childBodyLower = child.body?.toLowerCase() ?? "";
              if (childBodyLower.includes(searchLower)) {
                const snippet = child.body!.slice(0, 150) + (child.body!.length > 150 ? "..." : "");
                workItem.matchingChildSnippet = highlightText(snippet, filters.search);
                break;
              }
            }
          }
        }

        return workItem;
      });

      // Apply unreadOnly filter if requested
      // This must be done after computing isUnread since it depends on lastReadAt comparison
      //
      // KNOWN LIMITATION: Client-side filtering with cursor pagination
      // When unreadOnly=true, filtering happens AFTER the database fetch, which means:
      // 1. The cursor points to the last item from the DB, not the last filtered item
      // 2. This can cause fewer items than `limit` to be returned per page
      // 3. In rare cases, items near page boundaries may be skipped
      //
      // This is acceptable because:
      // - unreadOnly is typically used for "catch-up" views where users read through all items
      // - The alternative (subquery with ReadEvent join) would significantly complicate the query
      // - Users can toggle unreadOnly off to see all items with correct pagination
      //
      // Future improvement: Implement database-level filtering using a subquery:
      // WHERE NOT EXISTS (SELECT 1 FROM "ReadEvent" re WHERE re."eventId" = e.id 
      //                   AND re."userId" = $userId AND re."readAt" >= e."lastActivityAt")
      const filteredWorkItems = filters?.unreadOnly
        ? workItems.filter((w) => w.isUnread)
        : workItems;

      // NOTE: We intentionally do NOT sort by unread status here.
      // Client-side sorting would break cursor-based pagination invariants,
      // causing items to be skipped or duplicated across pages.
      // The database ordering (lastActivityAt DESC, id DESC) is authoritative.
      // If unread-first sorting is needed, it should be done at the DB level
      // or the UI should handle grouping separately.

      // Group by type
      const grouped: GroupedWorkItems = {
        issues: filteredWorkItems.filter((w) => w.type === "issue"),
        mergeRequests: filteredWorkItems.filter((w) => w.type === "merge_request"),
        totalCount: filteredWorkItems.length,
        unreadCount: filteredWorkItems.filter((w) => w.isUnread).length,
      };

      // Build next cursor from the LAST item in the response (after filtering)
      // This must match the database ordering to maintain pagination correctness
      const lastWorkItem = filteredWorkItems[filteredWorkItems.length - 1];
      const nextCursor =
        hasMore && lastWorkItem
          ? {
              lastActivityAt: lastWorkItem.lastActivityAt,
              id: lastWorkItem.id,
            }
          : null;

      return {
        items: grouped,
        nextCursor,
        hasMore,
      };
    }),

  /**
   * Get a single work item with full activity timeline
   *
   * Returns the work item with all child events (comments, status changes)
   * in chronological order, with read status for each activity.
   * Also includes related work items (closes, closedBy, mentions).
   */
  getWithActivity: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        includeRelated: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }): Promise<GetWorkItemWithActivityResponse> => {
      const userId = ctx.session.user.id;
      const { id, includeRelated } = input;

      // Fetch the work item with all children and read status
      const event = await ctx.db.event.findFirst({
        where: {
          id,
          userId,
          parentEventId: null, // Must be a top-level work item
        },
        include: {
          children: {
            select: {
              id: true,
              type: true,
              author: true,
              authorAvatar: true,
              body: true,
              createdAt: true,
              isSystemNote: true,
              gitlabUrl: true,
              discussionId: true, // For thread grouping
              gitlabEventId: true, // For fetching reactions on-demand
            },
            orderBy: { createdAt: "asc" }, // Chronological for timeline
          },
          readBy: {
            where: { userId },
            select: { readAt: true },
          },
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Work item not found",
        });
      }

      // Fetch monitored project to get numeric ID (try by path first, then by ID string)
      let monitoredProject = await ctx.db.monitoredProject.findFirst({
        where: { userId, projectPath: event.projectId },
        select: { gitlabProjectId: true },
      });
      if (!monitoredProject) {
        // event.projectId might be the numeric ID as a string
        monitoredProject = await ctx.db.monitoredProject.findFirst({
          where: { userId, gitlabProjectId: event.projectId },
          select: { gitlabProjectId: true },
        });
      }
      let numericProjectId = 0;
      if (monitoredProject) {
        const parsed = parseInt(monitoredProject.gitlabProjectId, 10);
        if (!isNaN(parsed)) {
          numericProjectId = parsed;
        }
      }

      const lastReadAt = event.readBy[0]?.readAt ?? null;

      // Transform children to ActivityItem[]
      const flatActivities: ActivityItem[] = event.children.map((child) => {
        // Extract numeric note ID from gitlabEventId (format: "note-12345")
        let gitlabNoteId: number | undefined;
        if (child.gitlabEventId.startsWith("note-")) {
          const parsed = parseInt(child.gitlabEventId.slice(5), 10);
          gitlabNoteId = Number.isNaN(parsed) ? undefined : parsed;
        }

        return {
          id: child.id,
          type: child.isSystemNote ? "system" : "comment",
          author: child.author,
          authorAvatar: child.authorAvatar,
          body: child.body,
          timestamp: child.createdAt,
          isSystemNote: child.isSystemNote,
          isUnread: lastReadAt ? child.createdAt > lastReadAt : true,
          gitlabUrl: child.gitlabUrl,
          discussionId: child.discussionId ?? undefined,
          gitlabNoteId,
        };
      });

      // Group activities by discussionId into threads
      // System notes and standalone comments (null discussionId) become single-item threads
      const threadMap = new Map<string, ActivityItem[]>();
      for (const activity of flatActivities) {
        // Use discussionId if present, otherwise use id (makes it a single-item thread)
        const key = activity.discussionId ?? activity.id;
        const thread = threadMap.get(key) ?? [];
        thread.push(activity);
        threadMap.set(key, thread);
      }

      // Convert to ThreadedActivityItem[], sorted by thread start time
      const activities: ThreadedActivityItem[] = [];
      for (const [, thread] of threadMap) {
        const [first, ...replies] = thread;
        if (first) {
          activities.push({
            ...first,
            replies,
            isThreadStart: true,
            threadStartTime: first.timestamp,
          });
        }
      }

      // Sort threads by when they started (first comment time)
      activities.sort((a, b) =>
        a.threadStartTime.getTime() - b.threadStartTime.getTime()
      );

      // Build activity summary
      const participantMap = new Map<string, Participant>();
      for (const child of event.children) {
        if (!participantMap.has(child.author)) {
          participantMap.set(child.author, {
            username: child.author,
            avatarUrl: child.authorAvatar,
          });
        }
      }

      // Count all unread activities (thread starters + replies)
      const unreadCount = flatActivities.filter((a) => a.isUnread).length;
      const latestChild = event.children[event.children.length - 1];

      const activitySummary: ActivitySummary = {
        totalCount: event.commentCount,
        newCount: unreadCount,
        latestActivity: latestChild
          ? {
              author: latestChild.author,
              authorAvatar: latestChild.authorAvatar,
              timestamp: latestChild.createdAt,
              preview: latestChild.body?.slice(0, 100) ?? "",
            }
          : null,
        participants: Array.from(participantMap.values()),
      };

      // Use stored IID if available, otherwise extract from URL (fallback for old data)
      const number = event.iid ?? extractIidFromUrl(event.gitlabUrl);

      // Determine unread status
      const isUnread = lastReadAt
        ? event.lastActivityAt
          ? event.lastActivityAt > lastReadAt
          : false
        : true;

      const workItem: WorkItem = {
        id: event.id,
        gitlabEventId: event.gitlabEventId,
        type: event.type as "issue" | "merge_request",
        status: (event.status as "open" | "closed" | "merged") ?? "open",
        title: event.title,
        body: event.body,
        number,
        repositoryName: event.project,
        repositoryPath: event.projectId,
        projectId: numericProjectId,
        labels: event.labels,
        author: event.author,
        authorAvatar: event.authorAvatar,
        assignees: event.assignees,
        createdAt: event.createdAt,
        lastActivityAt: event.lastActivityAt ?? event.createdAt,
        gitlabUrl: event.gitlabUrl,
        closesIssueIds: event.closesIssueIds,
        closedByMRIds: [],
        mentionedInIds: event.mentionedInIds,
        activitySummary,
        activities,
        isUnread,
        lastReadAt,
      };

      // Fetch related work items if requested
      let relatedWorkItems: GetWorkItemWithActivityResponse["relatedWorkItems"] = {
        closes: [],
        closedBy: [],
        mentioned: [],
      };

      if (includeRelated) {
        // Fetch all monitored projects for this user to map paths/IDs -> numeric IDs
        const allMonitoredProjects = await ctx.db.monitoredProject.findMany({
          where: { userId },
          select: { projectPath: true, gitlabProjectId: true },
        });
        const relatedProjectIdMap = new Map<string, number>();
        for (const p of allMonitoredProjects) {
          const numericId = parseInt(p.gitlabProjectId, 10);
          if (!isNaN(numericId)) {
            relatedProjectIdMap.set(p.projectPath, numericId);      // by path
            relatedProjectIdMap.set(p.gitlabProjectId, numericId);  // by numeric ID string
          }
        }

        // Find issues this MR closes (by closesIssueIds)
        // closesIssueIds contains IIDs (human-readable issue numbers like 123)
        // We query by iid field, scoped to the same project
        if (event.closesIssueIds.length > 0) {
          const closesEvents = await ctx.db.event.findMany({
            where: {
              userId,
              type: "issue",
              projectId: event.projectId, // Same project
              iid: {
                in: event.closesIssueIds,
              },
            },
            select: {
              id: true,
              gitlabEventId: true,
              type: true,
              status: true,
              title: true,
              body: true,
              project: true,
              projectId: true,
              labels: true,
              author: true,
              authorAvatar: true,
              assignees: true,
              createdAt: true,
              lastActivityAt: true,
              gitlabUrl: true,
              closesIssueIds: true,
              mentionedInIds: true,
              commentCount: true,
              iid: true,
            },
          });

          relatedWorkItems.closes = closesEvents.map((e) => ({
            id: e.id,
            gitlabEventId: e.gitlabEventId,
            type: e.type as "issue" | "merge_request",
            status: (e.status as "open" | "closed" | "merged") ?? "open",
            title: e.title,
            body: e.body,
            number: e.iid ?? extractIidFromUrl(e.gitlabUrl),
            repositoryName: e.project,
            repositoryPath: e.projectId,
            projectId: relatedProjectIdMap.get(e.projectId) ?? 0,
            labels: e.labels,
            author: e.author,
            authorAvatar: e.authorAvatar,
            assignees: e.assignees,
            createdAt: e.createdAt,
            lastActivityAt: e.lastActivityAt ?? e.createdAt,
            gitlabUrl: e.gitlabUrl,
            closesIssueIds: e.closesIssueIds,
            closedByMRIds: [],
            mentionedInIds: e.mentionedInIds,
            activitySummary: {
              totalCount: e.commentCount,
              newCount: 0,
              latestActivity: null,
              participants: [],
            },
            isUnread: false,
            lastReadAt: null,
          }));
        }

        // Find MRs that close this issue (if this is an issue)
        if (event.type === "issue") {
          const issueIid = event.iid ?? number;
          const closedByEvents = await ctx.db.event.findMany({
            where: {
              userId,
              type: "merge_request",
              projectId: event.projectId, // Same project
              closesIssueIds: { has: issueIid },
            },
            select: {
              id: true,
              gitlabEventId: true,
              type: true,
              status: true,
              title: true,
              body: true,
              project: true,
              projectId: true,
              labels: true,
              author: true,
              authorAvatar: true,
              assignees: true,
              createdAt: true,
              lastActivityAt: true,
              gitlabUrl: true,
              closesIssueIds: true,
              mentionedInIds: true,
              commentCount: true,
              iid: true,
            },
          });

          relatedWorkItems.closedBy = closedByEvents.map((e) => ({
            id: e.id,
            gitlabEventId: e.gitlabEventId,
            type: e.type as "issue" | "merge_request",
            status: (e.status as "open" | "closed" | "merged") ?? "open",
            title: e.title,
            body: e.body,
            number: e.iid ?? extractIidFromUrl(e.gitlabUrl),
            repositoryName: e.project,
            repositoryPath: e.projectId,
            projectId: relatedProjectIdMap.get(e.projectId) ?? 0,
            labels: e.labels,
            author: e.author,
            authorAvatar: e.authorAvatar,
            assignees: e.assignees,
            createdAt: e.createdAt,
            lastActivityAt: e.lastActivityAt ?? e.createdAt,
            gitlabUrl: e.gitlabUrl,
            closesIssueIds: e.closesIssueIds,
            closedByMRIds: [],
            mentionedInIds: e.mentionedInIds,
            activitySummary: {
              totalCount: e.commentCount,
              newCount: 0,
              latestActivity: null,
              participants: [],
            },
            isUnread: false,
            lastReadAt: null,
          }));
        }
      }

      return {
        workItem,
        activities,
        relatedWorkItems,
      };
    }),

  /**
   * Mark a single work item as read
   *
   * Creates or updates a ReadEvent record with the current timestamp.
   * If the work item was already read, updates the readAt timestamp.
   */
  markAsRead: protectedProcedure
    .input(z.object({ workItemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { workItemId } = input;

      // Verify the work item exists and belongs to the user
      const event = await ctx.db.event.findFirst({
        where: { id: workItemId, userId, parentEventId: null },
        select: { id: true },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Work item not found",
        });
      }

      // Upsert the ReadEvent record
      const readEvent = await ctx.db.readEvent.upsert({
        where: {
          userId_eventId: { userId, eventId: workItemId },
        },
        create: {
          userId,
          eventId: workItemId,
          readAt: new Date(),
        },
        update: {
          readAt: new Date(),
        },
      });

      return { success: true, readAt: readEvent.readAt };
    }),

  /**
   * Mark multiple work items as read (batch operation)
   *
   * Used for "Mark all as read" in section headers.
   */
  markMultipleAsRead: protectedProcedure
    .input(z.object({ workItemIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { workItemIds } = input;

      if (workItemIds.length === 0) {
        return { success: true, count: 0 };
      }

      // Use interactive transaction to ensure atomicity between validation and upsert
      // This prevents race conditions where events could be modified between check and update
      const count = await ctx.db.$transaction(async (tx) => {
        // Verify all work items exist and belong to the user (within transaction)
        const events = await tx.event.findMany({
          where: {
            id: { in: workItemIds },
            userId,
            parentEventId: null,
          },
          select: { id: true },
        });

        const validIds = events.map((e) => e.id);
        const now = new Date();

        // Upsert all ReadEvent records
        await Promise.all(
          validIds.map((eventId) =>
            tx.readEvent.upsert({
              where: {
                userId_eventId: { userId, eventId },
              },
              create: {
                userId,
                eventId,
                readAt: now,
              },
              update: {
                readAt: now,
              },
            })
          )
        );

        return validIds.length;
      });

      return { success: true, count };
    }),

  /**
   * Clear read status for a work item (for testing/undo)
   *
   * Deletes the ReadEvent record, making the item appear unread again.
   */
  clearReadStatus: protectedProcedure
    .input(z.object({ workItemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { workItemId } = input;

      await ctx.db.readEvent.deleteMany({
        where: { userId, eventId: workItemId },
      });

      return { success: true };
    }),

  /**
   * Get reactions (award emojis) for multiple notes
   *
   * Fetches reactions from GitLab on-demand for the specified notes.
   * Returns grouped reactions by emoji for each note.
   * Errors for individual notes are silently ignored (partial results OK).
   */
  getReactions: protectedProcedure
    .input(
      z.object({
        repositoryPath: z.string(), // Project path like "group/project"
        noteableType: z.enum(["issue", "merge_request"]),
        noteableIid: z.number(),
        noteIds: z.array(z.number()).max(100), // Limit batch size
      })
    )
    .query(async ({ ctx, input }) => {
      const account = await ctx.db.account.findFirst({
        where: { userId: ctx.session.user.id, providerId: "gitlab" },
        select: { accessToken: true },
      });

      if (!account?.accessToken) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "GitLab account not connected",
        });
      }

      const client = new GitLabClient(account.accessToken);

      // Fetch awards for each note in chunks of 5 (concurrency limit)
      const chunkSize = 5;
      const results: Array<{ noteId: number; awards: Awaited<ReturnType<typeof client.fetchNoteAwards>> }> = [];

      for (let i = 0; i < input.noteIds.length; i += chunkSize) {
        const chunk = input.noteIds.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(
          chunk.map(async (noteId) => {
            const awards = await client.fetchNoteAwards(
              input.repositoryPath,
              input.noteableType,
              input.noteableIid,
              noteId
            );
            return { noteId, awards };
          })
        );
        results.push(...chunkResults);
      }

      // Group awards by emoji for each note
      const grouped: Record<number, Reaction[]> = {};
      for (const { noteId, awards } of results) {
        if (awards.length > 0) {
          grouped[noteId] = groupAwardsByEmoji(awards);
        }
      }

      return grouped;
    }),
});

/**
 * Group award emojis by emoji name
 *
 * Transforms flat list of awards into grouped reactions.
 * Example: [{ name: "thumbsup", user: A }, { name: "thumbsup", user: B }]
 *       -> [{ emoji: "thumbsup", users: [A, B] }]
 */
function groupAwardsByEmoji(
  awards: Array<{ name: string; user: { username: string; avatar_url: string } }>
): Reaction[] {
  const byEmoji = new Map<string, Reaction>();

  for (const award of awards) {
    const existing = byEmoji.get(award.name);
    if (existing) {
      existing.users.push({
        username: award.user.username,
        avatar: award.user.avatar_url,
      });
    } else {
      byEmoji.set(award.name, {
        emoji: award.name,
        users: [{ username: award.user.username, avatar: award.user.avatar_url }],
      });
    }
  }

  return Array.from(byEmoji.values());
}
