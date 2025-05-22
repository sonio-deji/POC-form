/*
  Warnings:

  - You are about to drop the column `invoiceDue` on the `Invoice` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invoiceNo]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "invoiceDue";

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");
