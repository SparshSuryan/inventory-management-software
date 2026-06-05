const express = require("express");
const router = express.Router();

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryControllers");

const {
  createCategoryValidation,
  updateCategoryValidation,
} = require("../middleware/categoryValidation");

const validate = require("../middleware/validate");

router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.post("/", createCategoryValidation, validate, createCategory);
router.put("/:id", updateCategoryValidation, validate, updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;