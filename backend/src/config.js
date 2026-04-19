import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.API_PORT ?? 5000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/ms-garments-hub",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-env",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  adminName: process.env.ADMIN_NAME ?? "System Admin",
  adminEmail: (process.env.ADMIN_EMAIL ?? "admin@msgarments.com").toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD ?? "Admin@123",
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:8080",
};
