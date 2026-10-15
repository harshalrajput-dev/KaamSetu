/**
 * Secure bootstrap script to create the very first Super Admin.
 *
 * Password priority:
 *   1. BOOTSTRAP_SUPERADMIN_PASSWORD env var (useful for automated setup)
 *   2. Secure hidden console prompt (recommended)
 *
 * The password is NEVER stored in source code.
 *
 * Usage:
 *   npm run bootstrap:superadmin
 *   BOOTSTRAP_SUPERADMIN_EMAIL=me@x.com npm run bootstrap:superadmin   (bash)
 *   $env:BOOTSTRAP_SUPERADMIN_EMAIL="me@x.com"; npm run bootstrap:superadmin   (PowerShell)
 */
import readline from "node:readline";
import env from "../src/config/env.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import User, { ROLES } from "../src/models/User.js";
import { hashPassword } from "../src/utils/password.js";

function promptHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const stdin = process.stdin;
    process.stdout.write(question);
    const onData = (char) => {
      const s = char.toString();
      if (s === "\n" || s === "\r" || s === "\u0004") {
        stdin.removeListener("data", onData);
      } else {
        // Mask typed characters.
        process.stdout.clearLine?.(0);
        process.stdout.cursorTo?.(0);
        process.stdout.write(question + "*".repeat(rl.line.length + 1));
      }
    };
    stdin.on("data", onData);
    rl.question("", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  await connectDB(env.mongoUri);

  const existingSuper = await User.findOne({ role: ROLES.SUPER_ADMIN });
  if (existingSuper) {
    console.log("ℹ️  A Super Admin already exists:", existingSuper.email || existingSuper.phone);
    console.log("   Refusing to create another one from this script.");
    await disconnectDB();
    return;
  }

  const name = env.bootstrap.name;
  const email = env.bootstrap.email;
  const phone = env.bootstrap.phone;

  let password = env.bootstrap.password;
  if (!password) {
    password = await promptHidden(`Enter password for Super Admin (${email}): `);
    const confirm = await promptHidden("Confirm password: ");
    if (password !== confirm) {
      console.error("❌ Passwords do not match.");
      await disconnectDB();
      process.exit(1);
    }
  }

  if (!password || password.length < 8) {
    console.error("❌ Password must be at least 8 characters.");
    await disconnectDB();
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    email: email || undefined,
    phone,
    passwordHash,
    role: ROLES.SUPER_ADMIN,
    isActive: true,
  });

  console.log("✅ Super Admin created successfully");
  console.log("   Name :", user.name);
  console.log("   Email:", user.email || "(none)");
  console.log("   Phone:", user.phone);
  console.log("   Id   :", user._id.toString());
  console.log("\n🔐 Keep these credentials safe and change the password after first login.");

  await disconnectDB();
}

main().catch(async (err) => {
  console.error("❌ Bootstrap failed:", err.message);
  try {
    await disconnectDB();
  } catch {}
  process.exit(1);
});
