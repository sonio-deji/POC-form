/*
  Warnings:

  - You are about to drop the column `lastModfified` on the `Website` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Website" DROP COLUMN "lastModfified",
ADD COLUMN     "lastModified" TIMESTAMP(3);
