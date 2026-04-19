import mongoose from "mongoose";

const mlModelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    accuracy: { type: Number, required: true, min: 0, max: 100 },
    status: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const pricingSuggestionSchema = new mongoose.Schema(
  {
    product: { type: String, required: true, trim: true },
    current: { type: Number, required: true, min: 0 },
    suggested: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const anomalySchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    severity: { type: String, enum: ["critical", "high", "medium"], required: true },
    timeLabel: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export const MLModel = mongoose.model("MLModel", mlModelSchema);
export const PricingSuggestion = mongoose.model("PricingSuggestion", pricingSuggestionSchema);
export const Anomaly = mongoose.model("Anomaly", anomalySchema);
