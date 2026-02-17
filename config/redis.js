import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

const redis = createClient({
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.error("❌ Redis: max reconnection attempts reached");
        return false;
      }
      return Math.min(retries * 200, 3000);
    },
    connectTimeout: 15000,
  },
});

redis.on("connect",      ()    => console.log("✅ Redis connected"));
redis.on("ready",        ()    => console.log("✅ Redis ready"));
redis.on("error",        (err) => console.error("❌ Redis error:", err.message));
redis.on("reconnecting", ()    => console.log("🔄 Redis reconnecting…"));

redis.connect().catch((err) => {
  console.error("❌ Redis initial connection failed:", err.message);
});

export default redis;