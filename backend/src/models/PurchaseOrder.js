import mongoose from "mongoose";

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true, trim: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    supplierName: { type: String, required: true, trim: true },
    itemName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    expectedDelivery: { type: Date, required: true },
    notes: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["placed", "received", "cancelled"],
      default: "placed",
    },
  },
  { timestamps: true },
);

export const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
