-- DropIndex
DROP INDEX "Event_labels_gin_idx";

-- CreateTable
CREATE TABLE "Commit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "shortSha" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authoredAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT,
    "projectId" TEXT NOT NULL,
    "webUrl" TEXT NOT NULL,
    "additions" INTEGER NOT NULL DEFAULT 0,
    "deletions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "directory" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "extension" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitFile" (
    "id" TEXT NOT NULL,
    "commitId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,

    CONSTRAINT "CommitFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Commit_userId_authoredAt_idx" ON "Commit"("userId", "authoredAt");

-- CreateIndex
CREATE INDEX "Commit_userId_projectId_idx" ON "Commit"("userId", "projectId");

-- CreateIndex
CREATE INDEX "Commit_personId_idx" ON "Commit"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Commit_userId_sha_key" ON "Commit"("userId", "sha");

-- CreateIndex
CREATE INDEX "File_userId_directory_idx" ON "File"("userId", "directory");

-- CreateIndex
CREATE INDEX "File_userId_extension_idx" ON "File"("userId", "extension");

-- CreateIndex
CREATE UNIQUE INDEX "File_userId_path_key" ON "File"("userId", "path");

-- CreateIndex
CREATE INDEX "CommitFile_fileId_idx" ON "CommitFile"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "CommitFile_commitId_fileId_key" ON "CommitFile"("commitId", "fileId");

-- AddForeignKey
ALTER TABLE "Commit" ADD CONSTRAINT "Commit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commit" ADD CONSTRAINT "Commit_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitFile" ADD CONSTRAINT "CommitFile_commitId_fkey" FOREIGN KEY ("commitId") REFERENCES "Commit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitFile" ADD CONSTRAINT "CommitFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
