import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import env from "./config/env.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import { notFound, errorHandler } from "./middleware/error.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import nakaRoutes from "./routes/naka.routes.js";
import workerRoutes from "./routes/worker.routes.js";
import workerSelfRoutes from "./routes/workerSelf.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import reportRoutes from "./routes/report.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import auditLogRoutes from "./routes/auditLog.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS runs before ALL routes so preflight OPTIONS is answered with the right
// headers instead of falling through to 404/500.
//
// Dynamic reflection: we echo back the caller's Origin (Vercel production,
// Vercel preview/branch domains, localhost, mobile/curl with no Origin).
// A literal "*" is NOT allowed by browsers when credentials are enabled, so
// reflecting the actual origin is what keeps `credentials: true` working.
const corsOptions = {
  origin(origin, callback) {
    // No Origin header => same-origin, curl, Postman, native mobile apps.
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Content-Length"],
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  // 1) CORS FIRST — before every other middleware and all routes, so an
  //    OPTIONS preflight is answered here and can never fall through to a
  //    404 route or an error handler.
  app.use(cors(corsOptions));

  // 2) Explicit preflight handler as an extra safety net. The cors() call
  //    above already ends OPTIONS with 204 + headers; this guarantees the
  //    request is handled even if it somehow reaches this layer.
  app.options("*", cors(corsOptions), (_req, res) => res.sendStatus(200));

  // 3) Security headers (every non-CORS middleware comes after CORS).
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  if (env.nodeEnv !== "test") app.use(morgan("dev"));

  app.use(generalLimiter);

  // Static uploads (optional problem photos)
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // Root route — so hitting the base URL returns JSON instead of a 404.
  app.get("/", (_req, res) =>
    res.json({
      success: true,
      message: "KaamSetu API is running...",
      version: "1.0.0",
      environment: env.nodeEnv,
      health: "/api/health",
      time: new Date().toISOString(),
    })
  );

  // Health check
  app.get("/api/health", (_req, res) =>
    res.json({ success: true, data: { status: "ok", env: env.nodeEnv, time: new Date().toISOString() } })
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/nakas", nakaRoutes);
  app.use("/api/workers", workerRoutes);
  app.use("/api/worker", workerSelfRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/services", serviceRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/complaints", complaintRoutes);
  app.use("/api/audit-logs", auditLogRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
