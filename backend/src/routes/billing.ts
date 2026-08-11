import { Router } from "express";
import * as c from "../controllers/billingController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// MercadoPago sends JSON-formatted webhooks; we can rely on the global
// express.json() parser (no raw body needed since signature is computed over
// headers + data.id, not over the raw bytes).
router.post("/webhook", asyncHandler(c.webhook));

// Public: the pricing page renders before anyone signs in, and it must show
// the amount that will actually be charged.
router.get("/pricing", asyncHandler(c.pricing));

router.get("/me", requireAuth, asyncHandler(c.me));
router.post("/checkout", requireAuth, asyncHandler(c.checkout));
// Checkout Bricks: the card was tokenized in the browser, this charges it.
router.post("/process-payment", requireAuth, asyncHandler(c.processPayment));
router.post("/cancel", requireAuth, asyncHandler(c.cancel));

export default router;
