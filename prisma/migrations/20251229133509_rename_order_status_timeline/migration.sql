/*
  Warnings:

  - You are about to drop the column `changeBy` on the `OrderStatusHistory` table. All the data in the column will be lost.
  - Added the required column `changedBy` to the `OrderStatusHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderStatusHistory" DROP COLUMN "changeBy",
ADD COLUMN     "changedBy" "Role" NOT NULL;
