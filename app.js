import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.route.js";
import taskRoutes from "./routes/task.route.js";
import errorHandler from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

/* ══════════════════════════════════════════════════════
   SECURITY MIDDLEWARE
   ══════════════════════════════════════════════════════ */

// Set secure HTTP headers
app.use(helmet());

// CORS — allow only your frontend origin
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Global rate limiter — 100 req / 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// Tighter limiter for auth endpoints — 10 req / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many auth attempts, please try again later." },
});
app.use("/api/v1/auth", authLimiter);

// Body parsers — limit payload size
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Sanitize against NoSQL injection (strips $ and . from req.body/query/params)
app.use(mongoSanitize());

// Sanitize against XSS attacks
app.use(xss());

// Gzip compression
app.use(compression());

// HTTP request logger (only in dev)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* ══════════════════════════════════════════════════════
   API ROUTES  —  versioned under /api/v1
   ══════════════════════════════════════════════════════ */
app.use("/api/v1/auth",  authRoutes);
app.use("/api/v1/tasks", taskRoutes);

// Health check
app.get("/api/v1/health", (_req, res) => {
  res.json({ success: true, status: "ok", env: process.env.NODE_ENV });
});

// 404 handler — must be AFTER all routes
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

/* ══════════════════════════════════════════════════════
   GLOBAL ERROR HANDLER  — must be last
   ══════════════════════════════════════════════════════ */
app.use(errorHandler);

export default app;