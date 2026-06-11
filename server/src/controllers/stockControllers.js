const prisma = require("../config/prisma");

// GET /api/stock/:productId
const getStockByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const stock = await prisma.stock.findUnique({
      where: { product_id: parseInt(productId) },
      include: { product: true },
    });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock record not found for this product",
      });
    }

    res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock",
    });
  }
};

// POST /api/stock/:productId/increase
const increaseStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, reference, remarks } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number",
      });
    }

    // Check stock record exists
    const stock = await prisma.stock.findUnique({
      where: { product_id: parseInt(productId) },
    });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock record not found for this product",
      });
    }

    // Update stock quantity and record movement in one transaction
    const [updatedStock, movement] = await prisma.$transaction([
      prisma.stock.update({
        where: { product_id: parseInt(productId) },
        data: { quantity: stock.quantity + parseInt(quantity) },
      }),
      prisma.stockMovement.create({
        data: {
          product_id: parseInt(productId),
          stock_id: stock.stock_id,
          movement_type: "IN",
          quantity: parseInt(quantity),
          reference: reference || null,
          remarks: remarks || null,
          created_by: null, // hardcoded for now, will use JWT user in Week 4
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: `Stock increased by ${quantity}`,
      data: {
        stock: updatedStock,
        movement,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to increase stock",
    });
  }
};

// POST /api/stock/:productId/decrease
const decreaseStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, reference, remarks } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number",
      });
    }

    // Check stock record exists
    const stock = await prisma.stock.findUnique({
      where: { product_id: parseInt(productId) },
    });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock record not found for this product",
      });
    }

    // Prevent negative quantity
    if (stock.quantity - parseInt(quantity) < 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot decrease stock. Only ${stock.quantity} units available`,
      });
    }

    const newQuantity = stock.quantity - parseInt(quantity);

    // Update stock and record movement in one transaction
    const [updatedStock, movement] = await prisma.$transaction([
      prisma.stock.update({
        where: { product_id: parseInt(productId) },
        data: { quantity: newQuantity },
      }),
      prisma.stockMovement.create({
        data: {
          product_id: parseInt(productId),
          stock_id: stock.stock_id,
          movement_type: "OUT",
          quantity: parseInt(quantity),
          reference: reference || null,
          remarks: remarks || null,
          created_by: null, // hardcoded for now, will use JWT user in Week 4
        },
      }),
    ]);

    // Auto-create stock alert if quantity is at or below reorder level
    if (newQuantity <= stock.reorder_level) {
      const alertType = newQuantity === 0 ? "OUT OF STOCK" : "LOW STOCK";

      await prisma.stockAlert.create({
        data: {
          product_id: parseInt(productId),
          stock_id: stock.stock_id,
          current_quantity: newQuantity,
          alert_type: alertType,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Stock decreased by ${quantity}`,
      data: {
        stock: updatedStock,
        movement,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to decrease stock",
    });
  }
};

// GET /api/stock/:productId/movements
const getStockMovements = async (req, res) => {
  try {
    const { productId } = req.params;

    const movements = await prisma.stockMovement.findMany({
      where: { product_id: parseInt(productId) },
      orderBy: { created_at: "desc" },
      include: { product: true },
    });

    res.status(200).json({
      success: true,
      data: movements,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock movements",
    });
  }
};

module.exports = {
  getStockByProduct,
  increaseStock,
  decreaseStock,
  getStockMovements,
};