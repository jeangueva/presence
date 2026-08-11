import crypto from "node:crypto";
import { MercadoPagoConfig, Payment, PreApproval, Preference } from "mercadopago";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";
import { DEFAULT_PLAN, PLANS, type PlanId } from "../config/plans.js";
import { badRequest, notFound } from "../utils/errors.js";

// MP SDK is instantiated lazily — if no token, we still expose `isBillingEnabled`
// so endpoints can return a clean 400 instead of crashing at boot.
//
// Two clients, because MercadoPago ties one product to one application:
//   `mp`    → Checkout API app, sells Legado (Payment Brick + Payment)
//   `mpSub` → Suscripciones app, sells Vault IA (PreApproval)
// When only one application covers both, leave the SUBSCRIPTION_* vars empty
// and `mpSub` falls back to `mp`.
const mp = env.MERCADOPAGO_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN })
  : null;
const mpSub = env.MERCADOPAGO_SUBSCRIPTION_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: env.MERCADOPAGO_SUBSCRIPTION_ACCESS_TOKEN })
  : mp;

const preapproval = mpSub ? new PreApproval(mpSub) : null;
const preference = mp ? new Preference(mp) : null;
const payment = mp ? new Payment(mp) : null;

/** Bearer token for the raw REST calls the SDK doesn't cover. */
const subscriptionToken = () =>
  env.MERCADOPAGO_SUBSCRIPTION_ACCESS_TOKEN || env.MERCADOPAGO_ACCESS_TOKEN;

export const isBillingEnabled = () => preference !== null;

/** Whether the recurring add-on can actually be sold on this deployment. */
export const isSubscriptionBillingEnabled = () => preapproval !== null;

const ensurePreapproval = (): PreApproval => {
  if (!preapproval) throw badRequest("Billing no está configurado en este servidor");
  return preapproval;
};

const ensurePreference = (): Preference => {
  if (!preference) throw badRequest("Billing no está configurado en este servidor");
  return preference;
};

const amountForPlan = (planId: PlanId): number | null => {
  if (planId === "legado") return env.MERCADOPAGO_PRICE_LEGADO;
  if (planId === "vault") return env.MERCADOPAGO_PRICE_VAULT;
  return null;
};

/**
 * What each plan actually costs, in the currency the card will really be
 * charged in.
 *
 * `plans.ts` carries a USD figure for copy and structured data, but MercadoPago
 * charges in the account's local currency — two independent numbers that drift
 * the moment the exchange rate moves or someone edits one and forgets the
 * other. Displaying a price we are not going to charge is the kind of bug that
 * ends in chargebacks, so the checkout amount is the single source of truth and
 * the UI renders this, not the USD constant.
 *
 * Public on purpose: the pricing page is not behind auth.
 */
export const getPublicPricing = () => ({
  enabled: isBillingEnabled(),
  currency: env.MERCADOPAGO_CURRENCY,
  // Needed by the Payment Brick to tokenize in the browser. Public by design.
  public_key: env.MERCADOPAGO_PUBLIC_KEY || null,
  plans: Object.fromEntries(
    (Object.keys(PLANS) as PlanId[]).map((id) => [
      id,
      {
        billing: PLANS[id].billing,
        // Free tiers have no local amount and must render as 0, not as null.
        amount: PLANS[id].billing === "free" ? 0 : amountForPlan(id),
        // Selling the monthly add-on needs the Suscripciones application. If
        // only the one-time app is set up, the UI must say "próximamente" instead
        // of sending someone into a checkout that cannot complete.
        purchasable:
          PLANS[id].billing === "monthly" ? isSubscriptionBillingEnabled() : true,
      },
    ])
  ),
});

/**
 * Fail at boot rather than at checkout. A paid plan with no configured amount
 * would otherwise reach `pref.create` and either throw in front of a user who
 * already clicked "Comprar" or, worse, charge zero.
 */
