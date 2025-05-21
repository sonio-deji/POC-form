/*
  Warnings:

  - You are about to drop the column `homePageId` on the `Website` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Website" DROP CONSTRAINT "Website_homePageId_fkey";

-- DropIndex
DROP INDEX "Website_homePageId_key";

-- AlterTable
ALTER TABLE "Website" DROP COLUMN "homePageId",
ADD COLUMN     "homePage" TEXT NOT NULL DEFAULT '/';
