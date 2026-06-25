const prisma = require("../config/prisma");
const { createAuditLog } = require("./auditControllers");

// Helper — generate next receipt number (RCP-0001, RCP-0002...)
const generateReceiptNumber = async () => {
  const lastReceipt = await prisma.receipt.findFirst({
    orderBy: { receipt_id: "desc" },
  });

  let nextNumber = 1;
  if (lastReceipt) {
    const lastNum = parseInt(lastReceipt.receipt_number.split("-")[1]);
    nextNumber = lastNum + 1;
  }

  return `RCP-${String(nextNumber).padStart(4, "0")}`;
};

// GET /api/receipts
const getAllReceipts = async (req, res) => {
  try {
    const receipts = await prisma.receipt.findMany({
      include: { product: true },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json({
      success: true,
      data: receipts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch receipts",
    });
  }
};

// POST /api/receipts/check-sku
// Checks if a product with given SKU exists — used before creating receipt
const checkSku = async (req, res) => {
  try {
    const { sku } = req.body;

    if (!sku) {
      return res.status(400).json({
        success: false,
        message: "SKU is required",
      });
    }

    const product = await prisma.product.findUnique({
      where: { sku: String(sku) },
      include: { category: true },
    });

    if (!product) {
      return res.status(200).json({
        success: true,
        exists: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      exists: true,
      data: product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to check SKU",
    });
  }
};

// POST /api/receipts
const createReceipt = async (req, res) => {
  try {
    const { sku, supplier, quantity, unit_cost, received_date, remarks } = req.body;

    if (!sku || !supplier || !quantity) {
      return res.status(400).json({
        success: false,
        message: "sku, supplier and quantity are required",
      });
    }

    if (parseInt(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number",
      });
    }

    // Find product by SKU
    const product = await prisma.product.findUnique({
      where: { sku: String(sku) },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with SKU "${sku}" not found. Please create the product first.`,
      });
    }

    // Find or check stock record
    let stock = await prisma.stock.findUnique({
      where: { product_id: product.product_id },
    });

    const receiptNumber = await generateReceiptNumber();
    const qty = parseInt(quantity);

    const result = await prisma.$transaction(async (tx) => {
      // Create stock record if doesn't exist
      if (!stock) {
        stock = await tx.stock.create({
          data: {
            product_id: product.product_id,
            quantity: 0,
            reorder_level: 5,
          },
        });
      }

      // Update stock quantity
      const updatedStock = await tx.stock.update({
        where: { product_id: product.product_id },
        data: { quantity: stock.quantity + qty },
      });

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          product_id: product.product_id,
          stock_id: stock.stock_id,
          movement_type: "IN",
          quantity: qty,
          reference: receiptNumber,
          remarks: remarks || `Receipt from ${supplier}`,
          created_by: null,
        },
      });

      // Create receipt record
const unitCost = unit_cost ? parseFloat(unit_cost) : product.unit_price;
const totalCost = unitCost * qty;

const receipt = await tx.receipt.create({
  data: {
    receipt_number: receiptNumber,
    product_id: product.product_id,
    supplier,
    quantity: qty,
    unit_cost: unitCost,
    total_cost: totalCost,
    received_date: received_date ? new Date(received_date) : new Date(),
    remarks: remarks || null,
    created_by: null,
  },
  include: { product: true },
});

      return { receipt, updatedStock };
    });

    await createAuditLog({
      userId: req.user?.user_id || null,
      action: "CREATE",
      entityType: "Receipt",
      entityId: result.receipt.receipt_id,
      newValues: {
        receipt_number: result.receipt.receipt_number,
        sku,
        supplier,
        quantity: qty,
        unit_cost: result.receipt.unit_cost,
        total_cost: result.receipt.total_cost,
      },
    });

    res.status(201).json({
      success: true,
      message: `Receipt ${receiptNumber} created — stock updated for ${product.product_name}`,
      data: result.receipt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create receipt",
    });
  }

};

// POST /api/receipts/bulk
const bulkCreateReceipts = async (req, res) => {
  try {
    const { receipts } = req.body;

    if (!receipts || !Array.isArray(receipts) || receipts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No receipts provided",
      });
    }

    const results = [];
    const notFound = [];

    for (const r of receipts) {
      const product = await prisma.product.findUnique({
        where: { sku: String(r.sku) },
      });

      if (!product) {
        notFound.push(r.sku);
        continue;
      }

      let stock = await prisma.stock.findUnique({
        where: { product_id: product.product_id },
      });

      const receiptNumber = await generateReceiptNumber();
      const qty = parseInt(r.quantity) || 0;

      if (qty <= 0) continue;

      await prisma.$transaction(async (tx) => {
        if (!stock) {
          stock = await tx.stock.create({
            data: {
              product_id: product.product_id,
              quantity: 0,
              reorder_level: 5,
            },
          });
        }

        await tx.stock.update({
          where: { product_id: product.product_id },
          data: { quantity: stock.quantity + qty },
        });

        await tx.stockMovement.create({
          data: {
            product_id: product.product_id,
            stock_id: stock.stock_id,
            movement_type: "IN",
            quantity: qty,
            reference: receiptNumber,
            remarks: r.remarks || `Bulk receipt from ${r.supplier}`,
            created_by: null,
          },
        });

const unitCost = r.unit_cost ? parseFloat(r.unit_cost) : product.unit_price;
const totalCost = unitCost * qty;

const receipt = await tx.receipt.create({
  data: {
    receipt_number: receiptNumber,
    product_id: product.product_id,
    supplier: r.supplier,
    quantity: qty,
    unit_cost: unitCost,
    total_cost: totalCost,
    received_date: r.received_date ? new Date(r.received_date) : new Date(),
    remarks: r.remarks || null,
    created_by: null,
  },
});

        results.push(receipt);
      });
    }

    res.status(201).json({
      success: true,
      message: `${results.length} receipts created successfully${notFound.length > 0 ? `. ${notFound.length} SKUs not found: ${notFound.join(", ")}` : ""}`,
      data: results,
      notFound,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk create receipts",
    });
  }
};

module.exports = {
  getAllReceipts,
  checkSku,
  createReceipt,
  bulkCreateReceipts,
};