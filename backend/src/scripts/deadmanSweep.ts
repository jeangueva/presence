import { runSweep } from "../services/deadmanService.js";

/**
 * Daily entry point for the dead-man's switch, run by the Render cron job.
 *
 * It calls the service directly instead of POSTing to /admin/deadman/sweep:
 * no admin token in a second place, no dependency on the web service being
 * awake (Render's free tier sleeps after 15 minutes), and a non-zero exit code
 * on failure so a broken sweep shows up as a failed cron run instead of a 200
 * with an error body nobody reads.
 */
const main = async () => {
  const started = Date.now();
  try {
    const result = await runSweep();
    console.log(
      `[deadman-sweep] ok in ${Date.now() - started}ms —`,
      `check-ins enviados: ${result.checkins_sent},`,
      `periodos de gracia iniciados: ${result.grace_started}`
    );
    process.exit(0);
  } catch (err) {
    console.error("[deadman-sweep] FAILED:", err);
    process.exit(1);
  }
};

void main();
