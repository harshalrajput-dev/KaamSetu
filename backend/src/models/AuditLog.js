import mongoose from "mongoose";

// Append-only audit trail of sensitive/admin actions.
// Never store passwords, tokens or other secrets in `meta`.
const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    actorRole: { type: String, default: "" },
    action: { type: String, required: true, trim: true, index: true },
    entityType: { type: String, default: "", index: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    // Safe, non-sensitive context (ids, statuses, counts).
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
