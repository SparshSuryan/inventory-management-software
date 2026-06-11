-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_created_by_fkey";

-- AlterTable
ALTER TABLE "StockMovement" ALTER COLUMN "created_by" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
