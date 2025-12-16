-- Add missing indexes identified in code review
-- These indexes improve query performance for:
-- 1. People module queries (counting events by author)
-- 2. Work items repository filtering
-- 3. Label filtering using array containment

-- Index for people queries (author-based counts)
CREATE INDEX IF NOT EXISTS "Event_userId_author_idx" ON "Event"("userId", "author");

-- Index for repository filtering
CREATE INDEX IF NOT EXISTS "Event_userId_projectId_idx" ON "Event"("userId", "projectId");

-- GIN index for label array containment queries
-- Required for efficient `labels @> ARRAY['label']` operations
CREATE INDEX IF NOT EXISTS "Event_labels_gin_idx" ON "Event" USING gin("labels");
