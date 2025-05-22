-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_createdFromId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_customerId_fkey";

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "createdFromId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Submission" ALTER COLUMN "customerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_createdFromId_fkey" FOREIGN KEY ("createdFromId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
