/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Page` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[homePageId]` on the table `Website` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `url` to the `Website` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Website" ADD COLUMN     "homePageId" TEXT,
ADD COLUMN     "url" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Website_homePageId_key" ON "Website"("homePageId");

-- AddForeignKey
ALTER TABLE "Website" ADD CONSTRAINT "Website_homePageId_fkey" FOREIGN KEY ("homePageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;
