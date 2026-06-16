-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "product_name" TEXT,
ADD COLUMN     "total_cost" DOUBLE PRECISION,
ADD COLUMN     "unit_cost" DOUBLE PRECISION;
