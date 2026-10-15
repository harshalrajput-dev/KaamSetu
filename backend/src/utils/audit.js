import AuditLog from "../models/AuditLog.js";

/**
 * Records an audit entry for a sensitive/admin action.
 * Never throws: auditing must not break the primary request, and callers
 * must never pass secrets (passwords, tokens) inside `meta`.
 */
export async function recordAudit(req, { action, entityType = "", entityId = null, meta = {} } = {}) {
  try {
    await AuditLog.create({
      actor: req?.user?._id || null,
      actorRole: req?.user?.role || "",
      action,
      entityType,
      entityId: entityId || null,
      meta: meta || {},
      ip: req?.ip || "",
      userAgent: req?.get ? req.get("user-agent") || "" : "",
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[audit] failed to record", action, err.message);
  }
}

export default recordAudit;
