// Import express router to define URLs
import express from "express";
// Import the controller functions that handle the logic
import { registerDriver, loginDriver, sendAlert } from "../controllers/driverController.js";

const router = express.Router();

// Define a POST route for driver registration
// When a client sends a POST request to /api/driver/register, call registerDriver function
router.post("/register", registerDriver);

// Define a POST route for driver login
router.post("/login", loginDriver);

// Define a POST route for sending system alerts (like delay or emergency)
router.post("/alert", sendAlert);

export default router;
