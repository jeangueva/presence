import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  dispatchForUser,
  isAdminToken,
} from "../services/posthumousDispatchService.js";
import { runSweep } from "../services/deadmanService.js";

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

// Break-glass only. Normal delivery runs through the dead-man's switch: the
// user stops checking in and their own trusted contacts confirm. This endpoint
// exists for the case where that flow is stuck and a human must intervene —
// it is irreversible, so it stays behind the admin token and nothing else.
router.post(
  "/posthumous/dispatch",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { user_id } = dispatchSchema.parse(req.body);
    const result = await dispatchForUser(user_id);
    res.json(result);
  })
);

// Advances every dead-man's switch past its deadline. Meant to be hit once a
// day by a scheduler (Render cron job) with the X-Admin-Token header — it is
// idempotent, so a double-fire on the same day is harmless.
router.post(
  "/deadman/sweep",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    res.json(await runSweep());
  })
);

export default router;
