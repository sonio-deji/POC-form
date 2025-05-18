/*
  Warnings:

  - You are about to drop the column `websiteId` on the `Business` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Business_websiteId_key";

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "websiteId";

-- AddForeignKey
ALTER TABLE "Website" ADD CONSTRAINT "Website_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
