import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import redis from "../config/redis.js";

/* ── Helper: sign JWT ───────────────────────────────── */
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });

/* ── Helper: send token response ───────────────────── */
const sendToken = (res, statusCode, user, token) => {
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

/* ══════════════════════════════════════════════════════
   POST /api/v1/auth/register
   ══════════════════════════════════════════════════════ */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    /* Manual validation (supplement to mongoose schema) */
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required." });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    /* Password hashing handled by pre-save hook in model */
    const user = await User.create({ name: name.trim(), email, password });

    const token = signToken({ id: user._id, role: user.role });

    /* Cache the user profile in Redis for 1 h */
    await redis.set(
      `user:${user._id}`,
      JSON.stringify({ id: user._id, name: user.name, email: user.email, role: user.role }),
      { EX: 3600 }
    );

    return sendToken(res, 201, user, token);
  } catch (error) {
    /* Mongoose duplicate key */
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   POST /api/v1/auth/login
   ══════════════════════════════════════════════════════ */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    /* Must explicitly select password since it's select:false in schema */
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const token = signToken({ id: user._id, role: user.role });

    /* Refresh Redis cache on login */
    await redis.set(
      `user:${user._id}`,
      JSON.stringify({ id: user._id, name: user.name, email: user.email, role: user.role }),
      { EX: 3600 }
    );

    return sendToken(res, 200, user, token);
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   POST /api/v1/auth/logout
   Blacklists the token in Redis for its remaining TTL
   ══════════════════════════════════════════════════════ */
export const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ success: false, message: "No token provided." });
    }

    const token = authHeader.split(" ")[1];

    /* Decode without verify to get exp (already verified by middleware) */
    const decoded = jwt.decode(token);
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);

    if (ttl > 0) {
      /* Store token in blacklist until it naturally expires */
      await redis.set(`blacklist:${token}`, "1", { EX: ttl });
    }

    /* Invalidate user cache */
    await redis.del(`user:${req.user.id}`);

    return res.json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   GET /api/v1/auth/me
   Returns cached user profile
   ══════════════════════════════════════════════════════ */
export const getMe = async (req, res, next) => {
  try {
    /* Try Redis first */
    const cached = await redis.get(`user:${req.user.id}`);
    if (cached) {
      return res.json({ success: true, user: JSON.parse(cached) });
    }

    /* Fallback to DB */
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    await redis.set(
      `user:${user._id}`,
      JSON.stringify({ id: user._id, name: user.name, email: user.email, role: user.role }),
      { EX: 3600 }
    );

    return res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
};