/*
  Warnings:

  - You are about to drop the column `visitsByLocation` on the `Analytics` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Analytics" DROP COLUMN "visitsByLocation";

-- CreateTable
CREATE TABLE "VisitsByLocation" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "analyticsId" TEXT NOT NULL,

    CONSTRAINT "VisitsByLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisitsByLocation_id_key" ON "VisitsByLocation"("id");

-- CreateIndex
CREATE UNIQUE INDEX "VisitsByLocation_analyticsId_key" ON "VisitsByLocation"("analyticsId");

-- AddForeignKey
ALTER TABLE "VisitsByLocation" ADD CONSTRAINT "VisitsByLocation_analyticsId_fkey" FOREIGN KEY ("analyticsId") REFERENCES "Analytics"("websiteId") ON DELETE RESTRICT ON UPDATE CASCADE;
