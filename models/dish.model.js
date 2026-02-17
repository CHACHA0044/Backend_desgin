import mongoose from "mongoose";

/* ── Dish model — matches the frontend dish card shape ── */
const dishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Dish name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    emoji: {
      type: String,
      default: "🍽️",
      maxlength: [8, "Emoji field too long"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

/* Index for fast listing */
dishSchema.index({ createdAt: -1 });

export default mongoose.model("Dish", dishSchema);