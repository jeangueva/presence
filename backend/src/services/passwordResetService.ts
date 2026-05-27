import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";
import { sendEmail } from "./emailService.js";
import { badRequest, unauthorized } from "../utils/errors.js";

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const hashToken = (raw: string) =>
  crypto.createHash("sha256").update(raw).digest("hex");

const buildResetUrl = (rawToken: string) =>
  `${env.FRONTEND_URL.replace(/\/$/, "")}/reset-password?token=${rawToken}`;

/**
 * Request a password reset.
 * Always returns success to the caller — we never leak whether an email is registered.
 * If a matching user exists, a token is created and the reset URL is logged.
 * In production this would dispatch an email via Resend/SES; for now the URL is
 * surfaced through backend logs.
 */
export const requestPasswordReset = async (email: string) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;

  if (!user) {
    // Constant-time-ish: still hash some bytes so the path takes similar work.
    crypto.randomBytes(TOKEN_BYTES);
    return { sent: true };
  }

  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  const { error: insErr } = await supabase
    .from("password_reset_tokens")
    .insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
  if (insErr) throw insErr;

  const url = buildResetUrl(rawToken);
  try {
    await sendEmail({
      to: user.email,
      subject: "Restablece tu contraseña en Presence",
      text: buildResetEmailText(url),
      html: buildResetEmailHtml(url),
    });
  } catch (err) {
    // Don't surface email errors to the caller (we always return success to avoid
    // account-existence leaks). Log and continue — user can retry the flow.
    console.error("[password-reset] email dispatch failed:", err);
  }

  return { sent: true };
};

const buildResetEmailText = (url: string) =>
  `Hola,

Recibimos una solicitud para restablecer tu contraseña en Presence.

Abre este link para crear una nueva (expira en 1 hora):
${url}

Si no fuiste tú, puedes ignorar este mensaje — tu contraseña actual sigue siendo válida.

— Presence`;

const buildResetEmailHtml = (url: string) => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Restablece tu contraseña</title>
</head>
<body style="margin:0;padding:0;background:#f6f6f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#211922;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f3;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:24px;border:1px solid #e5e5e0;padding:40px;">
          <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#211922;padding-bottom:8px;">Presence</td></tr>
          <tr><td style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#91918c;font-weight:700;padding-bottom:24px;">Restablecer contraseña</td></tr>
          <tr><td style="font-size:16px;line-height:1.6;color:#211922;padding-bottom:20px;">Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para crear una nueva. El link expira en 1 hora.</td></tr>
          <tr><td align="center" style="padding:8px 0 24px;">
            <a href="${url}" style="display:inline-block;background:#7e238b;color:#ffffff;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:16px;font-size:15px;">Restablecer contraseña</a>
          </td></tr>
          <tr><td style="font-size:13px;line-height:1.5;color:#62625b;padding-bottom:20px;">O copia y pega este link en el browser:<br /><a href="${url}" style="color:#7e238b;word-break:break-all;">${url}</a></td></tr>
          <tr><td style="font-size:13px;line-height:1.5;color:#62625b;border-top:1px solid #e5e5e0;padding-top:20px;">Si no fuiste tú, ignora este mensaje — tu contraseña actual sigue siendo válida.</td></tr>
        </table>
        <p style="font-size:12px;color:#91918c;margin-top:24px;">Presence — Tu memoria, viva para siempre.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const confirmPasswordReset = async (rawToken: string, newPassword: string) => {
  if (newPassword.length < 8) throw badRequest("Password must be at least 8 characters");

  const tokenHash = hashToken(rawToken);
  const { data: row, error } = await supabase
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, consumed_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error) throw error;
  if (!row) throw unauthorized("Invalid or expired token");
  if (row.consumed_at) throw unauthorized("Token already used");
  if (new Date(row.expires_at) < new Date()) {
    throw unauthorized("Token expired");
  }

  const password_hash = await bcrypt.hash(newPassword, 12);

  const { error: updErr } = await supabase
    .from("users")
    .update({ password_hash })
    .eq("id", row.user_id);
  if (updErr) throw updErr;

  await supabase
    .from("password_reset_tokens")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", row.id);

  // Invalidate any other unconsumed tokens for this user.
  await supabase
    .from("password_reset_tokens")
    .update({ consumed_at: new Date().toISOString() })
    .eq("user_id", row.user_id)
    .is("consumed_at", null);

  return { reset: true };
};
