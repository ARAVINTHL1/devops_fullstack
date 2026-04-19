import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { connectDatabase, ensureDefaultAdmin } from "./db.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import buyerRoutes from "./routes/buyer.js";
import notificationRoutes from "./routes/notifications.js";
import { authenticate } from "./middleware/auth.js";

const app = express();

const allowedOrigins = new Set(
  String(config.frontendOrigin)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed for this origin"));
    },
  }),
);

app.use(express.json({ limit: "10mb" }));

app.get("/", (_req, res) => {
  res.status(200).send("MS Garments Hub API is running. Open frontend at http://localhost:8080");
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", authenticate, adminRoutes);
app.use("/api/buyer", authenticate, buyerRoutes);
app.use("/api/notifications", authenticate, notificationRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

const isServerAlreadyRunning = async (port) => {
  try {
    const response = await fetch(`http://localhost:${port}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
};

const listen = (port) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`API listening on http://0.0.0.0:${port}`);
      resolve(server);
    });

    server.on("error", reject);
  });
};

const start = async () => {
  await connectDatabase();
  await ensureDefaultAdmin();

  try {
    await listen(config.port);
  } catch (error) {
    if (error?.code === "EADDRINUSE") {
      const alreadyRunning = await isServerAlreadyRunning(config.port);

      if (alreadyRunning) {
        console.log(`API already running on http://localhost:${config.port}`);
        return;
      }
    }

    throw error;
  }
};

start().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
