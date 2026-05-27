import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

type SendInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Send an email via Resend.
 * If no RESEND_API_KEY is configured, falls back to console.log so dev still works.
 * Throws on Resend API errors — caller decides whether to surface or swallow.
 */
export const sendEmail = async ({ to, subject, html, text }: SendInput) => {
  if (!resend) {
    console.log(
      `[email:console-fallback] To: ${to}\n  Subject: ${subject}\n  ${text}`
    );
    return { id: "console-fallback", channel: "console" as const };
  }

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    console.error("[email:resend] send failed:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  return { id: data?.id ?? "unknown", channel: "resend" as const };
};
