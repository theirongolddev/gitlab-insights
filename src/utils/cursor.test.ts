import { describe, it, expect, vi } from "vitest";

// Mock the env module before importing cursor
vi.mock("~/env", () => ({
  env: {
    CURSOR_SECRET: "test-cursor-secret-for-hmac-signing-12345",
    BETTER_AUTH_SECRET: "fallback-secret",
  },
}));

import {
  encodeCursor,
  decodeCursor,
  createCursorFromRecord,
  buildCursorWhereClause,
  type CursorData,
} from "./cursor";

describe("cursor utilities", () => {
  const sampleCursorData: CursorData = {
    createdAt: "2025-01-15T10:30:00.000Z",
    id: "abc123-def456-ghi789",
  };

  describe("encodeCursor", () => {
    it("encodes cursor data to base64 string", () => {
      const encoded = encodeCursor(sampleCursorData);

      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(0);
      expect(encoded).not.toContain(" ");
    });

    it("produces consistent output for same input", () => {
      const encoded1 = encodeCursor(sampleCursorData);
      const encoded2 = encodeCursor(sampleCursorData);

      expect(encoded1).toBe(encoded2);
    });

    it("produces different output for different input", () => {
      const encoded1 = encodeCursor(sampleCursorData);
      const encoded2 = encodeCursor({
        createdAt: "2025-01-16T10:30:00.000Z",
        id: "different-id",
      });

      expect(encoded1).not.toBe(encoded2);
    });
  });

  describe("decodeCursor", () => {
    it("decodes valid base64 cursor back to original data", () => {
      const encoded = encodeCursor(sampleCursorData);
      const decoded = decodeCursor(encoded);

      expect(decoded).toEqual(sampleCursorData);
    });

    it("returns null for invalid base64", () => {
      const decoded = decodeCursor("not-valid-base64!!!");

      expect(decoded).toBeNull();
    });

    it("returns null for valid base64 but invalid JSON", () => {
      const invalidJson = Buffer.from("not json", "utf-8").toString("base64");
      const decoded = decodeCursor(invalidJson);

      expect(decoded).toBeNull();
    });

    it("returns null for valid JSON but missing required fields", () => {
      const missingId = Buffer.from(
        JSON.stringify({ createdAt: "2025-01-15T10:30:00.000Z" }),
        "utf-8"
      ).toString("base64");
      const decoded = decodeCursor(missingId);

      expect(decoded).toBeNull();
    });

    it("returns null for valid JSON but wrong field types", () => {
      const wrongTypes = Buffer.from(
        JSON.stringify({ createdAt: 12345, id: null }),
        "utf-8"
      ).toString("base64");
      const decoded = decodeCursor(wrongTypes);

      expect(decoded).toBeNull();
    });

    it("returns null for empty strings in fields", () => {
      const emptyFields = Buffer.from(
        JSON.stringify({ createdAt: "", id: "" }),
        "utf-8"
      ).toString("base64");
      const decoded = decodeCursor(emptyFields);

      expect(decoded).toBeNull();
    });

    it("returns null for empty cursor string", () => {
      const decoded = decodeCursor("");

      expect(decoded).toBeNull();
    });
  });

  describe("encodeCursor and decodeCursor roundtrip", () => {
    it("handles various timestamp formats", () => {
      const timestamps = [
        "2025-01-15T10:30:00.000Z",
        "2025-12-31T23:59:59.999Z",
        "2020-01-01T00:00:00.000Z",
      ];

      for (const createdAt of timestamps) {
        const data: CursorData = { createdAt, id: "test-id" };
        const encoded = encodeCursor(data);
        const decoded = decodeCursor(encoded);

        expect(decoded).toEqual(data);
      }
    });

    it("handles UUIDs as ids", () => {
      const data: CursorData = {
        createdAt: "2025-01-15T10:30:00.000Z",
        id: "550e8400-e29b-41d4-a716-446655440000",
      };
      const encoded = encodeCursor(data);
      const decoded = decodeCursor(encoded);

      expect(decoded).toEqual(data);
    });

    it("handles special characters in id", () => {
      const data: CursorData = {
        createdAt: "2025-01-15T10:30:00.000Z",
        id: "id-with-special_chars.and/slashes",
      };
      const encoded = encodeCursor(data);
      const decoded = decodeCursor(encoded);

      expect(decoded).toEqual(data);
    });
  });

  describe("createCursorFromRecord", () => {
    it("creates cursor from database record with Date object", () => {
      const record = {
        createdAt: new Date("2025-01-15T10:30:00.000Z"),
        id: "record-id-123",
      };

      const cursor = createCursorFromRecord(record);
      const decoded = decodeCursor(cursor);

      expect(decoded).toEqual({
        createdAt: "2025-01-15T10:30:00.000Z",
        id: "record-id-123",
      });
    });

    it("preserves millisecond precision", () => {
      const record = {
        createdAt: new Date("2025-01-15T10:30:00.123Z"),
        id: "record-id",
      };

      const cursor = createCursorFromRecord(record);
      const decoded = decodeCursor(cursor);

      expect(decoded?.createdAt).toBe("2025-01-15T10:30:00.123Z");
    });
  });

  describe("buildCursorWhereClause", () => {
    it("returns array with two OR conditions", () => {
      const cursorData: CursorData = {
        createdAt: "2025-01-15T10:30:00.000Z",
        id: "cursor-id",
      };

      const whereClause = buildCursorWhereClause(cursorData);

      expect(Array.isArray(whereClause)).toBe(true);
      expect(whereClause).toHaveLength(2);
    });

    it("first condition filters by createdAt less than cursor", () => {
      const cursorData: CursorData = {
        createdAt: "2025-01-15T10:30:00.000Z",
        id: "cursor-id",
      };

      const whereClause = buildCursorWhereClause(cursorData);
      const firstCondition = whereClause[0]!;

      expect(firstCondition).toHaveProperty("createdAt");
      expect(firstCondition.createdAt).toHaveProperty("lt");
    });

    it("second condition filters by same createdAt and id less than cursor", () => {
      const cursorData: CursorData = {
        createdAt: "2025-01-15T10:30:00.000Z",
        id: "cursor-id",
      };

      const whereClause = buildCursorWhereClause(cursorData);
      const secondCondition = whereClause[1]!;

      expect(secondCondition).toHaveProperty("createdAt");
      expect(secondCondition).toHaveProperty("id");
      expect(secondCondition.id).toHaveProperty("lt");
    });

    it("converts ISO string to Date object for Prisma", () => {
      const cursorData: CursorData = {
        createdAt: "2025-01-15T10:30:00.000Z",
        id: "cursor-id",
      };

      const whereClause = buildCursorWhereClause(cursorData);
      const firstCondition = whereClause[0]!;

      const ltValue = (firstCondition.createdAt as { lt: Date }).lt;
      expect(ltValue).toBeInstanceOf(Date);
      expect(ltValue.toISOString()).toBe("2025-01-15T10:30:00.000Z");
    });
  });
});
