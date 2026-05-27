import { Router } from "express";
import multer from "multer";
import * as c from "../controllers/vaultController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { chatLimiter, uploadLimiter } from "../middleware/rateLimiters.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(c.list));
router.post("/", asyncHandler(c.create));
router.get("/:id", asyncHandler(c.detail));
router.put("/:id", asyncHandler(c.update));
router.delete("/:id", asyncHandler(c.remove));

router.get("/:id/files", asyncHandler(c.files));
router.post("/:id/files", uploadLimiter, upload.single("file"), asyncHandler(c.uploadFile));
router.delete("/:id/files/:fileId", asyncHandler(c.removeFile));

router.get("/:id/access", asyncHandler(c.accessList));
router.post("/:id/access", asyncHandler(c.grantAccess));
router.delete("/:id/access/:accessId", asyncHandler(c.revokeAccess));

router.post(
  "/:id/profile-photo",
  upload.single("photo"),
  asyncHandler(c.uploadProfilePhoto)
);

router.get("/:id/biography", asyncHandler(c.biographyGet));
router.post("/:id/biography/generate", asyncHandler(c.biographyGenerate));
router.patch("/:id/biography", asyncHandler(c.biographyUpdate));

router.get("/:id/activity", asyncHandler(c.activity));
router.get("/:id/search", asyncHandler(c.search));
router.get("/:id/export", asyncHandler(c.exportVault));

router.post("/:id/chat", chatLimiter, asyncHandler(c.chat));
router.get("/:id/conversations", asyncHandler(c.conversations));
router.get("/:id/conversations/:conversationId/messages", asyncHandler(c.conversationMessages));

export default router;
