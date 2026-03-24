import express from "express";
import { registerAttendant, loginAttendant } from "../controllers/attendantController.js";

const router = express.Router();

router.post("/register", registerAttendant);
router.post("/login", loginAttendant);

export default router;
