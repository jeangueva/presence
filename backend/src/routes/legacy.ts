import { Router } from "express";
import * as c from "../controllers/legacyController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { requirePlanner } from "../middleware/requirePlanner.js";

const router = Router();
router.use(requireAuth);
// Reading is free — someone on the Memorial tier should be able to open the
// planner and see what they would be buying. Writing is what costs.
router.use(requirePlanner);

// Final wishes
router.get("/final-wishes", asyncHandler(c.finalWishesGet));
router.put("/final-wishes", asyncHandler(c.finalWishesSave));

// Estate
router.get("/estate", asyncHandler(c.estateGet));
router.put("/estate", asyncHandler(c.estateSave));
router.get("/estate/heirs", asyncHandler(c.heirsList));
router.post("/estate/heirs", asyncHandler(c.heirsCreate));
router.delete("/estate/heirs/:id", asyncHandler(c.heirsDelete));
router.get("/estate/assets", asyncHandler(c.assetsList));
router.post("/estate/assets", asyncHandler(c.assetsCreate));
router.delete("/estate/assets/:id", asyncHandler(c.assetsDelete));

// Digital will (capstone document + integrity seal)
router.get("/will", asyncHandler(c.willGet));
router.put("/will", asyncHandler(c.willSave));
router.get("/will/document", asyncHandler(c.willDocument));
router.post("/will/seal", asyncHandler(c.willSeal));

// Posthumous messages
router.get("/posthumous-messages", asyncHandler(c.posthumousList));
router.post("/posthumous-messages", asyncHandler(c.posthumousCreate));
router.delete("/posthumous-messages/:id", asyncHandler(c.posthumousDelete));

export default router;
