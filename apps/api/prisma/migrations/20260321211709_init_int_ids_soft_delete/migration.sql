/*
  Warnings:

  - The primary key for the `Basket` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Basket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `BasketItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `BasketItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Division` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Division` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `DivisionIsapre` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `DivisionIsapre` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Isapre` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Isapre` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `IsaprePlan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `IsaprePlan` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `MedicalFee` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `MedicalFee` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `isapreId` column on the `MedicalFee` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `isaprePlanId` column on the `MedicalFee` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `MedicalPackage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `MedicalPackage` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `MedicalPackageItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `MedicalPackageItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Patient` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Patient` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Procedure` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Procedure` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ProcedurePackageLink` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ProcedurePackageLink` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ProcedurePrice` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ProcedurePrice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `isapreId` column on the `ProcedurePrice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `isaprePlanId` column on the `ProcedurePrice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Professional` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Professional` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Quote` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Quote` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `isapreId` column on the `Quote` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `isaprePlanId` column on the `Quote` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `QuoteEmailLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `QuoteEmailLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `QuoteItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `QuoteItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `sourceId` column on the `QuoteItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `QuoteProfessional` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `QuoteProfessional` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `divisionId` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `divisionId` on the `Basket` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `BasketItem` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `basketId` on the `BasketItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `procedureId` on the `BasketItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `divisionId` on the `DivisionIsapre` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `isapreId` on the `DivisionIsapre` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `isapreId` on the `IsaprePlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `divisionId` on the `MedicalFee` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `professionalId` on the `MedicalFee` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `procedureId` on the `MedicalFee` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `divisionId` on the `MedicalPackage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `MedicalPackageItem` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `packageId` on the `MedicalPackageItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `procedureId` on the `MedicalPackageItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `divisionId` on the `Patient` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `divisionId` on the `Procedure` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `ProcedurePackageLink` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `procedureId` on the `ProcedurePackageLink` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `packageId` on the `ProcedurePackageLink` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `divisionId` on the `ProcedurePackageLink` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `divisionId` on the `ProcedurePrice` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `procedureId` on the `ProcedurePrice` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `divisionId` on the `Professional` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `divisionId` on the `Quote` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `patientId` on the `Quote` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdByUserId` on the `Quote` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `QuoteEmailLog` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `quoteId` on the `QuoteEmailLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `QuoteItem` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `quoteId` on the `QuoteItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `QuoteProfessional` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `quoteId` on the `QuoteProfessional` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `professionalId` on the `QuoteProfessional` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Basket" DROP CONSTRAINT "Basket_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "BasketItem" DROP CONSTRAINT "BasketItem_basketId_fkey";

-- DropForeignKey
ALTER TABLE "BasketItem" DROP CONSTRAINT "BasketItem_procedureId_fkey";

-- DropForeignKey
ALTER TABLE "DivisionIsapre" DROP CONSTRAINT "DivisionIsapre_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "DivisionIsapre" DROP CONSTRAINT "DivisionIsapre_isapreId_fkey";

-- DropForeignKey
ALTER TABLE "IsaprePlan" DROP CONSTRAINT "IsaprePlan_isapreId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalFee" DROP CONSTRAINT "MedicalFee_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalFee" DROP CONSTRAINT "MedicalFee_isapreId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalFee" DROP CONSTRAINT "MedicalFee_isaprePlanId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalFee" DROP CONSTRAINT "MedicalFee_procedureId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalFee" DROP CONSTRAINT "MedicalFee_professionalId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalPackage" DROP CONSTRAINT "MedicalPackage_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalPackageItem" DROP CONSTRAINT "MedicalPackageItem_packageId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalPackageItem" DROP CONSTRAINT "MedicalPackageItem_procedureId_fkey";

-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "Procedure" DROP CONSTRAINT "Procedure_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "ProcedurePackageLink" DROP CONSTRAINT "ProcedurePackageLink_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "ProcedurePackageLink" DROP CONSTRAINT "ProcedurePackageLink_packageId_fkey";

-- DropForeignKey
ALTER TABLE "ProcedurePackageLink" DROP CONSTRAINT "ProcedurePackageLink_procedureId_fkey";

-- DropForeignKey
ALTER TABLE "ProcedurePrice" DROP CONSTRAINT "ProcedurePrice_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "ProcedurePrice" DROP CONSTRAINT "ProcedurePrice_isapreId_fkey";

-- DropForeignKey
ALTER TABLE "ProcedurePrice" DROP CONSTRAINT "ProcedurePrice_isaprePlanId_fkey";

-- DropForeignKey
ALTER TABLE "ProcedurePrice" DROP CONSTRAINT "ProcedurePrice_procedureId_fkey";

-- DropForeignKey
ALTER TABLE "Professional" DROP CONSTRAINT "Professional_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_isapreId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_isaprePlanId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_patientId_fkey";

-- DropForeignKey
ALTER TABLE "QuoteEmailLog" DROP CONSTRAINT "QuoteEmailLog_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "QuoteItem" DROP CONSTRAINT "QuoteItem_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "QuoteProfessional" DROP CONSTRAINT "QuoteProfessional_professionalId_fkey";

-- DropForeignKey
ALTER TABLE "QuoteProfessional" DROP CONSTRAINT "QuoteProfessional_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_divisionId_fkey";

-- AlterTable
ALTER TABLE "Basket" DROP CONSTRAINT "Basket_pkey",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "divisionId",
ADD COLUMN     "divisionId" INTEGER NOT NULL,
ADD CONSTRAINT "Basket_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "BasketItem" DROP CONSTRAINT "BasketItem_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "basketId",
ADD COLUMN     "basketId" INTEGER NOT NULL,
DROP COLUMN "procedureId",
ADD COLUMN     "procedureId" INTEGER NOT NULL,
ADD CONSTRAINT "BasketItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Division" DROP CONSTRAINT "Division_pkey",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Division_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "DivisionIsapre" DROP CONSTRAINT "DivisionIsapre_pkey",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "divisionId",
ADD COLUMN     "divisionId" INTEGER NOT NULL,
DROP COLUMN "isapreId",
ADD COLUMN     "isapreId" INTEGER NOT NULL,
ADD CONSTRAINT "DivisionIsapre_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Isapre" DROP CONSTRAINT "Isapre_pkey",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Isapre_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "IsaprePlan" DROP CONSTRAINT "IsaprePlan_pkey",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "isapreId",
ADD COLUMN     "isapreId" INTEGER NOT NULL,
ADD CONSTRAINT "IsaprePlan_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MedicalFee" DROP CONSTRAINT "MedicalFee_pkey",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "divisionId",
ADD COLUMN     "divisionId" INTEGER NOT NULL,
DROP COLUMN "professionalId",
ADD COLUMN     "professionalId" INTEGER NOT NULL,
DROP COLUMN "procedureId",
ADD COLUMN     "procedureId" INTEGER NOT NULL,
DROP COLUMN "isapreId",
ADD COLUMN     "isapreId" INTEGER,
DROP COLUMN "isaprePlanId",
ADD COLUMN     "isaprePlanId" INTEGER,
ADD CONSTRAINT "MedicalFee_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MedicalPackage" DROP CONSTRAINT "MedicalPackage_pkey",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "divisionId",
ADD COLUMN     "divisionId" INTEGER NOT NULL,
ADD CONSTRAINT "MedicalPackage_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MedicalPackageItem" DROP CONSTRAINT "MedicalPackageItem_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "packageId",
ADD COLUMN     "packageId" INTEGER NOT NULL,
DROP COLUMN "procedureId",
ADD COLUMN     "procedureId" INTEGER NOT NULL,
ADD CONSTRAINT "MedicalPackageItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_pkey",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "divisionId",
ADD COLUMN     "divisionId" INTEGER NOT NULL,
ADD CONSTRAINT "Patient_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Procedure" DROP CONSTRAINT "Procedure_pkey",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "divisionId",
ADD COLUMN     "divisionId" INTEGER NOT NULL,
ADD CONSTRAINT "Procedure_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ProcedurePackageLink" DROP CONSTRAINT "ProcedurePackageLink_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "procedureId",
ADD COLUMN     "procedureId" INTEGER NOT NULL,
DROP COLUMN "packageId",
ADD COLUMN     "packageId" INTEGER NOT NULL,
DROP COLUMN "divisionId",
ADD COLUMN     "divisionId" INTEGER NOT NULL,
ADD CONSTRAINT "ProcedurePackageLink_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ProcedurePrice" DROP CONSTRAINT "ProcedurePrice_pkey",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "divisionId",
ADD COLUMN     "divisionId" INTEGER NOT NULL,
DROP COLUMN "procedureId",
ADD COLUMN     "procedureId" INTEGER NOT NULL,
DROP COLUMN "isapreId",
ADD COLUMN     "isapreId" INTEGER,
DROP COLUMN "isaprePlanId",
ADD COLUMN     "isaprePlanId" INTEGER,
ADD CONSTRAINT "ProcedurePrice_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Professional" DROP CONSTRAINT "Professional_pkey",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "divisionId",
ADD COLUMN     "divisionId" INTEGER NOT NULL,
ADD CONSTRAINT "Professional_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_pkey",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "divisionId",
ADD COLUMN     "divisionId" INTEGER NOT NULL,
DROP COLUMN "patientId",
ADD COLUMN     "patientId" INTEGER NOT NULL,
DROP COLUMN "isapreId",
ADD COLUMN     "isapreId" INTEGER,
DROP COLUMN "isaprePlanId",
ADD COLUMN     "isaprePlanId" INTEGER,
DROP COLUMN "createdByUserId",
ADD COLUMN     "createdByUserId" INTEGER NOT NULL,
ADD CONSTRAINT "Quote_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "QuoteEmailLog" DROP CONSTRAINT "QuoteEmailLog_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "quoteId",
ADD COLUMN     "quoteId" INTEGER NOT NULL,
ADD CONSTRAINT "QuoteEmailLog_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "QuoteItem" DROP CONSTRAINT "QuoteItem_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "quoteId",
ADD COLUMN     "quoteId" INTEGER NOT NULL,
DROP COLUMN "sourceId",
ADD COLUMN     "sourceId" INTEGER,
ADD CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "QuoteProfessional" DROP CONSTRAINT "QuoteProfessional_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "quoteId",
ADD COLUMN     "quoteId" INTEGER NOT NULL,
DROP COLUMN "professionalId",
ADD COLUMN     "professionalId" INTEGER NOT NULL,
ADD CONSTRAINT "QuoteProfessional_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "divisionId",
ADD COLUMN     "divisionId" INTEGER,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Basket_divisionId_code_key" ON "Basket"("divisionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "DivisionIsapre_divisionId_isapreId_key" ON "DivisionIsapre"("divisionId", "isapreId");

-- CreateIndex
CREATE UNIQUE INDEX "IsaprePlan_isapreId_name_key" ON "IsaprePlan"("isapreId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalPackage_divisionId_code_key" ON "MedicalPackage"("divisionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_divisionId_rut_key" ON "Patient"("divisionId", "rut");

-- CreateIndex
CREATE UNIQUE INDEX "Procedure_divisionId_code_key" ON "Procedure"("divisionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ProcedurePackageLink_procedureId_packageId_key" ON "ProcedurePackageLink"("procedureId", "packageId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IsaprePlan" ADD CONSTRAINT "IsaprePlan_isapreId_fkey" FOREIGN KEY ("isapreId") REFERENCES "Isapre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DivisionIsapre" ADD CONSTRAINT "DivisionIsapre_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DivisionIsapre" ADD CONSTRAINT "DivisionIsapre_isapreId_fkey" FOREIGN KEY ("isapreId") REFERENCES "Isapre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procedure" ADD CONSTRAINT "Procedure_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedurePrice" ADD CONSTRAINT "ProcedurePrice_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedurePrice" ADD CONSTRAINT "ProcedurePrice_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedurePrice" ADD CONSTRAINT "ProcedurePrice_isapreId_fkey" FOREIGN KEY ("isapreId") REFERENCES "Isapre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedurePrice" ADD CONSTRAINT "ProcedurePrice_isaprePlanId_fkey" FOREIGN KEY ("isaprePlanId") REFERENCES "IsaprePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalFee" ADD CONSTRAINT "MedicalFee_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalFee" ADD CONSTRAINT "MedicalFee_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalFee" ADD CONSTRAINT "MedicalFee_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalFee" ADD CONSTRAINT "MedicalFee_isapreId_fkey" FOREIGN KEY ("isapreId") REFERENCES "Isapre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalFee" ADD CONSTRAINT "MedicalFee_isaprePlanId_fkey" FOREIGN KEY ("isaprePlanId") REFERENCES "IsaprePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalPackage" ADD CONSTRAINT "MedicalPackage_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalPackageItem" ADD CONSTRAINT "MedicalPackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MedicalPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalPackageItem" ADD CONSTRAINT "MedicalPackageItem_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedurePackageLink" ADD CONSTRAINT "ProcedurePackageLink_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedurePackageLink" ADD CONSTRAINT "ProcedurePackageLink_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MedicalPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedurePackageLink" ADD CONSTRAINT "ProcedurePackageLink_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Basket" ADD CONSTRAINT "Basket_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BasketItem" ADD CONSTRAINT "BasketItem_basketId_fkey" FOREIGN KEY ("basketId") REFERENCES "Basket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BasketItem" ADD CONSTRAINT "BasketItem_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_isapreId_fkey" FOREIGN KEY ("isapreId") REFERENCES "Isapre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_isaprePlanId_fkey" FOREIGN KEY ("isaprePlanId") REFERENCES "IsaprePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteProfessional" ADD CONSTRAINT "QuoteProfessional_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteProfessional" ADD CONSTRAINT "QuoteProfessional_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteEmailLog" ADD CONSTRAINT "QuoteEmailLog_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
