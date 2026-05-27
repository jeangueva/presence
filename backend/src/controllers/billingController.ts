import type { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { PLANS, type PlanId } from "../config/plans.js";
import {
  cancelSubscription,
  createCheckoutSession,
  isBillingEnabled,
  processWebhook,
} from "../services/billingService.js";
import { getUsageSnapshot } from "../services/entitlementsService.js";
import { unauthorized } from "../utils/errors.js";

const getUser = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user;
};

const checkoutSchema = z.object({
  plan: z.enum(["personal", "family"]),
});

export const me = async (req: Request, res: Response) => {
  const user = getUser(req);
  const snapshot = await getUsageSnapshot(user.id);
  res.json({
    ...snapshot,
    plan_meta: PLANS[snapshot.plan as PlanId],
    billing_enabled: isBillingEnabled(),
  });
};

export const checkout = async (req: Request, res: Response) => {
  const user = getUser(req);
  const { plan } = checkoutSchema.parse(req.body);
  const origin = env.FRONTEND_URL.replace(/\/$/, "");
  const session = await createCheckoutSession({
    userId: user.id,
    userEmail: user.email,
    planId: plan,
    successUrl: `${origin}/app/settings?upgrade=success`,
  });
  res.json(session);
};

export const cancel = async (req: Request, res: Response) => {
  const user = getUser(req);
  const result = await cancelSubscription(user.id);
  res.json(result);
};

export const webhook = async (req: Request, res: Response) => {
  try {
    const result = await processWebhook(req.body ?? {}, {
      signature: typeof req.headers["x-signature"] === "string"
        ? (req.headers["x-signature"] as string)
        : undefined,
      requestId: typeof req.headers["x-request-id"] === "string"
        ? (req.headers["x-request-id"] as string)
        : undefined,
      eventId: typeof req.headers["x-idempotency-key"] === "string"
        ? (req.headers["x-idempotency-key"] as string)
        : undefined,
    });
    res.json(result);
  } catch (err) {
    console.error("[billing:webhook] error:", err);
    res.status(400).json({ error: (err as Error).message });
  }
};
