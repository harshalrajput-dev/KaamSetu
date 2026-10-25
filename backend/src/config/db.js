import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

// Load backend/.env as early as possible so process.env.MONGODB_URI is never
// undefined, no matter which directory the process is started from.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const DEFAULT_URI = "mongodb://127.0.0.1:27017/kaamsetu";
const FALLBACK_STANDARD_URI =
  "mongodb://queue123:queue123@ac-y5vngss-shard-00-00.yw2h4ix.mongodb.net:27017,ac-y5vngss-shard-00-01.yw2h4ix.mongodb.net:27017,ac-y5vngss-shard-00-02.yw2h4ix.mongodb.net:27017/kaamsetu?ssl=true&replicaSet=atlas-vfu2a7-shard-0&authSource=admin&retryWrites=true&w=majority";

// Global connection caching for Vercel Serverless
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export function getMongoUri() {
  const uri = (process.env.MONGODB_URI || DEFAULT_URI).trim();
  return uri;
}

function explainConnectionError(err, uri) {
  const message = err?.message || String(err);
  const hints = [];

  if (/querySrv|ESERVFAIL|ENOTFOUND|EAI_AGAIN|ETIMEOUT/i.test(message)) {
    hints.push(
      "DNS/SRV lookup failed. If using mongodb+srv://, try using the standard connection string; check DNS (8.8.8.8)."
    );
  }
  if (/ECONNREFUSED/i.test(message)) {
    hints.push(
      "Connection refused. The cluster is unreachable — confirm it is running and that your current IP is whitelisted in Atlas → Network Access."
    );
  }
  if (/Authentication failed|bad auth|auth/i.test(message)) {
    hints.push("Authentication failed. Verify the username and password in MONGODB_URI.");
  }
  if (/MongooseServerSelectionError|Server selection timed out/i.test(message)) {
    hints.push(
      "Could not select a MongoDB server. Whitelist your IP in Atlas → Network Access (0.0.0.0/0 for dev) and verify the URI/database path."
    );
  }
  if (!/^mongodb\+srv:\/\//.test(uri) && !/^mongodb:\/\//.test(uri)) {
    hints.push("MONGODB_URI does not start with mongodb:// or mongodb+srv://. Check backend/.env.");
  }

  if (hints.length) {
    console.error("MongoDB connection troubleshooting:");
    for (const hint of hints) console.error(`   • ${hint}`);
  }
}

/**
 * Connects to MongoDB using the provided URI (or process.env.MONGODB_URI).
 * Uses connection caching for Vercel Serverless environment.
 */
export async function connectDB(uri = getMongoUri(), options = {}) {
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to backend/.env.");
  }

  // Return existing active connection immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  mongoose.set("strictQuery", true);

  const baseOptions = {
    autoIndex: false, // Disabled for fast serverless execution
    serverSelectionTimeoutMS: 5000, // Reduced from 30s to 5s so requests don't hang
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
    bufferCommands: false, // Prevents 10000ms buffering timeout crashes
    ...options,
  };

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, baseOptions).then((mongooseInstance) => {
      console.log("✅ MongoDB Connected Successfully");
      return mongooseInstance.connection;
    }).catch(async (err) => {
      cached.promise = null; // Reset on failure
      const message = err?.message || String(err);
      const shouldFallback =
        /^mongodb\+srv:\/\//.test(uri) &&
        /querySrv|ESERVFAIL|ENOTFOUND|EAI_AGAIN|ETIMEOUT|MongooseServerSelectionError|ECONNREFUSED|ECONNABORTED|ECONNTIMEOUT/i.test(message);

      if (shouldFallback) {
        const fallbackUri = (process.env.MONGODB_URI_FALLBACK || FALLBACK_STANDARD_URI).trim();
        console.warn("⚠️  MongoDB SRV lookup failed; retrying with standard connection...");
        try {
          if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
          }
          const fallbackConn = await mongoose.connect(fallbackUri, baseOptions);
          console.log("✅ Connected using standard MongoDB connection string.");
          return fallbackConn.connection;
        } catch (fallbackErr) {
          console.error("❌ Fallback MongoDB connection failed.");
          explainConnectionError(fallbackErr, fallbackUri);
          throw fallbackErr;
        }
      }

      explainConnectionError(err, uri);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  cached.conn = null;
  cached.promise = null;
}

export default connectDB;