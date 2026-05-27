import crypto from "node:crypto";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";
import { PLANS, type PlanId } from "../config/plans.js";
import { badRequest, notFound } from "../utils/errors.js";

// MP SDK is instantiated lazily — if no token, we still expose `isBillingEnabled`
// so endpoints can return a clean 400 instead of crashing at boot.
const mp = env.MERCADOPAGO_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN })
  : null;
const preapproval = mp ? new PreApproval(mp) : null;

export const isBillingEnabled = () => preapproval !== null;

const ensurePreapproval = (): PreApproval => {
  if (!preapproval) throw badRequest("Billing no está configurado en este servidor");
  return preapproval;
};

const amountForPlan = (planId: PlanId): number | null => {
  if (planId === "personal") return env.MERCADOPAGO_PRICE_PERSONAL;
  if (planId === "family") return env.MERCADOPAGO_PRICE_FAMILY;
  return null;
};

const planFromReference = (ref?: string | null): PlanId | null => {
  if (!ref) return null;
  const [, planRaw] = ref.split(":plan:");
  if (planRaw && PLANS[planRaw as PlanId]) return planRaw as PlanId;
  return null;
};

const userIdFromReference = (ref?: string | null): string | null => {
  if (!ref) return null;
  const m = /^user:([0-9a-fA-F-]+):plan:/.exec(ref);
  return m ? m[1] : null;
};

const webhookUrl = (): string => {
  if (!env.BACKEND_PUBLIC_URL) {
    throw badRequest(
      "Falta BACKEND_PUBLIC_URL — MercadoPago necesita una URL pública para enviar webhooks."
    );
  }
  return `${env.BACKEND_PUBLIC_URL.replace(/\/$/, "")}/billing/webhook`;
};

/**
 * Create a preapproval (subscription) and return the init_point URL where the
 * user must complete checkout.
 */
