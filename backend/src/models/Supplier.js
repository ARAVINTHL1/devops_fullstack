import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    defectRate: { type: Number, min: 0, default: 0 },
    totalOrders: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

export const Supplier = mongoose.model("Supplier", supplierSchema);
