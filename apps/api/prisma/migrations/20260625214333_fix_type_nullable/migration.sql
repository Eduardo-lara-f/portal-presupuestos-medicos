/*
  Warnings:

  - You are about to drop the column `metadata` on the `QuoteItem` table. All the data in the column will be lost.
  - Made the column `sourceId` on table `QuoteItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "QuoteItem" DROP COLUMN "metadata",
ADD COLUMN     "editable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "parentId" INTEGER,
ADD COLUMN     "type" TEXT,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "quantity" DROP DEFAULT,
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "sourceId" SET NOT NULL;

-- CreateTable
CREATE TABLE "Campaign" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "packageId" INTEGER NOT NULL,
    "discountPercentage" DECIMAL(65,30) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "QuoteItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MedicalPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
