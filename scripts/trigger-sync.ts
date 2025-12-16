/**
 * Trigger Immediate GitLab Sync
 *
 * Manually triggers a GitLab sync for all users without waiting for cron.
 * Useful after database wipe to immediately re-populate data.
 *
 * Usage: npx tsx scripts/trigger-sync.ts
 */

import { PrismaClient } from "../generated/prisma";
import { GitLabClient } from "../src/server/services/gitlab-client";
import { getGitLabAccessToken } from "../src/server/services/gitlab-token";
import {
  transformIssues,
  transformMergeRequests,
  transformNotes,
  storeEvents,
  linkParentEvents,
  updateActivityMetadata,
  getProjectMap,
} from "../src/server/services/event-transformer";

const db = new PrismaClient();

async function triggerSync() {
  console.log("=== Manual GitLab Sync ===\n");

  // Get all users with monitored projects
  const users = await db.user.findMany({
    where: {
      projects: { some: {} },
    },
    include: {
      projects: true,
    },
  });

  console.log(`Found ${users.length} user(s) with monitored projects\n`);

  for (const user of users) {
    console.log(`Syncing user: ${user.email}`);

    try {
      // Get fresh access token
      const { accessToken } = await getGitLabAccessToken(user.id);

      const lastSync = await db.lastSync.findUnique({
        where: { userId: user.id },
      });

      const updatedAfter = lastSync?.lastSyncAt?.toISOString();
      const projectIds = user.projects.map((p) => p.gitlabProjectId);

      // Fetch from GitLab
      console.log(`  Fetching from ${projectIds.length} project(s)...`);
      const client = new GitLabClient(accessToken);
      const { issues, mergeRequests, notes } = await client.fetchEvents(
        projectIds,
        updatedAfter
      );

      console.log(`  Fetched: ${issues.length} issues, ${mergeRequests.length} MRs, ${notes.length} notes`);

      // Transform and store
      const projectMap = await getProjectMap(db, user.id, projectIds);
      const allEvents = [
        ...transformIssues(issues, projectMap),
        ...transformMergeRequests(mergeRequests, projectMap),
        ...transformNotes(notes, projectMap),
      ];

      console.log(`  Storing ${allEvents.length} events...`);
      const result = await storeEvents(db, user.id, allEvents);
      console.log(`  Stored: ${result.stored}, Skipped: ${result.skipped}`);

      // Link parent-child relationships
      console.log(`  Linking parent relationships...`);
      const linkedCount = await linkParentEvents(db, user.id);
      console.log(`  Linked: ${linkedCount} relationships`);

      // Update activity metadata
      console.log(`  Updating activity metadata...`);
      const metadataCount = await updateActivityMetadata(db, user.id);
      console.log(`  Updated: ${metadataCount} work items`);

      // Update last sync time
      await db.lastSync.upsert({
        where: { userId: user.id },
        create: { userId: user.id, lastSyncAt: new Date() },
        update: { lastSyncAt: new Date() },
      });

      console.log(`✓ Sync completed for ${user.email}\n`);
    } catch (error) {
      console.error(`✗ Sync failed for ${user.email}:`, error);
    }
  }

  console.log("=== Sync Complete ===");
}

triggerSync()
  .then(() => {
    console.log("\nSync completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nSync failed:", error);
    process.exit(1);
  })
  .finally(() => {
    db.$disconnect();
  });
