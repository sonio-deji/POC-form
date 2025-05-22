/*
  Warnings:

  - You are about to drop the column `visitsByBrowser` on the `Analytics` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Analytics" DROP COLUMN "visitsByBrowser";
