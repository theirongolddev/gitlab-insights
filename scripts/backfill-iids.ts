/**
 * Backfill IIDs from GitLab URLs for existing events
 *
 * This script extracts the IID (human-readable issue/MR number) from gitlabUrl
 * and populates the iid field for all events that don't have it set.
 *
 * Run with: npx tsx scripts/backfill-iids.ts
 */

import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * Extract the IID from a GitLab URL
 *
 * URLs have format: https://gitlab.com/group/project/-/issues/123
 * or: https://gitlab.com/group/project/-/merge_requests/456
 * or: https://gitlab.com/group/project/-/work_items/789
 */
function extractIidFromUrl(gitlabUrl: string): number | null {
  const match = gitlabUrl.match(/(?:issues|merge_requests|work_items)\/(\d+)/);
  return match?.[1] ? parseInt(match[1], 10) : null;
}

async function backfillIids(): Promise<void> {
  console.log("Starting IID backfill...\n");

  // Get all events without iid that are issues or merge_requests
  const events = await prisma.event.findMany({
    where: {
      iid: null,
      type: { in: ["issue", "merge_request"] },
    },
    select: {
      id: true,
      gitlabUrl: true,
      type: true,
    },
  });

  console.log(`Found ${events.length} events without IID`);

  if (events.length === 0) {
    console.log("Nothing to backfill!");
    return;
  }

  let updated = 0;
  let failed = 0;

  // Process in batches of 100
  const batchSize = 100;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (event) => {
        const iid = extractIidFromUrl(event.gitlabUrl);
        if (iid) {
          await prisma.event.update({
            where: { id: event.id },
            data: { iid },
          });
          updated++;
        } else {
          console.log(`  Failed to extract IID from: ${event.gitlabUrl}`);
          failed++;
        }
      })
    );

    console.log(`  Processed ${Math.min(i + batchSize, events.length)}/${events.length}`);
  }

  console.log(`\nBackfill complete!`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Failed: ${failed}`);
}

backfillIids()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
