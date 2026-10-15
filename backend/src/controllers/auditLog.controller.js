import AuditLog from "../models/AuditLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginate } from "../services/booking.service.js";

/**
 * Super-admin only: paginated audit trail with basic filters.
 */
export const listAuditLogs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.action) filter.action = { $regex: req.query.action, $options: "i" };
  if (req.query.entityType) filter.entityType = req.query.entityType;
  if (req.query.actor) filter.actor = req.query.actor;
  if (req.query.entityId) filter.entityId = req.query.entityId;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }

  const { page, limit, skip } = paginate(req.query);
  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actor", "name role"),
    AuditLog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { items, total, page, limit, pages: Math.ceil(total / limit) || 1 },
  });
});

export default { listAuditLogs };
