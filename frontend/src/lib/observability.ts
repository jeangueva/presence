import * as Sentry from "@sentry/react";

/**
 * Initialize observability tools — Sentry (error monitoring) and Plausible
 * (analytics). Both are opt-in via env vars; if not configured, no-op.
 *
 * Privacy: Plausible is cookie-less and respects DNT by design. Sentry only
 * sees errors and stack traces, no PII unless we explicitly add it.
 */
export const initObservability = () => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
      // Don't capture sessions/replays by default — paid feature.
    });
    console.log("[sentry] initialized");
  }

  const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
  if (plausibleDomain) {
    // Respect Do Not Track silently.
    const dnt =
      navigator.doNotTrack === "1" ||
      (window as unknown as { doNotTrack?: string }).doNotTrack === "1";
    if (!dnt) {
      const script = document.createElement("script");
      script.defer = true;
      script.dataset.domain = plausibleDomain;
      script.src = "https://plausible.io/js/script.js";
      document.head.appendChild(script);
      console.log("[plausible] script loaded");
    }
  }
};

export { Sentry };
