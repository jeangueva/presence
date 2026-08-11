import { randomBytes } from "node:crypto";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";
import { badRequest, notFound } from "../utils/errors.js";
import { escapeHtml } from "../utils/html.js";
import { sendEmail } from "./emailService.js";
import { dispatchForUser } from "./posthumousDispatchService.js";

export type DeadmanState =
  | "active"
  | "overdue"
  | "grace"
  | "triggered"
  | "paused";

export type DeadmanConfig = {
  user_id: string;
  enabled: boolean;
  interval_days: number;
  grace_days: number;
  required_confirmations: number;
  state: DeadmanState;
  last_checkin_at: string | null;
  next_checkin_due_at: string | null;
  grace_started_at: string | null;
  triggered_at: string | null;
};

export type DeadmanContact = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  relationship: string | null;
  notified_at: string | null;
  confirmed_at: string | null;
  declined_at: string | null;
};

const token = () => randomBytes(32).toString("hex");

const daysFromNow = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString();

const logEvent = async (userId: string, event: string, detail?: unknown) => {
  const { error } = await supabase
    .from("deadman_events")
    .insert({ user_id: userId, event, detail: detail ?? null });
  // Audit failures must never abort the state machine — but we do want to know.
  if (error) console.error("[deadman] audit write failed:", event, error);
};

// ---------- Config ----------

export const getConfig = async (userId: string): Promise<DeadmanConfig | null> => {
  const { data, error } = await supabase
    .from("deadman_config")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as DeadmanConfig) ?? null;
};

export const upsertConfig = async (
  userId: string,
  input: {
    enabled?: boolean;
    interval_days?: number;
    grace_days?: number;
    required_confirmations?: number;
  }
) => {
  const existing = await getConfig(userId);

  if (input.enabled) {
    const contacts = await listContacts(userId);
    if (contacts.length < (input.required_confirmations ?? existing?.required_confirmations ?? 2)) {
      throw badRequest(
        "Necesitas al menos tantos contactos de confianza como confirmaciones requeridas."
      );
    }
    const { count } = await supabase
      .from("legacy_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("trigger_type", "death");
    if (!count) {
      throw badRequest(
        "Todavía no tienes mensajes póstumos. Escribe al menos uno antes de activar el check-in."
      );
    }
  }

  const interval = input.interval_days ?? existing?.interval_days ?? 90;
  const enabling = input.enabled && !existing?.enabled;

  const payload: Record<string, unknown> = {
    user_id: userId,
    ...input,
    updated_at: new Date().toISOString(),
  };

  // Turning the switch on (re)starts the clock; turning it off parks it so a
  // paused user is never swept into grace by the cron.
  if (enabling) {
    payload.state = "active";
    payload.last_checkin_at = new Date().toISOString();
    payload.next_checkin_due_at = daysFromNow(interval);
    payload.grace_started_at = null;
  } else if (input.enabled === false) {
    payload.state = "paused";
    payload.next_checkin_due_at = null;
  } else if (existing?.enabled && input.interval_days) {
    payload.next_checkin_due_at = daysFromNow(interval);
  }

  const { data, error } = await supabase
    .from("deadman_config")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;

  await logEvent(userId, enabling ? "enabled" : input.enabled === false ? "paused" : "config_updated", input);
  return data as DeadmanConfig;
};

// ---------- Trusted contacts ----------

export const listContacts = async (userId: string): Promise<DeadmanContact[]> => {
  const { data, error } = await supabase
    .from("deadman_contacts")
    .select("id, user_id, full_name, email, relationship, notified_at, confirmed_at, declined_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DeadmanContact[];
};

export const createContact = async (
  userId: string,
  input: { full_name: string; email: string; relationship?: string }
) => {
  const { data: user } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  if (user?.email?.toLowerCase() === input.email.toLowerCase()) {
    throw badRequest("No puedes designarte a ti misma/o como contacto de confianza.");
  }

  const { data, error } = await supabase
    .from("deadman_contacts")
    .insert({ user_id: userId, ...input })
    .select("*")
    .single();
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      throw badRequest("Ese contacto ya está en tu lista.");
    }
    throw error;
  }
  await logEvent(userId, "contact_added", { email: input.email });
  return data;
};

