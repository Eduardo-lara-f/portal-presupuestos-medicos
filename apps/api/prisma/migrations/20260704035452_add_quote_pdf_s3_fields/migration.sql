-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "pdfGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "pdfS3Key" TEXT;
