/**
 * Cursor-based pagination utilities for infinite scroll.
 *
 * Cursors encode position information (createdAt + id) as base64 JSON
 * for stable, consistent pagination that handles concurrent inserts.
 * 
 * Security: Cursors are HMAC-signed to prevent tampering.
 */

import { createHmac, timingSafeEqual } from "crypto";
import { env } from "~/env";

export interface CursorData {
  createdAt: string; // ISO 8601 timestamp
  id: string; // Event UUID for tiebreaker
}

interface SignedCursor {
  d: CursorData; // data
  s: string; // signature
}

function getSecret(): string {
  // Use CURSOR_SECRET if set, otherwise fall back to BETTER_AUTH_SECRET
  const secret = env.CURSOR_SECRET ?? env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("No secret available for cursor signing. Set CURSOR_SECRET or BETTER_AUTH_SECRET.");
  }
  return secret;
}

function sign(data: CursorData): string {
  const hmac = createHmac("sha256", getSecret());
  hmac.update(JSON.stringify(data));
  return hmac.digest("base64url");
}

function verify(data: CursorData, signature: string): boolean {
  const expected = sign(data);
  // Use timing-safe comparison to prevent timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(signature, "base64url"),
      Buffer.from(expected, "base64url")
    );
  } catch {
    return false;
  }
}

/**
 * Encodes cursor data to a base64 string for use in API responses.
 *
 * @param data - The cursor position data (createdAt timestamp and id)
 * @returns Base64-encoded cursor string
 *
 * @example
 * const cursor = encodeCursor({
 *   createdAt: "2025-01-15T10:30:00.000Z",
 *   id: "abc123"
 * });
 * // Returns: "eyJjcmVhdGVkQXQiOiIyMDI1LTAxLTE1VDEwOjMwOjAwLjAwMFoiLCJpZCI6ImFiYzEyMyJ9"
 */
export function encodeCursor(data: CursorData): string {
  const signedCursor: SignedCursor = {
    d: data,
    s: sign(data),
  };
  const json = JSON.stringify(signedCursor);
  // Use Buffer for Node.js environment (server-side)
  if (typeof Buffer !== "undefined") {
    return Buffer.from(json, "utf-8").toString("base64url");
  }
  // Use btoa for browser environment (client-side)
  return btoa(json);
}

/**
 * Decodes a base64 cursor string back to cursor data.
 *
 * @param cursor - Base64-encoded cursor string
 * @returns Decoded cursor data, or null if invalid
 *
 * @example
 * const data = decodeCursor("eyJjcmVhdGVkQXQiOiIyMDI1LTAxLTE1VDEwOjMwOjAwLjAwMFoiLCJpZCI6ImFiYzEyMyJ9");
 * // Returns: { createdAt: "2025-01-15T10:30:00.000Z", id: "abc123" }
 */
export function decodeCursor(cursor: string): CursorData | null {
  try {
    let json: string;
    // Use Buffer for Node.js environment (server-side)
    if (typeof Buffer !== "undefined") {
      json = Buffer.from(cursor, "base64url").toString("utf-8");
    } else {
      // Use atob for browser environment (client-side)
      json = atob(cursor);
    }

    const parsed: unknown = JSON.parse(json);

    // Check if it's a signed cursor
    if (isSignedCursor(parsed)) {
      // Verify HMAC signature
      if (!verify(parsed.d, parsed.s)) {
        return null; // Tampered cursor
      }
      // Validate the inner data structure
      if (!isValidCursorData(parsed.d)) {
        return null;
      }
      return parsed.d;
    }

    // Legacy: unsigned cursor (for backwards compatibility during transition)
    // TODO: Remove this fallback after all clients have migrated to signed cursors
    if (isValidCursorData(parsed)) {
      return parsed;
    }

    return null;
  } catch {
    // Invalid base64 or JSON
    return null;
  }
}

function isSignedCursor(data: unknown): data is SignedCursor {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.d === "object" &&
    obj.d !== null &&
    typeof obj.s === "string" &&
    obj.s.length > 0
  );
}

/**
 * Type guard to validate cursor data structure.
 * Validates that createdAt is a valid ISO 8601 date string.
 */
function isValidCursorData(data: unknown): data is CursorData {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (
    typeof obj.createdAt !== "string" ||
    typeof obj.id !== "string" ||
    obj.createdAt.length === 0 ||
    obj.id.length === 0
  ) {
    return false;
  }

  // Validate that createdAt is a valid date
  const date = new Date(obj.createdAt);
  if (isNaN(date.getTime())) {
    return false;
  }

  return true;
}

/**
 * Creates a cursor from a database record that has createdAt and id fields.
 *
 * @param record - Database record with createdAt (Date) and id (string)
 * @returns Encoded cursor string
 *
 * @example
 * const events = await db.event.findMany(...);
 * const lastEvent = events[events.length - 1];
 * const nextCursor = createCursorFromRecord(lastEvent);
 */
export function createCursorFromRecord(record: {
  createdAt: Date;
  id: string;
}): string {
  return encodeCursor({
    createdAt: record.createdAt.toISOString(),
    id: record.id,
  });
}

/**
 * Builds Prisma where clause for cursor-based pagination.
 * Uses (createdAt, id) compound ordering for stable pagination.
 *
 * @param cursor - Decoded cursor data
 * @returns Prisma OR condition for cursor filtering
 *
 * @example
 * const cursorData = decodeCursor(input.cursor);
 * const where = {
 *   ...baseFilters,
 *   ...(cursorData && { OR: buildCursorWhereClause(cursorData) }),
 * };
 */
export function buildCursorWhereClause(cursor: CursorData): Array<{
  createdAt?: { lt: Date } | Date;
  id?: { lt: string };
}> {
  const cursorDate = new Date(cursor.createdAt);

  return [
    // Events with earlier createdAt
    { createdAt: { lt: cursorDate } },
    // Events with same createdAt but earlier id (tiebreaker)
    { createdAt: cursorDate, id: { lt: cursor.id } },
  ];
}
