import * as Sentry from "@sentry/node";
import { env } from "./env.js";

/**
 * Initialize Sentry if SENTRY_DSN is configured. No-op otherwise so dev runs
 * with zero overhead and no spurious events.
 */
export const initSentry = () => {
  if (!env.SENTRY_DSN) return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 0,
  });
  console.log("[sentry] initialized");
};

export { Sentry };
