const express = require("express");
const router = express.Router();
const { getSalesHistory } = require("../controllers/salesControllers");

router.get("/", getSalesHistory);

module.exports = router;