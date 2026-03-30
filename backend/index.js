<<<<<<< HEAD
import 'dotenv/config'; // Load env variables immediately (important for ES Modules)
import cors from "cors";
import express from "express";

// Import route handlers
import driverRoutes    from "./Routes/driverRoutes.js";
import parentRoutes    from "./Routes/parentRoutes.js";
import attendantRoutes from "./Routes/attendantRoutes.js";
import locationRoutes  from "./Routes/locationRoutes.js";
import systemRoutes    from "./Routes/systemRoutes.js";
import studentRoutes   from "./Routes/studentRoutes.js";
import notificationRoutes from "./Routes/notificationRoutes.js";

// Initialize Express app

const app = express();

// Middleware
app.use(express.json()); // Parse incoming JSON bodies
app.use(cors());         // Allow all cross-origin requests (mobile app needs this)

// Health check — visit http://localhost:5000/api/health in browser to confirm it's running
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Backend is running ✅" });
});


// API Routes

app.use("/api/driver",    driverRoutes);
app.use("/api/parent",    parentRoutes);
app.use("/api/attendant", attendantRoutes);
app.use("/api/location",  locationRoutes);
app.use("/api/system",    systemRoutes);
app.use("/api/students",  studentRoutes);
app.use("/api/notifications", notificationRoutes);


const PREFERRED_PORT = parseInt(process.env.PORT || "5000", 10);

function startServer(port) {
  const server = app.listen(port, () => {
    console.log("─────────────────────────────────────");
    console.log(`✅  Server is running on port ${port}`);
    console.log(`🔗  Health: http://localhost:${port}/api/health`);
    console.log("─────────────────────────────────────");
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      // Port is taken — try the next one automatically
      console.warn(`⚠️  Port ${port} is already in use. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      // Unknown error — log and exit
      console.error("❌  Failed to start server:", err.message);
      process.exit(1);
    }
  });
}

startServer(PREFERRED_PORT);
=======
import dotenv from "dotenv"; // Important: Loads configuration from .env file immediately
// MongoDB database connection temporarily removed as requested
import cors from "cors"; // CORS allows our frontend to communicate with this backend
import express from "express"; // Express is the web framework for Node.js

// 1. Configure DOTENV so logic below can read process.env.PORT
dotenv.config();

// Import our custom route handlers
import driverRoutes from "./routes/driverRoutes.js";
import parentRoutes from "./routes/parentRoutes.js";
import attendantRoutes from "./routes/attendantRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";

// Initialize up the Express application
const app = express();

// Middlewares setup
app.use(express.json()); // Allows the application to understand and process JSON data from requests
app.use(cors()); // Enables Cross-Origin Resource Sharing (allows frontend to fetch data)

// Define API routes
// Any request starting with /api/driver goes to driverRoutes
app.use("/api/driver", driverRoutes); 
app.use("/api/parent", parentRoutes);
app.use("/api/attendant", attendantRoutes);
// Any request starting with /api/location goes to locationRoutes
app.use("/api/location", locationRoutes);

// Start the server pulling exactly from .env if present
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running natively on port ${PORT}`);
});
>>>>>>> IT24103379
