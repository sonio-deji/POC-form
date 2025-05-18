/*
  Warnings:

  - Added the required column `pageId` to the `Form` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Business" DROP CONSTRAINT "Business_userId_fkey";

-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_websiteId_fkey";

-- DropForeignKey
ALTER TABLE "Website" DROP CONSTRAINT "Website_businessId_fkey";

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "pageId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "content" TEXT,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "label" DROP NOT NULL;
