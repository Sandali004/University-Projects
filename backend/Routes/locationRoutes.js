import express from "express";
import { updateDriverLocation } from "../controllers/locationController.js";

// Initialize a router specific to location endpoints natively attached to express
const router = express.Router();

// Define API Route: POST /api/location/update
router.post("/update", updateDriverLocation);

// Export the defined routers for insertion in index.js
export default router;
