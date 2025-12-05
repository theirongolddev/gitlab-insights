/**
 * GitLab Token Service
 *
 * Provides access to GitLab tokens with automatic refresh when expired.
 * Uses better-auth's getAccessToken API which handles refresh internally.
 */

import { TRPCError } from "@trpc/server";
import { auth } from "~/lib/auth";
import { logger } from "~/lib/logger";

interface GetGitLabTokenResult {
  accessToken: string;
}

/**
 * Get a valid GitLab access token for the given user.
 * Automatically refreshes the token if it has expired.
 *
 * @param userId - The user ID to get the token for
 * @returns The access token
 * @throws TRPCError with UNAUTHORIZED code if token cannot be obtained/refreshed
 */
export async function getGitLabAccessToken(
  userId: string
): Promise<GetGitLabTokenResult> {
  try {
    const result = await auth.api.getAccessToken({
      body: {
        providerId: "gitlab",
        userId,
      },
    });

    if (!result?.accessToken) {
      logger.warn({ userId }, "gitlab-token: No access token returned from getAccessToken");
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "GitLab session expired. Please log in again.",
      });
    }

    logger.debug({ userId, hasToken: true }, "gitlab-token: Token retrieved successfully");

    return {
      accessToken: result.accessToken,
    };
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }

    logger.error({ error, userId }, "gitlab-token: Failed to get/refresh access token");

    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "GitLab session expired or revoked. Please log in again.",
    });
  }
}
