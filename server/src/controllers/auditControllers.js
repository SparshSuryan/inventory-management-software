const prisma = require("../config/prisma");

// Helper — called from other controllers to log actions
const createAuditLog = async ({ userId, action, entityType, entityId, oldValues, newValues }) => {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId || null,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_values: oldValues ? JSON.stringify(oldValues) : null,
        new_values: newValues ? JSON.stringify(newValues) : null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
};

// GET /api/audit
const getAllAuditLogs = async (req, res) => {
  try {
    const { entity_type, limit } = req.query;

    const where = entity_type ? { entity_type } : {};

    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { created_at: "desc" },
      take: limit ? parseInt(limit) : 100,
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch audit logs" });
  }
};

module.exports = { createAuditLog, getAllAuditLogs };