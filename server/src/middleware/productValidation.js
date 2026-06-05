const { body } = require("express-validator");

const createProductValidation = [
  body("product_name")
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters"),

  body("sku")
    .notEmpty()
    .withMessage("SKU is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("SKU must be between 2 and 50 characters"),

  body("unit_price")
    .notEmpty()
    .withMessage("Unit price is required")
    .isFloat({ min: 0 })
    .withMessage("Unit price must be a positive number"),

  body("category_id")
    .notEmpty()
    .withMessage("Category ID is required")
    .isInt({ min: 1 })
    .withMessage("Category ID must be a valid integer"),

  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("supplier")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Supplier name cannot exceed 100 characters"),
];

const updateProductValidation = [
  body("product_name")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters"),

  body("sku")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("SKU must be between 2 and 50 characters"),

  body("unit_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Unit price must be a positive number"),

  body("category_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Category ID must be a valid integer"),

  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("supplier")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Supplier name cannot exceed 100 characters"),
];

module.exports = {
  createProductValidation,
  updateProductValidation,
};