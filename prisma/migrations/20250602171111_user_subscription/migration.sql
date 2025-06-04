/*
  Warnings:

  - You are about to drop the column `img` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `subscription` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "VisitsByBrowser" DROP CONSTRAINT "VisitsByBrowser_analyticsId_fkey";

-- DropForeignKey
ALTER TABLE "VisitsByLocation" DROP CONSTRAINT "VisitsByLocation_analyticsId_fkey";

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "img";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "subscription";

-- AlterTable
ALTER TABLE "Website" ALTER COLUMN "homePage" SET DEFAULT '/';

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- AddForeignKey
ALTER TABLE "VisitsByBrowser" ADD CONSTRAINT "VisitsByBrowser_analyticsId_fkey" FOREIGN KEY ("analyticsId") REFERENCES "Analytics"("websiteId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitsByLocation" ADD CONSTRAINT "VisitsByLocation_analyticsId_fkey" FOREIGN KEY ("analyticsId") REFERENCES "Analytics"("websiteId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
