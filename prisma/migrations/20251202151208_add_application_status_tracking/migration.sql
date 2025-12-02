-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'REJECTED', 'HIRED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "notes" JSONB,
ADD COLUMN     "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
ADD COLUMN     "statusUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "statusUpdatedBy" TEXT,
ADD COLUMN     "withdrawnAt" TIMESTAMP(3);
