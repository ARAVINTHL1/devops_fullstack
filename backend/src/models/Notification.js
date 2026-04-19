import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    type: { 
      type: String, 
      enum: ["new_order", "order_confirmed", "order_status_changed", "low_stock_alert"],
      required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    orderId: { type: String },
    orderNumber: { type: String },
    productId: { type: String },
    productName: { type: String },
    currentStock: { type: Number },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
