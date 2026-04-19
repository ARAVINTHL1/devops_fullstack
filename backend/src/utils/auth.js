import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export const hashPassword = async (password) => bcrypt.hash(password, 10);

export const comparePassword = async (password, passwordHash) => bcrypt.compare(password, passwordHash);

export const createToken = (user) => {
  return jwt.sign({ sub: user._id.toString(), role: user.role, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};
   

