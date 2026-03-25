import { 
  createSystem, 
  getSystem, 
  joinSystem, 
  getSystemParents, 
  removeParent,
  getRoutes
} from "../controllers/systemController.js";

const router = express.Router();

// General routes
router.get("/routes", getRoutes);

// Driver routes
router.post("/create", createSystem);
router.get("/driver/:driverId", getSystem);
router.get("/:systemId/parents", getSystemParents);
router.delete("/:systemId/parents/:parentId", removeParent);

// Parent routes
router.post("/join", joinSystem);
router.get("/parent/:parentId", getParentSystem);

export default router;
