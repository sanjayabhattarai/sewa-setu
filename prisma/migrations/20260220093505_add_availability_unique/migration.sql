/*
  Warnings:

  - A unique constraint covering the columns `[doctorId,hospitalId,mode,dayOfWeek,startTime,endTime]` on the table `AvailabilitySlot` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "AvailabilitySlot_doctorId_hospitalId_mode_dayOfWeek_startTi_key";

-- CreateIndex
CREATE INDEX "AvailabilitySlot_doctorId_idx" ON "AvailabilitySlot"("doctorId");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_hospitalId_idx" ON "AvailabilitySlot"("hospitalId");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_dayOfWeek_mode_idx" ON "AvailabilitySlot"("dayOfWeek", "mode");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySlot_doctorId_hospitalId_mode_dayOfWeek_startTi_key" ON "AvailabilitySlot"("doctorId", "hospitalId", "mode", "dayOfWeek", "startTime", "endTime");
