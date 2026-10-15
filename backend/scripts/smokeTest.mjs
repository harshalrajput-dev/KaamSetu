import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoMemoryServer } from "mongodb-memory-server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const PORT = 5099;
const BASE = `http://127.0.0.1:${PORT}`;

function waitForServer(child, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("server start timeout")), timeoutMs);
    const onData = (buf) => {
      const text = buf.toString();
      process.stdout.write(text);
      if (text.includes("listening on")) {
        clearTimeout(timer);
        child.stdout.off("data", onData);
        resolve();
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", (b) => process.stderr.write(b.toString()));
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`server exited early with code ${code}`));
    });
  });
}

async function json(method, url, body, token) {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, data };
}

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
  console.log(`  ✓ ${msg}`);
}

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri();
console.log("In-memory MongoDB:", uri);

function runNode(script, extraEnv = {}) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [script], {
      cwd: backendRoot,
      env: {
        ...process.env,
        MONGODB_URI: uri,
        JWT_SECRET: "smoke_test_secret_do_not_use",
        BCRYPT_SALT_ROUNDS: "4",
        ...extraEnv,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    p.stdout.on("data", (b) => {
      out += b.toString();
      process.stdout.write(b.toString());
    });
    p.stderr.on("data", (b) => process.stderr.write(b.toString()));
    p.on("exit", (code) => resolve({ code, out }));
  });
}

const child = spawn(process.execPath, ["src/server.js"], {
  cwd: backendRoot,
  env: {
    ...process.env,
    NODE_ENV: "development",
    PORT: String(PORT),
    MONGODB_URI: uri,
    JWT_SECRET: "smoke_test_secret_do_not_use",
    BCRYPT_SALT_ROUNDS: "4",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let ok = false;
try {
  await waitForServer(child);
  console.log("\nRunning smoke checks:");

  const health = await json("GET", `${BASE}/api/health`);
  assert(health.status === 200, "GET /api/health returns 200");

  const phone = "9876500001";
  const reg = await json("POST", `${BASE}/api/auth/register`, {
    name: "Smoke Customer",
    phone,
    password: "smoke1234",
    role: "customer",
  });
  assert(reg.status === 201, "POST /api/auth/register creates customer (201)");

  const login = await json("POST", `${BASE}/api/auth/login`, {
    identifier: phone,
    password: "smoke1234",
  });
  assert(login.status === 200 && login.data?.data?.token, "POST /api/auth/login returns token");

  const me = await json("GET", `${BASE}/api/auth/me`, null, login.data.data.token);
  assert(me.status === 200 && me.data?.data?.user?.phone === phone, "GET /api/auth/me returns self");

  const booking = await json(
    "POST",
    `${BASE}/api/bookings`,
    {
      customerName: "Smoke Customer",
      contactNumber: phone,
      service: "Plumber",
      description: "Tap leak in kitchen",
      address: "Udhna Main Road",
      city: "Surat",
      requiredWorkerCount: 1,
    },
    login.data.data.token
  );
  assert(
    booking.status === 201 && booking.data?.data?.booking?.bookingId,
    "POST /api/bookings creates booking"
  );

  const denied = await json("GET", `${BASE}/api/users`, null, login.data.data.token);
  assert(denied.status === 403, "customer blocked from GET /api/users (403)");

  console.log("\nRunning CLI scripts:");
  const seed = await runNode("scripts/seed.js");
  assert(seed.code === 0 && seed.out.includes("Services seeded"), "seed.js runs and seeds services");

  const boot = await runNode("scripts/bootstrapSuperAdmin.js", {
    BOOTSTRAP_SUPERADMIN_PASSWORD: "Smoke1234",
    BOOTSTRAP_SUPERADMIN_EMAIL: "root@smoke.local",
  });
  assert(
    boot.code === 0 && boot.out.includes("Super Admin created"),
    "bootstrapSuperAdmin.js creates the first super admin"
  );

  const bootAgain = await runNode("scripts/bootstrapSuperAdmin.js", {
    BOOTSTRAP_SUPERADMIN_PASSWORD: "Smoke1234",
  });
  assert(
    bootAgain.out.includes("already exists"),
    "bootstrap refuses to create a second super admin"
  );

  const adminLogin = await json("POST", `${BASE}/api/auth/login`, {
    identifier: "root@smoke.local",
    password: "Smoke1234",
  });
  assert(adminLogin.status === 200, "super admin can log in");

  const dash = await json("GET", `${BASE}/api/reports/dashboard`, null, adminLogin.data.data.token);
  assert(dash.status === 200 && dash.data?.data, "super admin can read /api/reports/dashboard");

  const services = await json("GET", `${BASE}/api/services`);
  assert(
    services.status === 200 && services.data?.data?.items?.length >= 7,
    "public /api/services returns seeded categories"
  );

  ok = true;
  console.log("\n✅ SMOKE TEST PASSED — real server.js + db.js + HTTP work end-to-end.");
} catch (err) {
  console.error("\n❌ SMOKE TEST FAILED:", err.message);
} finally {
  child.kill();
  await new Promise((r) => setTimeout(r, 500));
  await mongod.stop();
  process.exit(ok ? 0 : 1);
}
