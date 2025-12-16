/**
 * Backfill Work Item Relationships
 *
 * This script populates parent-child relationships and activity metadata
 * for existing Event data without re-fetching from GitLab.
 *
 * Performs:
 * 1. Links comments to parent issues/MRs (linkParentEvents)
 * 2. Computes activity metadata (updateActivityMetadata)
 *
 * Safe to run multiple times (idempotent).
 *
 * Usage: npx tsx scripts/backfill-work-item-relationships.ts
 */

import { PrismaClient } from "../generated/prisma";
import { linkParentEvents, updateActivityMetadata } from "../src/server/services/event-transformer";
import * as readline from "readline";

const db = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function backfillRelationships() {
  console.log("=== Backfill Work Item Relationships ===\n");

  // Get stats
  const totalEvents = await db.event.count();
  const commentsWithoutParent = await db.event.count({
    where: {
      type: "comment",
      parentEventId: null,
      gitlabParentId: { not: null },
    },
  });
  const workItems = await db.event.count({
    where: {
      type: { in: ["issue", "merge_request"] },
      parentEventId: null,
    },
  });

  console.log(`Total events: ${totalEvents}`);
  console.log(`Comments needing parent links: ${commentsWithoutParent}`);
  console.log(`Work items needing metadata: ${workItems}\n`);

  if (commentsWithoutParent === 0 && workItems === 0) {
    console.log("No backfill needed - all relationships already populated!");
    return;
  }

  // Check for --yes flag to skip confirmation
  const autoYes = process.argv.includes("--yes");

  if (!autoYes) {
    const answer = await question(
      "Proceed with backfill? This will update existing records. (yes/no): "
    );

    if (answer.toLowerCase() !== "yes") {
      console.log("Backfill cancelled.");
      return;
    }
  } else {
    console.log("Auto-confirmed with --yes flag");
  }

  console.log("\nStarting backfill...\n");

  // Get all users
  const users = await db.user.findMany({
    select: { id: true, email: true },
  });

  let totalLinked = 0;
  let totalMetadataUpdated = 0;

  for (const user of users) {
    console.log(`Processing user: ${user.email}`);

    // Link parent-child relationships
    const linked = await linkParentEvents(db, user.id);
    console.log(`  Linked ${linked} comments to parents`);
    totalLinked += linked;

    // Update activity metadata
    const metadataUpdated = await updateActivityMetadata(db, user.id);
    console.log(`  Updated metadata for ${metadataUpdated} work items`);
    totalMetadataUpdated += metadataUpdated;
  }

  console.log("\n=== Backfill Complete ===");
  console.log(`Total relationships linked: ${totalLinked}`);
  console.log(`Total work items updated: ${totalMetadataUpdated}`);
}

backfillRelationships()
  .then(() => {
    rl.close();
    console.log("\nBackfill completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    rl.close();
    console.error("\nBackfill failed:", error);
    process.exit(1);
  });
