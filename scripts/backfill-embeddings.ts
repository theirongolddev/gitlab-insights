/**
 * Backfill Embeddings
 *
 * Generates vector embeddings for all existing Events that don't have them.
 * Uses batch processing for efficiency and can be resumed if interrupted.
 *
 * Safe to run multiple times (idempotent) - skips events with existing embeddings.
 *
 * Usage:
 *   npx tsx scripts/backfill-embeddings.ts           # Interactive mode
 *   npx tsx scripts/backfill-embeddings.ts --yes     # Auto-confirm
 *   npx tsx scripts/backfill-embeddings.ts --batch=100  # Custom batch size
 */

import { PrismaClient } from "../generated/prisma";
import {
  embedEvent,
  prepareTextForEmbedding,
  generateEmbedding,
} from "../src/server/services/embedding-generator";
import * as readline from "readline";

// Default batch size - 50 items at a time for rate limiting
const DEFAULT_BATCH_SIZE = 50;

// Delay between batches in ms (to avoid overwhelming model inference)
const BATCH_DELAY_MS = 100;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

interface BackfillStats {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: Array<{ eventId: string; error: string }>;
}

async function backfillEmbeddings(batchSize: number): Promise<BackfillStats> {
  console.log("=== Backfill Event Embeddings ===\n");

  // Get counts
  const totalEvents = await db.event.count();
  const eventsWithEmbedding = await db.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "Event" WHERE embedding IS NOT NULL
  `;
  const embeddedCount = Number(eventsWithEmbedding[0]?.count ?? 0);
  const eventsNeedingEmbedding = totalEvents - embeddedCount;

  console.log(`Total events: ${totalEvents}`);
  console.log(`Already embedded: ${embeddedCount}`);
  console.log(`Needing embedding: ${eventsNeedingEmbedding}`);
  console.log(`Batch size: ${batchSize}\n`);

  if (eventsNeedingEmbedding === 0) {
    console.log("No backfill needed - all events already have embeddings!");
    return {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: embeddedCount,
      errors: [],
    };
  }

  // Estimate time (roughly 50ms per embedding on average)
  const estimatedMs = eventsNeedingEmbedding * 50;
  console.log(`Estimated time: ${formatDuration(estimatedMs)}\n`);

  // Check for --yes flag to skip confirmation
  const autoYes = process.argv.includes("--yes");

  if (!autoYes) {
    const answer = await question(
      "Proceed with embedding generation? This may take a while. (yes/no): "
    );

    if (answer.toLowerCase() !== "yes") {
      console.log("Backfill cancelled.");
      return {
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
        errors: [],
      };
    }
  } else {
    console.log("Auto-confirmed with --yes flag");
  }

  console.log("\nStarting backfill...\n");
  const startTime = Date.now();

  const stats: BackfillStats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: embeddedCount,
    errors: [],
  };

  // Process in batches
  let cursor: string | undefined;
  let batchNumber = 0;

  while (true) {
    batchNumber++;

    // Using raw SQL because Prisma can't filter on Unsupported types
    let events: Array<{ id: string; title: string; body: string | null }>;

    if (cursor) {
      events = await db.$queryRaw<
        Array<{ id: string; title: string; body: string | null }>
      >`
        SELECT id, title, body
        FROM "Event"
        WHERE embedding IS NULL AND id > ${cursor}
        ORDER BY id ASC
        LIMIT ${batchSize}
      `;
    } else {
      events = await db.$queryRaw<
        Array<{ id: string; title: string; body: string | null }>
      >`
        SELECT id, title, body
        FROM "Event"
        WHERE embedding IS NULL
        ORDER BY id ASC
        LIMIT ${batchSize}
      `;
    }

    if (events.length === 0) {
      break;
    }

    console.log(
      `Batch ${batchNumber}: Processing ${events.length} events...`
    );

    for (const event of events) {
      stats.processed++;

      try {
        // Generate embedding
        const text = prepareTextForEmbedding(event.title, event.body);
        const embedding = await generateEmbedding(text);

        // Store embedding
        const vectorString = `[${embedding.join(",")}]`;
        await db.$executeRaw`
          UPDATE "Event"
          SET embedding = ${vectorString}::vector
          WHERE id = ${event.id}
        `;

        stats.succeeded++;
      } catch (error) {
        stats.failed++;
        const errorMsg =
          error instanceof Error ? error.message : String(error);
        stats.errors.push({ eventId: event.id, error: errorMsg });

        // Log but continue
        console.error(`  Failed to embed ${event.id}: ${errorMsg}`);
      }

      // Progress update every 10 items
      if (stats.processed % 10 === 0) {
        const elapsed = Date.now() - startTime;
        const rate = stats.processed / (elapsed / 1000);
        const remaining = eventsNeedingEmbedding - stats.processed;
        const eta = remaining / rate;

        process.stdout.write(
          `\r  Progress: ${stats.processed}/${eventsNeedingEmbedding} ` +
            `(${((stats.processed / eventsNeedingEmbedding) * 100).toFixed(1)}%) ` +
            `- Rate: ${rate.toFixed(1)}/s - ETA: ${formatDuration(eta * 1000)}   `
        );
      }
    }

    // Update cursor for next batch
    const lastEvent = events[events.length - 1];
    cursor = lastEvent?.id;

    // Small delay between batches
    await sleep(BATCH_DELAY_MS);
  }

  console.log("\n");

  const elapsed = Date.now() - startTime;
  console.log("=== Backfill Complete ===");
  console.log(`Time elapsed: ${formatDuration(elapsed)}`);
  console.log(`Events processed: ${stats.processed}`);
  console.log(`  Succeeded: ${stats.succeeded}`);
  console.log(`  Failed: ${stats.failed}`);
  console.log(`  Previously embedded: ${stats.skipped}`);

  if (stats.errors.length > 0) {
    console.log(`\nErrors (first 10):`);
    stats.errors.slice(0, 10).forEach(({ eventId, error }) => {
      console.log(`  ${eventId}: ${error}`);
    });
    if (stats.errors.length > 10) {
      console.log(`  ... and ${stats.errors.length - 10} more`);
    }
  }

  return stats;
}

// Parse command line arguments
function getBatchSize(): number {
  const batchArg = process.argv.find((arg) => arg.startsWith("--batch="));
  if (batchArg) {
    const size = parseInt(batchArg.split("=")[1] ?? "", 10);
    if (!isNaN(size) && size > 0) {
      return size;
    }
  }
  return DEFAULT_BATCH_SIZE;
}

// Main execution
const batchSize = getBatchSize();

backfillEmbeddings(batchSize)
  .then((stats) => {
    rl.close();
    console.log("\nBackfill completed successfully!");
    process.exit(stats.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    rl.close();
    console.error("\nBackfill failed:", error);
    process.exit(1);
  });
