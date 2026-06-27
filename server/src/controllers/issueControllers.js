const prisma = require("../config/prisma");
const { createAuditLog } = require("./auditControllers");

const generateIssueNumber = async () => {
  const last = await prisma.issue.findFirst({ orderBy: { issue_id: "desc" } });
  const next = last ? parseInt(last.issue_number.split("-")[1]) + 1 : 1;
  return `ISS-${String(next).padStart(4, "0")}`;
};

// GET /api/inventory/issues
const getAllIssues = async (req, res) => {
  try {
    const { filter } = req.query;
    let dateFilter = {};

    if (filter === "1day") {
      dateFilter = { created_at: { gte: new Date(Date.now() - 86400000) } };
    } else if (filter === "1week") {
      dateFilter = { created_at: { gte: new Date(Date.now() - 7 * 86400000) } };
    } else if (filter === "1month") {
      dateFilter = { created_at: { gte: new Date(Date.now() - 30 * 86400000) } };
    }

    const issues = await prisma.issue.findMany({
      where: dateFilter,
      include: { product: { include: { category: true } } },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json({ success: true, data: issues });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch issues" });
  }
};

// POST /api/inventory/issues
const createIssue = async (req, res) => {
  try {
    const { product_id, issue_type, stage, description } = req.body;

    if (!product_id || !issue_type || !stage) {
      return res.status(400).json({
        success: false,
        message: "product_id, issue_type and stage are required",
      });
    }

    const product = await prisma.product.findUnique({
      where: { product_id: parseInt(product_id) },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const issue_number = await generateIssueNumber();

    const issue = await prisma.issue.create({
      data: {
        issue_number,
        product_id: parseInt(product_id),
        issue_type,
        stage,
        description: description || null,
        status: "OPEN",
      },
      include: { product: { include: { category: true } } },
    });

    // Create audit log — wrapped separately so it never blocks the response
    await createAuditLog({
      userId: null,
      action: "RAISE_ISSUE",
      entityType: "Issue",
      entityId: issue.issue_id,
      newValues: {
        issue_number: issue.issue_number,
        issue_type: issue.issue_type,
        stage: issue.stage,
        product_id: issue.product_id,
        product_name: product.product_name,
        status: "OPEN",
      },
    });

    return res.status(201).json({
      success: true,
      message: `Issue ${issue_number} raised successfully`,
      data: issue,
    });
  } catch (error) {
    console.error("Create issue error:", error);
    return res.status(500).json({ success: false, message: "Failed to create issue" });
  }
};

// PUT /api/inventory/issues/:id/resolve
const resolveIssue = async (req, res) => {
  try {
    const { id } = req.params;

    const issue = await prisma.issue.findUnique({
      where: { issue_id: parseInt(id) },
    });

    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    if (issue.status === "RESOLVED") {
      return res.status(400).json({ success: false, message: "Issue is already resolved" });
    }

    const updated = await prisma.issue.update({
      where: { issue_id: parseInt(id) },
      data: { status: "RESOLVED", resolved_at: new Date() },
      include: { product: { include: { category: true } } },
    });

    await createAuditLog({
      userId: null,
      action: "RESOLVE_ISSUE",
      entityType: "Issue",
      entityId: updated.issue_id,
      oldValues: { status: issue.status },
      newValues: {
        issue_number: issue.issue_number,
        status: "RESOLVED",
        resolved_at: updated.resolved_at,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Issue ${issue.issue_number} resolved`,
      data: updated,
    });
  } catch (error) {
    console.error("Resolve issue error:", error);
    return res.status(500).json({ success: false, message: "Failed to resolve issue" });
  }
};

// PUT /api/inventory/issues/:id/progress
const markInProgress = async (req, res) => {
  try {
    const { id } = req.params;

    const issue = await prisma.issue.findUnique({
      where: { issue_id: parseInt(id) },
    });

    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    const updated = await prisma.issue.update({
      where: { issue_id: parseInt(id) },
      data: { status: "IN_PROGRESS" },
      include: { product: { include: { category: true } } },
    });

    await createAuditLog({
      userId: null,
      action: "UPDATE",
      entityType: "Issue",
      entityId: updated.issue_id,
      oldValues: { status: issue.status },
      newValues: { status: "IN_PROGRESS" },
    });

    res.status(200).json({
      success: true,
      message: "Issue marked as In Progress",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update issue" });
  }
};

// GET /api/inventory/issues/summary
const getIssuesSummary = async (req, res) => {
  try {
    const [total, open, inProgress, resolved] = await Promise.all([
      prisma.issue.count(),
      prisma.issue.count({ where: { status: "OPEN" } }),
      prisma.issue.count({ where: { status: "IN_PROGRESS" } }),
      prisma.issue.count({ where: { status: "RESOLVED" } }),
    ]);

    const byType = await prisma.issue.groupBy({
      by: ["issue_type"],
      _count: { issue_type: true },
    });

    const recentOpen = await prisma.issue.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      include: { product: true },
      orderBy: { created_at: "desc" },
      take: 5,
    });

    res.status(200).json({
      success: true,
      data: { total, open, inProgress, resolved, byType, recentOpen },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch issues summary" });
  }
};

module.exports = { getAllIssues, createIssue, resolveIssue, markInProgress, getIssuesSummary };