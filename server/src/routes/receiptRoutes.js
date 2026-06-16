const express = require("express");
const router = express.Router();

const {
  getAllReceipts,
  checkSku,
  createReceipt,
  bulkCreateReceipts,
} = require("../controllers/receiptControllers");

router.get("/", getAllReceipts);
router.post("/check-sku", checkSku);
router.post("/bulk", bulkCreateReceipts);
router.post("/", createReceipt);

module.exports = router;