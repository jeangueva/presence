import { Router } from "express";
import * as c from "../controllers/legacyController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Dependents
router.get("/dependents", asyncHandler(c.dependentsList));
router.post("/dependents", asyncHandler(c.dependentsCreate));
router.delete("/dependents/:id", asyncHandler(c.dependentsDelete));

// Pets
router.get("/pets", asyncHandler(c.petsList));
router.post("/pets", asyncHandler(c.petsCreate));
router.delete("/pets/:id", asyncHandler(c.petsDelete));

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
