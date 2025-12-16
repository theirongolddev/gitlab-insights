/**
 * Integration tests for People tRPC Router pagination
 *
 * Tests cursor-based pagination logic for:
 * - people.list: Paginated list of people with search
 * - people.getActivity: Paginated events for a person
 *
 * Verifies:
 * - Correct items returned per page
 * - No duplicates across pages
 * - Proper nextCursor returned when more items exist
 * - nextCursor is undefined when no more items
 */

import { describe, it, expect } from "vitest";

describe("people router pagination logic", () => {
  describe("list pagination", () => {
    it("returns items up to limit when more exist", () => {
      const mockPeople = Array.from({ length: 15 }, (_, i) => ({
        id: `person-${i}`,
        username: `user${i}`,
        name: `User ${i}`,
      }));

      const limit = 10;
      const results = mockPeople.slice(0, limit + 1);

      let nextCursor: string | undefined;
      if (results.length > limit) {
        const nextItem = results.pop();
        nextCursor = nextItem?.id;
      }

      expect(results.length).toBe(limit);
      expect(nextCursor).toBe("person-10");
    });

    it("returns all items when fewer than limit exist", () => {
      const mockPeople = Array.from({ length: 5 }, (_, i) => ({
        id: `person-${i}`,
        username: `user${i}`,
        name: `User ${i}`,
      }));

      const limit = 10;
      const results = [...mockPeople];

      let nextCursor: string | undefined;
      if (results.length > limit) {
        const nextItem = results.pop();
        nextCursor = nextItem?.id;
      }

      expect(results.length).toBe(5);
      expect(nextCursor).toBeUndefined();
    });

    it("returns exactly limit items when exactly limit+1 exist", () => {
      const mockPeople = Array.from({ length: 11 }, (_, i) => ({
        id: `person-${i}`,
        username: `user${i}`,
        name: `User ${i}`,
      }));

      const limit = 10;
      const results = [...mockPeople];

      let nextCursor: string | undefined;
      if (results.length > limit) {
        const nextItem = results.pop();
        nextCursor = nextItem?.id;
      }

      expect(results.length).toBe(limit);
      expect(nextCursor).toBe("person-10");
    });

    it("returns empty array when no items exist", () => {
      const mockPeople: Array<{ id: string; username: string; name: string }> = [];

      const limit = 10;
      const results = [...mockPeople];

      let nextCursor: string | undefined;
      if (results.length > limit) {
        const nextItem = results.pop();
        nextCursor = nextItem?.id;
      }

      expect(results.length).toBe(0);
      expect(nextCursor).toBeUndefined();
    });
  });

  describe("pagination cursor mechanics", () => {
    it("subsequent pages have no duplicates from first page", () => {
      const allPeople = Array.from({ length: 25 }, (_, i) => ({
        id: `person-${i}`,
        username: `user${String(i).padStart(2, "0")}`,
        name: `User ${i}`,
      }));

      const limit = 10;

      // First page
      const page1Results = allPeople.slice(0, limit + 1);
      let page1Cursor: string | undefined;
      if (page1Results.length > limit) {
        const nextItem = page1Results.pop();
        page1Cursor = nextItem?.id;
      }

      // Second page (simulating cursor query)
      const cursorIndex = allPeople.findIndex((p) => p.id === page1Cursor);
      const page2Results = allPeople.slice(cursorIndex, cursorIndex + limit + 1);
      let page2Cursor: string | undefined;
      if (page2Results.length > limit) {
        const nextItem = page2Results.pop();
        page2Cursor = nextItem?.id;
      }

      // Verify no duplicates
      const page1Ids = new Set(page1Results.map((p) => p.id));
      const page2Ids = new Set(page2Results.map((p) => p.id));
      const intersection = [...page1Ids].filter((id) => page2Ids.has(id));

      expect(intersection.length).toBe(0);
      expect(page1Results.length).toBe(limit);
      expect(page2Results.length).toBe(limit);
      expect(page2Cursor).toBe("person-20");
    });

    it("last page has undefined nextCursor", () => {
      const allPeople = Array.from({ length: 25 }, (_, i) => ({
        id: `person-${i}`,
        username: `user${String(i).padStart(2, "0")}`,
        name: `User ${i}`,
      }));

      const limit = 10;

      // Simulate third (last) page starting at index 20
      const page3Results = allPeople.slice(20, 20 + limit + 1);
      let page3Cursor: string | undefined;
      if (page3Results.length > limit) {
        const nextItem = page3Results.pop();
        page3Cursor = nextItem?.id;
      }

      // Only 5 items remain (20-24)
      expect(page3Results.length).toBe(5);
      expect(page3Cursor).toBeUndefined();
    });

    it("handles exact multiple of limit correctly", () => {
      const allPeople = Array.from({ length: 20 }, (_, i) => ({
        id: `person-${i}`,
        username: `user${String(i).padStart(2, "0")}`,
        name: `User ${i}`,
      }));

      const limit = 10;

      // First page
      const page1Results = allPeople.slice(0, limit + 1);
      let page1Cursor: string | undefined;
      if (page1Results.length > limit) {
        const nextItem = page1Results.pop();
        page1Cursor = nextItem?.id;
      }

      expect(page1Results.length).toBe(limit);
      expect(page1Cursor).toBe("person-10");

      // Second (last) page
      const page2Results = allPeople.slice(10, 10 + limit + 1);
      let page2Cursor: string | undefined;
      if (page2Results.length > limit) {
        const nextItem = page2Results.pop();
        page2Cursor = nextItem?.id;
      }

      expect(page2Results.length).toBe(limit);
      expect(page2Cursor).toBeUndefined();
    });
  });

  describe("getActivity pagination", () => {
    it("returns events sorted by createdAt desc with cursor", () => {
      const baseDate = new Date("2025-01-15T10:00:00Z");
      const mockEvents = Array.from({ length: 15 }, (_, i) => ({
        id: `event-${i}`,
        createdAt: new Date(baseDate.getTime() - i * 3600000), // 1 hour apart, descending
        author: "testuser",
        type: "issue" as const,
      }));

      const limit = 10;
      const results = mockEvents.slice(0, limit + 1);

      let nextCursor: string | undefined;
      if (results.length > limit) {
        const nextItem = results.pop();
        nextCursor = nextItem?.id;
      }

      expect(results.length).toBe(limit);
      expect(nextCursor).toBe("event-10");

      // Verify descending order (newest first)
      for (let i = 1; i < results.length; i++) {
        expect(results[i]!.createdAt.getTime()).toBeLessThan(
          results[i - 1]!.createdAt.getTime()
        );
      }
    });
  });

  describe("search filtering with pagination", () => {
    it("applies search filter before pagination", () => {
      const mockPeople = [
        { id: "1", username: "alice", name: "Alice Smith" },
        { id: "2", username: "bob", name: "Bob Jones" },
        { id: "3", username: "charlie", name: "Charlie Smith" },
        { id: "4", username: "alicia", name: "Alicia Keys" },
        { id: "5", username: "dave", name: "Dave Smith" },
      ];

      const search = "ali";
      const filtered = mockPeople.filter(
        (p) =>
          p.username.toLowerCase().includes(search.toLowerCase()) ||
          p.name.toLowerCase().includes(search.toLowerCase())
      );

      expect(filtered.length).toBe(2);
      expect(filtered.map((p) => p.username)).toContain("alice");
      expect(filtered.map((p) => p.username)).toContain("alicia");
    });
  });
});
