import express from "express";
import { 
  addStudent, 
  getStudentsByParent, 
  updateStudent, 
  deleteStudent 
} from "../controllers/studentController.js";

const router = express.Router();

router.post("/", addStudent);
router.get("/parent/:parentId", getStudentsByParent);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

export default router;
