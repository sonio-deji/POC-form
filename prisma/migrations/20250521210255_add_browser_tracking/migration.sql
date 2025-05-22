/*
  Warnings:

  - Added the required column `charges` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vat` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "charges" TEXT NOT NULL,
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vat" TEXT NOT NULL;
