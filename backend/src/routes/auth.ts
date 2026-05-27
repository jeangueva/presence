import { Router } from "express";
import * as c from "../controllers/authController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  loginLimiter,
  passwordResetLimiter,
  registerLimiter,
} from "../middleware/rateLimiters.js";

const router = Router();

router.post("/register", registerLimiter, asyncHandler(c.register));
router.post("/login", loginLimiter, asyncHandler(c.login));
router.post("/refresh", asyncHandler(c.refresh));
router.post("/2fa/login", loginLimiter, asyncHandler(c.twoFaLogin));
router.get("/me", requireAuth, asyncHandler(c.me));
router.post(
  "/password-reset/request",
  passwordResetLimiter,
  asyncHandler(c.requestReset)
);
router.post("/password-reset/confirm", asyncHandler(c.confirmReset));
router.post("/verify-email", asyncHandler(c.verifyEmail));
router.post(
  "/resend-verification",
  passwordResetLimiter,
  requireAuth,
  asyncHandler(c.resendVerification)
);

export default router;
