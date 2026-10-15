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

let phoneSeq = 9700000000;
function nextPhone() {
  phoneSeq += 1;
  return String(phoneSeq);
}

async function makeUser(overrides = {}) {
  const passwordHash = await hashPassword("password123");
  const user = await User.create({
    name: "U",
    phone: nextPhone(),
    passwordHash,
    role: ROLES.CUSTOMER,
    ...overrides,
  });
  return { user, token: signToken(user) };
}

const bookingPayload = {
  customerName: "Cust",
  contactNumber: "9876500000",
  service: "Plumber",
  description: "Leaking tap",
  address: "12, Main Road",
  area: "Udhna",
  city: "Surat",
  requiredWorkerCount: 1,
};

async function seed() {
  const superAdmin = await makeUser({ role: ROLES.SUPER_ADMIN });
  const customer = await makeUser();
  const other = await makeUser();
  const naka = await Naka.create({ name: "Naka A", city: "Surat", area: "Udhna" });
  const admin = await makeUser({ role: ROLES.NAKA_ADMIN, naka: naka._id });
  const worker = await Worker.create({
    name: "Ravi",
    contactNumber: "9111111111",
    skills: ["Plumber"],
    naka: naka._id,
  });
  return { superAdmin, customer, other, naka, admin, worker };
}

async function createBooking(s, token) {
  const res = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${token}`)
    .send(bookingPayload);
  return res.body.data.booking;
}

async function assign(s, bookingId, workerId, token) {
  return request(app)
    .post(`/api/bookings/${bookingId}/assign-workers`)
    .set("Authorization", `Bearer ${token}`)
    .send({ workerIds: [String(workerId)] });
}

async function setStatus(bookingId, status, token, extra = {}) {
  return request(app)
    .patch(`/api/bookings/${bookingId}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status, ...extra });
}

async function advanceToCompleted(s, token) {
  const booking = await createBooking(s, s.customer.token);
  await assign(s, booking._id, s.worker._id, s.admin.token);
  await setStatus(booking._id, "In Progress", token || s.admin.token);
  await setStatus(booking._id, "Completed", token || s.admin.token);
  return booking;
}

describe("Reviews", () => {
  test("customer can review a completed booking and duplicate is blocked", async () => {
    const s = await seed();
    const booking = await advanceToCompleted(s);

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${s.customer.token}`)
      .send({ booking: booking._id, rating: 5, comment: "Great work" });
    expect(res.status).toBe(201);
    expect(res.body.data.review.rating).toBe(5);

    const dup = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${s.customer.token}`)
      .send({ booking: booking._id, rating: 4 });
    expect(dup.status).toBe(409);
  });

  test("cannot review an unfinished booking and cannot review others' booking", async () => {
    const s = await seed();
    const booking = await createBooking(s, s.customer.token);

    const early = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${s.customer.token}`)
      .send({ booking: booking._id, rating: 5 });
    expect(early.status).toBe(400);

    const foreign = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${s.other.token}`)
      .send({ booking: booking._id, rating: 5 });
    expect(foreign.status).toBe(403);
  });

  test("summary returns count and average", async () => {
    const s = await seed();
    const booking = await advanceToCompleted(s);
    await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${s.customer.token}`)
      .send({ booking: booking._id, rating: 4 });

    const res = await request(app)
      .get("/api/reviews/summary")
      .set("Authorization", `Bearer ${s.admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.average).toBe(4);
  });

  test("naka admin cannot create a review", async () => {
    const s = await seed();
    const booking = await advanceToCompleted(s);
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${s.admin.token}`)
      .send({ booking: booking._id, rating: 5 });
    expect(res.status).toBe(403);
  });
});

describe("Complaints", () => {
  test("customer complaint flags the booking and is scoped to the naka", async () => {
    const s = await seed();
    const booking = await advanceToCompleted(s);

    const create = await request(app)
      .post("/api/complaints")
      .set("Authorization", `Bearer ${s.customer.token}`)
      .send({
        booking: booking._id,
        subject: "Poor quality",
        description: "The tap still leaks",
        category: "Poor Quality",
      });
    expect(create.status).toBe(201);
    expect(create.body.data.complaint.status).toBe("Open");
    const complaintId = create.body.data.complaint._id;

    // Booking should now be in Complaint status.
    const b = await request(app)
      .get(`/api/bookings/${booking._id}`)
      .set("Authorization", `Bearer ${s.admin.token}`);
    expect(b.body.data.booking.status).toBe("Complaint");

    // Another customer cannot see it.
    const foreign = await request(app)
      .get(`/api/complaints/${complaintId}`)
      .set("Authorization", `Bearer ${s.other.token}`);
    expect(foreign.status).toBe(403);

    // Resolving moves the booking back to Completed.
    const resolved = await request(app)
      .patch(`/api/complaints/${complaintId}`)
      .set("Authorization", `Bearer ${s.admin.token}`)
      .send({ status: "Resolved", resolutionNote: "Replaced the washer" });
    expect(resolved.status).toBe(200);
    expect(resolved.body.data.complaint.status).toBe("Resolved");

    const b2 = await request(app)
      .get(`/api/bookings/${booking._id}`)
      .set("Authorization", `Bearer ${s.admin.token}`);
    expect(b2.body.data.booking.status).toBe("Completed");
  });

  test("complaint can be escalated and escalated complaints are locked for naka admin", async () => {
    const s = await seed();
    const booking = await advanceToCompleted(s);
    const create = await request(app)
      .post("/api/complaints")
      .set("Authorization", `Bearer ${s.customer.token}`)
      .send({ booking: booking._id, subject: "Issue", description: "Details here" });
    const id = create.body.data.complaint._id;

    const esc = await request(app)
      .post(`/api/complaints/${id}/escalate`)
      .set("Authorization", `Bearer ${s.admin.token}`)
      .send({ note: "Needs super admin" });
    expect(esc.status).toBe(200);
    expect(esc.body.data.complaint.status).toBe("Escalated");

    // naka admin can no longer modify an escalated complaint.
    const blocked = await request(app)
      .patch(`/api/complaints/${id}`)
      .set("Authorization", `Bearer ${s.admin.token}`)
      .send({ status: "Resolved" });
    expect(blocked.status).toBe(403);

    // super admin can.
    const ok = await request(app)
      .patch(`/api/complaints/${id}`)
      .set("Authorization", `Bearer ${s.superAdmin.token}`)
      .send({ status: "Resolved" });
    expect(ok.status).toBe(200);
  });
});

describe("Audit logs", () => {
  test("actions are recorded and only super admin can read the trail", async () => {
    const s = await seed();
    await advanceToCompleted(s);

    const list = await request(app)
      .get("/api/audit-logs")
      .set("Authorization", `Bearer ${s.superAdmin.token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.total).toBeGreaterThan(0);
    const actions = list.body.data.items.map((i) => i.action);
    expect(actions).toContain("booking.create");
    expect(actions).toContain("booking.assign");

    const forbidden = await request(app)
      .get("/api/audit-logs")
      .set("Authorization", `Bearer ${s.admin.token}`);
    expect(forbidden.status).toBe(403);
  });
});

