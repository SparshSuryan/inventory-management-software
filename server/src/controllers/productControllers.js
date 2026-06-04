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

module.exports = {
  getAllProducts,  //getProduct
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};