import express from "express";
import { markAttendance, getStudentActivities } from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/mark", markAttendance);
router.get("/:studentId", getStudentActivities);

export default router;
