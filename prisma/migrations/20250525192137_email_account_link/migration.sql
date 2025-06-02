/*
  Warnings:

  - Changed the type of `provider` on the `LinkedEmailAccount` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Providers" AS ENUM ('GOOGLE', 'MICROSOFT');

-- AlterTable
ALTER TABLE "LinkedEmailAccount" DROP COLUMN "provider",
ADD COLUMN     "provider" "Providers" NOT NULL;
