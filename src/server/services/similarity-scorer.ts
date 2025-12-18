/**
 * Similarity Scorer Service
 *
 * Combines multiple signals to calculate overall similarity between Events:
 * - Embedding similarity (title and description)
 * - Label Jaccard similarity
 * - File overlap (for MRs)
 *
 * @see docs/adr/001-embedding-approach.md for embedding architecture
 */

import type { PrismaClient } from "../../../generated/prisma";
import {
  generateEmbedding,
  prepareTextForEmbedding,
} from "./embedding-generator";

// Weights for combining similarity signals
const WEIGHTS = {
  titleSimilarity: 0.35,
  descriptionSimilarity: 0.35,
  labelSimilarity: 0.15,
  fileOverlap: 0.15,
} as const;

/**
 * Breakdown of similarity scores across different signals
 */
export interface SimilarityBreakdown {
  titleSimilarity: number;
  descriptionSimilarity: number;
  labelSimilarity: number;
  fileOverlap: number;
  totalScore: number;
}

/**
 * Event data needed for similarity comparison
 */
interface EventForComparison {
  id: string;
  title: string;
  body: string | null;
  labels: string[];
  // File paths from MRFileChange for MRs
  filePaths?: string[];
}

/**
 * Calculate Jaccard similarity between two sets
 * Jaccard = |intersection| / |union|
 */
function jaccardSimilarity(setA: string[], setB: string[]): number {
  if (setA.length === 0 && setB.length === 0) {
    return 1; // Both empty = identical
  }
  if (setA.length === 0 || setB.length === 0) {
    return 0; // One empty, one not = no similarity
  }

  const a = new Set(setA.map((s) => s.toLowerCase()));
  const b = new Set(setB.map((s) => s.toLowerCase()));

  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);

  return intersection.size / union.size;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have same dimensions");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i]!;
    const b = vecB[i]!;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Pre-computed embeddings for an event to avoid regenerating them
 */
interface EventEmbeddings {
  titleEmbedding: number[];
  bodyEmbedding: number[] | null;
}

/**
 * Generate embeddings for an event (title and optionally body)
 */
async function getEventEmbeddings(
  event: EventForComparison
): Promise<EventEmbeddings> {
  const [titleEmbedding, bodyEmbedding] = await Promise.all([
    generateEmbedding(event.title),
    event.body ? generateEmbedding(event.body) : null,
  ]);

  return { titleEmbedding, bodyEmbedding };
}

/**
 * Core scoring logic - calculates similarity from pre-computed embeddings
 */
function calculateScoreFromEmbeddings(
  embeddingsA: EventEmbeddings,
  embeddingsB: EventEmbeddings,
  dataA: EventForComparison,
  dataB: EventForComparison
): SimilarityBreakdown {
  const titleSimilarity = cosineSimilarity(
    embeddingsA.titleEmbedding,
    embeddingsB.titleEmbedding
  );

  let descriptionSimilarity: number;
  if (embeddingsA.bodyEmbedding && embeddingsB.bodyEmbedding) {
    descriptionSimilarity = cosineSimilarity(
      embeddingsA.bodyEmbedding,
      embeddingsB.bodyEmbedding
    );
  } else if (embeddingsA.bodyEmbedding && !embeddingsB.bodyEmbedding) {
    descriptionSimilarity = cosineSimilarity(
      embeddingsA.bodyEmbedding,
      embeddingsB.titleEmbedding
    );
  } else if (!embeddingsA.bodyEmbedding && embeddingsB.bodyEmbedding) {
    descriptionSimilarity = cosineSimilarity(
      embeddingsA.titleEmbedding,
      embeddingsB.bodyEmbedding
    );
  } else {
    descriptionSimilarity = titleSimilarity;
  }

  const labelSimilarity = jaccardSimilarity(dataA.labels, dataB.labels);
  const fileOverlap = jaccardSimilarity(
    dataA.filePaths ?? [],
    dataB.filePaths ?? []
  );

  const totalScore =
    titleSimilarity * WEIGHTS.titleSimilarity +
    descriptionSimilarity * WEIGHTS.descriptionSimilarity +
    labelSimilarity * WEIGHTS.labelSimilarity +
    fileOverlap * WEIGHTS.fileOverlap;

  return {
    titleSimilarity,
    descriptionSimilarity,
    labelSimilarity,
    fileOverlap,
    totalScore,
  };
}

/**
 * Calculate combined similarity score between two events
 */
export async function calculateSimilarity(
  eventA: EventForComparison,
  eventB: EventForComparison
): Promise<SimilarityBreakdown> {
  const [embeddingsA, embeddingsB] = await Promise.all([
    getEventEmbeddings(eventA),
    getEventEmbeddings(eventB),
  ]);

  return calculateScoreFromEmbeddings(embeddingsA, embeddingsB, eventA, eventB);
}

/**
 * Calculate similarity using pre-computed source embeddings
 */
async function calculateSimilarityWithCachedSource(
  sourceData: EventForComparison,
  sourceEmbeddings: EventEmbeddings,
  candidateData: EventForComparison
): Promise<SimilarityBreakdown> {
  const candidateEmbeddings = await getEventEmbeddings(candidateData);
  return calculateScoreFromEmbeddings(
    sourceEmbeddings,
    candidateEmbeddings,
    sourceData,
    candidateData
  );
}

