import express from "express";
import { 
  createSystem, 
  getDriverSystems, 
  getSystemById,
  joinSystem, 
  getSystemParents, 
  removeParent,
  getRoutes,
  getParentSystems,
  updateSystemRoute,
  startTrackingNotify,
  stopTrackingNotify,
  joinSystemAttendant,
  getAttendantSystems,
  updateAttendantPresence,
  updateParentPickup,
  updateAttendantControl,
  updateAttendantActivityAccess,
  updateAttendantPaymentAccess,
  updateSystemRouteMap,
  deleteSystem
} from "../controllers/systemController.js";

const router = express.Router();

// General routes
router.get("/routes", getRoutes);

// Driver routes
router.post("/create", createSystem);
router.get("/driver/:driverId", getDriverSystems);
router.get("/:systemId", getSystemById);
router.put('/:systemId/route-map', updateSystemRouteMap);
router.put("/:systemId/route", updateSystemRoute);
router.get("/:systemId/parents", getSystemParents);
router.delete("/:systemId/parents/:parentId", removeParent);
router.post("/:systemId/tracking/start", startTrackingNotify);
router.post("/:systemId/tracking/stop", stopTrackingNotify);
router.delete("/:systemId", deleteSystem);

// Parent routes
router.post("/join", joinSystem);
router.get("/parent/:parentId", getParentSystems);
router.put("/:systemId/parent/:parentId/pickup", updateParentPickup);

// Attendant routes
router.post("/join-attendant", joinSystemAttendant);
router.get("/attendant/:attendantId", getAttendantSystems);
router.put("/attendant/:attendantId/presence", updateAttendantPresence);
router.put("/attendant/:attendantId/control", updateAttendantControl);
router.put("/attendant/:attendantId/activities-access", updateAttendantActivityAccess);
router.put("/attendant/:attendantId/payment-access", updateAttendantPaymentAccess);

export default router;
