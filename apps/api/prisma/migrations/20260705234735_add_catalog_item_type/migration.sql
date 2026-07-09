-- CreateEnum
CREATE TYPE "CatalogItemType" AS ENUM ('PROCEDURE', 'SUPPLY', 'MEDICATION', 'BED_DAY', 'MEDICAL_FEE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QuoteItemSourceType" ADD VALUE 'SUPPLY';
ALTER TYPE "QuoteItemSourceType" ADD VALUE 'MEDICATION';
ALTER TYPE "QuoteItemSourceType" ADD VALUE 'BED_DAY';
ALTER TYPE "QuoteItemSourceType" ADD VALUE 'MEDICAL_FEE';

-- AlterTable
ALTER TABLE "Procedure" ADD COLUMN     "itemType" "CatalogItemType" NOT NULL DEFAULT 'PROCEDURE';
