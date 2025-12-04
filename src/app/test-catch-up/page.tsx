/**
 * Test Page for Catch-Up Mode Backend (Stories 3.1-3.4)
 *
 * Purpose: Manual testing UI for catch-up mode backend features
 *
 * Stories covered:
 * - Story 3.1: queries.getNewItems (lastVisitedAt tracking)
 * - Story 3.2: Catch-Up Mode View (will add frontend tests here)
 * - Story 3.3: Mark Query as Reviewed (will add updateLastVisited tests here)
 * - Story 3.4: Sidebar badges (will add badge count tests here)
 *
 * Test cases for Story 3.1:
 * - AC 3.1.3: getNewItems returns events created after lastVisitedAt
 * - AC 3.1.5: Recently visited query returns empty array
 * - AC 3.1.7: Response shape includes queryId, queryName, newCount, events[]
 * - AC 3.1.8: Query filters combined with "new since" using AND logic
 * - Authorization: FORBIDDEN for other user's queries
 * - Error handling: NOT_FOUND for invalid queryId
 *
 * TODO: DELETE THIS FILE after Story 3.4 is complete and validated
 */

"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function TestCatchUpPage() {
  const [selectedQueryId, setSelectedQueryId] = useState("");
  const [log, setLog] = useState<string[]>([]);

  const utils = api.useUtils();

  // Fetch queries list
  const { data: queries, isLoading, error } = api.queries.list.useQuery();

  // Story 3.1: getNewItems query
  const [getNewItemsData, setGetNewItemsData] = useState<{
    queryId: string;
    queryName: string;
    newCount: number;
    events: Array<{
      id: string;
      title: string;
      type: string;
      createdAt: Date;
      author: string;
      project: string;
    }>;
  } | null>(null);

  const getNewItemsMutation = api.queries.getNewItems.useQuery(
    { queryId: selectedQueryId },
    {
      enabled: false, // Only run when manually triggered
    }
  );



  const addLog = (message: string) => {
    setLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  const handleGetNewItems = async () => {
    if (!selectedQueryId) {
      addLog("⚠️ Select a query first");
      return;
    }

    addLog(`Calling getNewItems for query: ${selectedQueryId}`);

    try {
      const result = await getNewItemsMutation.refetch();
      if (result.data) {
        setGetNewItemsData(result.data);
        addLog(
          `✅ getNewItems returned ${result.data.newCount} new items for "${result.data.queryName}"`
        );
      }
    } catch (err) {
      const error = err as { message: string; data?: { code?: string } };
      addLog(
        `❌ getNewItems failed: [${error.data?.code ?? "UNKNOWN"}] ${error.message}`
      );
    }
  };



  const handleTestNotFound = () => {
    addLog(`Testing NOT_FOUND with fake queryId: nonexistent-id-12345`);
    addLog(`⚠️ To test NOT_FOUND: Manually enter a fake ID in the query selector and click "Get New Items"`);
    addLog(`Expected result: [NOT_FOUND] Query not found`);
  };

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Error loading queries: {error.message}
        <br />
        <span className="text-sm text-gray-400">
          Make sure you&apos;re logged in via /api/auth/signin
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <h1 className="mb-2 text-2xl font-bold">
        Test Catch-Up Mode Backend (Stories 3.1-3.4)
      </h1>
      <p className="mb-6 text-sm text-gray-400">
        Manual testing UI for catch-up mode features. TODO: Delete after Story
        3.4 validation.
      </p>

      <div className="grid grid-cols-2 gap-8">
        {/* Left Column - Actions */}
        <div className="space-y-6">
          {/* Query Selection */}
          <div className="rounded-lg bg-gray-800 p-4">
            <h2 className="mb-3 text-lg font-semibold text-blue-400">
              Select Query
            </h2>
            {isLoading ? (
              <p className="text-gray-400">Loading queries...</p>
            ) : queries?.length === 0 ? (
              <p className="text-gray-400">
                No queries found. Create one at{" "}
                <a href="/test-queries" className="text-blue-400 underline">
                  /test-queries
                </a>
              </p>
            ) : (
              <div className="space-y-2">
                {queries?.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setSelectedQueryId(q.id);
                      addLog(`Selected query: "${q.name}" (${q.id})`);
                    }}
                    className={`w-full rounded p-3 text-left transition ${
                      selectedQueryId === q.id
                        ? "bg-blue-600"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    <div className="font-semibold">{q.name}</div>
                    <div className="text-xs text-gray-400">
                      Keywords:{" "}
                      {(q.filters as { keywords?: string[] })?.keywords?.join(
                        ", "
                      ) ?? "none"}
                    </div>
                    <div className="text-xs text-gray-400">
                      Count: {q.count} matching events
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Story 3.1: Test getNewItems */}
          <div className="rounded-lg bg-gray-800 p-4">
            <h2 className="mb-3 text-lg font-semibold text-green-400">
              Story 3.1: Test getNewItems (AC 3.1.3-3.1.5, 3.1.7-3.1.8)
            </h2>
            <div className="space-y-2">
              <button
                onClick={handleGetNewItems}
                disabled={!selectedQueryId || getNewItemsMutation.isFetching}
                className="w-full rounded bg-green-600 px-4 py-2 hover:bg-green-700 disabled:opacity-50"
              >
                {getNewItemsMutation.isFetching
                  ? "Loading..."
                  : "Get New Items"}
              </button>
              <p className="text-xs text-gray-400">
                Returns events created after lastVisitedAt. Call twice to test
                AC 3.1.5 (second call should return empty).
              </p>
            </div>
          </div>

          {/* Story 3.1: Test NOT_FOUND */}
          <div className="rounded-lg bg-gray-800 p-4">
            <h2 className="mb-3 text-lg font-semibold text-red-400">
              Test NOT_FOUND Error
            </h2>
            <button
              onClick={handleTestNotFound}
              className="w-full rounded bg-red-600 px-4 py-2 hover:bg-red-700"
            >
              Show NOT_FOUND Test Instructions
            </button>
            <p className="mt-2 text-xs text-gray-400">
              Click for manual test instructions (cannot programmatically test due to React hooks)
            </p>
          </div>

          {/* Placeholder for Story 3.3 */}
          <div className="rounded-lg bg-gray-700 p-4 opacity-50">
            <h2 className="mb-3 text-lg font-semibold text-purple-400">
              Story 3.3: Mark as Reviewed (Coming Soon)
            </h2>
            <p className="text-xs text-gray-400">
              Will add updateLastVisited mutation test here
            </p>
          </div>
        </div>

        {/* Right Column - Data Display */}
        <div className="space-y-6">
          {/* getNewItems Response */}
          <div className="rounded-lg bg-gray-800 p-4">
            <h2 className="mb-3 text-lg font-semibold">
              getNewItems Response (AC 3.1.7)
            </h2>
            {!getNewItemsData ? (
              <p className="text-gray-400">
                No data yet. Click &quot;Get New Items&quot; to see response.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="rounded bg-gray-700 p-3">
                  <div className="mb-2 text-sm font-semibold text-blue-300">
                    Response Shape:
                  </div>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-gray-400">queryId:</span>{" "}
                      <span className="font-mono">
                        {getNewItemsData.queryId}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">queryName:</span>{" "}
                      {getNewItemsData.queryName}
                    </div>
                    <div>
                      <span className="text-gray-400">newCount:</span>{" "}
                      <span className="font-bold">
                        {getNewItemsData.newCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">events:</span> Array[
                      {getNewItemsData.events.length}]
                    </div>
                  </div>
                </div>

                {/* Events List */}
                <div className="max-h-96 overflow-y-auto rounded bg-gray-700 p-3">
                  <div className="mb-2 text-sm font-semibold text-green-300">
                    New Events ({getNewItemsData.newCount}):
                  </div>
                  {getNewItemsData.events.length === 0 ? (
                    <p className="text-xs text-gray-400">
                      No new events (visited recently - AC 3.1.5)
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {getNewItemsData.events.map((event) => (
                        <div
                          key={event.id}
                          className="rounded bg-gray-800 p-2 text-xs"
                        >
                          <div className="font-semibold">{event.title}</div>
                          <div className="mt-1 text-gray-400">
                            Type: {event.type} | Author: {event.author}
                          </div>
                          <div className="text-gray-400">
                            Project: {event.project}
                          </div>
                          <div className="text-gray-400">
                            Created:{" "}
                            {new Date(event.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Log */}
          <div className="rounded-lg bg-gray-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Activity Log</h2>
              <button
                onClick={() => setLog([])}
                className="rounded bg-gray-600 px-2 py-1 text-xs hover:bg-gray-500"
              >
                Clear
              </button>
            </div>
            <div className="h-64 overflow-y-auto rounded bg-gray-900 p-2 font-mono text-xs">
              {log.length === 0 ? (
                <p className="text-gray-500">No activity yet...</p>
              ) : (
                log.map((entry, i) => (
                  <div key={i} className="mb-1">
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Test Instructions */}
      <div className="mt-8 rounded-lg bg-gray-800 p-4 text-sm">
        <h2 className="mb-2 font-semibold">Story 3.1 Test Instructions:</h2>
        <ol className="list-inside list-decimal space-y-2 text-gray-300">
          <li>
            <strong>AC 3.1.5 - Recently Visited:</strong> Click &quot;Get New
            Items&quot; twice quickly → Second call should return empty array
            (newCount: 0)
          </li>
          <li>
            <strong>AC 3.1.7 - Response Shape:</strong> Verify response
            includes queryId, queryName, newCount, events[]
          </li>
          <li>
            <strong>AC 3.1.8 - Filter AND Logic:</strong> Response should only
            include events matching BOTH the query&apos;s keyword filters AND
            createdAt &gt; lastVisitedAt
          </li>
          <li>
            <strong>Error Handling - NOT_FOUND:</strong> In browser dev console, run:
            <code className="ml-2 text-xs bg-gray-700 px-2 py-1 rounded">
              fetch(&apos;/api/trpc/queries.getNewItems?input=%7B%22queryId%22%3A%22fake-id%22%7D&apos;)
            </code>
            → Should return [NOT_FOUND] error
          </li>
          <li>
            <strong>Error Handling - FORBIDDEN:</strong> Use Prisma Studio to create a
            query with different userId, note its ID, then test in dev console with that ID
            → Should get [FORBIDDEN] error
          </li>
        </ol>

        <h2 className="mb-2 mt-6 font-semibold">
          Future Stories (Will Add Tests Here):
        </h2>
        <ul className="list-inside list-disc space-y-1 text-gray-300">
          <li>
            <strong>Story 3.2:</strong> Catch-Up Mode View - Frontend display
            of new items grouped by query
          </li>
          <li>
            <strong>Story 3.3:</strong> Mark Query as Reviewed - Update
            lastVisitedAt to current timestamp
          </li>
          <li>
            <strong>Story 3.4:</strong> Sidebar New Item Badges - Display
            newCount badges on query list
          </li>
        </ul>
      </div>
    </div>
  );
}
