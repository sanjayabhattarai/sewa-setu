-- CreateEnum
CREATE TYPE "PartnerInquiryStatus" AS ENUM ('NEW', 'REVIEWED', 'CONTACTED', 'ONBOARDED', 'REJECTED');

-- CreateTable
CREATE TABLE "PartnerInquiry" (
    "id" TEXT NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "type" "HospitalType" NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "message" TEXT,
    "status" "PartnerInquiryStatus" NOT NULL DEFAULT 'NEW',
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartnerInquiry_status_idx" ON "PartnerInquiry"("status");

-- CreateIndex
CREATE INDEX "PartnerInquiry_email_idx" ON "PartnerInquiry"("email");

-- CreateIndex
CREATE INDEX "PartnerInquiry_createdAt_idx" ON "PartnerInquiry"("createdAt");
