/*
  Warnings:

  - Made the column `changedBy` on table `OrderStatusHistory` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "OrderStatusHistory" ALTER COLUMN "note" DROP NOT NULL,
ALTER COLUMN "changedBy" SET NOT NULL;
