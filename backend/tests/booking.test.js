import { jest } from "@jest/globals";
import { startTestDB, stopTestDB, clearDB, getApp, request } from "./setup.js";
import User, { ROLES } from "../src/models/User.js";
import Naka from "../src/models/Naka.js";
import Worker from "../src/models/Worker.js";
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

async function makeUser(overrides = {}) {
  const passwordHash = await hashPassword("password123");
  const user = await User.create({
    name: "U",
    phone: String(Math.floor(1e9 + Math.random() * 9e9)),
    passwordHash,
    role: ROLES.CUSTOMER,
    ...overrides,
  });
  return { user, token: signToken(user) };
}

async function seedScenario() {
  const superAdmin = await makeUser({ role: ROLES.SUPER_ADMIN, phone: "9000000001" });
  const customerA = await makeUser({ phone: "9000000002" });
  const customerB = await makeUser({ phone: "9000000003" });

  const naka1 = await Naka.create({ name: "Naka One", city: "Surat", area: "Udhna" });
  const naka2 = await Naka.create({ name: "Naka Two", city: "Surat", area: "Katargam" });

  const admin1 = await makeUser({
    role: ROLES.NAKA_ADMIN,
    phone: "9000000004",
    naka: naka1._id,
  });
  const admin2 = await makeUser({
    role: ROLES.NAKA_ADMIN,
    phone: "9000000005",
    naka: naka2._id,
  });

  const worker1 = await Worker.create({
    name: "Ravi",
    contactNumber: "9111111111",
    skills: ["Plumber"],
    naka: naka1._id,
  });
  const worker2 = await Worker.create({
    name: "Sita",
    contactNumber: "9222222222",
    skills: ["Electrician"],
    naka: naka1._id,
  });

  return { superAdmin, customerA, customerB, naka1, naka2, admin1, admin2, worker1, worker2 };
}

const bookingPayload = {
  customerName: "Cust A",
  contactNumber: "9876500000",
  service: "Plumber",
  description: "Leaking tap in kitchen",
  address: "12, Main Road",
  area: "Udhna",
  city: "Surat",
  requiredWorkerCount: 1,
};

