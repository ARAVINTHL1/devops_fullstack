import mongoose from "mongoose";
import { config } from "./config.js";
import { User } from "./models/User.js";
import { hashPassword } from "./utils/auth.js";

export const connectDatabase = async () => {
  await mongoose.connect(config.mongoUri);
};

export const ensureDefaultAdmin = async () => {
  const existingAdmin = await User.findOne({ role: "admin" }).lean();
  if (existingAdmin) return;

  const passwordHash = await hashPassword(config.adminPassword);
  await User.create({
    name: config.adminName,
    email: config.adminEmail,
    passwordHash,
    role: "admin",
    status: "active",
  });
};
