import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Rewrite `__SITE_URL__` into the real origin inside the built sitemap/robots.
 *
 * Both files are static assets, so they cannot read `window.location` the way
 * `seo.ts` does — and both protocols *require* absolute URLs:
 *   - sitemap.org: <loc> must be a full URL, relative ones are discarded
 *   - robots.txt: the Sitemap directive must be absolute, or crawlers skip it
 *
 * Shipping them relative meant the sitemap silently discovered nothing, which
 * matters more here than on most sites: organic discovery of memorial pages is
 * the acquisition channel, not a nice-to-have.
 */

const origin = (process.env.VITE_SITE_URL ?? "https://presence.app").replace(/\/$/, "");
const dist = join(process.cwd(), "dist");

// While the backend isn't wired up yet, the site loads but every API call
// fails. Letting Google index that is worse than not being indexed at all:
// the first impression it caches is a broken product. VITE_NOINDEX=1 ships a
// blocking robots.txt instead; drop the flag once the API is live.
if (process.env.VITE_NOINDEX === "1") {
  await writeFile(
    join(dist, "robots.txt"),
    "# Despliegue provisional: el backend todavía no está conectado.\nUser-agent: *\nDisallow: /\n"
  );
  console.log("[seo] robots.txt en NOINDEX — el sitio no se indexará");
}

for (const file of ["sitemap.xml", "robots.txt"]) {
  if (process.env.VITE_NOINDEX === "1" && file === "robots.txt") continue;
  const path = join(dist, file);
  try {
    const raw = await readFile(path, "utf8");
    await writeFile(path, raw.replaceAll("__SITE_URL__", origin));
  } catch (err) {
    if ((err && typeof err === "object" && "code" in err && err.code === "ENOENT")) {
      console.warn(`[seo] ${file} no está en dist/, se omite`);
      continue;
    }
    throw err;
  }
}

console.log(`[seo] sitemap.xml y robots.txt apuntando a ${origin}`);
