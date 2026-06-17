const prisma = require("../config/prisma");

const getDashboardSummary = async (req, res) => {
  try {
    // Products
    const totalProducts = await prisma.product.count();
    const products = await prisma.product.findMany({ include: { stock: true } });

    // Stock KPIs
    let lowStock = 0, outOfStock = 0, totalInventoryValue = 0;
    products.forEach((p) => {
      if (!p.stock) return;
      if (p.stock.quantity === 0) outOfStock++;
      else if (p.stock.quantity <= p.stock.reorder_level) lowStock++;
      totalInventoryValue += p.unit_price * p.stock.quantity;
    });

    // Receipts
    const totalReceipts = await prisma.receipt.count();
    const recentReceipts = await prisma.receipt.findMany({
      include: { product: true },
      orderBy: { created_at: "desc" },
      take: 5,
    });

    // Issues
    const totalIssues = await prisma.issue.count();
    const openIssues = await prisma.issue.count({ where: { status: "OPEN" } });
    const inProgressIssues = await prisma.issue.count({ where: { status: "IN_PROGRESS" } });
    const resolvedIssues = await prisma.issue.count({ where: { status: "RESOLVED" } });

    const unresolvedIssues = await prisma.issue.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      include: { product: true },
      orderBy: { created_at: "desc" },
      take: 5,
    });

    // Inventory by category
    const categoryBreakdown = await prisma.category.findMany({
      include: {
        products: { include: { stock: true } },
      },
    });

    const inventoryByStage = categoryBreakdown.map((cat) => ({
      category: cat.category_name,
      productCount: cat.products.length,
      totalQty: cat.products.reduce((sum, p) => sum + (p.stock?.quantity || 0), 0),
      totalValue: cat.products.reduce((sum, p) => sum + (p.unit_price * (p.stock?.quantity || 0)), 0),
    }));

    // Recent stock movements
    const recentMovements = await prisma.stockMovement.findMany({
      include: { product: true },
      orderBy: { created_at: "desc" },
      take: 5,
    });

    // Transfers
    const totalTransfers = await prisma.inventoryTransfer.count();

    res.status(200).json({
      success: true,
      data: {
        products: { total: totalProducts, lowStock, outOfStock, totalInventoryValue },
        receipts: { total: totalReceipts, recent: recentReceipts },
        issues: { total: totalIssues, open: openIssues, inProgress: inProgressIssues, resolved: resolvedIssues, unresolved: unresolvedIssues },
        inventory: { byStage: inventoryByStage },
        movements: { recent: recentMovements },
        transfers: { total: totalTransfers },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard data" });
  }
};

module.exports = { getDashboardSummary };