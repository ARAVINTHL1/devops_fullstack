import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "employee", "buyer"], required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    department: { type: String, trim: true },
    phone: { type: String, trim: true },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
