import env from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";

async function start() {
  try {
    await connectDB(env.mongoUri);
    console.log("✅ MongoDB connected");

    const app = createApp();
    const server = app.listen(env.port, () => {
      console.log(`🚀 KaamSetu API listening on http://localhost:${env.port}`);
      console.log(`   Environment: ${env.nodeEnv}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received, shutting down...`);
      server.close(async () => {
        const { disconnectDB } = await import("./config/db.js");
        await disconnectDB();
        process.exit(0);
      });
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
