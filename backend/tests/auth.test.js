import { jest } from "@jest/globals";
import { startTestDB, stopTestDB, clearDB, getApp, request } from "./setup.js";

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

const customer = {
  name: "Test Customer",
  phone: "9876543210",
  email: "customer@test.com",
  password: "secret123",
};

describe("Auth", () => {
  test("registers a customer and returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send(customer);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe("customer");
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  test("rejects duplicate registration", async () => {
    await request(app).post("/api/auth/register").send(customer);
    const res = await request(app).post("/api/auth/register").send(customer);
    expect(res.status).toBe(409);
  });

  test("logs in with email and phone", async () => {
    await request(app).post("/api/auth/register").send(customer);
    const byEmail = await request(app)
      .post("/api/auth/login")
      .send({ identifier: customer.email, password: customer.password });
    expect(byEmail.status).toBe(200);

    const byPhone = await request(app)
      .post("/api/auth/login")
      .send({ identifier: customer.phone, password: customer.password });
    expect(byPhone.status).toBe(200);
  });

  test("rejects incorrect password with generic message", async () => {
    await request(app).post("/api/auth/register").send(customer);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: customer.email, password: "wrongpass" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  test("rejects invalid registration input", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "", phone: "12", password: "123" });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  test("protected route rejects missing token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("public registration cannot create an admin role", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...customer, phone: "9999999999", email: "x@y.com", role: "super_admin" });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("customer");
  });
});
