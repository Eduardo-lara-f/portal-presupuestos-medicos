-- AlterTable
ALTER TABLE "Division" ADD COLUMN     "brandAccentColor" TEXT NOT NULL DEFAULT '#22C55E',
ADD COLUMN     "brandLogoKey" TEXT NOT NULL DEFAULT 'generic-health',
ADD COLUMN     "brandPrimaryColor" TEXT NOT NULL DEFAULT '#0F4C81',
ADD COLUMN     "brandSecondaryColor" TEXT NOT NULL DEFAULT '#2C8ED6',
ADD COLUMN     "corporationId" INTEGER;

-- CreateTable
CREATE TABLE "Corporation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Corporation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Corporation_code_key" ON "Corporation"("code");

-- AddForeignKey
ALTER TABLE "Division" ADD CONSTRAINT "Division_corporationId_fkey" FOREIGN KEY ("corporationId") REFERENCES "Corporation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
