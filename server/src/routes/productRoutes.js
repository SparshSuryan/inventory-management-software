const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productControllers");

const {
  createProductValidation,
  updateProductValidation,
} = require("../middleware/productValidation");

const validate = require("../middleware/validate");

router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/", createProductValidation, validate, createProduct);
router.put("/:id", updateProductValidation, validate, updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;