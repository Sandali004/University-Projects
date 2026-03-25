import express from "express";
import { 
  createSystem, 
  getSystem, 
  joinSystem, 
  getSystemParents, 
  removeParent,
  getRoutes,
  getParentSystem,
  updateSystemRoute,
  startTrackingNotify,
  stopTrackingNotify
} from "../controllers/systemController.js";

const router = express.Router();

// General routes
router.get("/routes", getRoutes);

// Driver routes
router.post("/create", createSystem);
router.get("/driver/:driverId", getSystem);
router.put("/:systemId/route", updateSystemRoute);
router.get("/:systemId/parents", getSystemParents);
router.delete("/:systemId/parents/:parentId", removeParent);
router.post("/:systemId/tracking/start", startTrackingNotify);
router.post("/:systemId/tracking/stop", stopTrackingNotify);

// Parent routes
router.post("/join", joinSystem);
router.get("/parent/:parentId", getParentSystem);

export default router;
