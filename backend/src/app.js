import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import fs from "node:fs";
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

// Robust dynamic CORS setup
const corsOptions = {
  origin: function (origin, callback) {
    return callback(null, origin || true);
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

  // 1) CORS FIRST
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  // 2) Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  if (env.nodeEnv !== "test") app.use(morgan("dev"));

  app.use(generalLimiter);

  // Safe static uploads serving (Vercel Read-Only Disk Fix)
  try {
    const uploadsDir = path.join(__dirname, "uploads");
    if (fs.existsSync(uploadsDir)) {
      app.use("/uploads", express.static(uploadsDir));
    }
  } catch (err) {
    console.log("Static uploads directory error ignored for serverless environment");
  }

  // Root route
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

  // Routes
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