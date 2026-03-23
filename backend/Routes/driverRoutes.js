import express from "express";
import { registerDriver, loginDriver, sendAlert } from "../controllers/driverController.js";

const router = express.Router();

router.post("/register", registerDriver);
router.post("/login", loginDriver);
router.post("/alert", sendAlert);

export default router;
