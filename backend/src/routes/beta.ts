import { Router } from "express";
import * as c from "../controllers/betaController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { betaSignupLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/signup", betaSignupLimiter, asyncHandler(c.signup));

export default router;
