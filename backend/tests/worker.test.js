import { jest } from "@jest/globals";
import { startTestDB, stopTestDB, clearDB, getApp, request } from "./setup.js";
import User, { ROLES } from "../src/models/User.js";
import Naka from "../src/models/Naka.js";
import Worker from "../src/models/Worker.js";
import Booking from "../src/models/Booking.js";
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
  const naka = await Naka.create({ name: "Naka A", city: "Surat", area: "Udhna" });
  const admin = await makeUser({ role: ROLES.NAKA_ADMIN, naka: naka._id });
  return { superAdmin, customer, naka, admin };
}

// Creates a worker (with an app login) through the naka admin API, then logs in.
async function createWorkerWithLogin(s, overrides = {}) {
  const payload = {
    name: "Ravi",
    contactNumber: "9111111111",
    skills: ["Plumber"],
    email: "ravi.worker@test.com",
    password: "worker1234",
    ...overrides,
  };
  const res = await request(app)
    .post("/api/workers")
    .set("Authorization", `Bearer ${s.admin.token}`)
    .send(payload);
  expect(res.status).toBe(201);

  const login = await request(app)
    .post("/api/auth/login")
    .send({ identifier: payload.email, password: payload.password });
  expect(login.status).toBe(200);
  expect(login.body.data.user.role).toBe("worker");

  return {
    worker: res.body.data.worker,
    token: login.body.data.token,
    user: login.body.data.user,
  };
}

