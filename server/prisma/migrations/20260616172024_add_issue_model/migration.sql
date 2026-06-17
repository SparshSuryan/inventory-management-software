-- CreateTable
CREATE TABLE "Issue" (
    "issue_id" SERIAL NOT NULL,
    "issue_number" TEXT NOT NULL,
    "product_id" INTEGER NOT NULL,
    "issue_type" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("issue_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Issue_issue_number_key" ON "Issue"("issue_number");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;
