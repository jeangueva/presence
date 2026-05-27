import { Router } from "express";
import * as c from "../controllers/accountController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/me", asyncHandler(c.me));
router.put("/profile", asyncHandler(c.profileUpdate));
router.put("/password", asyncHandler(c.passwordChange));
router.delete("/", asyncHandler(c.accountDelete));

router.post("/2fa/start", asyncHandler(c.twoFaStart));
router.post("/2fa/verify", asyncHandler(c.twoFaVerify));
router.post("/2fa/disable", asyncHandler(c.twoFaDisable));

export default router;
