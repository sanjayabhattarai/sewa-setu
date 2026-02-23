/*
  Warnings:

  - A unique constraint covering the columns `[stripeSessionId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clerkId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clerkId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "amountPaid" INTEGER,
ADD COLUMN     "currency" TEXT DEFAULT 'eur',
ADD COLUMN     "packageId" TEXT,
ADD COLUMN     "slotTime" TEXT,
ADD COLUMN     "stripeSessionId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "clerkId" TEXT NOT NULL,
ALTER COLUMN "country" SET DEFAULT 'NP';

-- CreateIndex
CREATE UNIQUE INDEX "Booking_stripeSessionId_key" ON "Booking"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "HospitalPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
