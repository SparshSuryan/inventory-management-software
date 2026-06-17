const express = require("express");
const router = express.Router();
const { getAllIssues, createIssue, resolveIssue, markInProgress, getIssuesSummary } = require("../controllers/issueControllers");

router.get("/summary", getIssuesSummary);
router.get("/", getAllIssues);
router.post("/", createIssue);
router.put("/:id/resolve", resolveIssue);
router.put("/:id/progress", markInProgress);

module.exports = router;