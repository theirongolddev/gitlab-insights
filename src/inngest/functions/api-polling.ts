/**
 * GitLab API Polling Background Job
 *
 * Scheduled function that runs every 10 minutes to fetch events from GitLab API
 * for all users with monitored projects.
 *
 * Cron schedule can be overridden via INNGEST_POLLING_CRON env var for testing.
 * Examples:
 *   - Every minute (testing): set INNGEST_POLLING_CRON to a 1-minute cron
 *   - Every 5 minutes: set to 5-minute cron
 *   - Default (production): every 10 minutes
 */

import { inngest } from "../client";
import { db } from "~/server/db";
import { GitLabClient, GitLabAPIError } from "~/server/services/gitlab-client";
import { getGitLabAccessToken } from "~/server/services/gitlab-token";
import {
  transformIssues,
  transformMergeRequests,
  transformNotes,
  storeEvents,
  linkParentEvents,
  updateActivityMetadata,
  getProjectMap,
} from "~/server/services/event-transformer";
import {
  extractPeopleFromGitLabResponses,
  upsertPeople,
} from "~/server/services/person-extractor";
import { logger } from "~/lib/logger";
import { TRPCError } from "@trpc/server";

// Default: every 10 minutes. Override with INNGEST_POLLING_CRON for testing.
// Note: Invalid cron expressions will cause Inngest to fail at function registration time.
const POLLING_CRON = process.env.INNGEST_POLLING_CRON ?? "*/10 * * * *";

export const apiPollingJob = inngest.createFunction(
  {
    id: "gitlab-api-polling",
    name: "GitLab API Polling",
    retries: 3,
    concurrency: {
      limit: 5,
    },
    onFailure: async ({ error }) => {
      logger.error({ error }, "api-polling: All retries exhausted");
    },
  },
  { cron: POLLING_CRON },
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return db.user.findMany({
        where: {
          projects: { some: {} },
        },
        include: {
          projects: true,
        },
      });
    });

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const user of users) {
      try {
        await step.run(`fetch-events-user-${user.id}`, async () => {
          // Get fresh access token (auto-refreshes if expired)
          const { accessToken } = await getGitLabAccessToken(user.id);

          const lastSync = await db.lastSync.findUnique({
            where: { userId: user.id },
          });

          const updatedAfter = lastSync?.lastSyncAt?.toISOString();
          const projectIds = user.projects.map((p) => p.gitlabProjectId);

          const client = new GitLabClient(accessToken);
          const { issues, mergeRequests, notes } = await client.fetchEvents(
            projectIds,
            updatedAfter
          );

          const projectMap = await getProjectMap(db, user.id, projectIds);
          const allEvents = [
            ...transformIssues(issues, projectMap),
            ...transformMergeRequests(mergeRequests, projectMap),
            ...transformNotes(notes, projectMap),
          ];

          const result = await storeEvents(db, user.id, allEvents);

          // Link parent-child relationships (comments -> issues/MRs)
          const linkedCount = await linkParentEvents(db, user.id);

          // Update activity metadata (lastActivityAt, commentCount, participants)
          const metadataCount = await updateActivityMetadata(db, user.id);

          // Extract and upsert people from GitLab responses
          const extractedPeople = extractPeopleFromGitLabResponses(
            issues,
            mergeRequests,
            notes
          );
          const peopleResult = await upsertPeople(db, user.id, extractedPeople);

          await db.lastSync.upsert({
            where: { userId: user.id },
            create: { userId: user.id, lastSyncAt: new Date() },
            update: { lastSyncAt: new Date() },
          });

          logger.info(
            {
              userId: user.id,
              stored: result.stored,
              skipped: result.skipped,
              linked: linkedCount,
              metadataUpdated: metadataCount,
              projectCount: projectIds.length,
            },
            "api-polling: User events synced"
          );

          return result;
        });

        processed++;
      } catch (error) {
        // Handle token refresh failures - skip user (requires re-auth)
        if (error instanceof TRPCError && error.code === "UNAUTHORIZED") {
          logger.warn(
            { userId: user.id },
            "api-polling: User token expired/revoked, skipping (requires re-auth)"
          );
          skipped++;
        // Handle 401 from GitLab API directly  
        } else if (error instanceof GitLabAPIError && error.statusCode === 401) {
          logger.warn(
            { userId: user.id },
            "api-polling: GitLab token rejected, skipping (requires re-auth)"
          );
          skipped++;
        } else {
          logger.error({ userId: user.id, error }, "api-polling: Failed to sync user");
          failed++;
        }
      }
    }

    logger.info(
      { processed, failed, skipped, total: users.length },
      "api-polling: Job completed"
    );

    // Calculate success based on failure rate
    // Success if: no users to process, OR processed at least one AND failure rate < 50%
    const usersAttempted = processed + failed; // excluding skipped (they need re-auth)
    const failureRate = usersAttempted > 0 ? failed / usersAttempted : 0;
    const success = users.length === 0 || (processed > 0 && failureRate < 0.5);

    if (!success) {
      logger.error(
        { processed, failed, skipped, failureRate: Math.round(failureRate * 100) },
        "api-polling: High failure rate detected"
      );
    }

    return {
      success,
      processed,
      failed,
      skipped,
      total: users.length,
      failureRate: Math.round(failureRate * 100),
    };
  }
);
