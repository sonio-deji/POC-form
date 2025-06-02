-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'Free';
