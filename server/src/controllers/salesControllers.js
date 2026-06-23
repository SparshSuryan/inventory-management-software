const prisma = require("../config/prisma");

const getSalesHistory = async (req, res) => {
  try {
    const sales = await prisma.inventoryTransfer.findMany({
      where: { to_category: 6 },
      include: {
        product: { include: { stock: true } },
        fromCategory: true,
        toCategory: true,
      },
      orderBy: { created_at: "desc" },
    });

    // Summary stats
    const totalUnitsSold = sales.reduce((sum, s) => sum + s.quantity, 0);
    const totalRevenue = sales.reduce((sum, s) => {
      return sum + s.quantity * (s.product?.unit_price || 0);
    }, 0);
    const uniqueProducts = new Set(sales.map((s) => s.product_id)).size;

    res.status(200).json({
      success: true,
      data: {
        sales,
        summary: { totalSales: sales.length, totalUnitsSold, totalRevenue, uniqueProducts },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch sales history" });
  }
};

module.exports = { getSalesHistory };