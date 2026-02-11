/*
  Warnings:

  - Made the column `slug` on table `Hospital` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Hospital" ALTER COLUMN "slug" SET NOT NULL;
