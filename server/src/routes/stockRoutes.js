const express = require("express");
const router = express.Router();

const {
  getStockByProduct,
  increaseStock,
  decreaseStock,
  getStockMovements,
} = require("../controllers/stockControllers");

router.get("/:productId", getStockByProduct);
router.post("/:productId/increase", increaseStock);
router.post("/:productId/decrease", decreaseStock);
router.get("/:productId/movements", getStockMovements);

module.exports = router;