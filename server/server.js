import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase } from "./db.js";
import authRoutes from "./routes/auth.js";
import outpassRoutes from "./routes/outpasses.js";
import { authenticate } from "./middleware/auth.js";
dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "GateFlow API" }));
app.use("/api/auth", authRoutes);
app.use("/api/outpasses", outpassRoutes);
app.get("/api/profile", authenticate, (req, res) => res.json({ user: req.user }));
const port = process.env.PORT || 5000;
initializeDatabase().then(() => app.listen(port, () => console.log(`GateFlow API running on http://localhost:${port}`)))
  .catch(error => { console.error("Database initialization failed:", error); process.exit(1); });
