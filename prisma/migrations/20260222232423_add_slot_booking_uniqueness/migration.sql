/*
  Warnings:

  - A unique constraint covering the columns `[availabilitySlotId,scheduledAt]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "availabilitySlotId" TEXT;

-- CreateIndex
CREATE INDEX "Booking_availabilitySlotId_idx" ON "Booking"("availabilitySlotId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_availabilitySlotId_scheduledAt_key" ON "Booking"("availabilitySlotId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_availabilitySlotId_fkey" FOREIGN KEY ("availabilitySlotId") REFERENCES "AvailabilitySlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
