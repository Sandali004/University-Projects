import express from "express";
import { createVehicle, getDriverVehicles, deleteVehicle } from "../controllers/vehicleController.js";

const router = express.Router();

// Add a new vehicle
router.post("/create", createVehicle);

// Fetch all vehicles for a driver
router.get("/driver/:driverId", getDriverVehicles);

// Delete a vehicle
router.delete("/:vehicleId", deleteVehicle);

export default router;
