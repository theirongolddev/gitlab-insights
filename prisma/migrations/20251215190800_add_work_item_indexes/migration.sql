-- Add composite indexes for work item grouping queries

-- Index for listing top-level work items (WHERE parentEventId IS NULL)
-- Optimizes getWorkItemsGrouped query
CREATE INDEX IF NOT EXISTS "Event_userId_parentEventId_lastActivityAt_idx" 
ON "Event"("userId", "parentEventId", "lastActivityAt" DESC);

-- Index for finding children of a work item (comments on issue/MR)
-- Optimizes getWithActivity query
CREATE INDEX IF NOT EXISTS "Event_userId_parentEventId_createdAt_asc_idx" 
ON "Event"("userId", "parentEventId", "createdAt" ASC);

-- GIN indexes for array fields (Prisma doesn't support these directly)
-- Optimizes queries filtering by closesIssueIds or mentionedInIds
CREATE INDEX IF NOT EXISTS "Event_closesIssueIds_gin_idx" 
ON "Event" USING GIN ("closesIssueIds");

CREATE INDEX IF NOT EXISTS "Event_mentionedInIds_gin_idx" 
ON "Event" USING GIN ("mentionedInIds");
