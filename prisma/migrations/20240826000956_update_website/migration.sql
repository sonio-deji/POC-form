/*
  Warnings:

  - A unique constraint covering the columns `[websiteId]` on the table `Business` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId]` on the table `Website` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `businessId` to the `Website` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "websiteId" TEXT;

-- AlterTable
ALTER TABLE "Website" ADD COLUMN     "businessId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Business_websiteId_key" ON "Business"("websiteId");

-- CreateIndex
CREATE UNIQUE INDEX "Website_businessId_key" ON "Website"("businessId");

-- AddForeignKey
ALTER TABLE "Website" ADD CONSTRAINT "Website_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
