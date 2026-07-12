/*
  Warnings:

  - Added the required column `departmentId` to the `Asset` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LifecycleRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'LIFECYCLE_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'LIFECYCLE_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'LIFECYCLE_REJECTED';

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "departmentId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "LifecycleRequest" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "requestedStatus" "AssetStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "status" "LifecycleRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminMessage" TEXT,
    "reviewedById" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifecycleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LifecycleRequest_assetId_idx" ON "LifecycleRequest"("assetId");

-- CreateIndex
CREATE INDEX "LifecycleRequest_requestedById_idx" ON "LifecycleRequest"("requestedById");

-- CreateIndex
CREATE INDEX "LifecycleRequest_reviewedById_idx" ON "LifecycleRequest"("reviewedById");

-- CreateIndex
CREATE INDEX "LifecycleRequest_status_idx" ON "LifecycleRequest"("status");

-- CreateIndex
CREATE INDEX "Asset_departmentId_idx" ON "Asset"("departmentId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifecycleRequest" ADD CONSTRAINT "LifecycleRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifecycleRequest" ADD CONSTRAINT "LifecycleRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifecycleRequest" ADD CONSTRAINT "LifecycleRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
