import crypto from "node:crypto";

/**
 * Generates a human friendly, unique booking id.
 * Format: KS-<YYYYMMDD>-<6 random chars>
 */
export function generateBookingId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return `KS-${y}${m}${d}-${rand}`;
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export default { generateBookingId, randomToken, sha256 };
