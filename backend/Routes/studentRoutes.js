import express from "express";
import { 
  addStudent, 
  getStudentsByParent, 
  updateStudent, 
  deleteStudent,
  getStudentsBySystem,
  updatePaymentStatus,
  sendPaymentReminder
} from "../controllers/studentController.js";

const router = express.Router();

router.post("/", addStudent);
router.get("/parent/:parentId", getStudentsByParent);
router.get("/system/:systemId", getStudentsBySystem);
router.put("/:id", updateStudent);
router.put("/:id/payment", updatePaymentStatus);
router.post("/:id/reminder", sendPaymentReminder);
router.delete("/:id", deleteStudent);

export default router;
