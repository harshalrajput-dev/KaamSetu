import { jest } from "@jest/globals";
import { startTestDB, stopTestDB, clearDB, getApp, request } from "./setup.js";
import User, { ROLES } from "../src/models/User.js";
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

async function superAdmin() {
  const passwordHash = await hashPassword("adminpass1");
  const u = await User.create({
    name: "Root",
    phone: "9000000000",
    email: "root@test.com",
    passwordHash,
    role: ROLES.SUPER_ADMIN,
  });
  return { user: u, token: signToken(u) };
}

describe("Super admin flows", () => {
  test("non-admin cannot create a naka", async () => {
    const passwordHash = await hashPassword("pass1234");
    const cust = await User.create({ name: "C", phone: "9111111111", passwordHash, role: ROLES.CUSTOMER });
    const res = await request(app)
      .post("/api/nakas")
      .set("Authorization", `Bearer ${signToken(cust)}`)
      .send({ name: "X Naka", city: "Surat" });
    expect(res.status).toBe(403);
  });

  test("creates naka then naka admin, who can login", async () => {
    const root = await superAdmin();

    const nakaRes = await request(app)
      .post("/api/nakas")
      .set("Authorization", `Bearer ${root.token}`)
      .send({ name: "Udhna Main Naka", city: "Surat", area: "Udhna" });
    expect(nakaRes.status).toBe(201);
    const nakaId = nakaRes.body.data.naka._id;

    const adminRes = await request(app)
      .post(`/api/nakas/${nakaId}/admins`)
      .set("Authorization", `Bearer ${root.token}`)
      .send({
        name: "Naka Boss",
        phone: "9222222222",
        email: "boss@test.com",
        password: "boss1234",
      });
    expect(adminRes.status).toBe(201);
    expect(adminRes.body.data.user.role).toBe("naka_admin");

    const login = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "9222222222", password: "boss1234" });
    expect(login.status).toBe(200);
    expect(login.body.data.user.naka._id || login.body.data.user.naka).toBe(nakaId);
  });

  test("account deactivation blocks login", async () => {
    const root = await superAdmin();
    const passwordHash = await hashPassword("pass1234");
    const cust = await User.create({ name: "C", phone: "9333333333", passwordHash, role: ROLES.CUSTOMER });

    const deactivate = await request(app)
      .patch(`/api/users/${cust._id}/active`)
      .set("Authorization", `Bearer ${root.token}`)
      .send({ isActive: false });
    expect(deactivate.status).toBe(200);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "9333333333", password: "pass1234" });
    expect(login.status).toBe(403);
  });

  test("super admin cannot deactivate self", async () => {
    const root = await superAdmin();
    const res = await request(app)
      .patch(`/api/users/${root.user._id}/active`)
      .set("Authorization", `Bearer ${root.token}`)
      .send({ isActive: false });
    expect(res.status).toBe(400);
  });

  test("reports dashboard returns real counts", async () => {
    const root = await superAdmin();
    const res = await request(app)
      .get("/api/reports/dashboard")
      .set("Authorization", `Bearer ${root.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.nakas.total).toBe(0);
    expect(res.body.data.bookings.total).toBe(0);
  });

  test("self profile update works and cannot change role", async () => {
    const passwordHash = await hashPassword("pass1234");
    const cust = await User.create({ name: "C", phone: "9444444444", passwordHash, role: ROLES.CUSTOMER });
    const res = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${signToken(cust)}`)
      .send({ name: "Renamed", role: "super_admin" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe("Renamed");
    expect(res.body.data.user.role).toBe("customer");
  });

  test("profile update rejects a phone number used by someone else", async () => {
    const passwordHash = await hashPassword("pass1234");
    const a = await User.create({ name: "A", phone: "9555555551", passwordHash, role: ROLES.CUSTOMER });
    await User.create({ name: "B", phone: "9555555552", passwordHash, role: ROLES.CUSTOMER });

    const res = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${signToken(a)}`)
      .send({ phone: "9555555552" });
    expect(res.status).toBe(409);
  });
});
