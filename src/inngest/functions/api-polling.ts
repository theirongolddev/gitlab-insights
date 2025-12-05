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
import {
  transformIssues,
  transformMergeRequests,
  transformNotes,
  storeEvents,
  getProjectMap,
} from "~/server/services/event-transformer";
import { logger } from "~/lib/logger";

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
          accounts: {
            where: { providerId: "gitlab" },
            select: { accessToken: true },
          },
        },
      });
    });

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const user of users) {
      const accessToken = user.accounts[0]?.accessToken;

      if (!accessToken) {
        logger.warn({ userId: user.id }, "api-polling: User has no access token, skipping");
        skipped++;
        continue;
      }

      try {
        await step.run(`fetch-events-user-${user.id}`, async () => {
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
              projectCount: projectIds.length,
            },
            "api-polling: User events synced"
          );

          return result;
        });

        processed++;
      } catch (error) {
        // Handle 401 token expiry - skip user (requires re-auth), don't count as failure
        if (error instanceof GitLabAPIError && error.statusCode === 401) {
          logger.warn(
            { userId: user.id },
            "api-polling: User token expired, skipping (requires re-auth)"
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

    // Success if we processed at least one user, or if there were no users to process
    const success = processed > 0 || users.length === 0;

    return {
      success,
      processed,
      failed,
      skipped,
      total: users.length,
    };
  }
);
