import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),

  // Audio transcription (Whisper). Pick ONE provider:
  //  - Groq (recommended): free tier + fastest. Set GROQ_API_KEY.
  //  - OpenAI fallback: set OPENAI_API_KEY.
  // If neither is set, audio uploads are stored but not transcribed.
  GROQ_API_KEY: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default(""),
  // Override model. Defaults to whisper-large-v3-turbo (Groq) or whisper-1 (OpenAI).
  WHISPER_MODEL: z.string().optional().default(""),

  // Email (Resend). If RESEND_API_KEY is empty, emails fall back to console.log.
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("Presence <onboarding@resend.dev>"),

  // MercadoPago (billing / freemium). All optional — if MERCADOPAGO_ACCESS_TOKEN
  // is empty, billing endpoints return a clear "not configured" error.
  // Currency must match what your MercadoPago account supports (COP/MXN/ARS/BRL/CLP/PEN/UYU).
  // Amounts are in the LOCAL currency (e.g. 36000 COP, 199 MXN, 9000 ARS).
  // MercadoPago's panel makes you declare ONE product per application, so a
  // product that sells both a one-time purchase (Checkout API) and a
  // subscription (Suscripciones) needs two applications — and therefore two
  // sets of credentials.
  //
  // MERCADOPAGO_ACCESS_TOKEN is the Checkout API app (one-time). If the
  // SUBSCRIPTION_* pair is empty, the same credentials are reused for
  // preapprovals, which is fine when a single application covers both.
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional().default(""),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().optional().default(""),
  // Public key of the Checkout API application. Safe to ship to the
  // browser — the Payment Brick needs it to tokenize the card client-side so
  // the raw PAN never reaches our servers.
  MERCADOPAGO_PUBLIC_KEY: z.string().optional().default(""),
  MERCADOPAGO_SUBSCRIPTION_ACCESS_TOKEN: z.string().optional().default(""),
  MERCADOPAGO_SUBSCRIPTION_WEBHOOK_SECRET: z.string().optional().default(""),
  MERCADOPAGO_CURRENCY: z.string().default("COP"),
  // Legado is a one-time charge, Vault is monthly. Both in LOCAL currency.
  MERCADOPAGO_PRICE_LEGADO: z.coerce.number().default(396000),
  MERCADOPAGO_PRICE_VAULT: z.coerce.number().default(48000),
  // Public URL where MercadoPago will POST webhook notifications.
  // In dev use ngrok / cloudflare tunnel; in prod the public API URL.
  BACKEND_PUBLIC_URL: z.string().default(""),

  STORAGE_PROVIDER: z.enum(["supabase", "gcs"]).default("supabase"),
  SUPABASE_STORAGE_BUCKET: z.string().default("vault-files"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // Shared secret to authorize admin ops (posthumous dispatch, etc.).
  // Operators send it via the `X-Admin-Token` header.
  ADMIN_TOKEN: z.string().optional().default(""),

  // Sentry DSN para error monitoring. Si está vacío, Sentry no se inicializa.
  SENTRY_DSN: z.string().optional().default(""),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
