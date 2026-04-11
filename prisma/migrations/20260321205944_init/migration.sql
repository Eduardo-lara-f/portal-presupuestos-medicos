-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'DIVISION_ADMIN', 'EXECUTIVE', 'MAINTAINER', 'VIEWER');

-- CreateEnum
CREATE TYPE "CareType" AS ENUM ('AMBULATORY', 'SURGICAL', 'BOTH');

-- CreateEnum
CREATE TYPE "ProfessionalType" AS ENUM ('STAFF', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "CoverageType" AS ENUM ('ISAPRE_PLAN', 'FONASA', 'PARTICULAR', 'OTHER');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'FINALIZED', 'SENT');

-- CreateEnum
CREATE TYPE "QuoteItemSourceType" AS ENUM ('PROCEDURE', 'PACKAGE', 'BASKET', 'MANUAL');

-- CreateTable
CREATE TABLE "Division" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "birthDate" TIMESTAMP(3),
    "sex" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Isapre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Isapre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IsaprePlan" (
    "id" TEXT NOT NULL,
    "isapreId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IsaprePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DivisionIsapre" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "isapreId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DivisionIsapre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procedure" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "careType" "CareType" NOT NULL DEFAULT 'BOTH',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedurePrice" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "coverageType" "CoverageType" NOT NULL,
    "isapreId" TEXT,
    "isaprePlanId" TEXT,
    "fonasaCode" TEXT,
    "payerLabel" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcedurePrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "type" "ProfessionalType" NOT NULL,
    "rut" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "specialty" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalFee" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "coverageType" "CoverageType" NOT NULL,
    "isapreId" TEXT,
    "isaprePlanId" TEXT,
    "feeType" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalPackage" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalPackageItem" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceMode" TEXT NOT NULL DEFAULT 'AGREEMENT_PRICE',
    "fixedPrice" DECIMAL(12,2),

    CONSTRAINT "MedicalPackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedurePackageLink" (
    "id" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,

    CONSTRAINT "ProcedurePackageLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Basket" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Basket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BasketItem" (
    "id" TEXT NOT NULL,
    "basketId" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "relevanceScore" DECIMAL(5,2),

    CONSTRAINT "BasketItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "coverageType" "CoverageType" NOT NULL,
    "isapreId" TEXT,
    "isaprePlanId" TEXT,
    "fonasaCode" TEXT,
    "payerLabel" TEXT,
    "careType" "CareType" NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "validityDays" INTEGER NOT NULL DEFAULT 15,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discountTotal" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteProfessional" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "roleInSurgery" TEXT,
    "professionalType" "ProfessionalType" NOT NULL,
    "feeAmount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "QuoteProfessional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "sourceType" "QuoteItemSourceType" NOT NULL,
    "sourceId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteEmailLog" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,

    CONSTRAINT "QuoteEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Division_code_key" ON "Division"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_divisionId_rut_key" ON "Patient"("divisionId", "rut");

-- CreateIndex
CREATE UNIQUE INDEX "Isapre_code_key" ON "Isapre"("code");

-- CreateIndex
CREATE UNIQUE INDEX "IsaprePlan_isapreId_name_key" ON "IsaprePlan"("isapreId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "DivisionIsapre_divisionId_isapreId_key" ON "DivisionIsapre"("divisionId", "isapreId");

-- CreateIndex
CREATE UNIQUE INDEX "Procedure_divisionId_code_key" ON "Procedure"("divisionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalPackage_divisionId_code_key" ON "MedicalPackage"("divisionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ProcedurePackageLink_procedureId_packageId_key" ON "ProcedurePackageLink"("procedureId", "packageId");

-- CreateIndex
CREATE UNIQUE INDEX "Basket_divisionId_code_key" ON "Basket"("divisionId", "code");

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
