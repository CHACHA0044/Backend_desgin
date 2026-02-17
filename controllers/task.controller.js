import Dish from "../models/dish.model.js";
import Order from "../models/order.model.js";
import redis from "../config/redis.js";

const DISHES_CACHE_KEY = "dishes:all";
const CACHE_TTL = 300; // 5 minutes

/* ── Cache helpers ──────────────────────────────────── */
const invalidateDishCache = async () => {
  await redis.del(DISHES_CACHE_KEY);
};

/* ════════════════════════════════════════════════════════
   DISH CRUD  (Admin: create / update / delete | All: read)
   ════════════════════════════════════════════════════════ */

/* GET /api/v1/tasks/dishes
   Public — any authenticated user can list dishes
   Redis cached for 5 minutes */
export const getDishes = async (req, res, next) => {
  try {
    /* Check Redis cache */
    const cached = await redis.get(DISHES_CACHE_KEY);
    if (cached) {
      return res.json({ success: true, source: "cache", dishes: JSON.parse(cached) });
    }

    const dishes = await Dish.find().sort({ createdAt: -1 }).populate("createdBy", "name email");

    /* Store in Redis */
    await redis.set(DISHES_CACHE_KEY, JSON.stringify(dishes), { EX: CACHE_TTL });

    return res.json({ success: true, source: "db", dishes });
  } catch (error) {
    next(error);
  }
};

/* GET /api/v1/tasks/dishes/:id */
export const getDishById = async (req, res, next) => {
  try {
    const cacheKey = `dish:${req.params.id}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json({ success: true, source: "cache", dish: JSON.parse(cached) });

    const dish = await Dish.findById(req.params.id).populate("createdBy", "name email");
    if (!dish) return res.status(404).json({ success: false, message: "Dish not found." });

    await redis.set(cacheKey, JSON.stringify(dish), { EX: CACHE_TTL });
    return res.json({ success: true, source: "db", dish });
  } catch (error) {
    next(error);
  }
};

/* POST /api/v1/tasks/dishes  — Admin only */
export const createDish = async (req, res, next) => {
  try {
    const { name, description, emoji } = req.body;

    if (!name || !description) {
      return res.status(400).json({ success: false, message: "Name and description are required." });
    }

    const dish = await Dish.create({
      name: name.trim(),
      description: description.trim(),
      emoji: emoji || "🍽️",
      createdBy: req.user.id,
    });

    await invalidateDishCache();

    return res.status(201).json({ success: true, dish });
  } catch (error) {
    next(error);
  }
};

/* PUT /api/v1/tasks/dishes/:id  — Admin only */
export const updateDish = async (req, res, next) => {
  try {
    const { name, description, emoji } = req.body;

    const dish = await Dish.findById(req.params.id);
    if (!dish) return res.status(404).json({ success: false, message: "Dish not found." });

    if (name) dish.name = name.trim();
    if (description) dish.description = description.trim();
    if (emoji) dish.emoji = emoji;

    await dish.save();

    /* Invalidate both list and individual caches */
    await Promise.all([
      invalidateDishCache(),
      redis.del(`dish:${dish._id}`),
    ]);

    return res.json({ success: true, dish });
  } catch (error) {
    next(error);
  }
};

/* PATCH /api/v1/tasks/dishes/:id  — alias for partial update (same handler) */
export const patchDish = updateDish;

/* DELETE /api/v1/tasks/dishes/:id  — Admin only */
export const deleteDish = async (req, res, next) => {
  try {
    const dish = await Dish.findByIdAndDelete(req.params.id);
    if (!dish) return res.status(404).json({ success: false, message: "Dish not found." });

    /* Also remove orders for this dish */
    await Order.deleteMany({ dish: req.params.id });

    await Promise.all([
      invalidateDishCache(),
      redis.del(`dish:${req.params.id}`),
    ]);

    return res.json({ success: true, message: "Dish deleted." });
  } catch (error) {
    next(error);
  }
};

/* ════════════════════════════════════════════════════════
   ORDER CRUD
   ════════════════════════════════════════════════════════ */

/* POST /api/v1/tasks/orders  — User places an order */
export const createOrder = async (req, res, next) => {
  try {
    const { dishId, qty = 1 } = req.body;

    if (!dishId) return res.status(400).json({ success: false, message: "dishId is required." });

    const dish = await Dish.findById(dishId);
    if (!dish) return res.status(404).json({ success: false, message: "Dish not found." });

    const order = await Order.create({ dish: dishId, user: req.user.id, qty });
    await order.populate("dish", "name emoji");

    /* Invalidate user order cache */
    await redis.del(`orders:user:${req.user.id}`);

    return res.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/* GET /api/v1/tasks/orders/me  — User's own order history, Redis cached */
export const getMyOrders = async (req, res, next) => {
  try {
    const cacheKey = `orders:user:${req.user.id}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json({ success: true, source: "cache", orders: JSON.parse(cached) });

    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("dish", "name emoji");

    await redis.set(cacheKey, JSON.stringify(orders), { EX: 120 }); // 2 min cache for orders
    return res.json({ success: true, source: "db", orders });
  } catch (error) {
    next(error);
  }
};

/* GET /api/v1/tasks/orders  — Admin sees ALL orders */
export const getAllOrders = async (req, res, next) => {
  try {
    const cacheKey = "orders:all";
    const cached = await redis.get(cacheKey);
    if (cached) return res.json({ success: true, source: "cache", orders: JSON.parse(cached) });

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("dish", "name emoji")
      .populate("user", "name email");

    await redis.set(cacheKey, JSON.stringify(orders), { EX: 60 }); // 1 min cache
    return res.json({ success: true, source: "db", orders });
  } catch (error) {
    next(error);
  }
};

/* PATCH /api/v1/tasks/orders/:id/status  — Admin updates order status */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "preparing", "delivered", "cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(", ")}` });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate("dish", "name emoji").populate("user", "name email");

    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    /* Invalidate both admin and user order caches */
    await Promise.all([
      redis.del("orders:all"),
      redis.del(`orders:user:${order.user._id}`),
    ]);

    return res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/v1/tasks/orders/:id  — User deletes own order | Admin can delete any */
export const deleteOrder = async (req, res, next) => {
  try {
    const query = req.user.role === "admin"
      ? { _id: req.params.id }
      : { _id: req.params.id, user: req.user.id };

    const order = await Order.findOneAndDelete(query);
    if (!order) return res.status(404).json({ success: false, message: "Order not found or not authorised." });

    await Promise.all([
      redis.del("orders:all"),
      redis.del(`orders:user:${req.user.id}`),
    ]);

    return res.json({ success: true, message: "Order deleted." });
  } catch (error) {
    next(error);
  }
};