import express from "express";
import { User } from "../models/User.js";
import { comparePassword, createToken, hashPassword } from "../utils/auth.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  department: user.department ?? "",
  phone: user.phone ?? "",
  lastLogin: user.lastLogin,
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  if (user.status === "inactive") {
    return res.status(403).json({ message: "This account is inactive. Contact admin." });
  }

  user.lastLogin = new Date();
  await user.save();

  const token = createToken(user);

  return res.json({ token, user: sanitizeUser(user) });
});

router.post("/signup", async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");
  const phone = String(req.body.phone ?? "").trim();

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: "Name, email, phone, and password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    return res.status(409).json({ message: "Email already registered." });
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    email,
    phone,
    passwordHash,
    role: "buyer",
    status: "active",
  });

  const token = createToken(user);
  return res.status(201).json({ token, user: sanitizeUser(user) });
});

router.get("/me", authenticate, async (req, res) => {
  const user = await User.findById(req.authUser._id).lean();

  if (!user) {
    return res.status(401).json({ message: "Session not found." });
  }

  return res.json({ user: sanitizeUser(user) });
});

export default router;
