/*
  Warnings:

  - A unique constraint covering the columns `[country,region,city,timezone,analyticsId]` on the table `VisitsByLocation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "VisitsByLocation_analyticsId_key";

-- DropIndex
DROP INDEX "VisitsByLocation_id_key";

-- AlterTable
ALTER TABLE "VisitsByLocation" ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "VisitsByBrowser" (
    "id" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "analyticsId" TEXT NOT NULL,

    CONSTRAINT "VisitsByBrowser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisitsByBrowser_browser_analyticsId_key" ON "VisitsByBrowser"("browser", "analyticsId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitsByLocation_country_region_city_timezone_analyticsId_key" ON "VisitsByLocation"("country", "region", "city", "timezone", "analyticsId");

-- AddForeignKey
ALTER TABLE "VisitsByBrowser" ADD CONSTRAINT "VisitsByBrowser_analyticsId_fkey" FOREIGN KEY ("analyticsId") REFERENCES "Analytics"("websiteId") ON DELETE RESTRICT ON UPDATE CASCADE;
