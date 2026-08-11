// Mirror of backend/src/config/plans.ts — kept in sync manually for now.
// If you change pricing tiers, update both files.

export type PlanId = "memorial" | "legado" | "vault";

export type PlanLimits = {
  vaults: number;
  files_per_vault: number;
  memorials: number;
  biography_generations_per_month: number;
  chat_messages_per_month: number;
  storage_mb: number;
  legacy_planner: boolean;
};

export type BillingMode = "free" | "one_time" | "monthly";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  price_usd: number;
  billing: BillingMode;
  limits: PlanLimits;
  highlights: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  memorial: {
    id: "memorial",
    name: "Memorial",
    tagline: "Una página para recordar a alguien. Gratis, para siempre.",
    price_usd: 0,
    billing: "free",
    limits: {
      vaults: 1,
      files_per_vault: 20,
      memorials: 1,
      biography_generations_per_month: 1,
      chat_messages_per_month: 20,
      storage_mb: 500,
      legacy_planner: false,
    },
    highlights: [
      "1 memorial público con libro de visitas",
      "20 fotos, audios o documentos",
      "1 biografía escrita con IA",
      "20 mensajes de chat para probarlo",
      "500 MB de almacenamiento",
    ],
  },
  legado: {
    id: "legado",
    name: "Legado",
    tagline: "Deja todo dicho. Un solo pago.",
    price_usd: 99,
    billing: "one_time",
    limits: {
      vaults: 1,
      files_per_vault: 50,
      memorials: 3,
      biography_generations_per_month: 3,
      chat_messages_per_month: 50,
      storage_mb: 2_000,
      legacy_planner: true,
    },
    highlights: [
      "Todo lo del Memorial",
      "Tus últimos deseos, patrimonio y herederos",
      "Tu documento generado y sellado",
      "Mensajes póstumos con check-in automático",
      "3 memoriales públicos",
      "2 GB de almacenamiento",
      "Pago único — sin suscripción",
    ],
  },
  vault: {
    id: "vault",
    name: "Vault IA",
    tagline: "Conversa con quien ya no está.",
    price_usd: 12,
    billing: "monthly",
    limits: {
      vaults: 5,
      files_per_vault: 200,
      memorials: 5,
      biography_generations_per_month: 20,
      chat_messages_per_month: 500,
      storage_mb: 10_000,
      legacy_planner: true,
    },
    highlights: [
      "Todo lo del Legado",
      "5 Memory Vaults",
      "500 mensajes de chat al mes",
      "200 archivos por vault, con transcripción",
      "20 biografías con IA al mes",
      "10 GB de almacenamiento",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["memorial", "legado", "vault"];
export const DEFAULT_PLAN: PlanId = "memorial";

export const formatLimit = (n: number) => (n === -1 ? "∞" : n.toLocaleString("es"));

/** "gratis" · "pago único" · "/mes" — the suffix next to the price. */
export const billingLabel = (plan: Plan) =>
  plan.billing === "free" ? "gratis" : plan.billing === "one_time" ? "pago único" : "/mes";
