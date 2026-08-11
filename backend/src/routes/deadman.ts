import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { requirePlanner } from "../middleware/requirePlanner.js";
import type { Request, Response } from "express";
import {
  confirmCheckin,
  contactRespond,
  createContact,
  deleteContact,
  getStatus,
  touchCheckin,
  upsertConfig,
} from "../services/deadmanService.js";

const router = Router();

const getUser = (req: Request) => (req as Request & { user: { id: string } }).user;

// ---- Public: resolved from an emailed token, so no session exists ----
// These sit before requireAuth on purpose: the recipient of a check-in or
// confirmation email is not necessarily signed in, and the trusted contact
// may not have an account at all.

router.post(
  "/checkin/:token",
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await confirmCheckin(req.params.token));
  })
);

const respondSchema = z.object({ confirmed: z.boolean() });

router.post(
  "/confirm/:token",
  asyncHandler(async (req: Request, res: Response) => {
    const { confirmed } = respondSchema.parse(req.body);
    res.json(await contactRespond(req.params.token, confirmed));
  })
);

// ---- Authenticated ----
router.use(requireAuth);
router.use(requirePlanner);

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await getStatus(getUser(req).id));
  })
);

const configSchema = z.object({
  enabled: z.boolean().optional(),
  // Bounds keep the switch meaningful: a 7-day interval would nag, and a
  // 2-year one would let messages sit undelivered for most of a lifetime.
  interval_days: z.number().int().min(30).max(365).optional(),
  grace_days: z.number().int().min(7).max(180).optional(),
  required_confirmations: z.number().int().min(1).max(5).optional(),
});

router.put(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const body = configSchema.parse(req.body);
    res.json(await upsertConfig(getUser(req).id, body));
  })
);

router.post(
  "/checkin",
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await touchCheckin(getUser(req).id));
  })
);

const contactSchema = z.object({
  full_name: z.string().min(1).max(255),
  email: z.string().email(),
  relationship: z.string().max(100).optional(),
});

router.get(
  "/contacts",
  asyncHandler(async (req: Request, res: Response) => {
    const { contacts } = await getStatus(getUser(req).id);
    res.json({ entries: contacts });
  })
);

router.post(
  "/contacts",
  asyncHandler(async (req: Request, res: Response) => {
    const body = contactSchema.parse(req.body);
    res.json(await createContact(getUser(req).id, body));
  })
);

router.delete(
  "/contacts/:id",
  asyncHandler(async (req: Request, res: Response) => {
    await deleteContact(getUser(req).id, req.params.id);
    res.status(204).end();
  })
);

export default router;
