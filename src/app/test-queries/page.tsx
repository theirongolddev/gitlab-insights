/**
 * Test Page for Queries Mutations (Story 2.7b)
 *
 * TODO: DELETE THIS FILE in Story 2.10 (Edit/Delete Query Actions)
 * This is a temporary test page for manually validating queries.update and queries.delete mutations.
 *
 * Test cases covered:
 * - 4.4: Create query, update name, verify change persists
 * - 4.5: Create query, delete it, verify removed from list
 * - 4.7: NOT_FOUND test with non-existent id
 *
 * Note: Authorization test (4.6) requires manually creating a query with different userId in Prisma Studio
 */

"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function TestQueriesPage() {
  const [newQueryName, setNewQueryName] = useState("Test Query");
  const [newKeyword, setNewKeyword] = useState("test-keyword");
  const [updateId, setUpdateId] = useState("");
  const [updateName, setUpdateName] = useState("");
  const [deleteId, setDeleteId] = useState("");
  const [log, setLog] = useState<string[]>([]);

  const utils = api.useUtils();

  // Fetch queries list
  const { data: queries, isLoading, error } = api.queries.list.useQuery();

  // Mutations
  const createMutation = api.queries.create.useMutation({
    onSuccess: (data) => {
      addLog(`✅ Created query: ${data.name} (id: ${data.id})`);
      utils.queries.list.invalidate();
    },
    onError: (err) => addLog(`❌ Create failed: ${err.message}`),
  });

  const updateMutation = api.queries.update.useMutation({
    onSuccess: (data) => {
      addLog(`✅ Updated query: ${data.name} (id: ${data.id})`);
      utils.queries.list.invalidate();
    },
    onError: (err) => addLog(`❌ Update failed: [${err.data?.code}] ${err.message}`),
  });

  const deleteMutation = api.queries.delete.useMutation({
    onSuccess: () => {
      addLog(`✅ Deleted query successfully`);
      utils.queries.list.invalidate();
    },
    onError: (err) => addLog(`❌ Delete failed: [${err.data?.code}] ${err.message}`),
  });

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleCreate = () => {
    addLog(`Creating query: "${newQueryName}" with keyword "${newKeyword}"`);
    createMutation.mutate({
      name: newQueryName,
      filters: { keywords: [newKeyword] },
    });
  };

  const handleUpdate = () => {
    if (!updateId) {
      addLog("⚠️ Enter a query ID to update");
      return;
    }
    addLog(`Updating query ${updateId} with name: "${updateName}"`);
    updateMutation.mutate({
      id: updateId,
      ...(updateName && { name: updateName }),
    });
  };

  const handleDelete = () => {
    if (!deleteId) {
      addLog("⚠️ Enter a query ID to delete");
      return;
    }
    addLog(`Deleting query ${deleteId}`);
    deleteMutation.mutate({ id: deleteId });
  };

  const handleTestNotFound = () => {
    const fakeId = "nonexistent-id-12345";
    addLog(`Testing NOT_FOUND with fake id: ${fakeId}`);
    deleteMutation.mutate({ id: fakeId });
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
      <h1 className="mb-2 text-2xl font-bold">Test Queries Mutations (Story 2.7b)</h1>
      <p className="mb-6 text-sm text-gray-400">
        TODO: Delete this page in Story 2.10
      </p>

      <div className="grid grid-cols-2 gap-8">
        {/* Left Column - Actions */}
        <div className="space-y-6">
          {/* Create Query */}
          <div className="rounded-lg bg-gray-800 p-4">
            <h2 className="mb-3 text-lg font-semibold text-green-400">
              Create Query (Test 4.4/4.5 setup)
            </h2>
            <div className="space-y-2">
              <input
                type="text"
                value={newQueryName}
                onChange={(e) => setNewQueryName(e.target.value)}
                placeholder="Query name"
                className="w-full rounded bg-gray-700 px-3 py-2"
              />
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Keyword"
                className="w-full rounded bg-gray-700 px-3 py-2"
              />
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full rounded bg-green-600 px-4 py-2 hover:bg-green-700 disabled:opacity-50"
              >
                {createMutation.isPending ? "Creating..." : "Create Query"}
              </button>
            </div>
          </div>

          {/* Update Query */}
          <div className="rounded-lg bg-gray-800 p-4">
            <h2 className="mb-3 text-lg font-semibold text-blue-400">
              Update Query (Test 4.4)
            </h2>
            <div className="space-y-2">
              <input
                type="text"
                value={updateId}
                onChange={(e) => setUpdateId(e.target.value)}
                placeholder="Query ID to update"
                className="w-full rounded bg-gray-700 px-3 py-2 font-mono text-sm"
              />
              <input
                type="text"
                value={updateName}
                onChange={(e) => setUpdateName(e.target.value)}
                placeholder="New name"
                className="w-full rounded bg-gray-700 px-3 py-2"
              />
              <button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
                className="w-full rounded bg-blue-600 px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? "Updating..." : "Update Query"}
              </button>
            </div>
          </div>

          {/* Delete Query */}
          <div className="rounded-lg bg-gray-800 p-4">
            <h2 className="mb-3 text-lg font-semibold text-red-400">
              Delete Query (Test 4.5)
            </h2>
            <div className="space-y-2">
              <input
                type="text"
                value={deleteId}
                onChange={(e) => setDeleteId(e.target.value)}
                placeholder="Query ID to delete"
                className="w-full rounded bg-gray-700 px-3 py-2 font-mono text-sm"
              />
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="w-full rounded bg-red-600 px-4 py-2 hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Query"}
              </button>
            </div>
          </div>

          {/* Test NOT_FOUND */}
          <div className="rounded-lg bg-gray-800 p-4">
            <h2 className="mb-3 text-lg font-semibold text-yellow-400">
              Test NOT_FOUND Error (Test 4.7)
            </h2>
            <button
              onClick={handleTestNotFound}
              disabled={deleteMutation.isPending}
              className="w-full rounded bg-yellow-600 px-4 py-2 hover:bg-yellow-700 disabled:opacity-50"
            >
              Delete Non-existent Query
            </button>
            <p className="mt-2 text-xs text-gray-400">
              Should show: [NOT_FOUND] Query not found
            </p>
          </div>
        </div>

        {/* Right Column - Data Display */}
        <div className="space-y-6">
          {/* Queries List */}
          <div className="rounded-lg bg-gray-800 p-4">
            <h2 className="mb-3 text-lg font-semibold">
              Your Queries ({queries?.length ?? 0})
            </h2>
            {isLoading ? (
              <p className="text-gray-400">Loading...</p>
            ) : queries?.length === 0 ? (
              <p className="text-gray-400">No queries yet. Create one above!</p>
            ) : (
              <div className="space-y-2">
                {queries?.map((q) => (
                  <div
                    key={q.id}
                    className="rounded bg-gray-700 p-3 text-sm"
                  >
                    <div className="font-semibold">{q.name}</div>
                    <div className="font-mono text-xs text-gray-400">
                      ID: {q.id}
                    </div>
                    <div className="text-xs text-gray-400">
                      Keywords: {(q.filters as { keywords?: string[] })?.keywords?.join(", ") ?? "none"}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => setUpdateId(q.id)}
                        className="rounded bg-blue-600 px-2 py-1 text-xs hover:bg-blue-700"
                      >
                        Copy ID to Update
                      </button>
                      <button
                        onClick={() => setDeleteId(q.id)}
                        className="rounded bg-red-600 px-2 py-1 text-xs hover:bg-red-700"
                      >
                        Copy ID to Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Log */}
          <div className="rounded-lg bg-gray-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Log</h2>
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

      {/* Instructions */}
      <div className="mt-8 rounded-lg bg-gray-800 p-4 text-sm">
        <h2 className="mb-2 font-semibold">Test Instructions:</h2>
        <ol className="list-inside list-decimal space-y-1 text-gray-300">
          <li><strong>Test 4.4:</strong> Create a query, then update its name - verify the list updates</li>
          <li><strong>Test 4.5:</strong> Create a query, then delete it - verify it disappears from the list</li>
          <li><strong>Test 4.6:</strong> Use Prisma Studio to create a query with a different userId, then try to update/delete it here - should get FORBIDDEN</li>
          <li><strong>Test 4.7:</strong> Click &quot;Delete Non-existent Query&quot; - should get NOT_FOUND error</li>
        </ol>
      </div>
    </div>
  );
}