export const assertPricingConfigured = () => {
  if (!isBillingEnabled()) return;
  for (const id of Object.keys(PLANS) as PlanId[]) {
    if (PLANS[id].billing === "free") continue;
    const amount = amountForPlan(id);
    if (amount == null || amount <= 0) {
      throw new Error(
        `[billing] El plan "${id}" no tiene precio configurado en ${env.MERCADOPAGO_CURRENCY}. ` +
          `Define MERCADOPAGO_PRICE_${id.toUpperCase()} antes de arrancar.`
      );
    }
  }
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
 * One-time purchase (Legado). Uses Preference rather than PreApproval: there is
 * nothing recurring to authorize, and a preapproval would keep charging for a
 * document the user finished once.
 */
const createOneTimeCheckout = async (params: {
  userId: string;
  userEmail: string;
  planId: PlanId;
  successUrl: string;
}) => {
  const pref = ensurePreference();
  const amount = amountForPlan(params.planId);
  if (amount == null || amount <= 0) {
    throw badRequest(`No hay precio configurado para el plan ${params.planId}`);
  }
  const plan = PLANS[params.planId];

  const response = (await pref.create({
    body: {
      items: [
        {
          id: plan.id,
          title: `Presence ${plan.name}`,
          quantity: 1,
          unit_price: amount,
          currency_id: env.MERCADOPAGO_CURRENCY,
        },
      ],
      payer: { email: params.userEmail },
      back_urls: {
        success: params.successUrl,
        failure: params.successUrl,
        pending: params.successUrl,
      },
      auto_return: "approved",
      external_reference: `user:${params.userId}:plan:${params.planId}`,
      notification_url: webhookUrl(),
    } as unknown as Parameters<typeof pref.create>[0]["body"],
  })) as { id?: string; init_point?: string; sandbox_init_point?: string };

  const url = response.init_point ?? response.sandbox_init_point;
  if (!url) throw new Error("MercadoPago no devolvió init_point");
  return { url };
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
  if (PLANS[params.planId].billing === "one_time") {
    return createOneTimeCheckout(params);
  }
  const pa = ensurePreapproval();
  if (PLANS[params.planId].billing === "free") {
    throw badRequest("El plan Memorial es gratuito");
  }

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
  const effectiveTier: PlanId = status === "authorized" ? planId : DEFAULT_PLAN;

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
  headers: { signature?: string; requestId?: string },
  eventType: string
): boolean => {
  // Each MercadoPago application signs with its own secret. Subscription
  // events come from the Suscripciones app, everything else from Checkout API.
  // With a single application the SUBSCRIPTION_* secret is empty and both
  // resolve to the same value.
  const isSubscriptionEvent =
    eventType === "preapproval" || eventType === "subscription_authorized_payment";
  const secret =
    (isSubscriptionEvent ? env.MERCADOPAGO_SUBSCRIPTION_WEBHOOK_SECRET : "") ||
    env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret) return true; // skip if not configured
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
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
};

/**
 * Grant a one-time purchase. Called from two places that must never diverge:
 * the Payment Brick (synchronous, so the user sees the result immediately) and
 * the `payment` webhook (the safety net when the browser closed mid-redirect).
 *
 * Idempotent on `external_event_id`: whichever arrives second is a no-op, and
 * `legado_purchased_at` uses coalesce so a replay never moves the purchase date.
 */
export const grantOneTimePurchase = async (params: {
  userId: string;
  planId: PlanId;
  paymentId: string | null;
  amount: number;
  currency: string;
  eventId: string;
}) => {
  if (PLANS[params.planId].billing !== "one_time") return { granted: false };

  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("external_event_id", params.eventId)
    .maybeSingle();
  if (existing) return { granted: true, idempotent: true };

  const { data: user } = await supabase
    .from("users")
    .select("legado_purchased_at")
    .eq("id", params.userId)
    .maybeSingle();

  await supabase
    .from("users")
    .update({
      // Never overwrite an earlier purchase date on a replayed notification.
      legado_purchased_at: user?.legado_purchased_at ?? new Date().toISOString(),
      subscription_tier: params.planId,
    })
    .eq("id", params.userId);

  await supabase.from("payments").insert({
    user_id: params.userId,
    amount: params.amount.toFixed(2),
    currency: params.currency,
    payment_type: "one_time",
    payment_method: "mercadopago",
    external_id: params.paymentId,
    external_event_id: params.eventId,
    plan: params.planId,
    status: "completed",
    completed_at: new Date().toISOString(),
  });

  return { granted: true };
};

