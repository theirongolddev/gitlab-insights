/**
 * Seed Script for Performance Testing
 *
 * Creates 10,000 realistic test events for FTS performance validation.
 * Generates varied titles and bodies with common developer keywords.
 *
 * Usage:
 *   npx tsx scripts/seed-events.ts
 *
 * Requirements:
 *   - Database must be running
 *   - User must exist (use the first user in the database)
 */

import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

// Realistic GitLab event titles for various event types
const ISSUE_TITLES = [
  "Add authentication middleware for API routes",
  "Fix rate limiting bug in webhook handler",
  "Implement OAuth2 flow for GitLab integration",
  "Update security headers configuration",
  "Refactor database connection pooling",
  "Add unit tests for user service",
  "Fix memory leak in event processor",
  "Implement pagination for large result sets",
  "Add retry logic for failed API calls",
  "Update dependencies to fix security vulnerabilities",
  "Implement caching layer for frequently accessed data",
  "Add logging for debugging production issues",
  "Fix race condition in concurrent requests",
  "Implement graceful shutdown for workers",
  "Add health check endpoint",
  "Fix CORS configuration for API",
  "Implement rate limiting per user",
  "Add input validation for all endpoints",
  "Fix timezone handling in date parsing",
  "Implement soft delete for entities",
  "Add database indexes for slow queries",
  "Fix N+1 query in dashboard endpoint",
  "Implement background job processing",
  "Add WebSocket support for real-time updates",
  "Fix session management issues",
  "Implement audit logging for admin actions",
  "Add CSV export functionality",
  "Fix file upload size limit",
  "Implement search functionality with full-text",
  "Add API versioning support",
];

const MR_TITLES = [
  "feat: Add authentication flow with JWT tokens",
  "fix: Resolve webhook delivery failures",
  "refactor: Improve database query performance",
  "chore: Update Node.js to latest LTS version",
  "feat: Implement real-time notifications",
  "fix: Handle edge case in date calculations",
  "docs: Add API documentation",
  "test: Add integration tests for auth module",
  "feat: Add dark mode support",
  "fix: Resolve memory issues under high load",
  "refactor: Extract reusable components",
  "feat: Add user preferences settings",
  "fix: Handle concurrent modification errors",
  "chore: Migrate to TypeScript strict mode",
  "feat: Implement file attachment support",
  "fix: Resolve caching inconsistencies",
  "refactor: Simplify error handling logic",
  "feat: Add GraphQL API endpoint",
  "fix: Handle malformed JSON in requests",
  "chore: Update testing framework",
  "feat: Add batch processing capability",
  "fix: Resolve timezone conversion bugs",
  "refactor: Optimize bundle size",
  "feat: Implement SSO integration",
  "fix: Handle network timeouts gracefully",
  "chore: Add pre-commit hooks",
  "feat: Add webhook retry mechanism",
  "fix: Resolve infinite loop in parser",
  "refactor: Clean up legacy code",
  "feat: Add multi-language support",
];

const COMMENT_PREFIXES = [
  "I think we should",
  "Have you considered",
  "This looks good, but",
  "Great work on this!",
  "Can we add a test for",
  "I noticed that",
  "According to our guidelines",
  "This might cause issues with",
  "Let's discuss this in our next meeting",
  "I agree with the approach here",
];

// Realistic body content snippets
const BODY_SNIPPETS = [
  "The current implementation has a bug where authentication tokens are not properly validated when users make API requests. This could potentially allow unauthorized access to protected endpoints. We need to add proper token verification middleware.",
  "After investigating the webhook delivery failures, I found that the issue is related to how we handle rate limiting responses from GitLab. When we receive a 429 status, we're not properly implementing exponential backoff.",
  "The database queries are taking longer than expected because we're missing indexes on frequently queried columns. Adding composite indexes on user_id and created_at should significantly improve performance.",
  "Users are reporting that notifications are not being delivered in real-time. The WebSocket connection seems to be dropping after a few minutes of inactivity. We need to implement a heartbeat mechanism.",
  "The memory usage keeps increasing over time, which suggests we have a memory leak somewhere. After profiling, I traced it to the event listener not being properly cleaned up when components unmount.",
  "This PR adds support for OAuth2 authentication with GitLab. Users can now sign in with their GitLab accounts and we'll store their access tokens securely for API calls.",
  "I've refactored the error handling to use a centralized error boundary. This will make it easier to track and debug issues in production by providing consistent error formatting.",
  "The search functionality now uses PostgreSQL full-text search with GIN indexes. This provides sub-second search results even with large datasets.",
  "Added caching layer using Redis to reduce database load. Frequently accessed data is now cached for 5 minutes, with cache invalidation on writes.",
  "Implemented graceful shutdown to ensure all pending requests are completed before the server stops. This prevents data loss during deployments.",
  "The API now supports pagination with cursor-based navigation for better performance with large result sets. Each page includes next/previous cursors.",
  "Added comprehensive logging with structured JSON output. This makes it easier to search and filter logs in our monitoring system.",
  "Fixed a race condition where concurrent requests could cause duplicate entries. Added database-level unique constraints and optimistic locking.",
  "Implemented background job processing using a message queue. Long-running tasks are now processed asynchronously without blocking the main thread.",
  "Added input validation for all API endpoints using Zod schemas. Invalid requests now return detailed error messages explaining what's wrong.",
];

