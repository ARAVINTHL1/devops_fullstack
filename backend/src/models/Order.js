import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, trim: true },
    buyerName: { type: String, required: true, trim: true },
    buyerEmail: { type: String, trim: true, lowercase: true },
    date: { type: Date, required: true, default: Date.now },
    items: [
      {
        product: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      }
    ],
    itemCount: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered"],
      default: "pending",
    },
    paymentMethod: { type: String, required: true, trim: true },
    paymentStatus: { 
      type: String, 
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const Order = mongoose.model("Order", orderSchema);
