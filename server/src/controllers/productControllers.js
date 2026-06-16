const prisma = require("../config/prisma");

// GET /api/products
const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
    });

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
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
    const {
      product_name,
      sku,
      description,
      unit_price,
      supplier,
      category_id,
    } = req.body;

    // Basic validation
    if (!product_name || !sku || !unit_price || !category_id) {
      return res.status(400).json({
        success: false,
        message: "product_name, sku, unit_price and category_id are required",
      });
    }

    const product = await prisma.product.create({
      data: {
        product_name,
        sku,
        description,
        unit_price,
        supplier,
        category_id,
      },
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);

    // Handle duplicate SKU error from Prisma
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "A product with this SKU already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      product_name,
      sku,
      description,
      unit_price,
      supplier,
      category_id,
    } = req.body;

    // Check if product exists first
    const existing = await prisma.product.findUnique({
      where: { product_id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = await prisma.product.update({
      where: { product_id: parseInt(id) },
      data: {
        product_name,
        sku,
        description,
        unit_price,
        supplier,
        category_id,
      },
    });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);

    // Handle duplicate SKU error from Prisma
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "A product with this SKU already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
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
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete in correct order — children first, then parent
    await prisma.stockMovement.deleteMany({
      where: { product_id: parseInt(id) },
    });

    await prisma.stockAlert.deleteMany({
      where: { product_id: parseInt(id) },
    });

    await prisma.stock.deleteMany({
      where: { product_id: parseInt(id) },
    });

    await prisma.product.delete({
      where: { product_id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
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