import 'dotenv/config';

// Using `dotenv/config` ensures env variables are loaded as a side effect
// before any other app modules that rely on process.env are evaluated.

import cors from "cors";
import express from "express";

// Import route handlers
import driverRoutes    from "./Routes/driverRoutes.js";
import parentRoutes    from "./Routes/parentRoutes.js";
import attendantRoutes from "./Routes/attendantRoutes.js";
<<<<<<< HEAD
import locationRoutes  from "./Routes/locationRoutes.js";
import systemRoutes    from "./Routes/systemRoutes.js";
=======
import locationRoutes from "./Routes/locationRoutes.js";
import systemRoutes from "./Routes/systemRoutes.js";
import studentRoutes from "./Routes/studentRoutes.js";
>>>>>>> 295b1962e294da686b3ff2ba806effc725c81893

// ──────────────────────────────────────────────
// Initialize Express app
// ──────────────────────────────────────────────
const app = express();

// Middleware
app.use(express.json()); // Parse incoming JSON bodies
app.use(cors());         // Allow cross-origin requests (needed by the mobile app)

// Health check endpoint — open in browser to confirm server is running
// URL: http://localhost:5000/api/health
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Backend is running ✅" });
});

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────
app.use("/api/driver",    driverRoutes);
app.use("/api/parent",    parentRoutes);
app.use("/api/attendant", attendantRoutes);
<<<<<<< HEAD
app.use("/api/location",  locationRoutes);
app.use("/api/system",    systemRoutes);
=======
app.use("/api/location", locationRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/students", studentRoutes);
>>>>>>> 295b1962e294da686b3ff2ba806effc725c81893

// ──────────────────────────────────────────────
// Start server — FIXED to port 5000 only
// No auto-switching. If port is busy, it tells
// you exactly how to fix it and exits cleanly.
// ──────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "5000", 10);

const server = app.listen(PORT, () => {
  console.log("─────────────────────────────────────────");
  console.log(`✅  Server is running on port ${PORT}`);
  console.log(`🔗  Health: http://localhost:${PORT}/api/health`);
  console.log("─────────────────────────────────────────");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error("─────────────────────────────────────────");
    console.error(`❌  Port ${PORT} is already in use!`);
    console.error("");
    console.error("   To fix this, run ONE of these commands:");
    console.error(`   1. pkill -f "node index.js"`);
    console.error(`   2. lsof -i :${PORT}  →  then: kill -9 <PID>`);
    console.error("");
    console.error("   Then run:  npm start");
    console.error("─────────────────────────────────────────");
    process.exit(1); // Exit with error code — DO NOT switch ports
  } else {
    console.error("❌  Unexpected server error:", err.message);
    process.exit(1);
  }
});
