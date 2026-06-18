const express = require("express");
const router = express.Router();
const { getInventoryStatus } = require("../controllers/inventoryStatusControllers");

router.get("/", getInventoryStatus);

module.exports = router;