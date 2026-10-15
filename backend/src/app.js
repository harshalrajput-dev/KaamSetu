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

// Origins that are always allowed (local dev + the deployed Vercel frontend),
// even if CORS_ORIGINS is not configured on the host (e.g. Render).
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
  "https://kaam-setu-rust.vercel.app",
];

// Raw value so we can tell "not configured" apart from an explicit allowlist.
const RAW_CORS_ORIGINS = (process.env.CORS_ORIGINS || "").trim();

// When CORS_ORIGINS is unset (or "*"), reflect any origin. Note: with
// `credentials: true` the browser forbids a literal "*" response, so we echo
// the caller's Origin header instead (handled by the cors callback below).
const ALLOW_ALL_ORIGINS =
  RAW_CORS_ORIGINS === "" || RAW_CORS_ORIGINS === "*" || env.corsOrigins.includes("*");

function isOriginAllowed(origin) {
  if (!origin) return true; // same-origin, curl, Postman, native mobile apps
  if (ALLOW_ALL_ORIGINS) return true;
  if (env.corsOrigins.includes(origin)) return true;
  if (DEFAULT_ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow Vercel preview/branch deployments (e.g. kaam-setu-git-main-*.vercel.app).
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
}

const corsOptions = {
  origin(origin, callback) {
    // Never throw here: an unhandled CORS error becomes a 500 WITHOUT CORS
    // headers, which the browser surfaces as a confusing "Network Error".
    callback(null, isOriginAllowed(origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Length"],
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  // Security headers. Disable CSP cross-origin resource policy for API usage.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // CORS must run before everything else so preflight (OPTIONS) requests are
  // answered with the right headers instead of falling through to 404/500.
  app.use(cors(corsOptions));

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
