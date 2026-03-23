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
