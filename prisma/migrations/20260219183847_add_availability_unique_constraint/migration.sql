/*
  Warnings:

  - A unique constraint covering the columns `[doctorId,hospitalId,mode,dayOfWeek,startTime]` on the table `AvailabilitySlot` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "AvailabilitySlot_dayOfWeek_mode_idx";

-- DropIndex
DROP INDEX "AvailabilitySlot_doctorId_hospitalId_mode_dayOfWeek_startTi_key";

-- DropIndex
DROP INDEX "AvailabilitySlot_doctorId_idx";

-- DropIndex
DROP INDEX "AvailabilitySlot_hospitalId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySlot_doctorId_hospitalId_mode_dayOfWeek_startTi_key" ON "AvailabilitySlot"("doctorId", "hospitalId", "mode", "dayOfWeek", "startTime");
