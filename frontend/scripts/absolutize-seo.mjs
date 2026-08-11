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

for (const file of ["sitemap.xml", "robots.txt"]) {
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
