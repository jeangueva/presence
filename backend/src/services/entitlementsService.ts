import { supabase } from "../config/supabase.js";
import {
  DEFAULT_PLAN,
  PLAN_ORDER,
  PLANS,
  isUnlimited,
  type Plan,
  type PlanId,
} from "../config/plans.js";
import { QuotaExceededError } from "../utils/billingErrors.js";

const startOfMonthIso = () => {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

const cheapestPlanWithRoom = (
  currentPlanId: PlanId,
  predicate: (p: Plan) => boolean
): PlanId => {
  // Search PLAN_ORDER after current; if nothing fits, point at the top tier.
  const idx = PLAN_ORDER.indexOf(currentPlanId);
  for (let i = Math.max(0, idx + 1); i < PLAN_ORDER.length; i++) {
    const candidate = PLANS[PLAN_ORDER[i]];
    if (predicate(candidate)) return candidate.id;
  }
  return PLAN_ORDER[PLAN_ORDER.length - 1];
};

// Accounts created before the repricing carry the old tier names. Map them
// forward on read so nobody loses access while migration 0013 rolls out.
const LEGACY_TIER_MAP: Record<string, PlanId> = {
  free: "memorial",
  personal: "legado",
  family: "vault",
};

const normalizeTier = (raw: string | null | undefined): PlanId => {
  const tier = raw ?? DEFAULT_PLAN;
  if (PLANS[tier as PlanId]) return tier as PlanId;
  return LEGACY_TIER_MAP[tier] ?? DEFAULT_PLAN;
};

/**
 * Resolve a user's active plan. Falls back to the free tier if subscription_status
 * isn't "active" or if the period_end has passed. If migration 0006 hasn't
 * been applied yet (status/period_end columns missing), we still return the
 * plan based on subscription_tier alone — no crash.
 */
export const getActivePlanId = async (userId: string): Promise<PlanId> => {
  let row: {
    subscription_tier?: string | null;
    subscription_status?: string | null;
    subscription_period_end?: string | null;
    legado_purchased_at?: string | null;
  } | null = null;

  const full = await supabase
    .from("users")
    .select(
      "subscription_tier, subscription_status, subscription_period_end, legado_purchased_at"
    )
    .eq("id", userId)
    .maybeSingle();

  if (full.error) {
    console.warn(
      "[entitlements] full users select failed (¿migración 0006 sin aplicar?), fallback minimal:",
      full.error.message
    );
    const minimal = await supabase
      .from("users")
      .select("subscription_tier")
      .eq("id", userId)
      .maybeSingle();
    if (minimal.error) {
      console.error("[entitlements] minimal users select también falló:", minimal.error);
      return DEFAULT_PLAN;
    }
    row = minimal.data;
  } else {
    row = full.data;
  }

  if (!row) return DEFAULT_PLAN;

  // What the user owns outright. A one-time purchase never lapses — that is
  // the whole promise of "pago único" — so it is the floor they can never drop
  // below, independent of any subscription state.
  const owned: PlanId = row.legado_purchased_at ? "legado" : DEFAULT_PLAN;

  const tier = normalizeTier(row.subscription_tier);
  if (PLANS[tier].billing !== "monthly") return owned;

  const status = row.subscription_status ?? "active";
  const lapsed =
    (status !== "active" && status !== "trialing" && status !== "authorized") ||
    (!!row.subscription_period_end &&
      new Date(row.subscription_period_end).getTime() < Date.now());

  return lapsed ? owned : tier;
};

export const getPlan = async (userId: string): Promise<Plan> => {
  const id = await getActivePlanId(userId);
  return PLANS[id];
};

// ---------- Usage counters ----------

const countVaults = async (userId: string) => {
  const { count } = await supabase
    .from("memory_vaults")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", userId);
  return count ?? 0;
};

const countFilesInVault = async (vaultId: string) => {
  const { count } = await supabase
    .from("memory_vault_files")
    .select("id", { head: true, count: "exact" })
    .eq("vault_id", vaultId);
  return count ?? 0;
};

const countMemorials = async (userId: string) => {
  const { count } = await supabase
    .from("memorials")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", userId);
  return count ?? 0;
};

const countBiogenThisMonth = async (userId: string) => {
  // We log every generation in vault_activity with action = "biography_generated".
  // Join through memory_vaults to scope by user.
  const { data: vaults } = await supabase
    .from("memory_vaults")
    .select("id")
    .eq("user_id", userId);
  const ids = (vaults ?? []).map((v) => v.id);
  if (ids.length === 0) return 0;
  const { count } = await supabase
    .from("vault_activity")
    .select("id", { head: true, count: "exact" })
    .in("vault_id", ids)
    .eq("action", "biography_generated")
    .gte("created_at", startOfMonthIso());
  return count ?? 0;
};

const countChatThisMonth = async (userId: string) => {
  // chat_conversations has user_id; chat_messages has only conversation_id.
  // We count messages where role = 'user' and conversation belongs to this user.
  const { data: convs } = await supabase
    .from("chat_conversations")
    .select("id")
    .eq("user_id", userId);
  const ids = (convs ?? []).map((c) => c.id);
  if (ids.length === 0) return 0;
  const { count } = await supabase
    .from("chat_messages")
    .select("id", { head: true, count: "exact" })
    .in("conversation_id", ids)
    .eq("role", "user")
    .gte("created_at", startOfMonthIso());
  return count ?? 0;
};

const storageUsedMb = async (userId: string) => {
  // Sum file_size across all this user's vault files.
  const { data: vaults } = await supabase
    .from("memory_vaults")
    .select("id")
    .eq("user_id", userId);
  const ids = (vaults ?? []).map((v) => v.id);
  if (ids.length === 0) return 0;
  const { data: files } = await supabase
    .from("memory_vault_files")
    .select("file_size")
    .in("vault_id", ids);
  const bytes = (files ?? []).reduce((sum, f) => sum + (f.file_size ?? 0), 0);
  return Math.round(bytes / (1024 * 1024));
};

export const getUsageSnapshot = async (userId: string) => {
  const plan = await getPlan(userId);
  const [vaults, memorials, biogen, chat, storage] = await Promise.all([
    countVaults(userId),
    countMemorials(userId),
    countBiogenThisMonth(userId),
    countChatThisMonth(userId),
    storageUsedMb(userId),
  ]);
  return {
    plan: plan.id,
    limits: plan.limits,
    usage: {
      vaults,
      memorials,
      biography_generations_this_month: biogen,
      chat_messages_this_month: chat,
      storage_mb: storage,
    },
  };
};

// ---------- Enforcement helpers (throw QuotaExceededError if blocked) ----------

export const enforceCanCreateVault = async (userId: string) => {
  const plan = await getPlan(userId);
  if (isUnlimited(plan.limits.vaults)) return;
  const used = await countVaults(userId);
  if (used >= plan.limits.vaults) {
    throw new QuotaExceededError({
      reason: "vaults",
      current_plan: plan.id,
      required_plan: cheapestPlanWithRoom(plan.id, (p) =>
        isUnlimited(p.limits.vaults) || p.limits.vaults > used
      ),
      limit: plan.limits.vaults,
      used,
      message: `Tu plan ${plan.name} permite ${plan.limits.vaults} Memory Vault${plan.limits.vaults === 1 ? "" : "s"}.`,
    });
  }
};

export const enforceCanUploadFile = async (userId: string, vaultId: string, sizeBytes: number) => {
  const plan = await getPlan(userId);
  const [filesInVault, storageMb] = await Promise.all([
    countFilesInVault(vaultId),
    storageUsedMb(userId),
  ]);
  if (!isUnlimited(plan.limits.files_per_vault) && filesInVault >= plan.limits.files_per_vault) {
    throw new QuotaExceededError({
      reason: "files_per_vault",
      current_plan: plan.id,
      required_plan: cheapestPlanWithRoom(plan.id, (p) =>
        isUnlimited(p.limits.files_per_vault) || p.limits.files_per_vault > filesInVault
      ),
      limit: plan.limits.files_per_vault,
      used: filesInVault,
      message: `Tu plan ${plan.name} permite ${plan.limits.files_per_vault} archivos por vault.`,
    });
  }
  const newTotalMb = Math.ceil((storageMb * 1024 * 1024 + sizeBytes) / (1024 * 1024));
  if (newTotalMb > plan.limits.storage_mb) {
    throw new QuotaExceededError({
      reason: "storage_mb",
      current_plan: plan.id,
      required_plan: cheapestPlanWithRoom(plan.id, (p) => p.limits.storage_mb > newTotalMb),
      limit: plan.limits.storage_mb,
      used: storageMb,
      message: `Tu plan ${plan.name} permite ${plan.limits.storage_mb} MB de almacenamiento.`,
    });
  }
};

export const enforceCanCreateMemorial = async (userId: string) => {
  const plan = await getPlan(userId);
  if (isUnlimited(plan.limits.memorials)) return;
  const used = await countMemorials(userId);
  if (used >= plan.limits.memorials) {
    throw new QuotaExceededError({
      reason: "memorials",
      current_plan: plan.id,
      required_plan: cheapestPlanWithRoom(plan.id, (p) =>
        isUnlimited(p.limits.memorials) || p.limits.memorials > used
      ),
      limit: plan.limits.memorials,
      used,
      message:
        plan.limits.memorials === 0
          ? `Tu plan ${plan.name} no incluye memoriales públicos.`
          : `Tu plan ${plan.name} permite ${plan.limits.memorials} memoriales.`,
    });
  }
};

export const enforceCanGenerateBiography = async (userId: string) => {
  const plan = await getPlan(userId);
  if (isUnlimited(plan.limits.biography_generations_per_month)) return;
  const used = await countBiogenThisMonth(userId);
  if (used >= plan.limits.biography_generations_per_month) {
    throw new QuotaExceededError({
      reason: "biography_generations_per_month",
      current_plan: plan.id,
      required_plan: cheapestPlanWithRoom(plan.id, (p) =>
        isUnlimited(p.limits.biography_generations_per_month) ||
        p.limits.biography_generations_per_month > used
      ),
      limit: plan.limits.biography_generations_per_month,
      used,
      message: `Has usado tus ${plan.limits.biography_generations_per_month} biografías de este mes.`,
    });
  }
};

export const enforceCanSendChatMessage = async (userId: string) => {
  const plan = await getPlan(userId);
  if (isUnlimited(plan.limits.chat_messages_per_month)) return;
  const used = await countChatThisMonth(userId);
  if (used >= plan.limits.chat_messages_per_month) {
    throw new QuotaExceededError({
      reason: "chat_messages_per_month",
      current_plan: plan.id,
      required_plan: cheapestPlanWithRoom(plan.id, (p) =>
        isUnlimited(p.limits.chat_messages_per_month) ||
        p.limits.chat_messages_per_month > used
      ),
      limit: plan.limits.chat_messages_per_month,
      used,
      message: `Has usado tus ${plan.limits.chat_messages_per_month} mensajes de este mes.`,
    });
  }
};

/**
 * The legacy planner, its generated document and the dead-man's switch are the
 * paid product. The memorial tier can see that they exist but not fill them in.
 */
export const enforceCanUseLegacyPlanner = async (userId: string) => {
  const plan = await getPlan(userId);
  if (plan.limits.legacy_planner) return;
  throw new QuotaExceededError({
    reason: "legacy_planner",
    current_plan: plan.id,
    required_plan: cheapestPlanWithRoom(plan.id, (p) => p.limits.legacy_planner),
    limit: 0,
    used: 0,
    message: "Planificar tu legado es parte de Legado, un pago único.",
  });
};
