/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `EmailVerificationToken` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmailVerificationToken" DROP COLUMN "expiresAt";
