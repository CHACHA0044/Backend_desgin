import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";
import {
  getDishes,
  getDishById,
  createDish,
  updateDish,
  patchDish,
  deleteDish,
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/task.controller.js";

const router = express.Router();

/* All task routes require authentication */
router.use(authMiddleware);

/* ── Dish routes ──────────────────────────────────────
   GET    /api/v1/tasks/dishes        — any logged-in user
   GET    /api/v1/tasks/dishes/:id    — any logged-in user
   POST   /api/v1/tasks/dishes        — admin only
   PUT    /api/v1/tasks/dishes/:id    — admin only
   PATCH  /api/v1/tasks/dishes/:id    — admin only
   DELETE /api/v1/tasks/dishes/:id    — admin only
   ─────────────────────────────────────────────────── */
router.get("/dishes",             getDishes);
router.get("/dishes/:id",         getDishById);
router.post("/dishes",            adminMiddleware, createDish);
router.put("/dishes/:id",         adminMiddleware, updateDish);
router.patch("/dishes/:id",       adminMiddleware, patchDish);
router.delete("/dishes/:id",      adminMiddleware, deleteDish);

/* ── Order routes ─────────────────────────────────────
   POST   /api/v1/tasks/orders             — user places order
   GET    /api/v1/tasks/orders/me          — user sees own orders
   GET    /api/v1/tasks/orders             — admin sees all orders
   PATCH  /api/v1/tasks/orders/:id/status  — admin updates status
   DELETE /api/v1/tasks/orders/:id         — user/admin deletes
   ─────────────────────────────────────────────────── */
router.post("/orders",                  createOrder);
router.get("/orders/me",                getMyOrders);
router.get("/orders",                   adminMiddleware, getAllOrders);
router.patch("/orders/:id/status",      adminMiddleware, updateOrderStatus);
router.delete("/orders/:id",            deleteOrder);

export default router;