const prisma = require("../config/prisma");
const { createAuditLog } = require("./auditControllers");

// Helper — auto raise issue if stock is low
const checkAndRaiseStockAlert = async (productId, newQuantity, reorderLevel) => {
  try {
    if (newQuantity > reorderLevel) return; // Stock is fine, no alert needed

    // Check if an open issue already exists for this product
    const existingIssue = await prisma.issue.findFirst({
      where: {
        product_id: parseInt(productId),
        status: { in: ["OPEN", "IN_PROGRESS"] },
        issue_type: { in: ["LOW_STOCK", "OUT_OF_STOCK"] },
      },
    });

    if (existingIssue) return; // Already has an open stock issue

    // Get product details for the issue
    const product = await prisma.product.findUnique({
      where: { product_id: parseInt(productId) },
      include: { category: true },
    });

    if (!product) return;

    const issueType = newQuantity === 0 ? "OUT_OF_STOCK" : "LOW_STOCK";
    const stage = product.category?.category_name || "Raw Material";

    // Generate issue number
    const last = await prisma.issue.findFirst({ orderBy: { issue_id: "desc" } });
    const next = last ? parseInt(last.issue_number.split("-")[1]) + 1 : 1;
    const issueNumber = `ISS-${String(next).padStart(4, "0")}`;

    // Create the issue
    const issue = await prisma.issue.create({
      data: {
        issue_number: issueNumber,
        product_id: parseInt(productId),
        issue_type: issueType,
        stage,
        description: newQuantity === 0
          ? `Auto-alert: ${product.product_name} is OUT OF STOCK`
          : `Auto-alert: ${product.product_name} stock is LOW (${newQuantity} units remaining, reorder level: ${reorderLevel})`,
        status: "OPEN",
      },
    });

    // Audit log the auto-raised issue
    await createAuditLog({
      userId: null,
      action: "RAISE_ISSUE",
      entityType: "Issue",
      entityId: issue.issue_id,
      newValues: {
        issue_number: issueNumber,
        issue_type: issueType,
        product_name: product.product_name,
        quantity: newQuantity,
        reorder_level: reorderLevel,
        auto_raised: true,
      },
    });

    console.log(`🚨 Auto-raised ${issueType} issue for ${product.product_name} (qty: ${newQuantity})`);
  } catch (error) {
    console.error("Auto stock alert error:", error.message);
  }
};

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

    res.status(200).json({ success: true, data: stock });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch stock" });
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

    const stock = await prisma.stock.findUnique({
      where: { product_id: parseInt(productId) },
    });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock record not found for this product",
      });
    }

    const newQuantity = stock.quantity + parseInt(quantity);

    const [updatedStock, movement] = await prisma.$transaction([
      prisma.stock.update({
        where: { product_id: parseInt(productId) },
        data: { quantity: newQuantity },
      }),
      prisma.stockMovement.create({
        data: {
          product_id: parseInt(productId),
          stock_id: stock.stock_id,
          movement_type: "IN",
          quantity: parseInt(quantity),
          reference: reference || null,
          remarks: remarks || null,
          created_by: null,
        },
      }),
    ]);

    // When stock increases, auto-resolve any open LOW_STOCK/OUT_OF_STOCK issues
    // if quantity is now above reorder level
    if (newQuantity > stock.reorder_level) {
      const openStockIssues = await prisma.issue.findMany({
        where: {
          product_id: parseInt(productId),
          status: { in: ["OPEN", "IN_PROGRESS"] },
          issue_type: { in: ["LOW_STOCK", "OUT_OF_STOCK"] },
        },
      });

      for (const issue of openStockIssues) {
        await prisma.issue.update({
          where: { issue_id: issue.issue_id },
          data: { status: "RESOLVED", resolved_at: new Date() },
        });

        await createAuditLog({
          userId: null,
          action: "RESOLVE_ISSUE",
          entityType: "Issue",
          entityId: issue.issue_id,
          newValues: {
            issue_number: issue.issue_number,
            status: "RESOLVED",
            auto_resolved: true,
            reason: `Stock increased to ${newQuantity} units (above reorder level: ${stock.reorder_level})`,
          },
        });

        console.log(`✅ Auto-resolved ${issue.issue_type} issue for product #${productId}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Stock increased by ${quantity}`,
      data: { stock: updatedStock, movement },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to increase stock" });
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

    const stock = await prisma.stock.findUnique({
      where: { product_id: parseInt(productId) },
    });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock record not found for this product",
      });
    }

    if (stock.quantity - parseInt(quantity) < 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot decrease stock. Only ${stock.quantity} units available`,
      });
    }

    const newQuantity = stock.quantity - parseInt(quantity);

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
          created_by: null,
        },
      }),
    ]);

    // Auto-raise issue if stock is now low or out
    await checkAndRaiseStockAlert(productId, newQuantity, stock.reorder_level);

    res.status(200).json({
      success: true,
      message: `Stock decreased by ${quantity}`,
      data: { stock: updatedStock, movement },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to decrease stock" });
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

    res.status(200).json({ success: true, data: movements });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch stock movements" });
  }
};

module.exports = {
  getStockByProduct,
  increaseStock,
  decreaseStock,
  getStockMovements,
};