import { Router } from "express";
import * as c from "../controllers/publicMemorialController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { guestbookLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.get("/:slug", asyncHandler(c.getMemorial));
router.get("/:slug/photos", asyncHandler(c.getPhotos));
router.get("/:slug/guestbook", asyncHandler(c.getGuestbook));
router.post("/:slug/guestbook", guestbookLimiter, asyncHandler(c.submitGuestbook));

export default router;
