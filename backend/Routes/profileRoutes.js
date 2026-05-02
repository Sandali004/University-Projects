import express from "express";
import { getProfile, updateProfile, deleteAccount } from "../controllers/profileController.js";

const router = express.Router();

// Fetch current user details
router.get("/get", getProfile);

// Update user details
router.put("/update", updateProfile);

// Delete account permanently
router.delete("/delete/:userId", deleteAccount);

export default router;
