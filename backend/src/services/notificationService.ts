import { env } from "../config/env.js";
import { sendEmail } from "./emailService.js";

const wrap = (inner: string) => `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f6f6f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#211922;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f3;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:24px;border:1px solid #e5e5e0;padding:40px;">
        <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#211922;padding-bottom:24px;">Presence</td></tr>
        ${inner}
      </table>
      <p style="font-size:12px;color:#91918c;margin-top:24px;">Presence — Tu memoria, viva para siempre.</p>
    </td></tr>
  </table>
</body>
</html>`;

const button = (url: string, label: string) =>
  `<a href="${url}" style="display:inline-block;background:#7e238b;color:#ffffff;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:16px;font-size:15px;">${label}</a>`;

export const notifyVaultShared = async (params: {
  toEmail: string;
  inviterName: string;
  vaultName: string;
  role: string;
}) => {
  const url = `${env.FRONTEND_URL.replace(/\/$/, "")}/app`;
  const inner = `
    <tr><td style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#91918c;font-weight:700;padding-bottom:16px;">Te invitaron a un Memory Vault</td></tr>
    <tr><td style="font-size:16px;line-height:1.6;padding-bottom:20px;">${params.inviterName} compartió contigo el Memory Vault de <strong>${params.vaultName}</strong> con rol de <strong>${params.role}</strong>. Ahora puedes ver los recuerdos y conversar con la IA.</td></tr>
    <tr><td align="center" style="padding:8px 0 24px;">${button(url, "Abrir Presence")}</td></tr>
    <tr><td style="font-size:13px;line-height:1.5;color:#62625b;">Si todavía no tienes cuenta, regístrate con este mismo email para acceder.</td></tr>`;
  try {
    await sendEmail({
      to: params.toEmail,
      subject: `${params.inviterName} compartió contigo el vault de ${params.vaultName}`,
      html: wrap(inner),
      text: `${params.inviterName} compartió contigo el Memory Vault de ${params.vaultName}. Abre: ${url}`,
    });
  } catch (e) {
    console.error("[notify:vault-shared] failed:", e);
  }
};

export const notifyGuestbookPending = async (params: {
  toEmail: string;
  memorialName: string;
  visitorName: string;
  message: string;
  memorialId: string;
}) => {
  const url = `${env.FRONTEND_URL.replace(/\/$/, "")}/app/memorials/${params.memorialId}`;
  const preview = params.message.length > 240
    ? `${params.message.slice(0, 240)}…`
    : params.message;
  const inner = `
    <tr><td style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#91918c;font-weight:700;padding-bottom:16px;">Nuevo mensaje en el libro de visitas</td></tr>
    <tr><td style="font-size:16px;line-height:1.6;padding-bottom:8px;"><strong>${params.visitorName}</strong> dejó un mensaje en el memorial de <strong>${params.memorialName}</strong>.</td></tr>
    <tr><td style="font-size:14px;line-height:1.6;color:#62625b;font-style:italic;padding:12px 16px;background:#f6f6f3;border-radius:12px;border-left:3px solid #7e238b;margin-bottom:20px;">"${preview.replace(/\n/g, "<br/>")}"</td></tr>
    <tr><td style="padding-top:20px;" align="center">${button(url, "Revisar y aprobar")}</td></tr>`;
  try {
    await sendEmail({
      to: params.toEmail,
      subject: `Mensaje pendiente en el memorial de ${params.memorialName}`,
      html: wrap(inner),
      text: `${params.visitorName} escribió: "${preview}". Apruébalo en: ${url}`,
    });
  } catch (e) {
    console.error("[notify:guestbook-pending] failed:", e);
  }
};