const AUTHORS = [
  "alice.developer",
  "bob.engineer",
  "charlie.dev",
  "diana.programmer",
  "eve.coder",
  "frank.hacker",
  "grace.builder",
  "henry.creator",
  "iris.maker",
  "jack.developer",
];

const PROJECTS = [
  { name: "api-service", path: "company/api-service" },
  { name: "web-app", path: "company/web-app" },
  { name: "mobile-client", path: "company/mobile-client" },
  { name: "infra-config", path: "company/infra-config" },
  { name: "shared-libs", path: "company/shared-libs" },
  { name: "data-pipeline", path: "company/data-pipeline" },
  { name: "auth-service", path: "company/auth-service" },
  { name: "notification-service", path: "company/notification-service" },
];

const LABELS = [
  "bug",
  "feature",
  "security",
  "api",
  "database",
  "performance",
  "documentation",
  "testing",
  "infrastructure",
  "frontend",
  "backend",
  "urgent",
  "blocked",
  "needs-review",
  "wip",
];

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomSubset<T>(arr: T[], min = 0, max = 3): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomDate(daysBack: number): Date {
  const now = Date.now();
  const randomMs = Math.random() * daysBack * 24 * 60 * 60 * 1000;
  return new Date(now - randomMs);
}

function generateEvent(index: number, userId: string) {
  const eventTypes = ["issue", "merge_request", "comment"] as const;
  const type = randomFrom(eventTypes);
  const project = randomFrom(PROJECTS);
  const author = randomFrom(AUTHORS);

  let title: string = "";
  let body: string = "";

  switch (type) {
    case "issue":
      title = randomFrom(ISSUE_TITLES);
      body = randomFrom(BODY_SNIPPETS);
      break;
    case "merge_request":
      title = randomFrom(MR_TITLES);
      body = randomFrom(BODY_SNIPPETS);
      break;
    case "comment":
      title = `${randomFrom(COMMENT_PREFIXES)} ${randomFrom(ISSUE_TITLES).toLowerCase().slice(0, 50)}...`;
      body = randomFrom(BODY_SNIPPETS);
      break;
  }

  return {
    id: `seed-event-${index}`,
    userId,
    type: type as string,
    title,
    body,
    author,
    authorAvatar: `https://gitlab.com/uploads/-/system/user/avatar/${Math.floor(Math.random() * 10000)}/avatar.png`,
    project: project.name,
    projectId: String(Math.floor(Math.random() * 1000) + 1),
    labels: randomSubset(LABELS, 0, 4),
    gitlabEventId: `gitlab-seed-${index}-${Date.now()}`,
    gitlabUrl: `https://gitlab.com/${project.path}/-/${type === "merge_request" ? "merge_requests" : type === "comment" ? "issues" : "issues"}/${index % 1000}`,
    createdAt: randomDate(90), // Last 90 days
  };
}

async function main() {
  console.log("Starting event seed script...");
  console.time("Total seed time");

  // Get the first user in the database to associate events with
  const user = await prisma.user.findFirst();

  if (!user) {
    console.error("No user found in database. Please create a user first by logging in.");
    process.exit(1);
  }

  console.log(`Found user: ${user.email} (${user.id})`);

  // Check if we already have seed events
  const existingSeedCount = await prisma.event.count({
    where: {
      gitlabEventId: {
        startsWith: "gitlab-seed-",
      },
    },
  });

  if (existingSeedCount > 0) {
    console.log(`Found ${existingSeedCount} existing seed events.`);
    console.log("Do you want to delete them and re-seed? (This script will proceed in 3 seconds)");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("Deleting existing seed events...");
    console.time("Delete existing events");
    await prisma.event.deleteMany({
      where: {
        gitlabEventId: {
          startsWith: "gitlab-seed-",
        },
      },
    });
    console.timeEnd("Delete existing events");
  }

  const TOTAL_EVENTS = 10000;
  const BATCH_SIZE = 500;

  console.log(`Generating ${TOTAL_EVENTS} events in batches of ${BATCH_SIZE}...`);

  let created = 0;
  console.time("Event generation");

  for (let batch = 0; batch < TOTAL_EVENTS / BATCH_SIZE; batch++) {
    const events = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const eventIndex = batch * BATCH_SIZE + i;
      events.push(generateEvent(eventIndex, user.id));
    }

    await prisma.event.createMany({
      data: events,
      skipDuplicates: true,
    });

    created += events.length;
    const progress = ((created / TOTAL_EVENTS) * 100).toFixed(1);
    process.stdout.write(`\rProgress: ${progress}% (${created}/${TOTAL_EVENTS})`);
  }

  console.log("\n");
  console.timeEnd("Event generation");

  // Verify the count
  const totalCount = await prisma.event.count({
    where: { userId: user.id },
  });

  console.log(`\nTotal events in database for user: ${totalCount}`);

  // Test search performance
  console.log("\n--- Performance Test ---");
  console.log("Running sample FTS queries...\n");

  const testKeywords = ["authentication", "webhook", "database", "api", "performance"];

  for (const keyword of testKeywords) {
    console.time(`Search '${keyword}'`);
    const results = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM "Event"
      WHERE "userId" = ${user.id}
        AND to_tsvector('english', title || ' ' || COALESCE(body, ''))
            @@ plainto_tsquery('english', ${keyword})
    `;
    console.timeEnd(`Search '${keyword}'`);
    console.log(`  Results: ${results[0]?.count ?? 0} events\n`);
  }

  console.timeEnd("Total seed time");
  console.log("\nSeed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