describe("Worker sanctions & stats", () => {
  test("warn, block and stats reflect real data", async () => {
    const s = await seed();
    await advanceToCompleted(s);

    const warn = await request(app)
      .post(`/api/workers/${s.worker._id}/sanction`)
      .set("Authorization", `Bearer ${s.admin.token}`)
      .send({ action: "warn", note: "Late" });
    expect(warn.status).toBe(200);
    expect(warn.body.data.worker.warningCount).toBe(1);

    const stats = await request(app)
      .get(`/api/workers/${s.worker._id}/stats`)
      .set("Authorization", `Bearer ${s.admin.token}`);
    expect(stats.status).toBe(200);
    expect(stats.body.data.completedJobs).toBe(1);

    const block = await request(app)
      .post(`/api/workers/${s.worker._id}/sanction`)
      .set("Authorization", `Bearer ${s.admin.token}`)
      .send({ action: "block", note: "Repeated issues" });
    expect(block.status).toBe(200);
    expect(block.body.data.worker.isBlocked).toBe(true);
  });

  test("a blocked worker cannot be assigned to a new booking", async () => {
    const s = await seed();
    await request(app)
      .post(`/api/workers/${s.worker._id}/sanction`)
      .set("Authorization", `Bearer ${s.admin.token}`)
      .send({ action: "block" });

    const booking = await createBooking(s, s.customer.token);
    const res = await assign(s, booking._id, s.worker._id, s.admin.token);
    expect(res.status).toBe(400);
  });
});

describe("Super admin assignment & fair allocation", () => {
  test("super admin can assign a worker (booking naka scope)", async () => {
    const s = await seed();
    const booking = await createBooking(s, s.customer.token);
    const res = await assign(s, booking._id, s.worker._id, s.superAdmin.token);
    expect(res.status).toBe(200);
    expect(res.body.data.booking.status).toBe("Assigned");
  });

  test("suggested workers rank skill matches and prefer idle workers", async () => {
    const s = await seed();
    const busy = await Worker.create({
      name: "Busy",
      contactNumber: "9222222222",
      skills: ["Plumber"],
      naka: s.naka._id,
    });
    const booking1 = await createBooking(s, s.customer.token);
    await assign(s, booking1._id, busy._id, s.admin.token);
    await setStatus(booking1._id, "In Progress", s.admin.token);

    const booking2 = await createBooking(s, s.customer.token);
    const res = await request(app)
      .get(`/api/bookings/${booking2._id}/suggested-workers`)
      .set("Authorization", `Bearer ${s.admin.token}`);
    expect(res.status).toBe(200);
    const items = res.body.data.items;
    expect(items.length).toBe(2);
    // The idle Plumber should rank first, the busy one second.
    expect(String(items[0].worker._id)).toBe(String(s.worker._id));
    expect(items[0].activeJobs).toBe(0);
    expect(items[1].activeJobs).toBe(1);
  });
});

describe("Arrival & no-show", () => {
  test("recording arrival moves Assigned -> Accepted", async () => {
    const s = await seed();
    const booking = await createBooking(s, s.customer.token);
    await assign(s, booking._id, s.worker._id, s.admin.token);

    const res = await request(app)
      .post(`/api/bookings/${booking._id}/arrivals`)
      .set("Authorization", `Bearer ${s.admin.token}`)
      .send({ workerId: String(s.worker._id), arrived: true });
    expect(res.status).toBe(200);
    expect(res.body.data.booking.status).toBe("Accepted");
  });

  test("a no-show increments the worker's no-show counter", async () => {
    const s = await seed();
    const booking = await createBooking(s, s.customer.token);
    await assign(s, booking._id, s.worker._id, s.admin.token);

    const res = await request(app)
      .post(`/api/bookings/${booking._id}/arrivals`)
      .set("Authorization", `Bearer ${s.admin.token}`)
      .send({ workerId: String(s.worker._id), arrived: false, note: "Did not come" });
    expect(res.status).toBe(200);

    const w = await Worker.findById(s.worker._id);
    expect(w.noShowCount).toBe(1);
  });
});
