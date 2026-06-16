-- CreateTable
CREATE TABLE "InventoryTransfer" (
    "transfer_id" SERIAL NOT NULL,
    "transfer_number" TEXT NOT NULL,
    "product_id" INTEGER NOT NULL,
    "from_category" INTEGER NOT NULL,
    "to_category" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "remarks" TEXT,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransfer_pkey" PRIMARY KEY ("transfer_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryTransfer_transfer_number_key" ON "InventoryTransfer"("transfer_number");

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_from_category_fkey" FOREIGN KEY ("from_category") REFERENCES "Category"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_to_category_fkey" FOREIGN KEY ("to_category") REFERENCES "Category"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
