/**
 * Person Extraction Service
 *
 * Extracts and manages Person records from GitLab API responses and Events.
 * Handles deduplication and upsert semantics for person data.
 */

import type { PrismaClient, Person } from "../../../generated/prisma";
import { logger } from "~/lib/logger";

export interface ExtractedPerson {
  gitlabId: number;
  username: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface GitLabAuthor {
  id: number;
  username: string;
  name?: string;
  avatar_url?: string;
}

export interface ExtractPeopleResult {
  created: number;
  updated: number;
  total: number;
}

/**
 * Extract person data from a GitLab API author object
 */
export function extractPersonFromGitLabAuthor(
  author: GitLabAuthor
): ExtractedPerson {
  return {
    gitlabId: author.id,
    username: author.username,
    name: author.name ?? null,
    avatarUrl: author.avatar_url ?? null,
  };
}

/**
 * Upsert a single person - create if new, update if exists
 * Returns the created/updated Person record
 */
export async function upsertPerson(
  db: PrismaClient,
  userId: string,
  person: ExtractedPerson
): Promise<Person> {
  return db.person.upsert({
    where: {
      userId_gitlabId: {
        userId,
        gitlabId: person.gitlabId,
      },
    },
    create: {
      userId,
      gitlabId: person.gitlabId,
      username: person.username,
      name: person.name,
      avatarUrl: person.avatarUrl,
    },
    update: {
      username: person.username,
      name: person.name,
      avatarUrl: person.avatarUrl,
    },
  });
}

/**
 * Batch upsert multiple people efficiently
 * Uses individual upserts wrapped in a transaction for consistency
 */
// Maximum people to process in a single transaction to prevent long-running locks
const BATCH_SIZE = 100;

export async function upsertPeople(
  db: PrismaClient,
  userId: string,
  people: ExtractedPerson[]
): Promise<ExtractPeopleResult> {
  if (people.length === 0) {
    return { created: 0, updated: 0, total: 0 };
  }

  // Deduplicate by gitlabId before processing
  const uniquePeople = deduplicatePeople(people);

  let totalCreated = 0;
  let totalUpdated = 0;

  // Process in batches to prevent long-running transactions that lock the DB
  for (let i = 0; i < uniquePeople.length; i += BATCH_SIZE) {
    const batch = uniquePeople.slice(i, i + BATCH_SIZE);

    const { created, updated } = await db.$transaction(
      async (tx) => {
        // Check which people already exist (inside transaction for consistency)
        const existingPeople = await tx.person.findMany({
          where: {
            userId,
            gitlabId: { in: batch.map((p) => p.gitlabId) },
          },
          select: { gitlabId: true },
        });

        const existingIds = new Set(existingPeople.map((p) => p.gitlabId));

        // Perform upserts
        for (const person of batch) {
          await tx.person.upsert({
            where: {
              userId_gitlabId: {
                userId,
                gitlabId: person.gitlabId,
              },
            },
            create: {
              userId,
              gitlabId: person.gitlabId,
              username: person.username,
              name: person.name,
              avatarUrl: person.avatarUrl,
            },
            update: {
              username: person.username,
              name: person.name,
              avatarUrl: person.avatarUrl,
            },
          });
        }

        // Calculate stats inside transaction for accuracy
        return {
          created: batch.filter((p) => !existingIds.has(p.gitlabId)).length,
          updated: batch.filter((p) => existingIds.has(p.gitlabId)).length,
        };
      },
      {
        timeout: 15000, // 15 second timeout per batch
        maxWait: 5000, // 5 second max wait to acquire connection
      }
    );

    totalCreated += created;
    totalUpdated += updated;
  }

  const created = totalCreated;
  const updated = totalUpdated;

  logger.info(
    { userId, created, updated, total: uniquePeople.length },
    "person-extractor: Upserted people"
  );

  return {
    created,
    updated,
    total: uniquePeople.length,
  };
}

/**
 * Analyze existing Events to find unique authors.
 *
 * LIMITATION: This function cannot create Person records because Events
 * only store username strings, not GitLab user IDs. Person records require
 * gitlabId for proper deduplication and linking.
 *
 * Use this function only for analysis/reporting. To populate Person records,
 * use extractPeopleFromGitLabResponses() during sync when you have full
 * GitLab API author objects with IDs.
 *
 * @returns Count of unique authors found (no records created)
 */
export async function extractPeopleFromEvents(
  db: PrismaClient,
  userId: string
): Promise<ExtractPeopleResult> {
  const events = await db.event.findMany({
    where: { userId },
    select: {
      author: true,
      authorAvatar: true,
    },
    distinct: ["author"],
  });

  if (events.length === 0) {
    return { created: 0, updated: 0, total: 0 };
  }

  // Count unique authors
  const uniqueAuthors = new Set(events.map((e) => e.author));

  logger.warn(
    { userId, uniqueAuthors: uniqueAuthors.size },
    "person-extractor: extractPeopleFromEvents cannot create Person records (missing gitlabId). Use GitLab API sync to populate Person data."
  );

  return {
    created: 0,
    updated: 0,
    total: uniqueAuthors.size,
  };
}

/**
 * Extract people from GitLab API responses during sync
 * This is the primary extraction method for new data
 */
export function extractPeopleFromGitLabResponses(
  issues: Array<{ author: GitLabAuthor }>,
  mergeRequests: Array<{ author: GitLabAuthor }>,
  notes: Array<{ author: GitLabAuthor }>
): ExtractedPerson[] {
  const people: ExtractedPerson[] = [];

  for (const issue of issues) {
    people.push(extractPersonFromGitLabAuthor(issue.author));
  }

  for (const mr of mergeRequests) {
    people.push(extractPersonFromGitLabAuthor(mr.author));
  }

  for (const note of notes) {
    people.push(extractPersonFromGitLabAuthor(note.author));
  }

  return deduplicatePeople(people);
}

/**
 * Deduplicate people by gitlabId, merging the most complete data from all records
 */
function deduplicatePeople(people: ExtractedPerson[]): ExtractedPerson[] {
  const personMap = new Map<number, ExtractedPerson>();

  for (const person of people) {
    const existing = personMap.get(person.gitlabId);

    if (!existing) {
      personMap.set(person.gitlabId, person);
    } else {
      // Merge fields, preferring non-null/non-empty values
      personMap.set(person.gitlabId, {
        gitlabId: person.gitlabId,
        username: person.username || existing.username,
        name: person.name ?? existing.name,
        avatarUrl: person.avatarUrl ?? existing.avatarUrl,
      });
    }
  }

  return Array.from(personMap.values());
}
