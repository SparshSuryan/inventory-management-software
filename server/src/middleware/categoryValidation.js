const { body } = require("express-validator");

const createCategoryValidation = [
  body("category_name")
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters"),

  body("description")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Description cannot exceed 255 characters"),
];

const updateCategoryValidation = [
  body("category_name")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters"),

  body("description")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Description cannot exceed 255 characters"),
];

module.exports = {
  createCategoryValidation,
  updateCategoryValidation,
};