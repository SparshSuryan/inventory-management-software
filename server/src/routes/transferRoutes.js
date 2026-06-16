const express = require("express");
const router = express.Router();
const { getAllTransfers, createTransfer } = require("../controllers/transferControllers");

router.get("/", getAllTransfers);
router.post("/", createTransfer);

module.exports = router;