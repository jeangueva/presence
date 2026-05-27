import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  dispatchForUser,
  isAdminToken,
} from "../services/posthumousDispatchService.js";

const router = Router();

const requireAdmin = (
  req: { headers: Record<string, string | string[] | undefined> },
  res: { status: (n: number) => { json: (o: unknown) => void } },
  next: () => void
) => {
  const t = req.headers["x-admin-token"];
  const token = typeof t === "string" ? t : Array.isArray(t) ? t[0] : "";
  if (!isAdminToken(token)) {
    res.status(401).json({ error: "Invalid admin token" });
    return;
  }
  next();
};

const dispatchSchema = z.object({ user_id: z.string().uuid() });

router.post(
  "/posthumous/dispatch",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { user_id } = dispatchSchema.parse(req.body);
    const result = await dispatchForUser(user_id);
    res.json(result);
  })
);

export default router;
