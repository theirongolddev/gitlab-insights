/**
 * Embedding Generator Service
 *
 * Generates vector embeddings for Events using transformers.js with all-MiniLM-L6-v2.
 * The embeddings enable similarity search and duplicate detection.
 *
 * @see docs/adr/001-embedding-approach.md for architecture decision
 */

import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";
import type { PrismaClient } from "../../../generated/prisma";

// Model produces 384-dimensional vectors
const EMBEDDING_DIMENSIONS = 384;

// Maximum tokens to embed (model max is 512, leaving headroom)
const MAX_TOKENS = 400;

// Approximate chars per token (conservative estimate for English text)
const CHARS_PER_TOKEN = 4;

// Singleton pipeline instance (lazy loaded)
let embeddingPipeline: FeatureExtractionPipeline | null = null;

/**
 * Initialize or retrieve the embedding pipeline.
 * Uses singleton pattern to avoid loading model multiple times.
 */
async function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
  if (!embeddingPipeline) {
    // First call downloads the model (~90MB) - cached for subsequent uses
    embeddingPipeline = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }
  return embeddingPipeline;
}

/**
 * Truncate text to approximately the specified number of tokens.
 * Uses character-based estimation since tokenization is expensive.
 */
function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (text.length <= maxChars) {
    return text;
  }
  // Truncate and add ellipsis to indicate truncation
  return text.slice(0, maxChars - 3) + "...";
}

/**
 * Prepare text for embedding by combining title and body.
 * Truncates to model's maximum context length.
 */
export function prepareTextForEmbedding(
  title: string,
  body: string | null
): string {
  const combined = body ? `${title}\n\n${body}` : title;
  return truncateToTokens(combined, MAX_TOKENS);
}

/**
 * Generate embedding vector for the given text.
 * Returns a 384-dimensional normalized vector.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const embedder = await getEmbeddingPipeline();

  // Generate embedding with mean pooling and normalization
  const output = await embedder(text, {
    pooling: "mean",
    normalize: true,
  });

  // Extract the embedding data from the Tensor
  const embedding = Array.from(output.data as Float32Array);

  // Validate dimensions
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Unexpected embedding dimensions: ${embedding.length}, expected ${EMBEDDING_DIMENSIONS}`
    );
  }

  return embedding;
}

/**
 * Generate and store embedding for an Event.
 * Combines title and body, generates embedding, and updates the database.
 */
export async function embedEvent(
  db: PrismaClient,
  eventId: string
): Promise<void> {
  // Fetch the event
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, body: true },
  });

  if (!event) {
    throw new Error(`Event not found: ${eventId}`);
  }

  // Prepare text and generate embedding
  const text = prepareTextForEmbedding(event.title, event.body);
  const embedding = await generateEmbedding(text);

  // Store embedding using raw SQL (Prisma doesn't support pgvector directly)
  const vectorString = `[${embedding.join(",")}]`;
  await db.$executeRaw`
    UPDATE "Event"
    SET embedding = ${vectorString}::vector
    WHERE id = ${eventId}
  `;
}

/**
 * Generate and store embeddings for multiple Events in batch.
 * Useful for backfilling existing events.
 *
 * @param db - Prisma client
 * @param eventIds - Array of event IDs to embed
 * @param onProgress - Optional callback for progress updates
 * @returns Number of events successfully embedded
 */
export async function embedEvents(
  db: PrismaClient,
  eventIds: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<number> {
  let successCount = 0;

  for (let i = 0; i < eventIds.length; i++) {
    const eventId = eventIds[i];
    if (!eventId) continue;

    try {
      await embedEvent(db, eventId);
      successCount++;
    } catch (error) {
      // Log but continue with other events
      console.error(`Failed to embed event ${eventId}:`, error);
    }

    if (onProgress) {
      onProgress(i + 1, eventIds.length);
    }
  }

  return successCount;
}

/**
 * Find events similar to the given text using cosine similarity.
 * Uses pgvector's <=> operator for efficient nearest neighbor search.
 *
 * @param db - Prisma client
 * @param text - Text to find similar events for
 * @param userId - User ID to scope the search
 * @param limit - Maximum number of results
 * @param threshold - Minimum similarity score (0-1)
 * @returns Array of event IDs with similarity scores
 */
export async function findSimilarEvents(
  db: PrismaClient,
  text: string,
  userId: string,
  limit = 10,
  threshold = 0.7
): Promise<Array<{ id: string; similarity: number }>> {
  const embedding = await generateEmbedding(text);
  const vectorString = `[${embedding.join(",")}]`;

  // Query using pgvector cosine distance
  // Cosine distance = 1 - cosine similarity, so we convert back
  const results = await db.$queryRaw<Array<{ id: string; distance: number }>>`
    SELECT id, embedding <=> ${vectorString}::vector as distance
    FROM "Event"
    WHERE "userId" = ${userId}
      AND embedding IS NOT NULL
      AND (1 - (embedding <=> ${vectorString}::vector)) >= ${threshold}
    ORDER BY distance ASC
    LIMIT ${limit}
  `;

  return results.map((r) => ({
    id: r.id,
    similarity: 1 - r.distance, // Convert distance back to similarity
  }));
}

/**
 * Find events similar to an existing event.
 * Useful for duplicate/related item detection.
 *
 * @param db - Prisma client
 * @param eventId - Source event ID
 * @param limit - Maximum number of results
 * @param threshold - Minimum similarity score (0-1)
 * @returns Array of event IDs with similarity scores (excludes source event)
 */
export async function findSimilarToEvent(
  db: PrismaClient,
  eventId: string,
  limit = 10,
  threshold = 0.7
): Promise<Array<{ id: string; similarity: number }>> {
  // Get the source event's embedding
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { userId: true, title: true, body: true },
  });

  if (!event) {
    throw new Error(`Event not found: ${eventId}`);
  }

  // Generate embedding for the source event
  const text = prepareTextForEmbedding(event.title, event.body);
  const embedding = await generateEmbedding(text);
  const vectorString = `[${embedding.join(",")}]`;

  // Find similar events, excluding the source
  const results = await db.$queryRaw<Array<{ id: string; distance: number }>>`
    SELECT id, embedding <=> ${vectorString}::vector as distance
    FROM "Event"
    WHERE "userId" = ${event.userId}
      AND id != ${eventId}
      AND embedding IS NOT NULL
      AND (1 - (embedding <=> ${vectorString}::vector)) >= ${threshold}
    ORDER BY distance ASC
    LIMIT ${limit}
  `;

  return results.map((r) => ({
    id: r.id,
    similarity: 1 - r.distance,
  }));
}
