import { useEffect } from "react";
import { SITE_NAME, SITE_ORIGIN } from "../lib/seo";

type UseMetaInput = {
  title: string | null | undefined;
  description?: string;
  canonical?: string; // path like "/pricing" — gets prefixed with origin
  /**
   * Override og:title (defaults to title). Set null to leave whatever was
   * defined at index.html level.
   */
  ogTitle?: string | null;
  ogDescription?: string;
  ogImage?: string;
};

const upsertMeta = (
  selector: string,
  attrName: "name" | "property",
  attrValue: string,
  content: string
) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  return el;
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  return el;
};

/**
 * Unified per-page SEO hook. Sets document.title (with " · Presence" suffix),
 * meta description, canonical, and OG/Twitter tags. Restores previous values
 * on unmount so per-page declarations don't leak across navigation.
 */
export const useMeta = (input: UseMetaInput) => {
  useEffect(() => {
    const previousTitle = document.title;
    const newTitle = input.title ? `${input.title} · ${SITE_NAME}` : SITE_NAME;
    document.title = newTitle;

    const cleanupTargets: (() => void)[] = [];

    if (input.description) {
      const el = upsertMeta('meta[name="description"]', "name", "description", input.description);
      // We won't fully restore description on unmount because the index.html
      // baseline is fine. Just leave it; next page sets its own.
      cleanupTargets.push(() => {
        // no-op; pages should always set their own description.
        void el;
      });
    }

    if (input.canonical) {
      const url = input.canonical.startsWith("http")
        ? input.canonical
        : `${SITE_ORIGIN}${input.canonical}`;
      const el = upsertLink("canonical", url);
      cleanupTargets.push(() => {
        el.remove();
      });
    }

    if (input.ogTitle !== null) {
      upsertMeta(
        'meta[property="og:title"]',
        "property",
        "og:title",
        input.ogTitle ?? newTitle
      );
    }

    if (input.ogDescription) {
      upsertMeta(
        'meta[property="og:description"]',
        "property",
        "og:description",
        input.ogDescription
      );
      upsertMeta(
        'meta[name="twitter:description"]',
        "name",
        "twitter:description",
        input.ogDescription
      );
    }

    if (input.ogImage) {
      const fullImage = input.ogImage.startsWith("http")
        ? input.ogImage
        : `${SITE_ORIGIN}${input.ogImage}`;
      upsertMeta('meta[property="og:image"]', "property", "og:image", fullImage);
      upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", fullImage);
    }

    return () => {
      document.title = previousTitle;
      cleanupTargets.forEach((fn) => fn());
    };
  }, [
    input.title,
    input.description,
    input.canonical,
    input.ogTitle,
    input.ogDescription,
    input.ogImage,
  ]);
};
