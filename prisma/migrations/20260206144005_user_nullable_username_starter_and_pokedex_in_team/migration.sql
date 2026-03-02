/*
  Warnings:

  - You are about to drop the `Equipe` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Equipe" DROP CONSTRAINT "Equipe_userId_fkey";

-- AlterTable
ALTER TABLE "Pokedex" ADD COLUMN     "inTeam" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "username" DROP NOT NULL;

-- DropTable
DROP TABLE "Equipe";
