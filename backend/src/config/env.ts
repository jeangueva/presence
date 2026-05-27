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
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional().default(""),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().optional().default(""),
  MERCADOPAGO_CURRENCY: z.string().default("COP"),
  MERCADOPAGO_PRICE_PERSONAL: z.coerce.number().default(36000),
  MERCADOPAGO_PRICE_FAMILY: z.coerce.number().default(76000),
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
