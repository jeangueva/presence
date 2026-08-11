import { Router } from "express";
import multer from "multer";
import * as c from "../controllers/memorialController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(c.list));
router.post("/", asyncHandler(c.create));
router.get("/:id", asyncHandler(c.detail));
router.put("/:id", asyncHandler(c.update));
router.delete("/:id", asyncHandler(c.remove));
router.post("/:id/public", asyncHandler(c.toggle));

router.get("/:id/photos", asyncHandler(c.photos));
router.post("/:id/photos", upload.single("photo"), asyncHandler(c.uploadPhoto));
router.delete("/:id/photos/:photoId", asyncHandler(c.removePhoto));

router.get("/:id/guestbook", asyncHandler(c.guestbookForOwner));
router.patch("/:id/guestbook/:entryId/approve", asyncHandler(c.approveGuestbook));
router.delete("/:id/guestbook/:entryId", asyncHandler(c.removeGuestbook));

router.post(
  "/:id/profile-photo",
  upload.single("photo"),
  asyncHandler(c.uploadProfilePhoto)
);


export default router;