describe("Bookings & RBAC", () => {
  test("customer can create a booking and gets a generated booking id", async () => {
    const s = await seedScenario();
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${s.customerA.token}`)
      .send(bookingPayload);
    expect(res.status).toBe(201);
    expect(res.body.data.booking.bookingId).toMatch(/^KS-/);
    expect(res.body.data.booking.status).toBe("Pending");
    // auto-assigned to naka1 (only active naka in Surat)
    expect(String(res.body.data.booking.naka)).toBe(String(s.naka1._id));
  });

  test("naka admin and super admin cannot create bookings", async () => {
    const s = await seedScenario();
    const r1 = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${s.admin1.token}`)
      .send(bookingPayload);
    expect(r1.status).toBe(403);

    const r2 = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${s.superAdmin.token}`)
      .send(bookingPayload);
    expect(r2.status).toBe(403);
  });

  test("customer can only see own bookings", async () => {
    const s = await seedScenario();
    await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${s.customerA.token}`)
      .send(bookingPayload);

    const listA = await request(app)
      .get("/api/bookings")
      .set("Authorization", `Bearer ${s.customerA.token}`);
    expect(listA.body.data.total).toBe(1);

    const listB = await request(app)
      .get("/api/bookings")
      .set("Authorization", `Bearer ${s.customerB.token}`);
    expect(listB.body.data.total).toBe(0);
  });

  test("customer cannot view another customer's booking", async () => {
    const s = await seedScenario();
    const created = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${s.customerA.token}`)
      .send(bookingPayload);
    const id = created.body.data.booking._id;

    const res = await request(app)
      .get(`/api/bookings/${id}`)
      .set("Authorization", `Bearer ${s.customerB.token}`);
    expect(res.status).toBe(403);
  });

  test("naka admin data isolation: only own naka bookings visible", async () => {
    const s = await seedScenario();
    await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${s.customerA.token}`)
      .send(bookingPayload); // goes to naka1

    const list1 = await request(app)
      .get("/api/bookings")
      .set("Authorization", `Bearer ${s.admin1.token}`);
    expect(list1.body.data.total).toBe(1);

    const list2 = await request(app)
      .get("/api/bookings")
      .set("Authorization", `Bearer ${s.admin2.token}`);
    expect(list2.body.data.total).toBe(0);
  });

  test("worker assignment + status transition validation", async () => {
    const s = await seedScenario();
    const created = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${s.customerA.token}`)
      .send(bookingPayload);
    const id = created.body.data.booking._id;

    // Invalid jump: Pending -> Completed
    const bad = await request(app)
      .patch(`/api/bookings/${id}/status`)
      .set("Authorization", `Bearer ${s.admin1.token}`)
      .send({ status: "Completed" });
    expect(bad.status).toBe(400);

    // Assign worker
    const assign = await request(app)
      .post(`/api/bookings/${id}/assign-workers`)
      .set("Authorization", `Bearer ${s.admin1.token}`)
      .send({ workerIds: [String(s.worker1._id)] });
    expect(assign.status).toBe(200);
    expect(assign.body.data.booking.status).toBe("Assigned");

    // Cannot assign a worker from another naka
    const other = await Worker.create({
      name: "Other",
      contactNumber: "9333333333",
      skills: ["Painter"],
      naka: s.naka2._id,
    });
    // worker gets reassigned booking
    const badAssign = await request(app)
      .post(`/api/bookings/${id}/assign-workers`)
      .set("Authorization", `Bearer ${s.admin1.token}`)
      .send({ workerIds: [String(other._id)] });
    expect(badAssign.status).toBe(403);

    // Valid transitions
    const started = await request(app)
      .patch(`/api/bookings/${id}/status`)
      .set("Authorization", `Bearer ${s.admin1.token}`)
      .send({ status: "In Progress" });
    expect(started.status).toBe(200);

    const done = await request(app)
      .patch(`/api/bookings/${id}/status`)
      .set("Authorization", `Bearer ${s.admin1.token}`)
      .send({ status: "Completed" });
    expect(done.status).toBe(200);

    // Worker should be available again after completion
    const w = await Worker.findById(s.worker1._id);
    expect(w.isAvailable).toBe(true);
  });

  test("customer can cancel but not complete own booking", async () => {
    const s = await seedScenario();
    const created = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${s.customerA.token}`)
      .send(bookingPayload);
    const id = created.body.data.booking._id;

    const bad = await request(app)
      .patch(`/api/bookings/${id}/status`)
      .set("Authorization", `Bearer ${s.customerA.token}`)
      .send({ status: "Completed" });
    expect(bad.status).toBe(403);

    const cancel = await request(app)
      .patch(`/api/bookings/${id}/status`)
      .set("Authorization", `Bearer ${s.customerA.token}`)
      .send({ status: "Cancelled", cancelReason: "No longer needed" });
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.booking.status).toBe("Cancelled");
  });

  test("invalid booking input is rejected", async () => {
    const s = await seedScenario();
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${s.customerA.token}`)
      .send({ ...bookingPayload, requiredWorkerCount: 0, service: "Astronaut" });
    expect(res.status).toBe(400);
  });

  test("super admin sees all bookings", async () => {
    const s = await seedScenario();
    await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${s.customerA.token}`)
      .send(bookingPayload);
    await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${s.customerB.token}`)
      .send(bookingPayload);

    const res = await request(app)
      .get("/api/bookings")
      .set("Authorization", `Bearer ${s.superAdmin.token}`);
    expect(res.body.data.total).toBe(2);
  });

  test("customer gets full assigned worker details on detail and my-bookings", async () => {
    const s = await seedScenario();
    const created = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${s.customerA.token}`)
      .send(bookingPayload);
    const id = created.body.data.booking._id;

    await request(app)
      .post(`/api/bookings/${id}/assign-workers`)
      .set("Authorization", `Bearer ${s.admin1.token}`)
      .send({ workerIds: [String(s.worker1._id)] });

    const detail = await request(app)
      .get(`/api/bookings/${id}`)
      .set("Authorization", `Bearer ${s.customerA.token}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.booking.assignedWorker).toMatchObject({
      name: "Ravi",
      phone: "9111111111",
    });
    expect(detail.body.data.booking.assignedWorker.skills).toContain("Plumber");
    expect(detail.body.data.booking.workerName).toBe("Ravi");
    expect(detail.body.data.booking.workerPhone).toBe("9111111111");

    const mine = await request(app)
      .get("/api/bookings/my-bookings")
      .set("Authorization", `Bearer ${s.customerA.token}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data.total).toBe(1);
    expect(mine.body.data.items[0].assignedWorker.name).toBe("Ravi");

    // The shortcut is customer-only.
    const forbidden = await request(app)
      .get("/api/bookings/my-bookings")
      .set("Authorization", `Bearer ${s.admin1.token}`);
    expect(forbidden.status).toBe(403);
  });

  test("list supports comma-separated multi-status filter (naka tabs)", async () => {
    const s = await seedScenario();
    const created = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${s.customerA.token}`)
      .send(bookingPayload);
    const id = created.body.data.booking._id;

    // Advance to "Assigned" so it belongs to the assigned tab set.
    await request(app)
      .post(`/api/bookings/${id}/assign-workers`)
      .set("Authorization", `Bearer ${s.admin1.token}`)
      .send({ workerIds: [String(s.worker1._id)] });

    const assigned = await request(app)
      .get("/api/bookings")
      .query({ status: "Assigned,In Progress" })
      .set("Authorization", `Bearer ${s.admin1.token}`);
    expect(assigned.body.data.total).toBe(1);

    const history = await request(app)
      .get("/api/bookings")
      .query({ status: "Completed,Cancelled" })
      .set("Authorization", `Bearer ${s.admin1.token}`);
    expect(history.body.data.total).toBe(0);
  });
});