/**
 * Find similar events with combined scoring
 *
 * @param db - Prisma client
 * @param eventId - Source event to find similar events for
 * @param limit - Maximum number of results
 * @param threshold - Minimum total score (0-1)
 * @returns Array of similar events with similarity breakdown
 */
export async function findSimilarWithCombinedScore(
  db: PrismaClient,
  eventId: string,
  limit = 10,
  threshold = 0.5
): Promise<
  Array<{
    eventId: string;
    similarity: SimilarityBreakdown;
  }>
> {
  // Get the source event with its data
  const sourceEvent = await db.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      userId: true,
      title: true,
      body: true,
      labels: true,
      type: true,
      mrFileChanges: {
        select: { filePath: true },
      },
    },
  });

  if (!sourceEvent) {
    throw new Error(`Event not found: ${eventId}`);
  }

  const sourceData: EventForComparison = {
    id: sourceEvent.id,
    title: sourceEvent.title,
    body: sourceEvent.body,
    labels: sourceEvent.labels,
    filePaths: sourceEvent.mrFileChanges.map((f) => f.filePath),
  };

  // Pre-compute source embeddings once (optimization)
  const sourceEmbeddings = await getEventEmbeddings(sourceData);

  // First pass: use embedding similarity to get candidates
  // This is more efficient than calculating combined score for all events
  const embedding = await generateEmbedding(
    prepareTextForEmbedding(sourceEvent.title, sourceEvent.body)
  );
  const vectorString = `[${embedding.join(",")}]`;

  // Get candidates with at least some embedding similarity
  const candidates = await db.$queryRaw<
    Array<{
      id: string;
      title: string;
      body: string | null;
      labels: string[];
      distance: number;
    }>
  >`
    SELECT
      e.id,
      e.title,
      e.body,
      e.labels,
      e.embedding <=> ${vectorString}::vector as distance
    FROM "Event" e
    WHERE e."userId" = ${sourceEvent.userId}
      AND e.id != ${eventId}
      AND e.embedding IS NOT NULL
      AND (1 - (e.embedding <=> ${vectorString}::vector)) >= ${threshold * 0.5}
    ORDER BY distance ASC
    LIMIT ${limit * 3}
  `;

  // Get file changes for candidates that are MRs
  const candidateIds = candidates.map((c) => c.id);
  const fileChanges = await db.mRFileChange.findMany({
    where: { eventId: { in: candidateIds } },
    select: { eventId: true, filePath: true },
  });

  // Group file changes by event
  const fileChangesByEvent = new Map<string, string[]>();
  for (const fc of fileChanges) {
    const existing = fileChangesByEvent.get(fc.eventId) ?? [];
    existing.push(fc.filePath);
    fileChangesByEvent.set(fc.eventId, existing);
  }

  // Calculate combined scores for all candidates in parallel
  const BATCH_SIZE = 5;
  const results: Array<{
    eventId: string;
    similarity: SimilarityBreakdown;
  }> = [];

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (candidate) => {
        const candidateData: EventForComparison = {
          id: candidate.id,
          title: candidate.title,
          body: candidate.body,
          labels: candidate.labels,
          filePaths: fileChangesByEvent.get(candidate.id),
        };

        const similarity = await calculateSimilarityWithCachedSource(
          sourceData,
          sourceEmbeddings,
          candidateData
        );

        return { eventId: candidate.id, similarity };
      })
    );

    for (const result of batchResults) {
      if (result.similarity.totalScore >= threshold) {
        results.push(result);
      }
    }
  }

  // Sort by total score and return top results
  results.sort((a, b) => b.similarity.totalScore - a.similarity.totalScore);
  return results.slice(0, limit);
}

/**
 * Check if two events are potential duplicates
 * Uses a higher threshold for duplicate detection
 *
 * @param db - Prisma client
 * @param eventA - First event ID
 * @param eventB - Second event ID
 * @returns True if events are likely duplicates
 */
export async function arePotentialDuplicates(
  db: PrismaClient,
  eventIdA: string,
  eventIdB: string
): Promise<{ isDuplicate: boolean; similarity: SimilarityBreakdown | null }> {
  const [eventA, eventB] = await Promise.all([
    db.event.findUnique({
      where: { id: eventIdA },
      select: {
        id: true,
        title: true,
        body: true,
        labels: true,
        mrFileChanges: { select: { filePath: true } },
      },
    }),
    db.event.findUnique({
      where: { id: eventIdB },
      select: {
        id: true,
        title: true,
        body: true,
        labels: true,
        mrFileChanges: { select: { filePath: true } },
      },
    }),
  ]);

  if (!eventA || !eventB) {
    return { isDuplicate: false, similarity: null };
  }

  const similarity = await calculateSimilarity(
    {
      id: eventA.id,
      title: eventA.title,
      body: eventA.body,
      labels: eventA.labels,
      filePaths: eventA.mrFileChanges.map((f) => f.filePath),
    },
    {
      id: eventB.id,
      title: eventB.title,
      body: eventB.body,
      labels: eventB.labels,
      filePaths: eventB.mrFileChanges.map((f) => f.filePath),
    }
  );

  // Threshold for duplicate detection (higher than similarity search)
  const DUPLICATE_THRESHOLD = 0.85;

  return {
    isDuplicate: similarity.totalScore >= DUPLICATE_THRESHOLD,
    similarity,
  };
}
