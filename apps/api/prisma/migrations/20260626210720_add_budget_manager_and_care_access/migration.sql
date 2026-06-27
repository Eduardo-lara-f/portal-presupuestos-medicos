-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'BUDGET_MANAGER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "careAccess" "CareType" NOT NULL DEFAULT 'BOTH';
