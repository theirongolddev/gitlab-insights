/**
 * Performance Benchmarks for Work Items API
 * 
 * Task 2.5: Establish performance baseline metrics
 * 
 * Target thresholds (from PRD):
 * - Initial page load: < 200ms
 * - Subsequent page loads: < 150ms
 * - Search operations: < 100ms
 * 
 * Usage: npx vitest bench src/server/api/routers/work-items.bench.ts
 */

import { describe, bench, beforeAll, afterAll } from "vitest";
import { db } from "~/server/db";

// Skip database-dependent benchmarks if no connection
let dbConnected = false;
let totalEvents = 0;

beforeAll(async () => {
  try {
    await db.$connect();
    dbConnected = true;
    totalEvents = await db.event.count();
    console.log(`Database connected. Total events: ${totalEvents}`);
  } catch {
    console.log("Database not available - skipping benchmarks");
  }
});

afterAll(async () => {
  if (dbConnected) {
    await db.$disconnect();
  }
});

// Helper to build work items query (mirrors work-items.ts logic)
async function queryWorkItems(params: {
  limit: number;
  cursor?: string | null;
  status?: string | null;
  type?: string | null;
  project?: string | null;
  search?: string | null;
}) {
  const { limit, cursor, status, type, project, search } = params;
  
  // Build where clause dynamically
  const where: Record<string, unknown> = {
    parentEventId: null, // Top-level items only
  };

  // Filter by type
  if (type === "issue") {
    where.type = "issue";
  } else if (type === "merge_request") {
    where.type = "merge_request";
  } else {
    where.type = { in: ["issue", "merge_request"] };
  }

  if (status) {
    where.status = status;
  }

  if (project) {
    where.project = project;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { body: { contains: search, mode: "insensitive" } },
    ];
  }

  const items = await db.event.findMany({
    where,
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      gitlabEventId: true,
      type: true,
      title: true,
      status: true,
      project: true,
      projectId: true,
      author: true,
      authorAvatar: true,
      gitlabUrl: true,
      updatedAt: true,
      createdAt: true,
      labels: true,
      commentCount: true,
    },
  });

  const hasMore = items.length > limit;
  const resultItems = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore && resultItems.length > 0 ? resultItems[resultItems.length - 1]!.id : null;

  return { items: resultItems, nextCursor, hasMore };
}

// Helper to fetch activity summaries
async function fetchActivitySummaries(parentIds: number[]) {
  if (parentIds.length === 0) return [];
  
  return db.event.findMany({
    where: {
      gitlabParentId: { in: parentIds },
      type: "comment",
    },
    select: {
      gitlabParentId: true,
      author: true,
      authorAvatar: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100, // Limit to prevent huge queries
  });
}

describe.skipIf(!dbConnected)("Work Items Query Performance", () => {
  describe("Initial page load (no filters)", () => {
    bench(
      "fetch first 20 items",
      async () => {
        await queryWorkItems({ limit: 20 });
      },
      { time: 5000, iterations: 10 }
    );

    bench(
      "fetch first 50 items",
      async () => {
        await queryWorkItems({ limit: 50 });
      },
      { time: 5000, iterations: 10 }
    );
  });

  describe("Pagination (subsequent loads)", () => {
    let cursor: string | null = null;

    beforeAll(async () => {
      const result = await queryWorkItems({ limit: 20 });
      cursor = result.nextCursor;
    });

    bench(
      "fetch page 2 with cursor",
      async () => {
        if (!cursor) return;
        await queryWorkItems({ limit: 20, cursor });
      },
      { time: 5000, iterations: 10 }
    );
  });

  describe("Filtered queries", () => {
    bench(
      "filter by status: open",
      async () => {
        await queryWorkItems({ limit: 20, status: "open" });
      },
      { time: 5000, iterations: 10 }
    );

    bench(
      "filter by type: issue",
      async () => {
        await queryWorkItems({ limit: 20, type: "issue" });
      },
      { time: 5000, iterations: 10 }
    );

    bench(
      "filter by status + type",
      async () => {
        await queryWorkItems({ limit: 20, status: "open", type: "merge_request" });
      },
      { time: 5000, iterations: 10 }
    );
  });

  describe("Search performance", () => {
    bench(
      "search: single word",
      async () => {
        await queryWorkItems({ limit: 20, search: "authentication" });
      },
      { time: 5000, iterations: 10 }
    );

    bench(
      "search: multiple words",
      async () => {
        await queryWorkItems({ limit: 20, search: "fix bug" });
      },
      { time: 5000, iterations: 10 }
    );

    bench(
      "search with filters",
      async () => {
        await queryWorkItems({ limit: 20, status: "open", type: "issue", search: "error" });
      },
      { time: 5000, iterations: 10 }
    );
  });

  describe("Activity summary aggregation", () => {
    let parentIds: number[] = [];

    beforeAll(async () => {
      const result = await queryWorkItems({ limit: 20 });
      parentIds = result.items
        .map(i => {
          const match = i.gitlabEventId?.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter(id => id > 0);
    });

    bench(
      "fetch activity summaries for 20 items",
      async () => {
        await fetchActivitySummaries(parentIds);
      },
      { time: 5000, iterations: 10 }
    );
  });
});

// Performance thresholds for CI
export const PERFORMANCE_THRESHOLDS = {
  initialPageLoad: 200, // ms
  subsequentPageLoad: 150, // ms
  searchOperation: 100, // ms
};
