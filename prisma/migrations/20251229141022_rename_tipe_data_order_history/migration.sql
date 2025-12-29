/*
  Warnings:

  - Made the column `toStatus` on table `OrderStatusHistory` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "OrderStatusHistory" ALTER COLUMN "toStatus" SET NOT NULL,
ALTER COLUMN "changedBy" DROP NOT NULL;
