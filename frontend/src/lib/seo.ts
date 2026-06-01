/**
 * SEO + structured data helpers. One source of truth for site constants and
 * schema builders so the JSON-LD stays consistent across pages.
 */

// Origin used for canonicals + absolute URLs in schemas. Falls back to a
// reasonable default if we're in SSG/build-time. In runtime we use the actual
// window.location.origin so things work on staging/preview URLs too.
export const SITE_ORIGIN =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "https://presence.app";

export const SITE_NAME = "Presence";

export const ORG_SCHEMA = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/favicon.svg`,
};

// ---------- Schema builders ----------

export const buildServiceSchema = (params: {
  name: string;
  description: string;
  url: string;
  serviceType?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: params.name,
  description: params.description,
  url: params.url,
  serviceType: params.serviceType ?? "Digital legacy",
  provider: ORG_SCHEMA,
  areaServed: ["ES", "MX", "AR", "CO", "CL", "PE", "UY"],
});

export const buildFaqSchema = (faqs: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
});

export const buildPricingSchema = (plans: {
  name: string;
  description: string;
  priceMonthlyUsd: number;
}[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: plans.map((plan, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      name: `${SITE_NAME} ${plan.name}`,
      description: plan.description,
      provider: ORG_SCHEMA,
      offers: {
        "@type": "Offer",
        price: plan.priceMonthlyUsd,
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: plan.priceMonthlyUsd,
          priceCurrency: "USD",
          billingDuration: "P1M",
          unitText: "MONTH",
        },
        availability: "https://schema.org/InStock",
        url: `${SITE_ORIGIN}/pricing`,
      },
    },
  })),
});

export const buildPersonSchema = (params: {
  name: string;
  birthDate?: string | null;
  deathDate?: string | null;
  description?: string | null;
  image?: string | null;
  url: string;
}) => {
  const out: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: params.name,
    url: params.url,
  };
  if (params.birthDate) out.birthDate = params.birthDate;
  if (params.deathDate) out.deathDate = params.deathDate;
  if (params.description) out.description = params.description;
  if (params.image) out.image = params.image;
  return out;
};

export const buildBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((b, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: b.name,
    item: b.url,
  })),
});
