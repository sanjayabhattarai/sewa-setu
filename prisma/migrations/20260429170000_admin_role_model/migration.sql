-- Align platform and hospital roles with the approved access model.
-- Note: legacy CONTENT_EDITOR memberships are migrated to STAFF for safety.
-- Review those accounts manually after deployment if broader access is needed.

-- Role enum transitions
ALTER TYPE "UserRole" RENAME VALUE 'ADMIN' TO 'PLATFORM_SUPPORT';

ALTER TYPE "HospitalRole" RENAME VALUE 'HOSPITAL_OWNER' TO 'OWNER';
ALTER TYPE "HospitalRole" RENAME VALUE 'HOSPITAL_MANAGER' TO 'MANAGER';
ALTER TYPE "HospitalRole" RENAME VALUE 'RECEPTION' TO 'RECEPTIONIST';
ALTER TYPE "HospitalRole" RENAME VALUE 'CONTENT_EDITOR' TO 'STAFF';
ALTER TYPE "HospitalRole" ADD VALUE 'DOCTOR';

-- Hospital lifecycle fields
ALTER TABLE "Hospital"
ADD COLUMN "verifiedAt" TIMESTAMP(3),
ADD COLUMN "verifiedById" TEXT,
ADD COLUMN "suspendedAt" TIMESTAMP(3),
ADD COLUMN "suspendedById" TEXT,
ADD COLUMN "suspensionReason" TEXT;

UPDATE "Hospital"
SET "verifiedAt" = CURRENT_TIMESTAMP
WHERE "verified" = true
  AND "verifiedAt" IS NULL;

-- Membership lifecycle fields
ALTER TABLE "HospitalMembership"
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvedById" TEXT,
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "rejectedById" TEXT;

UPDATE "HospitalMembership"
SET "approvedAt" = "updatedAt"
WHERE "status" = 'APPROVED'
  AND "approvedAt" IS NULL;

UPDATE "HospitalMembership"
SET "rejectedAt" = "updatedAt"
WHERE "status" = 'REJECTED'
  AND "rejectedAt" IS NULL;

-- Doctor login linkage
ALTER TABLE "Doctor"
ADD COLUMN "userId" TEXT;

CREATE UNIQUE INDEX "Doctor_userId_key" ON "Doctor"("userId");

ALTER TABLE "Doctor"
ADD CONSTRAINT "Doctor_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Partner inquiry to hospital linkage
ALTER TABLE "PartnerInquiry"
ADD COLUMN "hospitalId" TEXT;

CREATE UNIQUE INDEX "PartnerInquiry_hospitalId_key" ON "PartnerInquiry"("hospitalId");
CREATE INDEX "PartnerInquiry_hospitalId_idx" ON "PartnerInquiry"("hospitalId");

ALTER TABLE "PartnerInquiry"
ADD CONSTRAINT "PartnerInquiry_hospitalId_fkey"
FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Support assignments
CREATE TABLE "SupportAssignment" (
    "id" TEXT NOT NULL,
    "supportUserId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "assignedById" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupportAssignment_supportUserId_hospitalId_key" ON "SupportAssignment"("supportUserId", "hospitalId");
CREATE INDEX "SupportAssignment_supportUserId_isActive_idx" ON "SupportAssignment"("supportUserId", "isActive");
CREATE INDEX "SupportAssignment_hospitalId_isActive_idx" ON "SupportAssignment"("hospitalId", "isActive");

ALTER TABLE "SupportAssignment"
ADD CONSTRAINT "SupportAssignment_supportUserId_fkey"
FOREIGN KEY ("supportUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportAssignment"
ADD CONSTRAINT "SupportAssignment_hospitalId_fkey"
FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
