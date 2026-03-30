import express from "express";
import { getNotifications, deleteNotification } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/:userId", getNotifications);
router.delete("/:id", deleteNotification);

export default router;
