-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "deliveredCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "failedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "failedRecipients" TEXT[] DEFAULT ARRAY[]::TEXT[];
