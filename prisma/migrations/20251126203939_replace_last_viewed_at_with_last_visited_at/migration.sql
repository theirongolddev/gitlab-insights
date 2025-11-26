/*
  Warnings:

  - You are about to drop the column `lastViewedAt` on the `UserQuery` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserQuery" DROP COLUMN "lastViewedAt",
ADD COLUMN     "last_visited_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
