import dotenv from "dotenv";
import cors from "cors";
import express from "express";

// 1. Configure DOTENV so logic below can read environment variables
dotenv.config();

// Import our custom route handlers
import driverRoutes from "./routes/driverRoutes.js";
import parentRoutes from "./routes/parentRoutes.js";
import attendantRoutes from "./routes/attendantRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";

// Initialize the Express application
const app = express();

// Middlewares setup
app.use(express.json()); // Allows processing JSON data
app.use(cors()); // Enables Cross-Origin Resource Sharing

// Define API routes
app.use("/api/driver", driverRoutes); 
app.use("/api/parent", parentRoutes);
app.use("/api/attendant", attendantRoutes);
app.use("/api/location", locationRoutes);

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, (err) => {
  if (err) {
    console.error(`Failed to start server on port ${PORT}:`, err.message);
    process.exit(1);
  }
  console.log(`Server is running on port ${PORT}`);
});
