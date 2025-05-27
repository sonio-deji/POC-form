/*
  Warnings:

  - Made the column `lastModified` on table `Website` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Website" ALTER COLUMN "lastModified" SET NOT NULL;
