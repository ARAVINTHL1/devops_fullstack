import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { User } from "../models/User.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing authentication token." });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.sub).lean();

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.authUser = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.authUser || !roles.includes(req.authUser.role)) {
    return res.status(403).json({ message: "Insufficient permissions." });
  }

  return next();
};
