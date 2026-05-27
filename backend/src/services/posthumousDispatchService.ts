import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";
import { sendEmail } from "./emailService.js";
import { logAudit } from "./auditService.js";

const wrap = (inner: string) => `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f6f6f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#211922;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f3;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:24px;border:1px solid #e5e5e0;padding:40px;">
        ${inner}
      </table>
    </td></tr>
  </table>
</body></html>`;

type PostMessageRow = {
  id: string;
  user_id: string;
  recipient_email: string | null;
  subject: string | null;
  text_content: string | null;
};

/**
 * Dispatch all unsent posthumous messages for a given user. Idempotent: only
 * affects rows with sent=false and trigger_type='death'.
 *
 * IMPORTANT: This is a sensitive operation — once sent, can't be undone.
 * Called only after manual verification of death by an operator.
 */
export const dispatchForUser = async (userId: string) => {
  const { data: user } = await supabase
    .from("users")
    .select("id, email, full_name")
    .eq("id", userId)
    .maybeSingle();

  const { data: messages, error } = await supabase
    .from("legacy_messages")
    .select("id, user_id, recipient_email, subject, text_content")
    .eq("user_id", userId)
    .eq("trigger_type", "death")
    .eq("sent", false);
  if (error) throw error;

  let delivered = 0;
  const failures: string[] = [];

  for (const msg of (messages ?? []) as PostMessageRow[]) {
    if (!msg.recipient_email || !msg.subject || !msg.text_content) {
      failures.push(msg.id);
      continue;
    }
    const inner = `
      <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#211922;padding-bottom:12px;">Un mensaje para ti</td></tr>
      <tr><td style="font-size:13px;color:#62625b;line-height:1.5;padding-bottom:24px;">${user?.full_name ?? user?.email ?? "Una persona"} dejó este mensaje guardado en Presence, para que lo recibieras hoy.</td></tr>
      <tr><td style="font-size:16px;line-height:1.7;color:#211922;white-space:pre-wrap;padding:20px;background:#f6f6f3;border-radius:16px;border-left:4px solid #7e238b;">${(msg.text_content ?? "").replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</td></tr>
      <tr><td style="font-size:12px;color:#91918c;padding-top:20px;">Presence — Tu memoria, viva para siempre.</td></tr>`;
    try {
      await sendEmail({
        to: msg.recipient_email,
        subject: msg.subject,
        html: wrap(inner),
        text: msg.text_content,
      });
      const { error: updErr } = await supabase
        .from("legacy_messages")
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq("id", msg.id);
      if (updErr) throw updErr;
      delivered += 1;
      void logAudit({
        userId,
        resourceType: "legacy_message",
        resourceId: msg.id,
        action: "posthumous_message_dispatched",
        metadata: { recipient: msg.recipient_email },
      });
    } catch (err) {
      console.error("[posthumous-dispatch] failed for", msg.id, err);
      failures.push(msg.id);
    }
  }

  return { total: messages?.length ?? 0, delivered, failed: failures.length };
};

export const isAdminToken = (token: string | undefined): boolean => {
  if (!env.ADMIN_TOKEN) return false;
  if (!token) return false;
  return token === env.ADMIN_TOKEN;
};
