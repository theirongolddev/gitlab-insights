/**
 * Prepare Database for Full GitLab Re-Sync
 * 
 * This script prepares the database for a fresh sync by:
 * 1. Truncating the Event table (to allow fresh data with relationships)
 * 2. Clearing LastSync records for all users
 * 
 * After running this script, users should trigger a manual refresh
 * through the application to re-sync their data with relationship fields.
 * 
 * Usage: npx tsx scripts/full-sync-gitlab.ts
 */

import { PrismaClient } from "../generated/prisma";

const db = new PrismaClient();

async function prepareForFullSync() {
  console.log("Preparing database for full GitLab re-sync...\n");

  // Step 1: Check current event count
  const beforeCount = await db.event.count();
  console.log(`Current events in database: ${beforeCount}`);

  // Step 2: Truncate Event table to allow fresh data with relationships
  console.log("\nTruncating Event table...");
  await db.$executeRaw`TRUNCATE TABLE "Event" CASCADE`;
  console.log("Event table truncated.");

  // Step 3: Clear all LastSync records to force full fetch for all users
  console.log("\nClearing LastSync records...");
  const deletedSyncs = await db.lastSync.deleteMany();
  console.log(`Cleared ${deletedSyncs.count} LastSync record(s).`);

  // Step 4: Verify
  const afterCount = await db.event.count();
  console.log(`\n=== Database Prepared ===`);
  console.log(`Events remaining: ${afterCount}`);
  console.log(`\nNext steps:`);
  console.log(`1. Log into the application`);
  console.log(`2. Navigate to the work items list`);
  console.log(`3. Click the refresh button to trigger a full sync`);
  console.log(`4. Wait for the sync to complete (may take several minutes)`);
}

prepareForFullSync()
  .then(() => {
    console.log("\nDatabase preparation completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nPreparation failed:", error);
    process.exit(1);
  });
