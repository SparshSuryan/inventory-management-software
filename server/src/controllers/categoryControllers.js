const prisma = require("../config/prisma");

// GET /api/categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// GET /api/categories/:id
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { category_id: parseInt(id) },
      include: {
        products: true,  // also return all products in this category
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
    });
  }
};

// POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body;

    // Basic validation
    if (!category_name) {
      return res.status(400).json({
        success: false,
        message: "category_name is required",
      });
    }

    const category = await prisma.category.create({
      data: {
        category_name,
        description,
      },
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error(error);

    // Handle duplicate category name
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "A category with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, description } = req.body;

    const existing = await prisma.category.findUnique({
      where: { category_id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const category = await prisma.category.update({
      where: { category_id: parseInt(id) },
      data: {
        category_name,
        description,
      },
    });

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "A category with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.category.findUnique({
      where: { category_id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await prisma.category.delete({
      where: { category_id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error(error);

    // Handle case where category has products linked to it
    if (error.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category — it has products linked to it",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};