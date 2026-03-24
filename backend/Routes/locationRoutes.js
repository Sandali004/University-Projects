import express from "express";
import { updateLocation } from "../controllers/locationController.js";

const router = express.Router();

router.post("/update", updateLocation);

export default router;
