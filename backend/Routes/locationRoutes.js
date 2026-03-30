import express from "express";
<<<<<<< HEAD
import { updateDriverLocation } from "../controllers/locationController.js";

// Initialize a router specific to location endpoints natively attached to express
const router = express.Router();

// Define API Route: POST /api/location/update
router.post("/update", updateDriverLocation);

// Export the defined routers for insertion in index.js
=======
import { updateLocation } from "../controllers/locationController.js";

const router = express.Router();

router.post("/update", updateLocation);

>>>>>>> IT24103379
export default router;
