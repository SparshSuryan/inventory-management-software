const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const { scanReceipt } = require("../controllers/receiptScanControllers");

// POST /api/receipts/scan
router.post("/scan", upload.single("receipt_image"), scanReceipt);

module.exports = router;