/*
  Warnings:

  - Added the required column `low_stock_threshold` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplier` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "low_stock_threshold" INTEGER NOT NULL,
ADD COLUMN     "supplier" TEXT NOT NULL;
