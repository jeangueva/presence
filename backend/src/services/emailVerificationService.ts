import crypto from "node:crypto";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";
import { sendEmail } from "./emailService.js";
import { badRequest, notFound } from "../utils/errors.js";

const TOKEN_BYTES = 32;

const hashToken = (raw: string) =>
  crypto.createHash("sha256").update(raw).digest("hex");

const buildVerifyUrl = (rawToken: string) =>
  `${env.FRONTEND_URL.replace(/\/$/, "")}/verify-email?token=${rawToken}`;

const wrap = (inner: string) => `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f6f6f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#211922;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f3;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:24px;border:1px solid #e5e5e0;padding:40px;">
        <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#211922;padding-bottom:24px;">Presence</td></tr>
        ${inner}
      </table>
    </td></tr>
  </table>
</body></html>`;

export const sendVerificationEmail = async (userId: string, email: string) => {
  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(rawToken);
  const { error } = await supabase
    .from("users")
    .update({
      email_verification_token: tokenHash,
      email_verification_sent_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;

  const url = buildVerifyUrl(rawToken);
  const inner = `
    <tr><td style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#91918c;font-weight:700;padding-bottom:16px;">Verifica tu email</td></tr>
    <tr><td style="font-size:16px;line-height:1.6;padding-bottom:20px;">Bienvenido a Presence. Para activar tu cuenta y poder compartir vaults o recibir mensajes, verifica tu email.</td></tr>
    <tr><td align="center" style="padding:8px 0 24px;">
      <a href="${url}" style="display:inline-block;background:#7e238b;color:#ffffff;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:16px;font-size:15px;">Verificar email</a>
    </td></tr>
    <tr><td style="font-size:13px;line-height:1.5;color:#62625b;padding-bottom:20px;">O copia este link:<br /><a href="${url}" style="color:#7e238b;word-break:break-all;">${url}</a></td></tr>`;
  try {
    await sendEmail({
      to: email,
      subject: "Verifica tu email en Presence",
      html: wrap(inner),
      text: `Verifica tu email visitando: ${url}`,
    });
  } catch (e) {
    console.error("[verify-email] send failed:", e);
  }
  return { sent: true };
};

export const verifyEmailToken = async (rawToken: string) => {
  const tokenHash = hashToken(rawToken);
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email_verification_sent_at")
    .eq("email_verification_token", tokenHash)
    .maybeSingle();
  if (error) throw error;
  if (!user) throw badRequest("Token inválido o expirado");

  // Tokens caducan a las 7 días.
  if (user.email_verification_sent_at) {
    const sent = new Date(user.email_verification_sent_at).getTime();
    if (Date.now() - sent > 7 * 24 * 60 * 60 * 1000) {
      throw badRequest("Token expirado. Pide uno nuevo.");
    }
  }

  const { error: updErr } = await supabase
    .from("users")
    .update({
      email_verified: true,
      email_verification_token: null,
      email_verification_sent_at: null,
    })
    .eq("id", user.id);
  if (updErr) throw updErr;
  return { verified: true };
};

export const resendVerificationEmail = async (userId: string) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("email, email_verified")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!user) throw notFound("User not found");
  if (user.email_verified) return { sent: false, already_verified: true };
  return sendVerificationEmail(userId, user.email);
};
