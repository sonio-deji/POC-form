/*
  Warnings:

  - Changed the type of `type` on the `Field` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('text', 'number', 'date', 'dropdown', 'checkbox', 'email', 'textarea');

-- AlterTable
ALTER TABLE "Field" ADD COLUMN     "displayField" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "placeholder" TEXT NOT NULL DEFAULT '',
DROP COLUMN "type",
ADD COLUMN     "type" "FieldType" NOT NULL;