export const createCheckoutSession = async (params: {
  userId: string;
  userEmail: string;
  planId: PlanId;
  successUrl: string;
}) => {
  const pa = ensurePreapproval();
  if (params.planId === "free") throw badRequest("No se puede pagar el plan Free");

  const amount = amountForPlan(params.planId);
  if (amount == null || amount <= 0) {
    throw badRequest(`No hay precio configurado para el plan ${params.planId}`);
  }
  const plan = PLANS[params.planId];

  // If the user already has an active/pending subscription, cancel it first so
  // we don't double-charge when they switch plans. Errors here are non-fatal.
  const { data: existing } = await supabase
    .from("users")
    .select("external_subscription_id, subscription_status")
    .eq("id", params.userId)
    .maybeSingle();
  if (
    existing?.external_subscription_id &&
    existing.subscription_status &&
    ["authorized", "pending"].includes(existing.subscription_status)
  ) {
    try {
      await pa.update({
        id: existing.external_subscription_id,
        body: { status: "cancelled" },
      });
    } catch (err) {
      console.warn("[billing] auto-cancel previous preapproval failed:", err);
    }
  }

  // MP SDK types lag the REST API a bit; notification_url IS a valid field.
  const response = (await pa.create({
    body: {
      reason: `Presence ${plan.name}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: env.MERCADOPAGO_CURRENCY,
      },
      back_url: params.successUrl,
      payer_email: params.userEmail,
      external_reference: `user:${params.userId}:plan:${params.planId}`,
      status: "pending",
      notification_url: webhookUrl(),
    } as unknown as Parameters<typeof pa.create>[0]["body"],
  })) as { id?: string; init_point?: string; sandbox_init_point?: string };

  const url = response.init_point ?? response.sandbox_init_point;
  if (!url) throw new Error("MercadoPago no devolvió init_point");

  // Save the preapproval id immediately so we can look it up before the
  // webhook lands.
  if (response.id) {
    await supabase
      .from("users")
      .update({ external_subscription_id: response.id, external_customer_id: params.userEmail })
      .eq("id", params.userId);
  }

  return { url };
};

/**
 * Cancel the active subscription (MercadoPago has no "customer portal", so we
 * expose a single endpoint that flips the preapproval to "cancelled").
 */
export const cancelSubscription = async (userId: string) => {
  const pa = ensurePreapproval();
  const { data: user, error } = await supabase
    .from("users")
    .select("external_subscription_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!user?.external_subscription_id) {
    throw badRequest("No tienes una suscripción activa que cancelar.");
  }

  await pa.update({
    id: user.external_subscription_id,
    body: { status: "cancelled" },
  });

  // Optimistic local update; the webhook will reconfirm.
  await supabase
    .from("users")
    .update({ subscription_status: "cancelled" })
    .eq("id", userId);

  return { cancelled: true };
};

// ---------- Webhook handling ----------

type PreApprovalResource = {
  id?: string;
  status?: string;
  payer_email?: string;
  external_reference?: string;
  next_payment_date?: string;
  auto_recurring?: {
    transaction_amount?: number;
    currency_id?: string;
  };
};

const applyPreapprovalToUser = async (sub: PreApprovalResource) => {
  const ref = sub.external_reference ?? null;
  const userId = userIdFromReference(ref);
  const planId = planFromReference(ref);
  if (!userId || !planId) {
    console.warn("[billing:webhook] preapproval without external_reference", sub.id);
    return;
  }

  // Map MP statuses to our tier:
  // - authorized → active subscription on the requested plan
  // - paused / cancelled / pending → free
  const status = sub.status ?? "pending";
  const effectiveTier: PlanId = status === "authorized" ? planId : "free";

  const periodEnd = sub.next_payment_date
    ? new Date(sub.next_payment_date).toISOString()
    : null;

  await supabase
    .from("users")
    .update({
      subscription_tier: effectiveTier,
      subscription_status: status,
      subscription_period_end: periodEnd,
      external_subscription_id: sub.id ?? null,
      external_customer_id: sub.payer_email ?? null,
    })
    .eq("id", userId);
};

/**
 * Verify HMAC signature when MERCADOPAGO_WEBHOOK_SECRET is set.
 * MP signature header format: ts=...,v1=hmac_sha256(manifest)
 * manifest: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 */
const verifySignature = (
  body: { data?: { id?: string | number } },
  headers: { signature?: string; requestId?: string }
): boolean => {
  if (!env.MERCADOPAGO_WEBHOOK_SECRET) return true; // skip if not configured
  if (!headers.signature) return false;

  const parts = headers.signature.split(",").reduce<Record<string, string>>((acc, p) => {
    const [k, v] = p.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const dataId = String(body?.data?.id ?? "");
  const requestId = headers.requestId ?? "";
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", env.MERCADOPAGO_WEBHOOK_SECRET)
    .update(manifest)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
};

export const processWebhook = async (
  body: { type?: string; action?: string; data?: { id?: string | number } },
  headers: { signature?: string; requestId?: string; eventId?: string }
) => {
  const pa = ensurePreapproval();

  if (!verifySignature(body, headers)) {
    throw badRequest("Firma de webhook inválida");
  }

  const type = body.type ?? "";
  const dataId = body.data?.id ? String(body.data.id) : null;
  const eventId = headers.eventId ?? `${type}:${dataId}:${Date.now()}`;

  // Idempotency: skip if we've already recorded this event.
  if (headers.eventId) {
    const { data: existing } = await supabase
      .from("payments")
      .select("id")
      .eq("external_event_id", eventId)
      .maybeSingle();
    if (existing) return { received: true, idempotent: true };
  }

  if (type === "preapproval" && dataId) {
    const sub = (await pa.get({ id: dataId })) as PreApprovalResource;
    await applyPreapprovalToUser(sub);

    const userId = userIdFromReference(sub.external_reference);
    const planId = planFromReference(sub.external_reference);
    if (userId && sub.status === "authorized") {
      await supabase.from("payments").insert({
        user_id: userId,
        amount: (sub.auto_recurring?.transaction_amount ?? 0).toFixed(2),
        currency: sub.auto_recurring?.currency_id ?? env.MERCADOPAGO_CURRENCY,
        payment_type: "subscription",
        payment_method: "mercadopago",
        external_id: sub.id ?? null,
        external_event_id: eventId,
        plan: planId,
        status: "completed",
        completed_at: new Date().toISOString(),
        period_end: sub.next_payment_date ?? null,
      });
    }
  }

  return { received: true, type };
};

const notFoundIfMissing = <T>(v: T | null | undefined, msg: string): T => {
  if (!v) throw notFound(msg);
  return v;
};

// Helper exported for testing.
export const _internals = { applyPreapprovalToUser, userIdFromReference, planFromReference, notFoundIfMissing };
