import type { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { PLANS, type PlanId } from "../config/plans.js";
import {
  cancelSubscription,
  createCheckoutSession,
  getPublicPricing,
  isBillingEnabled,
  processBrickPayment,
  processWebhook,
} from "../services/billingService.js";
import { getUsageSnapshot } from "../services/entitlementsService.js";
import { unauthorized } from "../utils/errors.js";

const getUser = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user;
};

const checkoutSchema = z.object({
  plan: z.enum(["legado", "vault"]),
});

export const pricing = async (_req: Request, res: Response) => {
  res.json(getPublicPricing());
};

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

const brickSchema = z.object({
  plan: z.enum(["legado"]),
  // Shape produced by the Payment Brick's onSubmit. The amount is intentionally
  // absent — the server reads it from plan config, never from the client.
  formData: z.object({
    token: z.string().optional(),
    payment_method_id: z.string().optional(),
    issuer_id: z.string().optional(),
    installments: z.number().int().min(1).max(48).optional(),
    payer: z
      .object({
        email: z.string().email().optional(),
        identification: z
          .object({ type: z.string().optional(), number: z.string().optional() })
          .optional(),
      })
      .optional(),
  }),
});

export const processPayment = async (req: Request, res: Response) => {
  const user = getUser(req);
  const { plan, formData } = brickSchema.parse(req.body);
  const result = await processBrickPayment({
    userId: user.id,
    userEmail: user.email,
    planId: plan,
    formData,
  });
  res.json(result);
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
