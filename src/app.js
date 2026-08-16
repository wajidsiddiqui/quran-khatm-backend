import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import khatmRoutes from "./routes/khatmRoutes.js";
import inviteRoutes from "./routes/inviteRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim());
  app.use(cors({ origin: allowedOrigins }));

  app.use(express.json());
  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  app.get("/api/health", (req, res) => res.json({ success: true, message: "OK" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/khatms", khatmRoutes);
  app.use("/api/invite", inviteRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
