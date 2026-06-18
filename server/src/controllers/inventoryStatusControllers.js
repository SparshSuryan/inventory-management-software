const prisma = require("../config/prisma");

const getStockStatus = (quantity, reorderLevel) => {
  if (quantity === 0) return "Out of Stock";
  if (quantity <= reorderLevel) return "Low Stock";
  if (quantity <= reorderLevel * 2) return "Sufficient";
  return "Surplus";
};

const getInventoryStatus = async (req, res) => {
  try {
    // Fixed category IDs
    const CATEGORIES = [
      { id: 3, name: "Raw Material" },
      { id: 4, name: "Work In Progress" },
      { id: 5, name: "Finished Product" },
      { id: 6, name: "Sold" },
    ];

    const result = [];

    for (const cat of CATEGORIES) {
      const products = await prisma.product.findMany({
        where: { category_id: cat.id },
        include: {
          stock: true,
          issues: {
            orderBy: { created_at: "desc" },
          },
        },
      });

      const rows = products.map((p) => {
        const stock = p.stock;
        const quantity = stock?.quantity ?? 0;
        const reorderLevel = stock?.reorder_level ?? 0;
        const stockStatus = stock ? getStockStatus(quantity, reorderLevel) : "No Record";

        // Issue status logic
        const openIssues = p.issues.filter((i) => i.status === "OPEN" || i.status === "IN_PROGRESS");
        const resolvedIssues = p.issues.filter((i) => i.status === "RESOLVED");

        let issueStatus = "No Issues";
        if (openIssues.length > 0) issueStatus = "Issue Raised";
        else if (resolvedIssues.length > 0 && openIssues.length === 0) issueStatus = "Issue Resolved";

        return {
          product_id: p.product_id,
          product_name: p.product_name,
          sku: p.sku,
          unit_price: p.unit_price,
          quantity,
          reorder_level: reorderLevel,
          stock_status: stockStatus,
          issue_status: issueStatus,
          open_issues_count: openIssues.length,
          total_issues_count: p.issues.length,
        };
      });

      // Category summary
      const totalQty = rows.reduce((sum, r) => sum + r.quantity, 0);
      const totalValue = rows.reduce((sum, r) => sum + r.unit_price * r.quantity, 0);
      const issueCount = rows.filter((r) => r.issue_status === "Issue Raised").length;

      result.push({
        category_id: cat.id,
        category_name: cat.name,
        products: rows,
        summary: {
          total_products: rows.length,
          total_quantity: totalQty,
          total_value: totalValue,
          products_with_issues: issueCount,
        },
      });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch inventory status" });
  }
};

module.exports = { getInventoryStatus };