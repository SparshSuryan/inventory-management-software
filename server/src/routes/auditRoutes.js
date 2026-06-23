const express = require("express");
const router = express.Router();
const { getAllAuditLogs } = require("../controllers/auditControllers");

router.get("/", getAllAuditLogs);

module.exports = router;