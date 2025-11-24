import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env";

/**
 * GitLab API Router
 *
 * Handles interactions with GitLab REST API v4
 * - List user's accessible projects
 * - Fetch project details
 */

interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  description: string | null;
  avatar_url: string | null;
  archived: boolean;
  last_activity_at: string;
}

export const gitlabRouter = createTRPCRouter({
  /**
   * List all GitLab projects the authenticated user has access to
   *
   * GET /api/v4/projects?membership=true&per_page=100
   *
   * @returns Array of projects with id, name, path_with_namespace
   */
  listUserProjects: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Retrieve user's GitLab access token from Account table
      const account = await ctx.db.account.findFirst({
        where: {
          userId: ctx.session.user.id,
          providerId: "gitlab",
        },
        select: {
          accessToken: true,
          scope: true,
        },
      });

      if (!account?.accessToken) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "GitLab access token not found. Please re-authenticate.",
        });
      }

      console.log("[gitlab.listUserProjects] Debug info:", {
        userId: ctx.session.user.id,
        hasToken: !!account.accessToken,
        tokenLength: account.accessToken?.length,
        tokenPrefix: account.accessToken?.substring(0, 10) + "...",
        scope: account.scope,
      });

      // Fetch projects from GitLab API
      // archived=false excludes archived projects
      // order_by=last_activity_at sorts by most recent activity
      const response = await fetch(
        `${env.GITLAB_INSTANCE_URL}/api/v4/projects?membership=true&per_page=100&archived=false&order_by=last_activity_at`,
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
          },
          // 10 second timeout to handle slow GitLab instances
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        // Handle GitLab API errors
        if (response.status === 401) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "GitLab token expired or revoked. Please re-authenticate.",
          });
        }

        if (response.status === 403) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Insufficient permissions to access projects. Ensure your OAuth app has read_api scope.",
          });
        }

        if (response.status === 429) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "GitLab API rate limit exceeded. Please try again in a moment.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `GitLab API error: ${response.status} ${response.statusText}`,
        });
      }

      const projects = await response.json() as GitLabProject[];

      // Return transformed project data
      return projects.map((project) => ({
        id: project.id.toString(),
        name: project.name,
        path_with_namespace: project.path_with_namespace,
        description: project.description,
        avatar_url: project.avatar_url,
        archived: project.archived,
        last_activity_at: project.last_activity_at,
      }));
    } catch (error) {
      // Handle network errors
      if (error instanceof TRPCError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new TRPCError({
          code: "TIMEOUT",
          message: "GitLab API request timed out. Please try again.",
        });
      }

      console.error("[gitlab.listUserProjects] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch projects from GitLab. Please check your connection.",
        cause: error,
      });
    }
  }),
});
