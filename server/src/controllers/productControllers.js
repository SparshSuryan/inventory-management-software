const prisma = require("../config/prisma");

const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany();

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
  
      res.status(500).json({
        success: false,
        message: "Failed to create product",
      });
    }
  };

module.exports = {
  getAllProducts,
  createProduct,
};