import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root folder (one level above src/)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    // In production we must fail fast if a critical secret is missing.
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/kaamsetu"),
  jwtSecret: required("JWT_SECRET", "dev_only_insecure_secret_change_me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  },
  bootstrap: {
    name: process.env.BOOTSTRAP_SUPERADMIN_NAME || "Super Admin",
    email: process.env.BOOTSTRAP_SUPERADMIN_EMAIL || "superadmin@kaamsetu.local",
    phone: process.env.BOOTSTRAP_SUPERADMIN_PHONE || "9000000000",
    password: process.env.BOOTSTRAP_SUPERADMIN_PASSWORD || "",
  },
};

export default env;
