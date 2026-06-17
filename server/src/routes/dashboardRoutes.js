const express = require("express");
const router = express.Router();
const { getDashboardSummary } = require("../controllers/dashboardControllers");

router.get("/", getDashboardSummary);

module.exports = router;