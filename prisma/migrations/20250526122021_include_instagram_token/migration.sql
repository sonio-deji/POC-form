/*
  Warnings:

  - A unique constraint covering the columns `[businessId]` on the table `Form` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Website" ADD COLUMN     "instagramToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Form_businessId_key" ON "Form"("businessId");
