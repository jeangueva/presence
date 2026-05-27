import { Router } from "express";
import * as c from "../controllers/billingController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// MercadoPago sends JSON-formatted webhooks; we can rely on the global
// express.json() parser (no raw body needed since signature is computed over
// headers + data.id, not over the raw bytes).
router.post("/webhook", asyncHandler(c.webhook));

router.get("/me", requireAuth, asyncHandler(c.me));
router.post("/checkout", requireAuth, asyncHandler(c.checkout));
router.post("/cancel", requireAuth, asyncHandler(c.cancel));

export default router;
