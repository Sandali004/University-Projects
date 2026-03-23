// Import required packages
import mongoose from "mongoose"; // Mongoose is used to interact with MongoDB
import cors from "cors"; // CORS allows our frontend to communicate with this backend
import express from "express"; // Express is the web framework for Node.js

// Import our custom route handlers
import driverRoutes from "./routes/driverRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";

// Initialize the Express application
const app = express();

// Connect to MongoDB database
mongoose
  .connect("mongodb://localhost:27017/mydatabase", {
    useNewUrlParser: true, // Uses the new connection string parser for MongoDB
    useUnifiedTopology: true, // Uses the new server discovery and monitoring engine
  })
  .then(() => {
    console.log("Connected to MongoDB"); // Runs if connection is successful
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error); // Runs if connection fails
  });

// Middlewares setup
app.use(express.json()); // Allows the application to understand and process JSON data from requests
app.use(cors()); // Enables Cross-Origin Resource Sharing (allows frontend to fetch data)

// Define API routes
// Any request starting with /api/driver goes to driverRoutes
app.use("/api/driver", driverRoutes); 
// Any request starting with /api/location goes to locationRoutes
app.use("/api/location", locationRoutes);

// Start the server on port 5000
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
