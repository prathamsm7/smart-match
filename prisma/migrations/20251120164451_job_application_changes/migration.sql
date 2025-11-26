/*
  Warnings:

  - You are about to drop the column `jobDescription` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `jobRequirements` on the `Job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "jobDescription",
DROP COLUMN "jobRequirements",
ADD COLUMN     "applyLink" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "employmentType" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "requirements" JSONB,
ADD COLUMN     "responsibilities" TEXT,
ADD COLUMN     "salary" TEXT;