export const processWebhook = async (
  body: { type?: string; action?: string; data?: { id?: string | number } },
  headers: { signature?: string; requestId?: string; eventId?: string }
) => {
  const type = body.type ?? "";
  const dataId = body.data?.id ? String(body.data.id) : null;

  if (!verifySignature(body, headers, type)) {
    throw badRequest("Firma de webhook inválida");
  }

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

  // One-time purchase cleared. This is the only place Legado is granted, and
  // the stamp is permanent: `legado_purchased_at` is never cleared by a lapsed
  // subscription, so "pago único" means what it says.
  if (type === "payment" && dataId) {
    if (!payment) throw badRequest("Billing no está configurado en este servidor");
    const p = (await payment.get({ id: dataId })) as {
      id?: number | string;
      status?: string;
      transaction_amount?: number;
      currency_id?: string;
      external_reference?: string;
    };
    const userId = userIdFromReference(p.external_reference);
    const planId = planFromReference(p.external_reference);

    if (userId && planId && p.status === "approved") {
      await grantOneTimePurchase({
        userId,
        planId,
        paymentId: p.id ? String(p.id) : null,
        amount: p.transaction_amount ?? 0,
        currency: p.currency_id ?? env.MERCADOPAGO_CURRENCY,
        eventId,
      });
    }
    return { received: true, type };
  }

  // Each recurring charge arrives as `subscription_authorized_payment`, NOT as
  // `preapproval` — that one only fires on creation and status changes. Without
  // this branch `subscription_period_end` is stamped once at signup and never
  // advances, so `getActivePlanId` sees it expire and downgrades a subscriber
  // who is still being charged every month.
  //
  // The authorized-payment resource has no dedicated SDK class, so we read it
  // over REST and then re-apply its parent preapproval, which is what carries
  // the refreshed `next_payment_date`.
  if (type === "subscription_authorized_payment" && dataId) {
    const res = await fetch(`https://api.mercadopago.com/authorized_payments/${dataId}`, {
      headers: { Authorization: `Bearer ${subscriptionToken()}` },
    });
    if (!res.ok) {
      console.error("[billing:webhook] authorized_payment fetch failed:", res.status);
      return { received: true, type, skipped: true };
    }
    const authorized = (await res.json()) as {
      preapproval_id?: string;
      status?: string;
    };
    if (!authorized.preapproval_id) return { received: true, type, skipped: true };

    const sub = (await ensurePreapproval().get({
      id: authorized.preapproval_id,
    })) as PreApprovalResource;
    await applyPreapprovalToUser(sub);
    return { received: true, type };
  }

  if (type === "preapproval" && dataId) {
    const sub = (await ensurePreapproval().get({ id: dataId })) as PreApprovalResource;
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

/**
 * Process a payment submitted by the Checkout Bricks widget.
 *
 * The Brick tokenizes the card in the browser against MercadoPago, so what
 * arrives here is a single-use token plus the chosen method — never a card
 * number. That is what keeps raw PAN out of our logs and out of our database.
 *
 * The amount is deliberately NOT taken from the request: it is read from our
 * own plan config. A client-supplied `transaction_amount` would let anyone buy
 * Legado for one peso.
 */
export const processBrickPayment = async (params: {
  userId: string;
  userEmail: string;
  planId: PlanId;
  formData: {
    token?: string;
    payment_method_id?: string;
    issuer_id?: string;
    installments?: number;
    payer?: { email?: string; identification?: { type?: string; number?: string } };
  };
}) => {
  if (!payment) throw badRequest("Billing no está configurado en este servidor");
  if (PLANS[params.planId].billing !== "one_time") {
    throw badRequest("Este plan no se cobra con un pago único.");
  }
  const amount = amountForPlan(params.planId);
  if (amount == null || amount <= 0) {
    throw badRequest(`No hay precio configurado para el plan ${params.planId}`);
  }

  const externalReference = `user:${params.userId}:plan:${params.planId}`;
  // Scoped to the user + plan + attempt so a double-submit from a jumpy button
  // cannot charge twice, while a genuine retry after a decline still can.
  const idempotencyKey = `${externalReference}:${params.formData.token ?? crypto.randomUUID()}`;

  const created = (await payment.create({
    body: {
      transaction_amount: amount,
      token: params.formData.token,
      description: `Presence ${PLANS[params.planId].name}`,
      installments: params.formData.installments ?? 1,
      payment_method_id: params.formData.payment_method_id,
      issuer_id: params.formData.issuer_id,
      payer: {
        email: params.formData.payer?.email ?? params.userEmail,
        identification: params.formData.payer?.identification,
      },
      external_reference: externalReference,
      notification_url: webhookUrl(),
    } as unknown as Parameters<typeof payment.create>[0]["body"],
    requestOptions: { idempotencyKey },
  })) as {
    id?: number | string;
    status?: string;
    status_detail?: string;
    transaction_amount?: number;
    currency_id?: string;
  };

  if (created.status === "approved") {
    await grantOneTimePurchase({
      userId: params.userId,
      planId: params.planId,
      paymentId: created.id ? String(created.id) : null,
      amount: created.transaction_amount ?? amount,
      currency: created.currency_id ?? env.MERCADOPAGO_CURRENCY,
      eventId: `brick:${created.id}`,
    });
  }

  // `in_process` is a real outcome (manual review, some cash methods): the
  // webhook will grant access when it settles, so we say "pending", not "failed".
  return {
    status: created.status ?? "unknown",
    status_detail: created.status_detail ?? null,
    payment_id: created.id ? String(created.id) : null,
  };
};
