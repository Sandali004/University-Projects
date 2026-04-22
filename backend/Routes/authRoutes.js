import express from "express";
import { loginUser } from "../controllers/authController.js";

const router = express.Router();

// Define a unified login route
router.post("/login", loginUser);

export default router;
