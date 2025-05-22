-- AlterTable
ALTER TABLE "Analytics" ADD COLUMN     "urlVisits" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "visitsByBrowser" DROP NOT NULL;
