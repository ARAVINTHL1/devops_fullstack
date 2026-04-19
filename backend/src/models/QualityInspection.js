import mongoose from "mongoose";

const qualityInspectionSchema = new mongoose.Schema(
  {
    inspectionId: { type: String, required: true, unique: true, trim: true },
    batch: { type: String, required: true, trim: true },
    product: { type: String, required: true, trim: true },
    defects: { type: Number, min: 0, default: 0 },
    score: { type: Number, min: 0, max: 100, required: true },
    status: { type: String, enum: ["passed", "warning", "flagged"], required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const QualityInspection = mongoose.model("QualityInspection", qualityInspectionSchema);
