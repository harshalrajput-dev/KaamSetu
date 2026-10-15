import { jest } from "@jest/globals";
import { startTestDB, stopTestDB, clearDB, getApp, request } from "./setup.js";
import User, { ROLES } from "../src/models/User.js";
import Naka from "../src/models/Naka.js";
import { hashPassword } from "../src/utils/password.js";
import { signToken } from "../src/utils/jwt.js";

jest.setTimeout(60000);

let app;
beforeAll(async () => {
  await startTestDB();
  app = await getApp();
});
afterAll(async () => {
  await stopTestDB();
});
beforeEach(async () => {
  await clearDB();
});

async function makeUser(overrides) {
  const passwordHash = await hashPassword("pass1234");
  return User.create({ passwordHash, isActive: true, ...overrides });
}

async function makeNakaWithAdmin(suffix) {
  const naka = await Naka.create({ name: `Naka ${suffix}`, city: "Surat", area: suffix });
  const admin = await makeUser({
    name: `Naka Admin ${suffix}`,
    email: `naka${suffix}@test.com`,
    phone: `90000000${suffix}`,
    role: ROLES.NAKA_ADMIN,
    naka: naka._id,
  });
  naka.admin = admin._id;
  await naka.save();
  return { naka, admin, token: signToken(admin) };
}

describe("Authentication requirement (401)", () => {
  const protectedRoutes = [
    ["get", "/api/users"],
    ["get", "/api/nakas"],
    ["get", "/api/audit-logs"],
    ["get", "/api/worker/me"],
  ];

  test.each(protectedRoutes)("%s %s without token returns 401", async (method, url) => {
    const res = await request(app)[method](url);
    expect(res.status).toBe(401);
  });

  test("a deactivated admin loses access immediately (401)", async () => {
    const { admin, token } = await makeNakaWithAdmin("01");
    const res = await request(app).get("/api/nakas").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    await User.updateOne({ _id: admin._id }, { isActive: false });
    const after = await request(app).get("/api/nakas").set("Authorization", `Bearer ${token}`);
    expect(after.status).toBe(401);
  });
});

describe("Super Admin only endpoints (403 for others)", () => {
  test("naka admin cannot list users, read audit logs, or create nakas", async () => {
    const { token } = await makeNakaWithAdmin("02");

    const users = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`);
    expect(users.status).toBe(403);

    const logs = await request(app).get("/api/audit-logs").set("Authorization", `Bearer ${token}`);
    expect(logs.status).toBe(403);

    const createNaka = await request(app)
      .post("/api/nakas")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Hacked Naka", city: "Surat" });
    expect(createNaka.status).toBe(403);
  });

  test("naka admin cannot create another naka admin", async () => {
    const { naka, token } = await makeNakaWithAdmin("03");
    const res = await request(app)
      .post(`/api/nakas/${naka._id}/admins`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "X", phone: "9898989898", email: "x@test.com", password: "pass1234" });
    expect(res.status).toBe(403);
  });

  test("only super admin can read the global booking report", async () => {
    const { token } = await makeNakaWithAdmin("04");
    const forbidden = await request(app)
      .get("/api/reports/bookings")
      .set("Authorization", `Bearer ${token}`);
    expect(forbidden.status).toBe(403);

    const root = await makeUser({
      name: "Root",
      email: "root@test.com",
      phone: "9111111111",
      role: ROLES.SUPER_ADMIN,
    });
    const allowed = await request(app)
      .get("/api/reports/bookings")
      .set("Authorization", `Bearer ${signToken(root)}`);
    expect(allowed.status).toBe(200);
  });

  test("customers and workers are blocked from admin user management", async () => {
    const customer = await makeUser({
      name: "C",
      email: "c@test.com",
      phone: "9222222222",
      role: ROLES.CUSTOMER,
    });
    const worker = await makeUser({
      name: "W",
      email: "w@test.com",
      phone: "9333333333",
      role: ROLES.WORKER,
    });

    const asCustomer = await request(app).get("/api/users").set("Authorization", `Bearer ${signToken(customer)}`);
    expect(asCustomer.status).toBe(403);

    const asWorker = await request(app).get("/api/users").set("Authorization", `Bearer ${signToken(worker)}`);
    expect(asWorker.status).toBe(403);
  });
});

describe("Naka Admin scoping", () => {
  test("naka admin can read own naka but not another naka", async () => {
    const a = await makeNakaWithAdmin("11");
    const b = await makeNakaWithAdmin("12");

    const own = await request(app)
      .get(`/api/nakas/${a.naka._id}`)
      .set("Authorization", `Bearer ${a.token}`);
    expect(own.status).toBe(200);

    const other = await request(app)
      .get(`/api/nakas/${b.naka._id}`)
      .set("Authorization", `Bearer ${a.token}`);
    expect(other.status).toBe(403);

    const list = await request(app).get("/api/nakas").set("Authorization", `Bearer ${a.token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.items).toHaveLength(1);
    expect(String(list.body.data.items[0]._id)).toBe(String(a.naka._id));
  });

  test("naka admin dashboard stats are scoped and allowed", async () => {
    const { token } = await makeNakaWithAdmin("13");
    const res = await request(app)
      .get("/api/reports/dashboard")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.bookings.total).toBe(0);
    expect(res.body.data.nakas).toBeUndefined();
  });

  test("naka admin cannot access worker-only endpoints", async () => {
    const { token } = await makeNakaWithAdmin("14");
    const res = await request(app).get("/api/worker/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe("Deployment smoke checks (CORS + root route)", () => {
  const VERCEL_ORIGIN = "https://kaam-setu-rust.vercel.app";

  test("root route returns a running JSON message instead of 404", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/KaamSetu API is running/i);
  });

  test("health route responds under /api", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
  });

  test("preflight from the Vercel origin allows credentials", async () => {
    const res = await request(app)
      .options("/api/auth/login")
      .set("Origin", VERCEL_ORIGIN)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type,authorization");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(VERCEL_ORIGIN);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
    expect(res.headers["access-control-allow-credentials"]).not.toBe("*");
  });

  test("actual GET response carries CORS headers for the Vercel origin", async () => {
    const res = await request(app).get("/").set("Origin", VERCEL_ORIGIN);
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(VERCEL_ORIGIN);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  test("preflight for POST /api/auth/register reflects any Vercel domain", async () => {
    const previewOrigin = "https://kaamsetu-abc123-user.vercel.app";
    const res = await request(app)
      .options("/api/auth/register")
      .set("Origin", previewOrigin)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type,x-requested-with,accept");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(previewOrigin);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
    expect(res.headers["access-control-allow-methods"]).toContain("OPTIONS");
    expect(res.headers["access-control-allow-headers"]).toMatch(/content-type/i);
    expect(res.headers["access-control-allow-headers"]).toMatch(/authorization/i);
    expect(res.headers["access-control-allow-headers"]).toMatch(/x-requested-with/i);
  });

  test("preflight reflects any origin dynamically (not a literal *)", async () => {
    const res = await request(app)
      .options("/api/auth/register")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "POST");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(res.headers["access-control-allow-origin"]).not.toBe("*");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  test("actual POST reaches the route instead of dying at preflight", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("Origin", VERCEL_ORIGIN)
      .send({ name: "Preflight User", email: "preflight@kt.com", phone: "9000000001", password: "secret12" });
    expect([201, 400, 409]).toContain(res.status);
    expect(res.headers["access-control-allow-origin"]).toBe(VERCEL_ORIGIN);
  });

  test("requests without an Origin header still succeed", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });
});