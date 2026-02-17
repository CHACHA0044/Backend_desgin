import express from "express";
import { register, login, logout, getMe } from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

/* Public routes */
router.post("/register", register);
router.post("/login",    login);

/* Protected routes */
router.post("/logout", authMiddleware, logout);
router.get("/me",      authMiddleware, getMe);

export default router;