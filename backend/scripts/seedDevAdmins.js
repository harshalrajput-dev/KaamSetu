import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load backend/.env before anything else so process.env.MONGODB_URI is always set.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import env from "../src/config/env.js";
import { connectDB, disconnectDB, getMongoUri } from "../src/config/db.js";
import Naka from "../src/models/Naka.js";
import User, { ROLES } from "../src/models/User.js";
import { hashPassword } from "../src/utils/password.js";

const CHECK_ONLY = process.argv.includes("--check");

// Mongoose connection options for Atlas (force IPv4 and allow time for DNS/SRV).
const MONGO_OPTIONS = {
  family: 4,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
};

function redactUri(uri) {
  if (!uri) return "(unset)";
  try {
    return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, "//$1:****@");
  } catch {
    return "(hidden)";
  }
}

function envOrNull(name) {
  const value = process.env[name];
  return value === undefined || value === "" ? null : String(value).trim();
}

function validateCredential(label, value, kind) {
  if (!value) {
    console.error(`❌ Missing required environment variable: ${label}`);
    return false;
  }
  if (kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    console.error(`❌ ${label} is not a valid email address`);
    return false;
  }
  if (kind === "phone" && !/^[0-9]{10,15}$/.test(value)) {
    console.error(`❌ ${label} must be 10-15 digits`);
    return false;
  }
  if (kind === "password" && value.length < 8) {
    console.error(`❌ ${label} must be at least 8 characters`);
    return false;
  }
  return true;
}

async function listAdmins() {
  const admins = await User.find({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.NAKA_ADMIN] } })
    .select("name email phone role isActive naka")
    .populate("naka", "name city");

  console.log(`ℹ️  Found ${admins.length} admin account(s) in ${redactUri(env.mongoUri)}`);
  for (const a of admins) {
    const naka = a.naka ? `${a.naka.name} / ${a.naka.city}` : "-";
    console.log(
      `   • ${a.role} | ${a.email || "(no email)"} | ${a.phone} | active=${a.isActive} | naka=${naka}`
    );
  }
}

async function ensureSuperAdmin() {
  const email = envOrNull("DEV_SUPERADMIN_EMAIL");
  const phone = envOrNull("DEV_SUPERADMIN_PHONE");
  const password = envOrNull("DEV_SUPERADMIN_PASSWORD");
  const name = envOrNull("DEV_SUPERADMIN_NAME") || "Dev Super Admin";

  const valid = [
    validateCredential("DEV_SUPERADMIN_EMAIL", email, "email"),
    validateCredential("DEV_SUPERADMIN_PHONE", phone, "phone"),
    validateCredential("DEV_SUPERADMIN_PASSWORD", password, "password"),
  ].every(Boolean);
  if (!valid) return false;

  const existingSuper = await User.findOne({ role: ROLES.SUPER_ADMIN });
  if (existingSuper) {
    console.log(`ℹ️  Super Admin already exists (${existingSuper.email || existingSuper.phone}) — skipped.`);
    return true;
  }

  const conflict = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
  if (conflict) {
    console.error(
      `❌ A user with this email/phone already exists (role=${conflict.role}). Not touching it — choose different credentials.`
    );
    return false;
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    role: ROLES.SUPER_ADMIN,
    isActive: true,
  });
  console.log(`✅ Super Admin created: ${user.email} (password not shown) → /admin`);
  return true;
}

async function ensureNakaAdmin() {
  const email = envOrNull("DEV_NAKA_ADMIN_EMAIL");
  const phone = envOrNull("DEV_NAKA_ADMIN_PHONE");
  const password = envOrNull("DEV_NAKA_ADMIN_PASSWORD");
  const name = envOrNull("DEV_NAKA_ADMIN_NAME") || "Dev Naka Admin";
  const nakaName = envOrNull("DEV_NAKA_NAME") || "Dev Naka";
  const nakaCity = envOrNull("DEV_NAKA_CITY") || "Surat";
  const nakaArea = envOrNull("DEV_NAKA_AREA") || "Udhna";

  const valid = [
    validateCredential("DEV_NAKA_ADMIN_EMAIL", email, "email"),
    validateCredential("DEV_NAKA_ADMIN_PHONE", phone, "phone"),
    validateCredential("DEV_NAKA_ADMIN_PASSWORD", password, "password"),
  ].every(Boolean);
  if (!valid) return false;

  let naka = await Naka.findOne({ name: nakaName, city: nakaCity });
  if (!naka) {
    naka = await Naka.create({ name: nakaName, city: nakaCity, area: nakaArea, isActive: true });
    console.log(`✅ Naka created: ${naka.name} / ${naka.city}`);
  } else {
    console.log(`ℹ️  Naka already exists: ${naka.name} / ${naka.city} — reused.`);
  }

  if (naka.admin) {
    console.log(`ℹ️  This naka already has an admin linked — skipped to avoid changes.`);
    return true;
  }

  const conflict = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
  if (conflict) {
    console.error(
      `❌ A user with this email/phone already exists (role=${conflict.role}). Not touching it — choose different credentials.`
    );
    return false;
  }

  const passwordHash = await hashPassword(password);
  const admin = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    role: ROLES.NAKA_ADMIN,
    naka: naka._id,
    isActive: true,
  });

  naka.admin = admin._id;
  await naka.save();

  console.log(
    `✅ Naka Admin created: ${admin.email} (password not shown) for ${naka.name}/${naka.city} → /naka`
  );
  return true;
}

async function main() {
  if (env.nodeEnv === "production") {
    console.error("❌ Refusing to run: this script is for development only (NODE_ENV=production).");
    process.exitCode = 1;
    return;
  }

  const uri = getMongoUri();
  console.log(`⏳ Connecting to MongoDB → ${redactUri(uri)}`);
  let connection;
  try {
    connection = await connectDB(uri, MONGO_OPTIONS);
  } catch (err) {
    console.error("❌ Seed failed:", err?.message || String(err));
    try {
      await disconnectDB();
    } catch {}
    process.exit(1);
    return;
  }
  console.log(
    `✅ MongoDB connected → database "${connection.name}" at ${connection.host}:${connection.port}`
  );

  if (CHECK_ONLY) {
    await listAdmins();
    await disconnectDB();
    return;
  }

  console.log("⏳ Ensuring development admin accounts...");
  const superOk = await ensureSuperAdmin();
  const nakaOk = await ensureNakaAdmin();

  if (!superOk || !nakaOk) {
    process.exitCode = 1;
  } else {
    console.log("\n🔐 Credentials were read from environment variables and are never printed here.");
    console.log("   Open the dashboards: /admin (Super Admin) and /naka (Naka Admin).");
  }

  await disconnectDB();
  console.log("👋 Done. Connection closed cleanly.");
}

main().catch(async (err) => {
  console.error("❌ Seed failed:", err.message);
  try {
    await disconnectDB();
  } catch {}
  process.exit(1);
});
