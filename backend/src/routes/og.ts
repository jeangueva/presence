import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../config/env.js";
import { getPublicMemorialBySlug } from "../services/memorialService.js";
import { escapeHtml, escapeJsonForScript } from "../utils/html.js";

const router = Router();

const escape = escapeHtml;

/**
 * Pre-rendered HTML with OG meta tags for social-media scrapers visiting a
 * public memorial. JS-less crawlers (Facebook, WhatsApp, LinkedIn) hit this
 * URL via a redirect rule and parse the meta tags.
 *
 * Deployment note: configure your edge (Cloudflare Worker / load balancer)
 * to route /m/:slug requests with crawler user-agents to /og/m/:slug, and
 * route everything else to the frontend SPA.
 */
router.get(
  "/m/:slug",
  asyncHandler(async (req, res) => {
    let memorial;
    try {
      memorial = await getPublicMemorialBySlug(req.params.slug);
    } catch {
      res.status(404).send("Memorial no encontrado");
      return;
    }

    const lifespanYears = [memorial.birth_date, memorial.death_date]
      .map((d) => (d ? /^(\d{4})/.exec(d)?.[1] : null))
      .filter(Boolean)
      .join(" – ");
    const title = `En memoria de ${memorial.deceased_name}${lifespanYears ? ` (${lifespanYears})` : ""}`;
    const description = (memorial.deceased_bio ?? "Un memorial digital creado en Presence.")
      .slice(0, 200);
    const image = memorial.cover_photo_url ?? memorial.profile_photo_url ?? null;
    const canonical = `${env.FRONTEND_URL.replace(/\/$/, "")}/m/${memorial.public_slug}`;
    const origin = env.FRONTEND_URL.replace(/\/$/, "");

    // Schema.org Person JSON-LD for AI Overviews + crawlers JS-less.
    const personSchema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: memorial.deceased_name,
      url: canonical,
    };
    if (memorial.birth_date) personSchema.birthDate = memorial.birth_date;
    if (memorial.death_date) personSchema.deathDate = memorial.death_date;
    if (memorial.deceased_bio) personSchema.description = memorial.deceased_bio;
    if (image) personSchema.image = image;

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Presence", item: origin },
        { "@type": "ListItem", position: 2, name: memorial.deceased_name, item: canonical },
      ],
    };

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${escape(title)} · Presence</title>
<meta name="description" content="${escape(description)}" />
<link rel="canonical" href="${escape(canonical)}" />

<meta property="og:type" content="profile" />
<meta property="og:title" content="${escape(title)}" />
<meta property="og:description" content="${escape(description)}" />
<meta property="og:url" content="${escape(canonical)}" />
<meta property="og:site_name" content="Presence" />
${image ? `<meta property="og:image" content="${escape(image)}" />` : ""}

<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />
<meta name="twitter:title" content="${escape(title)}" />
<meta name="twitter:description" content="${escape(description)}" />
${image ? `<meta name="twitter:image" content="${escape(image)}" />` : ""}

<script type="application/ld+json">${escapeJsonForScript(personSchema)}</script>
<script type="application/ld+json">${escapeJsonForScript(breadcrumbSchema)}</script>

<meta http-equiv="refresh" content="0; url=${escape(canonical)}" />
</head>
<body style="font-family:-apple-system,system-ui,sans-serif;padding:40px;color:#211922;">
<h1>${escape(title)}</h1>
<p>${escape(description)}</p>
<p><a href="${escape(canonical)}">Ir al memorial</a></p>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  })
);

export default router;
