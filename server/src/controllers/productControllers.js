const prisma = require("../config/prisma");
const { createAuditLog } = require("./auditControllers");

// GET /api/products
const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        stock: true,
      },
      orderBy: { product_id: "asc" },
    });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { product_id: parseInt(id) },
      include: {
        category: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const { product_name, sku, description, unit_price, category_id, supplier } = req.body;

    const product = await prisma.product.create({
      data: {
        product_name,
        sku,
        description: description || null,
        unit_price: parseFloat(unit_price),
        category_id: parseInt(category_id),
        supplier: supplier || null,
      },
      include: { category: true },
    });

    // Auto-create stock record
    await prisma.stock.create({
      data: {
        product_id: product.product_id,
        quantity: 0,
        reorder_level: 5,
      },
    });

    await createAuditLog({
      action: "CREATE",
      entityType: "Product",
      entityId: product.product_id,
      newValues: { product_name, sku, unit_price, category_id },
    });

    res.status(201).json({ success: true, message: "Product created successfully", data: product });
  } catch (error) {
    console.error(error);
    if (error.code === "P2002") {
      return res.status(400).json({ success: false, message: "SKU already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to create product" });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({
      where: { product_id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const product = await prisma.product.update({
      where: { product_id: parseInt(id) },
      data: {
        product_name: req.body.product_name,
        sku: req.body.sku,
        description: req.body.description || null,
        unit_price: parseFloat(req.body.unit_price),
        category_id: parseInt(req.body.category_id),
        supplier: req.body.supplier || null,
      },
      include: { category: true },
    });

    await createAuditLog({
      action: "UPDATE",
      entityType: "Product",
      entityId: parseInt(id),
      oldValues: { product_name: existing.product_name, sku: existing.sku, unit_price: existing.unit_price },
      newValues: req.body,
    });

    res.status(200).json({ success: true, message: "Product updated successfully", data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update product" });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({
      where: { product_id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await createAuditLog({
      action: "DELETE",
      entityType: "Product",
      entityId: parseInt(id),
      oldValues: { product_name: existing.product_name, sku: existing.sku },
    });

    // Delete in correct order — children first, then parent
    await prisma.stockMovement.deleteMany({ where: { product_id: parseInt(id) } });
    await prisma.stockAlert.deleteMany({ where: { product_id: parseInt(id) } });
    await prisma.issue.deleteMany({ where: { product_id: parseInt(id) } });
    await prisma.receipt.deleteMany({ where: { product_id: parseInt(id) } });
    await prisma.inventoryTransfer.deleteMany({ where: { product_id: parseInt(id) } });
    await prisma.stock.deleteMany({ where: { product_id: parseInt(id) } });
    await prisma.product.delete({ where: { product_id: parseInt(id) } });

    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error.message);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
};

// POST /api/products/bulk
const bulkCreateProducts = async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No products provided",
      });
    }

    // Validate each product
    const errors = [];
    products.forEach((p, index) => {
      if (!p.product_name) errors.push(`Row ${index + 1}: product_name is required`);
      if (!p.sku) errors.push(`Row ${index + 1}: sku is required`);
      if (!p.unit_price) errors.push(`Row ${index + 1}: unit_price is required`);
      if (!p.category_id) errors.push(`Row ${index + 1}: category_id is required`);
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Create each product + stock record in a transaction
    const results = [];

    for (const p of products) {
      const result = await prisma.$transaction(async (tx) => {
        // Create product
        const product = await tx.product.create({
          data: {
            product_name: p.product_name,
            sku: String(p.sku),
            description: p.description || null,
            unit_price: parseFloat(p.unit_price),
            supplier: p.supplier || null,
            category_id: parseInt(p.category_id),
          },
        });

        // Create stock record for this product
        const stock = await tx.stock.create({
          data: {
            product_id: product.product_id,
            quantity: parseInt(p.quantity) || 0,
            reorder_level: parseInt(p.reorder_level) || 5,
          },
        });

        // Create stock movement record if quantity > 0
        if (parseInt(p.quantity) > 0) {
          await tx.stockMovement.create({
            data: {
              product_id: product.product_id,
              stock_id: stock.stock_id,
              movement_type: "IN",
              quantity: parseInt(p.quantity),
              reference: "Bulk upload",
              remarks: "Initial stock from bulk import",
              created_by: null,
            },
          });
        }

        return product;
      });

      results.push(result);
    }

    res.status(201).json({
      success: true,
      message: `${results.length} products imported successfully with stock records`,
      data: results,
    });
  } catch (error) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "One or more SKUs already exist in the database",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to bulk import products",
    });
  }
};

module.exports = {
  getAllProducts,  //getProduct
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkCreateProducts,
};