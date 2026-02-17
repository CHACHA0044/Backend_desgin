import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import redis from "./config/redis.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });

  /* ── Graceful shutdown ──────────────────────────────── */
  const shutdown = async (signal) => {
    console.log(`\n${signal} received — shutting down gracefully…`);
    server.close(async () => {
      try {
        if (redis.isReady) {
          await redis.quit();
          console.log("✅ Redis disconnected");
        }
      } catch (e) {
        // Redis was never connected — ignore
      }
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));

  /* ── Unhandled rejections ───────────────────────────── */
  process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Rejection:", err.message);
    server.close(() => process.exit(1));
  });
};

start();