export const deleteContact = async (userId: string, id: string) => {
  const { error } = await supabase
    .from("deadman_contacts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
  await logEvent(userId, "contact_removed", { id });
};

// ---------- Check-in ----------

const wrap = (inner: string) => `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#000000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:24px;border:1px solid #E8E8E8;padding:40px;">
        ${inner}
      </table>
    </td></tr>
  </table>
</body></html>`;

const button = (href: string, label: string) =>
  `<tr><td style="padding-top:28px;"><a href="${href}" style="display:inline-block;background:#000000;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:9999px;font-size:15px;">${escapeHtml(label)}</a></td></tr>`;

/**
 * Send the "are you there?" email and stamp a fresh single-use token. The
 * token is what the link carries, so an old email can never re-confirm a
 * later cycle.
 */
export const sendCheckinEmail = async (userId: string) => {
  const { data: user } = await supabase
    .from("users")
    .select("email, full_name")
    .eq("id", userId)
    .maybeSingle();
  if (!user?.email) return;

  const config = await getConfig(userId);
  const t = token();
  await supabase
    .from("deadman_config")
    .update({
      checkin_token: t,
      checkin_token_expires_at: daysFromNow(config?.grace_days ?? 30),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  const url = `${env.FRONTEND_URL.replace(/\/$/, "")}/checkin/${t}`;
  const name = user.full_name?.split(" ")[0] ?? "";
  const inner = `
    <tr><td style="font-family:Georgia,serif;font-size:28px;padding-bottom:12px;">¿Sigues por aquí${name ? `, ${escapeHtml(name)}` : ""}?</td></tr>
    <tr><td style="font-size:15px;color:#6F6F6F;line-height:1.6;">Es el check-in que configuraste en Presence. Un clic y seguimos como estamos — nadie recibe nada.</td></tr>
    ${button(url, "Sí, estoy bien")}
    <tr><td style="font-size:13px;color:#A3A3A3;padding-top:24px;line-height:1.6;">Si no respondes en ${config?.grace_days ?? 30} días, escribiremos a tus contactos de confianza para preguntarles. Solo si ellos confirman se entregan tus mensajes.</td></tr>`;

  await sendEmail({
    to: user.email,
    subject: "¿Sigues por aquí? — Presence",
    html: wrap(inner),
    text: `Confirma que estás bien: ${url}`,
  });
  await logEvent(userId, "checkin_sent");
};

/** Resolve a check-in token: proves the user is alive and restarts the clock. */
export const confirmCheckin = async (checkinToken: string) => {
  const { data: config, error } = await supabase
    .from("deadman_config")
    .select("*")
    .eq("checkin_token", checkinToken)
    .maybeSingle();
  if (error) throw error;
  if (!config) throw notFound("Este enlace ya no es válido.");
  if (
    config.checkin_token_expires_at &&
    new Date(config.checkin_token_expires_at) < new Date()
  ) {
    throw badRequest("Este enlace expiró. Entra a tu cuenta para hacer el check-in.");
  }

  await touchCheckin(config.user_id, config.interval_days);
  return { ok: true };
};

/**
 * Restart the cycle. Clears any in-flight grace period and resets every
 * contact's confirmation state, so a user who comes back after contacts were
 * already notified is fully back to `active`.
 */
export const touchCheckin = async (userId: string, intervalDays?: number) => {
  const config = await getConfig(userId);
  const interval = intervalDays ?? config?.interval_days ?? 90;

  const { error } = await supabase
    .from("deadman_config")
    .update({
      state: "active",
      last_checkin_at: new Date().toISOString(),
      next_checkin_due_at: daysFromNow(interval),
      grace_started_at: null,
      checkin_token: null,
      checkin_token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) throw error;

  await supabase
    .from("deadman_contacts")
    .update({ notified_at: null, confirmed_at: null, declined_at: null, confirm_token: null })
    .eq("user_id", userId);

  await logEvent(userId, "checkin_confirmed");
  return getConfig(userId);
};

// ---------- Grace period: ask the trusted contacts ----------

const startGracePeriod = async (config: DeadmanConfig) => {
  const { data: user } = await supabase
    .from("users")
    .select("email, full_name")
    .eq("id", config.user_id)
    .maybeSingle();
  const contacts = await listContacts(config.user_id);
  if (contacts.length === 0) {
    // Reachable if the user deletes every contact after arming the switch.
    // Park it instead of leaving the row in `overdue`, which the sweep would
    // otherwise re-select and retry every single day, forever.
    await supabase
      .from("deadman_config")
      .update({ enabled: false, state: "paused", updated_at: new Date().toISOString() })
      .eq("user_id", config.user_id);
    await logEvent(config.user_id, "paused_no_contacts");
    return;
  }

  await supabase
    .from("deadman_config")
    .update({
      state: "grace",
      grace_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", config.user_id);

  const who = user?.full_name ?? user?.email ?? "Una persona";
  for (const c of contacts) {
    const t = token();
    await supabase
      .from("deadman_contacts")
      .update({ confirm_token: t, notified_at: new Date().toISOString() })
      .eq("id", c.id);

    const base = env.FRONTEND_URL.replace(/\/$/, "");
    const inner = `
      <tr><td style="font-family:Georgia,serif;font-size:26px;padding-bottom:12px;">Una pregunta delicada</td></tr>
      <tr><td style="font-size:15px;color:#6F6F6F;line-height:1.6;">${escapeHtml(who)} te designó como contacto de confianza en Presence, para una sola cosa: confirmar si ha fallecido.</td></tr>
      <tr><td style="font-size:15px;color:#6F6F6F;line-height:1.6;padding-top:14px;">Lleva ${config.grace_days} días sin responder a nuestros check-ins. Puede no significar nada. Por eso te preguntamos a ti antes de hacer nada.</td></tr>
      ${button(`${base}/confirmar/${t}`, "Confirmar el fallecimiento")}
      <tr><td style="padding-top:14px;"><a href="${base}/confirmar/${t}?no=1" style="font-size:14px;color:#6F6F6F;">No, está bien / no me consta</a></td></tr>
      <tr><td style="font-size:13px;color:#A3A3A3;padding-top:24px;line-height:1.6;">Hacen falta ${config.required_confirmations} confirmaciones para que se entreguen los mensajes que dejó escritos. No se comparte ningún otro dato contigo.</td></tr>`;

    try {
      await sendEmail({
        to: c.email,
        subject: `Sobre ${who} — Presence`,
        html: wrap(inner),
        text: `${who} te designó como contacto de confianza. Confirma en: ${base}/confirmar/${t}`,
      });
    } catch (err) {
      console.error("[deadman] contact notify failed:", c.email, err);
    }
  }
  await logEvent(config.user_id, "grace_started", { contacts: contacts.length });
};

/**
 * A trusted contact answers. Once enough of them confirm, the posthumous
 * messages go out — this is the only path that dispatches without a human
 * operator, and it is irreversible, hence the strict count check.
 */
export const contactRespond = async (confirmToken: string, confirmed: boolean) => {
  const { data: contact, error } = await supabase
    .from("deadman_contacts")
    .select("*")
    .eq("confirm_token", confirmToken)
    .maybeSingle();
  if (error) throw error;
  if (!contact) throw notFound("Este enlace ya no es válido.");

  await supabase
    .from("deadman_contacts")
    .update(
      confirmed
        ? { confirmed_at: new Date().toISOString(), declined_at: null }
        : { declined_at: new Date().toISOString(), confirmed_at: null }
    )
    .eq("id", contact.id);

  await logEvent(contact.user_id, confirmed ? "contact_confirmed" : "contact_declined", {
    contact_id: contact.id,
  });

  const config = await getConfig(contact.user_id);
  if (!config || config.state === "triggered") return { ok: true, triggered: false };

  const contacts = await listContacts(contact.user_id);
  const confirmations = contacts.filter((c) => c.confirmed_at).length;

  if (confirmed && confirmations >= config.required_confirmations) {
    await supabase
      .from("deadman_config")
      .update({
        state: "triggered",
        triggered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", contact.user_id);

    const result = await dispatchForUser(contact.user_id);
    await logEvent(contact.user_id, "triggered", { confirmations, ...result });
    return { ok: true, triggered: true };
  }

  return { ok: true, triggered: false, confirmations };
};

// ---------- The sweep (called by cron) ----------

/**
 * Advance every enabled switch whose deadline has passed. Idempotent: running
 * it twice in a day sends at most one email per user per phase, because each
 * phase moves the row out of the state the query selects on.
 */
export const runSweep = async () => {
  const now = new Date().toISOString();
  const summary = { checkins_sent: 0, grace_started: 0 };

  // 1. Due for a check-in → ask them.
  const { data: due, error: dueErr } = await supabase
    .from("deadman_config")
    .select("*")
    .eq("enabled", true)
    .eq("state", "active")
    .lte("next_checkin_due_at", now);
  if (dueErr) throw dueErr;

  for (const config of (due ?? []) as DeadmanConfig[]) {
    await supabase
      .from("deadman_config")
      .update({ state: "overdue", updated_at: now })
      .eq("user_id", config.user_id);
    try {
      await sendCheckinEmail(config.user_id);
      summary.checkins_sent += 1;
    } catch (err) {
      console.error("[deadman] checkin email failed:", config.user_id, err);
    }
  }

  // 2. Silent through the whole grace window → ask the trusted contacts.
  const { data: overdue, error: overdueErr } = await supabase
    .from("deadman_config")
    .select("*")
    .eq("enabled", true)
    .eq("state", "overdue");
  if (overdueErr) throw overdueErr;

  for (const config of (overdue ?? []) as DeadmanConfig[]) {
    const due = config.next_checkin_due_at
      ? new Date(config.next_checkin_due_at).getTime()
      : 0;
    const deadline = due + config.grace_days * 86_400_000;
    if (Date.now() < deadline) continue;
    try {
      await startGracePeriod(config);
      summary.grace_started += 1;
    } catch (err) {
      console.error("[deadman] grace start failed:", config.user_id, err);
    }
  }

  return summary;
};

/** Read model for the settings screen. */
export const getStatus = async (userId: string) => {
  const config = await getConfig(userId);
  const contacts = await listContacts(userId);
  return {
    config,
    contacts,
    confirmations: contacts.filter((c) => c.confirmed_at).length,
  };
};
