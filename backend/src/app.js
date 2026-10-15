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

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  // Security headers. Disable CSP cross-origin resource policy for API usage.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // Strict CORS: only allow configured origins.
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true); // curl / same-origin / mobile apps
        if (env.corsOrigins.includes("*") || env.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  if (env.nodeEnv !== "test") app.use(morgan("dev"));

  app.use(generalLimiter);

  // Static uploads (optional problem photos)
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
