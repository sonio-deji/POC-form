/*
  Warnings:

  - The `visitsByLocation` column on the `Analytics` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `visitsByBrowser` column on the `Analytics` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Analytics" DROP COLUMN "visitsByLocation",
ADD COLUMN     "visitsByLocation" TEXT[],
DROP COLUMN "visitsByBrowser",
ADD COLUMN     "visitsByBrowser" TEXT[];
