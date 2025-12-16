-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "assignees" TEXT[],
ADD COLUMN     "closesIssueIds" INTEGER[],
ADD COLUMN     "commentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gitlabParentId" INTEGER,
ADD COLUMN     "isSystemNote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "mentionedInIds" INTEGER[],
ADD COLUMN     "parentEventId" TEXT,
ADD COLUMN     "parentType" TEXT,
ADD COLUMN     "participants" TEXT[],
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "dashboardView" TEXT NOT NULL DEFAULT 'grouped';

-- CreateTable
CREATE TABLE "ReadEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gitlabId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReadEvent_userId_readAt_idx" ON "ReadEvent"("userId", "readAt");

-- CreateIndex
CREATE INDEX "ReadEvent_eventId_idx" ON "ReadEvent"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadEvent_userId_eventId_key" ON "ReadEvent"("userId", "eventId");

-- CreateIndex
CREATE INDEX "Person_userId_idx" ON "Person"("userId");

-- CreateIndex
CREATE INDEX "Person_userId_username_idx" ON "Person"("userId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "Person_userId_gitlabId_key" ON "Person"("userId", "gitlabId");

-- CreateIndex
CREATE INDEX "Event_parentEventId_createdAt_idx" ON "Event"("parentEventId", "createdAt");

-- CreateIndex
CREATE INDEX "Event_gitlabParentId_idx" ON "Event"("gitlabParentId");

-- CreateIndex
CREATE INDEX "Event_status_lastActivityAt_idx" ON "Event"("status", "lastActivityAt");

-- CreateIndex
CREATE INDEX "Event_userId_type_status_idx" ON "Event"("userId", "type", "status");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadEvent" ADD CONSTRAINT "ReadEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadEvent" ADD CONSTRAINT "ReadEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