async function createBooking(s, token) {
  const res = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${token}`)
    .send(bookingPayload);
  return res.body.data.booking;
}

async function assign(s, bookingId, workerId) {
  return request(app)
    .post(`/api/bookings/${bookingId}/assign-workers`)
    .set("Authorization", `Bearer ${s.admin.token}`)
    .send({ workerIds: [String(workerId)] });
}

describe("Worker role & login", () => {
  test("naka admin can create a worker with a login; worker can log in and read own profile", async () => {
    const s = await seed();
    const w = await createWorkerWithLogin(s);

    const me = await request(app)
      .get("/api/worker/me")
      .set("Authorization", `Bearer ${w.token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.worker.name).toBe("Ravi");
    expect(String(me.body.data.worker.naka._id || me.body.data.worker.naka)).toBe(String(s.naka._id));

    const created = await Worker.findById(w.worker._id);
    expect(String(created.loginUser)).toBe(String(w.user.id));
  });

  test("worker cannot access admin-only endpoints", async () => {
    const s = await seed();
    const w = await createWorkerWithLogin(s);

    const users = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${w.token}`);
    expect(users.status).toBe(403);

    const workers = await request(app)
      .get("/api/workers")
      .set("Authorization", `Bearer ${w.token}`);
    expect(workers.status).toBe(403);

    const complaints = await request(app)
      .get("/api/complaints")
      .set("Authorization", `Bearer ${w.token}`);
    expect(complaints.status).toBe(403);
  });

  test("worker only sees jobs assigned to them", async () => {
    const s = await seed();
    const w = await createWorkerWithLogin(s);
    const booking = await createBooking(s, s.customer.token);
    await assign(s, booking._id, w.worker._id);

    const otherBooking = await createBooking(s, s.customer.token);

    const list = await request(app)
      .get("/api/worker/jobs")
      .set("Authorization", `Bearer ${w.token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.total).toBe(1);
    expect(String(list.body.data.items[0]._id)).toBe(String(booking._id));

    const foreign = await request(app)
      .get(`/api/worker/jobs/${otherBooking._id}`)
      .set("Authorization", `Bearer ${w.token}`);
    expect(foreign.status).toBe(403);
  });

  test("worker accept + progress + complete updates the booking lifecycle", async () => {
    const s = await seed();
    const w = await createWorkerWithLogin(s);
    const booking = await createBooking(s, s.customer.token);
    await assign(s, booking._id, w.worker._id);

    const accept = await request(app)
      .post(`/api/worker/jobs/${booking._id}/respond`)
      .set("Authorization", `Bearer ${w.token}`)
      .send({ decision: "accept" });
    expect(accept.status).toBe(200);
    expect(accept.body.data.booking.status).toBe("Accepted");

    const start = await request(app)
      .post(`/api/worker/jobs/${booking._id}/status`)
      .set("Authorization", `Bearer ${w.token}`)
      .send({ status: "In Progress" });
    expect(start.status).toBe(200);
    expect(start.body.data.booking.status).toBe("In Progress");

    const done = await request(app)
      .post(`/api/worker/jobs/${booking._id}/status`)
      .set("Authorization", `Bearer ${w.token}`)
      .send({ status: "Completed" });
    expect(done.status).toBe(200);
    expect(done.body.data.booking.status).toBe("Completed");

    // Worker is free again after completion.
    const worker = await Worker.findById(w.worker._id);
    expect(worker.isAvailable).toBe(true);
  });

  test("worker decline returns the booking to Pending for reassignment", async () => {
    const s = await seed();
    const w = await createWorkerWithLogin(s);
    const booking = await createBooking(s, s.customer.token);
    await assign(s, booking._id, w.worker._id);

    const res = await request(app)
      .post(`/api/worker/jobs/${booking._id}/respond`)
      .set("Authorization", `Bearer ${w.token}`)
      .send({ decision: "decline", note: "Already busy" });
    expect(res.status).toBe(200);
    expect(res.body.data.booking.status).toBe("Pending");
    expect(res.body.data.booking.assignedWorkers.length).toBe(0);

    const worker = await Worker.findById(w.worker._id);
    expect(worker.isAvailable).toBe(true);
  });

  test("worker can report inability to attend with a reason", async () => {
    const s = await seed();
    const w = await createWorkerWithLogin(s);
    const booking = await createBooking(s, s.customer.token);
    await assign(s, booking._id, w.worker._id);

    const res = await request(app)
      .post(`/api/worker/jobs/${booking._id}/absence`)
      .set("Authorization", `Bearer ${w.token}`)
      .send({ reason: "Family emergency" });
    expect(res.status).toBe(200);
    expect(res.body.data.booking.status).toBe("Pending");

    const fresh = await Booking.findById(booking._id);
    const last = fresh.statusHistory[fresh.statusHistory.length - 1];
    expect(last.note).toContain("Family emergency");
  });

  test("worker can update own available status but not sanctions", async () => {
    const s = await seed();
    const w = await createWorkerWithLogin(s);

    const off = await request(app)
      .patch("/api/worker/me")
      .set("Authorization", `Bearer ${w.token}`)
      .send({ isAvailable: false });
    expect(off.status).toBe(200);
    expect(off.body.data.worker.isAvailable).toBe(false);

    // Sanctions are admin-only.
    const sanction = await request(app)
      .post(`/api/workers/${w.worker._id}/sanction`)
      .set("Authorization", `Bearer ${w.token}`)
      .send({ action: "block" });
    expect(sanction.status).toBe(403);
  });

  test("worker listing of reviews is scoped to own reviews", async () => {
    const s = await seed();
    const w = await createWorkerWithLogin(s);
    const booking = await createBooking(s, s.customer.token);
    await assign(s, booking._id, w.worker._id);
    await request(app)
      .patch(`/api/bookings/${booking._id}/status`)
      .set("Authorization", `Bearer ${s.admin.token}`)
      .send({ status: "In Progress" });
    await request(app)
      .patch(`/api/bookings/${booking._id}/status`)
      .set("Authorization", `Bearer ${s.admin.token}`)
      .send({ status: "Completed" });

    await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${s.customer.token}`)
      .send({ booking: booking._id, rating: 5, comment: "Great" });

    const res = await request(app)
      .get("/api/worker/reviews")
      .set("Authorization", `Bearer ${w.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.rating.average).toBe(5);
  });
});
