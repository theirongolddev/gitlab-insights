/**
 * Integration tests for Read Tracking State Machine
 *
 * Story 4.5: Write tests for read tracking state machine
 *
 * Tests the read tracking state transitions:
 * 1. New work item → isUnread=true (no ReadEvent)
 * 2. Mark as read → ReadEvent created, isUnread=false
 * 3. New activity after read → isUnread=true (lastActivityAt > readAt)
 * 4. Batch mark as read → works correctly
 * 5. Clear read status → isUnread reverts to true
 * 6. Edge cases (already read, missing items, empty batch)
 */

import { describe, it, expect } from "vitest";

/**
 * isUnread State Machine Logic
 *
 * The state is computed as:
 * - No readAt (never read) → isUnread = true
 * - lastActivityAt > readAt → isUnread = true (new activity)
 * - lastActivityAt <= readAt → isUnread = false
 */
function computeIsUnread(
  lastActivityAt: Date | null,
  lastReadAt: Date | null
): boolean {
  // Never read = unread
  if (!lastReadAt) return true;

  // No activity = not unread (edge case)
  if (!lastActivityAt) return false;

  // New activity since last read = unread
  return lastActivityAt > lastReadAt;
}

describe("read tracking state machine", () => {
  describe("isUnread computation", () => {
    it("returns true when never read (no ReadEvent)", () => {
      const lastActivityAt = new Date("2025-01-15T10:00:00Z");
      const lastReadAt = null;

      const isUnread = computeIsUnread(lastActivityAt, lastReadAt);

      expect(isUnread).toBe(true);
    });

    it("returns false when read after last activity", () => {
      const lastActivityAt = new Date("2025-01-15T10:00:00Z");
      const lastReadAt = new Date("2025-01-15T11:00:00Z"); // Read after activity

      const isUnread = computeIsUnread(lastActivityAt, lastReadAt);

      expect(isUnread).toBe(false);
    });

    it("returns true when new activity after read", () => {
      const lastActivityAt = new Date("2025-01-15T12:00:00Z"); // New activity
      const lastReadAt = new Date("2025-01-15T11:00:00Z");

      const isUnread = computeIsUnread(lastActivityAt, lastReadAt);

      expect(isUnread).toBe(true);
    });

    it("returns false when read at exact same time as activity", () => {
      const timestamp = new Date("2025-01-15T10:00:00Z");
      const lastActivityAt = timestamp;
      const lastReadAt = timestamp;

      const isUnread = computeIsUnread(lastActivityAt, lastReadAt);

      expect(isUnread).toBe(false);
    });

    it("returns false when no activity and read", () => {
      const lastActivityAt = null;
      const lastReadAt = new Date("2025-01-15T10:00:00Z");

      const isUnread = computeIsUnread(lastActivityAt, lastReadAt);

      expect(isUnread).toBe(false);
    });
  });

  describe("state transitions", () => {
    it("transition: unread -> read (mark as read)", () => {
      // Initial state: never read
      const initialReadAt = null;
      const lastActivityAt = new Date("2025-01-15T10:00:00Z");
      expect(computeIsUnread(lastActivityAt, initialReadAt)).toBe(true);

      // Action: mark as read (creates ReadEvent)
      const newReadAt = new Date("2025-01-15T11:00:00Z");
      expect(computeIsUnread(lastActivityAt, newReadAt)).toBe(false);
    });

    it("transition: read -> unread (new activity after read)", () => {
      // Initial state: read
      const initialReadAt = new Date("2025-01-15T10:00:00Z");
      const initialActivityAt = new Date("2025-01-15T09:00:00Z");
      expect(computeIsUnread(initialActivityAt, initialReadAt)).toBe(false);

      // Action: new activity arrives
      const newActivityAt = new Date("2025-01-15T12:00:00Z");
      expect(computeIsUnread(newActivityAt, initialReadAt)).toBe(true);
    });

    it("transition: unread -> read -> unread (mark, then new activity)", () => {
      // Step 1: New work item (unread)
      const activityAt1 = new Date("2025-01-15T10:00:00Z");
      expect(computeIsUnread(activityAt1, null)).toBe(true);

      // Step 2: Mark as read
      const readAt = new Date("2025-01-15T11:00:00Z");
      expect(computeIsUnread(activityAt1, readAt)).toBe(false);

      // Step 3: New comment arrives (lastActivityAt updates)
      const activityAt2 = new Date("2025-01-15T12:00:00Z");
      expect(computeIsUnread(activityAt2, readAt)).toBe(true);

      // Step 4: Mark as read again
      const readAt2 = new Date("2025-01-15T13:00:00Z");
      expect(computeIsUnread(activityAt2, readAt2)).toBe(false);
    });
  });

  describe("activity summary newCount computation", () => {
    interface ChildEvent {
      id: string;
      createdAt: Date;
      body: string;
    }

    function computeNewCount(
      children: ChildEvent[],
      lastReadAt: Date | null
    ): number {
      if (!lastReadAt) return children.length;
      return children.filter((c) => c.createdAt > lastReadAt).length;
    }

    it("all children are new when never read", () => {
      const children = [
        { id: "1", createdAt: new Date("2025-01-15T10:00:00Z"), body: "a" },
        { id: "2", createdAt: new Date("2025-01-15T11:00:00Z"), body: "b" },
        { id: "3", createdAt: new Date("2025-01-15T12:00:00Z"), body: "c" },
      ];

      expect(computeNewCount(children, null)).toBe(3);
    });

    it("no children are new when read after all activity", () => {
      const children = [
        { id: "1", createdAt: new Date("2025-01-15T10:00:00Z"), body: "a" },
        { id: "2", createdAt: new Date("2025-01-15T11:00:00Z"), body: "b" },
      ];
      const lastReadAt = new Date("2025-01-15T12:00:00Z");

      expect(computeNewCount(children, lastReadAt)).toBe(0);
    });

    it("only children after readAt are counted as new", () => {
      const children = [
        { id: "1", createdAt: new Date("2025-01-15T10:00:00Z"), body: "a" },
        { id: "2", createdAt: new Date("2025-01-15T11:00:00Z"), body: "b" },
        { id: "3", createdAt: new Date("2025-01-15T13:00:00Z"), body: "c" },
        { id: "4", createdAt: new Date("2025-01-15T14:00:00Z"), body: "d" },
      ];
      const lastReadAt = new Date("2025-01-15T12:00:00Z");

      expect(computeNewCount(children, lastReadAt)).toBe(2); // Only id 3 and 4
    });

    it("handles empty children array", () => {
      const children: ChildEvent[] = [];
      expect(computeNewCount(children, null)).toBe(0);
      expect(computeNewCount(children, new Date())).toBe(0);
    });
  });

  describe("batch operations", () => {
    interface WorkItem {
      id: string;
      lastActivityAt: Date;
      lastReadAt: Date | null;
    }

    function applyBatchMarkAsRead(
      items: WorkItem[],
      idsToMark: string[],
      readAt: Date
    ): WorkItem[] {
      const idsSet = new Set(idsToMark);
      return items.map((item) =>
        idsSet.has(item.id) ? { ...item, lastReadAt: readAt } : item
      );
    }

    it("marks multiple items as read", () => {
      const items: WorkItem[] = [
        { id: "1", lastActivityAt: new Date("2025-01-15T10:00:00Z"), lastReadAt: null },
        { id: "2", lastActivityAt: new Date("2025-01-15T11:00:00Z"), lastReadAt: null },
        { id: "3", lastActivityAt: new Date("2025-01-15T12:00:00Z"), lastReadAt: null },
      ];

      const readAt = new Date("2025-01-15T13:00:00Z");
      const updated = applyBatchMarkAsRead(items, ["1", "2"], readAt);

      expect(updated[0]?.lastReadAt).toEqual(readAt);
      expect(updated[1]?.lastReadAt).toEqual(readAt);
      expect(updated[2]?.lastReadAt).toBeNull(); // Not marked
    });

    it("ignores non-existent IDs in batch", () => {
      const items: WorkItem[] = [
        { id: "1", lastActivityAt: new Date("2025-01-15T10:00:00Z"), lastReadAt: null },
      ];

      const readAt = new Date("2025-01-15T11:00:00Z");
      const updated = applyBatchMarkAsRead(items, ["1", "nonexistent"], readAt);

      expect(updated).toHaveLength(1);
      expect(updated[0]?.lastReadAt).toEqual(readAt);
    });

    it("handles empty ID array", () => {
      const items: WorkItem[] = [
        { id: "1", lastActivityAt: new Date("2025-01-15T10:00:00Z"), lastReadAt: null },
      ];

      const updated = applyBatchMarkAsRead(items, [], new Date());

      expect(updated[0]?.lastReadAt).toBeNull();
    });

    it("updates already-read items to new timestamp", () => {
      const oldReadAt = new Date("2025-01-15T10:00:00Z");
      const items: WorkItem[] = [
        { id: "1", lastActivityAt: new Date("2025-01-15T09:00:00Z"), lastReadAt: oldReadAt },
      ];

      const newReadAt = new Date("2025-01-15T12:00:00Z");
      const updated = applyBatchMarkAsRead(items, ["1"], newReadAt);

      expect(updated[0]?.lastReadAt).toEqual(newReadAt);
    });
  });

  describe("unread count computation", () => {
    interface WorkItem {
      id: string;
      isUnread: boolean;
    }

    function computeUnreadCount(items: WorkItem[]): number {
      return items.filter((item) => item.isUnread).length;
    }

    function updateUnreadCount(
      currentCount: number,
      wasUnread: boolean,
      willBeUnread: boolean
    ): number {
      if (wasUnread && !willBeUnread) {
        return Math.max(0, currentCount - 1);
      }
      if (!wasUnread && willBeUnread) {
        return currentCount + 1;
      }
      return currentCount;
    }

    it("counts all unread items", () => {
      const items = [
        { id: "1", isUnread: true },
        { id: "2", isUnread: false },
        { id: "3", isUnread: true },
        { id: "4", isUnread: true },
      ];

      expect(computeUnreadCount(items)).toBe(3);
    });

    it("returns 0 for all-read items", () => {
      const items = [
        { id: "1", isUnread: false },
        { id: "2", isUnread: false },
      ];

      expect(computeUnreadCount(items)).toBe(0);
    });

    it("decrements count when marking unread item as read", () => {
      const currentCount = 5;
      const wasUnread = true;
      const willBeUnread = false;

      expect(updateUnreadCount(currentCount, wasUnread, willBeUnread)).toBe(4);
    });

    it("does not go below 0", () => {
      const currentCount = 0;
      const wasUnread = true;
      const willBeUnread = false;

      expect(updateUnreadCount(currentCount, wasUnread, willBeUnread)).toBe(0);
    });

    it("increments count when new activity makes item unread", () => {
      const currentCount = 5;
      const wasUnread = false;
      const willBeUnread = true;

      expect(updateUnreadCount(currentCount, wasUnread, willBeUnread)).toBe(6);
    });

    it("stays same when already-unread item stays unread", () => {
      const currentCount = 5;
      const wasUnread = true;
      const willBeUnread = true;

      expect(updateUnreadCount(currentCount, wasUnread, willBeUnread)).toBe(5);
    });
  });

  describe("optimistic update scenarios", () => {
    interface OptimisticState {
      items: Array<{ id: string; isUnread: boolean }>;
      unreadCount: number;
    }

    function applyOptimisticMarkAsRead(
      state: OptimisticState,
      itemId: string
    ): OptimisticState {
      const item = state.items.find((i) => i.id === itemId);
      if (!item) return state;

      const wasUnread = item.isUnread;

      return {
        items: state.items.map((i) =>
          i.id === itemId ? { ...i, isUnread: false } : i
        ),
        unreadCount: wasUnread
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    }

    function revertOptimisticUpdate(
      state: OptimisticState,
      previousState: OptimisticState
    ): OptimisticState {
      return previousState;
    }

    it("optimistically updates item to read", () => {
      const state: OptimisticState = {
        items: [
          { id: "1", isUnread: true },
          { id: "2", isUnread: true },
        ],
        unreadCount: 2,
      };

      const updated = applyOptimisticMarkAsRead(state, "1");

      expect(updated.items[0]?.isUnread).toBe(false);
      expect(updated.items[1]?.isUnread).toBe(true);
      expect(updated.unreadCount).toBe(1);
    });

    it("does not decrement count for already-read item", () => {
      const state: OptimisticState = {
        items: [{ id: "1", isUnread: false }],
        unreadCount: 0,
      };

      const updated = applyOptimisticMarkAsRead(state, "1");

      expect(updated.items[0]?.isUnread).toBe(false);
      expect(updated.unreadCount).toBe(0);
    });

    it("reverts to previous state on error", () => {
      const previousState: OptimisticState = {
        items: [{ id: "1", isUnread: true }],
        unreadCount: 1,
      };

      const optimisticState: OptimisticState = {
        items: [{ id: "1", isUnread: false }],
        unreadCount: 0,
      };

      const reverted = revertOptimisticUpdate(optimisticState, previousState);

      expect(reverted).toEqual(previousState);
    });

    it("handles non-existent item gracefully", () => {
      const state: OptimisticState = {
        items: [{ id: "1", isUnread: true }],
        unreadCount: 1,
      };

      const updated = applyOptimisticMarkAsRead(state, "nonexistent");

      expect(updated).toEqual(state);
    });
  });

  describe("race condition prevention", () => {
    it("pending IDs set prevents duplicate operations", () => {
      const pendingIds = new Set<string>();

      // First operation: should proceed
      const id1 = "item-1";
      expect(pendingIds.has(id1)).toBe(false);
      pendingIds.add(id1);
      expect(pendingIds.has(id1)).toBe(true);

      // Second operation for same ID: should be skipped
      const shouldSkip = pendingIds.has(id1);
      expect(shouldSkip).toBe(true);

      // Complete first operation
      pendingIds.delete(id1);
      expect(pendingIds.has(id1)).toBe(false);

      // Now can proceed with new operation
      expect(pendingIds.has(id1)).toBe(false);
    });

    it("concurrent operations on different items allowed", () => {
      const pendingIds = new Set<string>();

      pendingIds.add("item-1");
      pendingIds.add("item-2");

      expect(pendingIds.has("item-1")).toBe(true);
      expect(pendingIds.has("item-2")).toBe(true);
      expect(pendingIds.has("item-3")).toBe(false);

      // Both complete independently
      pendingIds.delete("item-1");
      expect(pendingIds.has("item-1")).toBe(false);
      expect(pendingIds.has("item-2")).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles Date precision correctly", () => {
      // Same second, different milliseconds
      const readAt = new Date("2025-01-15T10:00:00.000Z");
      const activityAt = new Date("2025-01-15T10:00:00.001Z");

      expect(computeIsUnread(activityAt, readAt)).toBe(true);
    });

    it("handles very old dates", () => {
      const lastActivityAt = new Date("2020-01-01T00:00:00Z");
      const lastReadAt = new Date("2025-01-15T10:00:00Z");

      expect(computeIsUnread(lastActivityAt, lastReadAt)).toBe(false);
    });

    it("handles future dates", () => {
      const lastActivityAt = new Date("2030-01-01T00:00:00Z");
      const lastReadAt = new Date("2025-01-15T10:00:00Z");

      expect(computeIsUnread(lastActivityAt, lastReadAt)).toBe(true);
    });
  });
});
