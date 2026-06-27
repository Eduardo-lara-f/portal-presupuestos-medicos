/*
  Warnings:

  - Made the column `description` on table `QuoteItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `QuoteItem` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "MedicalPackageType" AS ENUM ('CONVENTIONAL', 'PAD');

-- CreateEnum
CREATE TYPE "PadCoverageMode" AS ENUM ('NONE', 'STANDARD', 'PARTO_CESAREA');

-- AlterTable
ALTER TABLE "MedicalPackage" ADD COLUMN     "packageType" "MedicalPackageType" NOT NULL DEFAULT 'CONVENTIONAL',
ADD COLUMN     "padCoverageMode" "PadCoverageMode" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "QuoteItem" ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL;
