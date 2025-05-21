/*
  Warnings:

  - You are about to drop the column `pageId` on the `Form` table. All the data in the column will be lost.
  - Added the required column `businessId` to the `Form` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_websiteId_fkey";

-- AlterTable
ALTER TABLE "Form" DROP COLUMN "pageId",
ADD COLUMN     "businessId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
