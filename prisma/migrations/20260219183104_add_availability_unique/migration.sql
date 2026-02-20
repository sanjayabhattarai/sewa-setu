/*
  Warnings:

  - A unique constraint covering the columns `[doctorId,hospitalId,mode,dayOfWeek,startTime,endTime]` on the table `AvailabilitySlot` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySlot_doctorId_hospitalId_mode_dayOfWeek_startTi_key" ON "AvailabilitySlot"("doctorId", "hospitalId", "mode", "dayOfWeek", "startTime", "endTime");
