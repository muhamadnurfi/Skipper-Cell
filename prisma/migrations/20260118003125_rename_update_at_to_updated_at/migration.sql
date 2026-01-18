/*
  Warnings:

  - You are about to drop the column `updateAt` on the `Cart` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Product` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Cart` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CartItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cart" 
RENAME COLUMN "updateAt" TO "updatedAt";

-- AlterTable
ALTER TABLE "CartItem" 
RENAME COLUMN "updateAt" TO "updatedAt";

-- AlterTable
ALTER TABLE "Category" 
RENAME COLUMN "updateAt" TO "updatedAt";

-- AlterTable
ALTER TABLE "Order" 
RENAME COLUMN "updateAt" TO "updatedAt";

-- AlterTable
ALTER TABLE "OrderItem" 
RENAME COLUMN "updateAt" TO "updatedAt";

-- AlterTable
ALTER TABLE "Payment" 
RENAME COLUMN "updateAt" TO "updatedAt";

-- AlterTable
ALTER TABLE "Product" 
RENAME COLUMN "updateAt" TO "updatedAt";
