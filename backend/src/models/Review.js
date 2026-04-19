import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    buyer: { type: String, required: true, trim: true },
    product: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    helpful: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: ["approved", "pending"], default: "pending" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const Review = mongoose.model("Review", reviewSchema);
