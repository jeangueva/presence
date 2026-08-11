/**
 * Daily trigger for the dead-man's switch, running on Cloudflare's free
 * Cron Triggers instead of a Render cron job (which is not on Render's free
 * tier). All it does is call the backend, so none of the Node-only pieces of
 * the API — sharp, multer, express — are in play here.
 *
 * Deploy:  wrangler deploy
 * Secrets: wrangler secret put ADMIN_TOKEN
 *          wrangler secret put BACKEND_URL
 */

type Env = {
  BACKEND_URL: string;
  ADMIN_TOKEN: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Render's free tier sleeps after 15 minutes, and the wake-up can take the
 * better part of a minute. Poll /health first so the sweep itself doesn't
 * eat the cold start and time out.
 */
const wakeBackend = async (base: string): Promise<boolean> => {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(`${base}/health`, { method: "GET" });
      if (res.ok) return true;
    } catch {
      // Still booting — keep waiting.
    }
    await sleep(10_000);
  }
  return false;
};

const runSweep = async (env: Env) => {
  const base = env.BACKEND_URL.replace(/\/$/, "");

  const awake = await wakeBackend(base);
  if (!awake) {
    console.error("[deadman-cron] el backend no despertó tras 60s");
    return;
  }

  const res = await fetch(`${base}/admin/deadman/sweep`, {
    method: "POST",
    headers: {
      "X-Admin-Token": env.ADMIN_TOKEN,
      "Content-Type": "application/json",
    },
  });

  const body = await res.text();
  if (!res.ok) {
    // Surfaced in `wrangler tail`. A failed sweep means check-in emails did not
    // go out, so it must be loud rather than swallowed.
    console.error(`[deadman-cron] falló: HTTP ${res.status} — ${body}`);
    return;
  }
  console.log(`[deadman-cron] ok — ${body}`);
};

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runSweep(env));
  },

  /**
   * Manual trigger, so the sweep can be tested without waiting for 12:00 UTC.
   * Guarded by the same admin token as the endpoint it calls.
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.headers.get("X-Admin-Token") !== env.ADMIN_TOKEN) {
      return new Response("Unauthorized", { status: 401 });
    }
    await runSweep(env);
    return new Response("sweep ejecutado — revisa `wrangler tail` para el detalle\n");
  },
};
