const prisma = require("../config/prisma");

const generateTransferNumber = async () => {
  const last = await prisma.inventoryTransfer.findFirst({
    orderBy: { transfer_id: "desc" },
  });
  const next = last ? parseInt(last.transfer_number.split("-")[1]) + 1 : 1;
  return `TRF-${String(next).padStart(4, "0")}`;
};

// GET /api/transfers
const getAllTransfers = async (req, res) => {
  try {
    const transfers = await prisma.inventoryTransfer.findMany({
      include: {
        product: true,
        fromCategory: true,
        toCategory: true,
      },
      orderBy: { created_at: "desc" },
    });
    res.status(200).json({ success: true, data: transfers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch transfers" });
  }
};

// POST /api/transfers
const createTransfer = async (req, res) => {
  try {
    const { product_id, from_category, to_category, quantity, remarks } = req.body;

    if (!product_id || !from_category || !to_category || !quantity) {
      return res.status(400).json({
        success: false,
        message: "product_id, from_category, to_category and quantity are required",
      });
    }

    if (parseInt(from_category) === parseInt(to_category)) {
      return res.status(400).json({
        success: false,
        message: "From and To categories cannot be the same",
      });
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number",
      });
    }

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { product_id: parseInt(product_id) },
      include: { category: true },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check product is currently in the from_category
    if (product.category_id !== parseInt(from_category)) {
      return res.status(400).json({
        success: false,
        message: `Product is in "${product.category.category_name}" — not in the selected source category`,
      });
    }

    // Check stock is sufficient
    const stock = await prisma.stock.findUnique({
      where: { product_id: parseInt(product_id) },
    });

    if (!stock || stock.quantity < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${stock?.quantity || 0} units`,
      });
    }

    const transferNumber = await generateTransferNumber();

    const result = await prisma.$transaction(async (tx) => {
      // Update product category to destination
      await tx.product.update({
        where: { product_id: parseInt(product_id) },
        data: { category_id: parseInt(to_category) },
      });

      // Decrease stock from source
      await tx.stock.update({
        where: { product_id: parseInt(product_id) },
        data: { quantity: stock.quantity - qty },
      });

      // Record stock movement OUT from source
      await tx.stockMovement.create({
        data: {
          product_id: parseInt(product_id),
          stock_id: stock.stock_id,
          movement_type: "OUT",
          quantity: qty,
          reference: transferNumber,
          remarks: `Transfer to ${(await tx.category.findUnique({ where: { category_id: parseInt(to_category) } }))?.category_name}`,
          created_by: null,
        },
      });

      // Create the transfer record
      const transfer = await tx.inventoryTransfer.create({
        data: {
          transfer_number: transferNumber,
          product_id: parseInt(product_id),
          from_category: parseInt(from_category),
          to_category: parseInt(to_category),
          quantity: qty,
          remarks: remarks || null,
          created_by: null,
        },
        include: {
          product: true,
          fromCategory: true,
          toCategory: true,
        },
      });

      return transfer;
    });

    res.status(201).json({
      success: true,
      message: `Transfer ${transferNumber} created — ${product.product_name} moved to ${result.toCategory.category_name}`,
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create transfer" });
  }
};

module.exports = { getAllTransfers, createTransfer };