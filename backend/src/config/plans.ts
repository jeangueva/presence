// Pricing tiers + per-tier limits. Single source of truth used by both the
// entitlements service (enforce on backend) and the pricing/usage UI.
// Limits use -1 to mean "unlimited".

export type PlanId = "free" | "personal" | "family";

export type PlanLimits = {
  vaults: number;
  files_per_vault: number;
  memorials: number;
  biography_generations_per_month: number;
  chat_messages_per_month: number;
  storage_mb: number;
  family_sharing: boolean;
};

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  price_usd_monthly: number;
  stripe_price_env: string | null; // env var name holding the Stripe price id
  limits: PlanLimits;
  highlights: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Empieza a honrar a alguien especial.",
    price_usd_monthly: 0,
    stripe_price_env: null,
    limits: {
      vaults: 1,
      files_per_vault: 5,
      memorials: 0,
      biography_generations_per_month: 1,
      chat_messages_per_month: 50,
      storage_mb: 100,
      family_sharing: false,
    },
    highlights: [
      "1 Memory Vault",
      "5 archivos por vault",
      "50 mensajes de chat al mes",
      "1 biografía con IA al mes",
      "100 MB de almacenamiento",
    ],
  },
  personal: {
    id: "personal",
    name: "Personal",
    tagline: "Construye un legado completo.",
    price_usd_monthly: 9,
    stripe_price_env: "STRIPE_PRICE_PERSONAL_MONTHLY",
    limits: {
      vaults: 5,
      files_per_vault: 50,
      memorials: 2,
      biography_generations_per_month: 10,
      chat_messages_per_month: 1000,
      storage_mb: 5_000,
      family_sharing: true,
    },
    highlights: [
      "5 Memory Vaults",
      "50 archivos por vault",
      "2 memoriales públicos",
      "10 biografías con IA al mes",
      "1.000 mensajes de chat al mes",
      "5 GB de almacenamiento",
      "Compartir con familia",
    ],
  },
  family: {
    id: "family",
    name: "Family",
    tagline: "Sin límites. Para toda la familia.",
    price_usd_monthly: 19,
    stripe_price_env: "STRIPE_PRICE_FAMILY_MONTHLY",
    limits: {
      vaults: -1,
      files_per_vault: 200,
      memorials: -1,
      biography_generations_per_month: -1,
      chat_messages_per_month: -1,
      storage_mb: 20_000,
      family_sharing: true,
    },
    highlights: [
      "Vaults ilimitados",
      "200 archivos por vault",
      "Memoriales ilimitados",
      "Biografías con IA ilimitadas",
      "Chat ilimitado",
      "20 GB de almacenamiento",
      "Soporte prioritario",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "personal", "family"];

export const isUnlimited = (n: number) => n === -1;
