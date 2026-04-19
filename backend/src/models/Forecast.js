import mongoose from "mongoose";

const forecastSchema = new mongoose.Schema(
  {
    day: { type: String, required: true, trim: true },
    actual: { type: Number, required: true, min: 0 },
    predicted: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export const Forecast = mongoose.model("Forecast", forecastSchema);
