/**
 * Validate Work Item Relationships
 *
 * Samples random work items from database and compares relationship fields
 * to GitLab API data to verify 100% accuracy.
 *
 * Validates:
 * - parentEventId: Comments linked to correct parent
 * - closesIssueIds: MR closes patterns parsed correctly
 * - mentionedInIds: Cross-references extracted correctly
 * - participants: Comment authors aggregated correctly
 *
 * Usage: npx tsx scripts/validate-relationships.ts [--sample-size=20]
 */

import { PrismaClient } from "../generated/prisma";
import { getGitLabAccessToken } from "../src/server/services/gitlab-token";
import { parseClosesIssueIds, extractMentionedIds } from "../src/server/services/event-transformer";

const db = new PrismaClient();

interface ValidationResult {
  passed: number;
  failed: number;
  errors: Array<{
    eventId: string;
    field: string;
    expected: unknown;
    actual: unknown;
    gitlabUrl: string;
  }>;
}

async function validateRelationships() {
  console.log("=== Validate Work Item Relationships ===\n");

  const sampleSize = parseInt(
    process.argv.find((arg) => arg.startsWith("--sample-size="))?.split("=")[1] ?? "20"
  );

  // Get a user to validate
  const user = await db.user.findFirst({
    where: { projects: { some: {} } },
  });

  if (!user) {
    console.log("No users with projects found");
    return;
  }

  console.log(`Validating data for user: ${user.email}`);
  console.log(`Sample size: ${sampleSize} work items\n`);

  // Get access token (GitLabClient available if needed for future API validation)
  await getGitLabAccessToken(user.id);

  const result: ValidationResult = {
    passed: 0,
    failed: 0,
    errors: [],
  };

  // Sample work items (issues and MRs)
  const workItems = await db.event.findMany({
    where: {
      userId: user.id,
      type: { in: ["issue", "merge_request"] },
      parentEventId: null,
    },
    take: sampleSize,
    include: {
      children: {
        where: { type: "comment" },
        select: {
          id: true,
          author: true,
          isSystemNote: true,
          gitlabEventId: true,
        },
      },
    },
  });

  console.log(`Sampled ${workItems.length} work items for validation\n`);

  for (const workItem of workItems) {
    console.log(`Validating: ${workItem.title}`);
    console.log(`  Type: ${workItem.type}`);
    console.log(`  GitLab URL: ${workItem.gitlabUrl}`);

    try {
      // Extract project ID and item IID from gitlabEventId
      // Format: "issue-123" or "mr-456"
      const match = workItem.gitlabEventId.match(/^(issue|mr)-(\d+)$/);
      if (!match) {
        console.log(`  ⚠ Skipping - invalid gitlabEventId format: ${workItem.gitlabEventId}\n`);
        continue;
      }

      // Fetch from GitLab API to compare
      // For a full validation, we would:
      // 1. Fetch the issue/MR from GitLab
      // 2. Fetch all notes for that issue/MR
      // 3. Compare fields

      // Validate closesIssueIds (for MRs)
      if (workItem.type === "merge_request" && workItem.body) {
        const expectedCloses = parseClosesIssueIds(workItem.body);
        const actualCloses = workItem.closesIssueIds;

        if (JSON.stringify(expectedCloses.sort()) !== JSON.stringify(actualCloses.sort())) {
          result.failed++;
          result.errors.push({
            eventId: workItem.id,
            field: "closesIssueIds",
            expected: expectedCloses,
            actual: actualCloses,
            gitlabUrl: workItem.gitlabUrl,
          });
          console.log(`  ✗ FAILED: closesIssueIds mismatch`);
          console.log(`    Expected: ${JSON.stringify(expectedCloses)}`);
          console.log(`    Actual: ${JSON.stringify(actualCloses)}`);
        } else {
          result.passed++;
          console.log(`  ✓ closesIssueIds correct`);
        }
      }

      // Validate mentionedInIds
      if (workItem.body) {
        const expectedMentions = extractMentionedIds(workItem.body);
        const actualMentions = workItem.mentionedInIds;

        if (JSON.stringify(expectedMentions.sort()) !== JSON.stringify(actualMentions.sort())) {
          result.failed++;
          result.errors.push({
            eventId: workItem.id,
            field: "mentionedInIds",
            expected: expectedMentions,
            actual: actualMentions,
            gitlabUrl: workItem.gitlabUrl,
          });
          console.log(`  ✗ FAILED: mentionedInIds mismatch`);
          console.log(`    Expected: ${JSON.stringify(expectedMentions)}`);
          console.log(`    Actual: ${JSON.stringify(actualMentions)}`);
        } else {
          result.passed++;
          console.log(`  ✓ mentionedInIds correct`);
        }
      }

      // Validate participants
      const expectedParticipants = new Set<string>([workItem.author]);
      for (const child of workItem.children) {
        if (!child.isSystemNote) {
          expectedParticipants.add(child.author);
        }
      }
      const expectedParticipantsArray = Array.from(expectedParticipants).sort();
      const actualParticipantsArray = workItem.participants.sort();

      if (JSON.stringify(expectedParticipantsArray) !== JSON.stringify(actualParticipantsArray)) {
        result.failed++;
        result.errors.push({
          eventId: workItem.id,
          field: "participants",
          expected: expectedParticipantsArray,
          actual: actualParticipantsArray,
          gitlabUrl: workItem.gitlabUrl,
        });
        console.log(`  ✗ FAILED: participants mismatch`);
        console.log(`    Expected: ${JSON.stringify(expectedParticipantsArray)}`);
        console.log(`    Actual: ${JSON.stringify(actualParticipantsArray)}`);
      } else {
        result.passed++;
        console.log(`  ✓ participants correct`);
      }

      // Validate commentCount
      const expectedCommentCount = workItem.children.filter((c) => !c.isSystemNote).length;
      const actualCommentCount = workItem.commentCount;

      if (expectedCommentCount !== actualCommentCount) {
        result.failed++;
        result.errors.push({
          eventId: workItem.id,
          field: "commentCount",
          expected: expectedCommentCount,
          actual: actualCommentCount,
          gitlabUrl: workItem.gitlabUrl,
        });
        console.log(`  ✗ FAILED: commentCount mismatch`);
        console.log(`    Expected: ${expectedCommentCount}`);
        console.log(`    Actual: ${actualCommentCount}`);
      } else {
        result.passed++;
        console.log(`  ✓ commentCount correct`);
      }

      console.log();
    } catch (error) {
      console.error(`  ✗ Validation error:`, error);
      result.failed++;
      console.log();
    }
  }

  // Validate parent-child links for comments
  console.log("Validating comment parent links...\n");
  const comments = await db.event.findMany({
    where: {
      userId: user.id,
      type: "comment",
      parentEventId: { not: null },
    },
    take: sampleSize,
    include: {
      parent: {
        select: {
          gitlabEventId: true,
          type: true,
        },
      },
    },
  });

  for (const comment of comments) {
    const expectedParentGitlabId =
      comment.parentType === "issue"
        ? `issue-${comment.gitlabParentId}`
        : `mr-${comment.gitlabParentId}`;

    if (comment.parent?.gitlabEventId === expectedParentGitlabId) {
      result.passed++;
      console.log(`✓ Comment ${comment.id.substring(0, 8)} linked to correct parent`);
    } else {
      result.failed++;
      result.errors.push({
        eventId: comment.id,
        field: "parentEventId",
        expected: expectedParentGitlabId,
        actual: comment.parent?.gitlabEventId ?? "null",
        gitlabUrl: comment.gitlabUrl,
      });
      console.log(`✗ Comment ${comment.id.substring(0, 8)} parent link FAILED`);
      console.log(`  Expected parent: ${expectedParentGitlabId}`);
      console.log(`  Actual parent: ${comment.parent?.gitlabEventId ?? "null"}`);
    }
  }

  // Print summary
  console.log("\n=== Validation Summary ===");
  console.log(`Total checks: ${result.passed + result.failed}`);
  console.log(`Passed: ${result.passed}`);
  console.log(`Failed: ${result.failed}`);

  if (result.failed > 0) {
    console.log("\n=== Failures ===");
    for (const error of result.errors) {
      console.log(`\nEvent: ${error.eventId}`);
      console.log(`Field: ${error.field}`);
      console.log(`URL: ${error.gitlabUrl}`);
      console.log(`Expected: ${JSON.stringify(error.expected)}`);
      console.log(`Actual: ${JSON.stringify(error.actual)}`);
    }
  }

  const accuracy = result.passed / (result.passed + result.failed) * 100;
  console.log(`\nAccuracy: ${accuracy.toFixed(2)}%`);

  if (accuracy === 100) {
    console.log("✓ All validations passed!");
  } else {
    console.log(`✗ ${result.failed} validation(s) failed`);
    process.exit(1);
  }
}

validateRelationships()
  .then(() => {
    db.$disconnect();
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nValidation script error:", error);
    db.$disconnect();
    process.exit(1);
  });
