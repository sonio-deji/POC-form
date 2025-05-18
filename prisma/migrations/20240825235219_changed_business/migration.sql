/*
  Warnings:

  - You are about to drop the column `emailVerfied` on the `User` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Business` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emailVerified` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Business" DROP CONSTRAINT "Business_id_fkey";

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerfied",
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;
