/*
  Warnings:

  - A unique constraint covering the columns `[sessionTokenHash]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "sessionTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_sessionTokenHash_key" ON "User"("sessionTokenHash");
