-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "confirmedAt" TIMESTAMP(3);

-- Backfill existing confirmed bookings so reschedule policy remains consistent
UPDATE "Booking"
SET "confirmedAt" = "createdAt"
WHERE "status" = 'CONFIRMED' AND "confirmedAt" IS NULL;
