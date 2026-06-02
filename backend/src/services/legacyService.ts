import { createHash } from "node:crypto";
import { supabase } from "../config/supabase.js";
import { notFound } from "../utils/errors.js";

// Helper: drop empty strings so PG receives null where appropriate.
const clean = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === "" || v === undefined) continue;
    out[k] = v;
  }
  return out as Partial<T>;
};

// ---------- Dependents ----------
export const listDependents = async (userId: string) => {
  const { data, error } = await supabase
    .from("legacy_dependents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};
export const createDependent = async (userId: string, input: Record<string, unknown>) => {
  const { data, error } = await supabase
    .from("legacy_dependents")
    .insert({ user_id: userId, ...clean(input) })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};
export const deleteDependent = async (userId: string, id: string) => {
  const { error } = await supabase
    .from("legacy_dependents")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
};

// ---------- Pets ----------
export const listPets = async (userId: string) => {
  const { data, error } = await supabase
    .from("legacy_pets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};
export const createPet = async (userId: string, input: Record<string, unknown>) => {
  const { data, error } = await supabase
    .from("legacy_pets")
    .insert({ user_id: userId, ...clean(input) })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};
export const deletePet = async (userId: string, id: string) => {
  const { error } = await supabase
    .from("legacy_pets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
};

// ---------- Final wishes (single row per user) ----------
export const getFinalWishes = async (userId: string) => {
  const { data, error } = await supabase
    .from("legacy_final_wishes")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
};
export const upsertFinalWishes = async (userId: string, input: Record<string, unknown>) => {
  const payload = { user_id: userId, ...clean(input), updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from("legacy_final_wishes")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

// ---------- Estate (single row per user + nested heirs/assets) ----------
export const getEstate = async (userId: string) => {
  const { data, error } = await supabase
    .from("legacy_estate")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
};
export const upsertEstate = async (userId: string, input: Record<string, unknown>) => {
  const payload = { user_id: userId, ...clean(input), updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from("legacy_estate")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const listHeirs = async (userId: string) => {
  const { data, error } = await supabase
    .from("legacy_estate_heirs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};
export const createHeir = async (userId: string, input: Record<string, unknown>) => {
  const { data, error } = await supabase
    .from("legacy_estate_heirs")
    .insert({ user_id: userId, ...clean(input) })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};
export const deleteHeir = async (userId: string, id: string) => {
  const { error } = await supabase
    .from("legacy_estate_heirs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
};

export const listAssets = async (userId: string) => {
  const { data, error } = await supabase
    .from("legacy_estate_assets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};
export const createAsset = async (userId: string, input: Record<string, unknown>) => {
  const { data, error } = await supabase
    .from("legacy_estate_assets")
    .insert({ user_id: userId, ...clean(input) })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};
export const deleteAsset = async (userId: string, id: string) => {
  const { error } = await supabase
    .from("legacy_estate_assets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
};

// ---------- Posthumous messages ----------
export const listPosthumousMessages = async (userId: string) => {
  const { data, error } = await supabase
    .from("legacy_messages")
    .select("id, recipient_email, subject, message_type, text_content, sent, sent_at, created_at")
    .eq("user_id", userId)
    .eq("trigger_type", "death")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};
export const createPosthumousMessage = async (
  userId: string,
  input: {
    recipient_email: string;
    subject: string;
    text_content: string;
    message_type: "text" | "audio" | "video";
  }
) => {
  const { data, error } = await supabase
    .from("legacy_messages")
    .insert({
      user_id: userId,
      plan_id: null,
      trigger_type: "death",
      message_type: input.message_type,
      recipient_email: input.recipient_email,
      subject: input.subject,
      text_content: input.text_content,
      sent: false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};
export const deletePosthumousMessage = async (userId: string, id: string) => {
  const { data: existing } = await supabase
    .from("legacy_messages")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing) throw notFound("Mensaje no encontrado");
  if (existing.user_id !== userId) throw notFound("Mensaje no encontrado");
  const { error } = await supabase.from("legacy_messages").delete().eq("id", id);
  if (error) throw error;
};

// ---------- Digital will (capstone document + integrity seal) ----------

export const getWill = async (userId: string) => {
  const { data, error } = await supabase
    .from("legacy_will")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
};

/**
 * Save will-specific fields. Any content edit invalidates a prior seal: the
 * stored hash would no longer match, so we drop it and revert to draft. The
 * version counter is preserved (it only advances on seal).
 */
export const upsertWill = async (userId: string, input: Record<string, unknown>) => {
  const payload = {
    user_id: userId,
    ...clean(input),
    status: "draft",
    document_hash: null,
    sealed_at: null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("legacy_will")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

// Deterministic stringify: stable key order so the hash is reproducible.
const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return `{${keys
      .map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value ?? null);
};

const pick = (row: Record<string, unknown> | null, keys: string[]) => {
  const out: Record<string, unknown> = {};
  if (!row) return out;
  for (const k of keys) out[k] = row[k] ?? null;
  return out;
};

/**
 * Assemble the full will document by aggregating every estate-plan source.
 * The `content` block is exactly what gets hashed on seal; `seal` and
 * `generated_at` are metadata and excluded from the hash.
 */
export const buildWillDocument = async (userId: string) => {
  const [will, estate, heirs, assets, wishes, dependents] = await Promise.all([
    getWill(userId),
    getEstate(userId),
    listHeirs(userId),
    listAssets(userId),
    getFinalWishes(userId),
    listDependents(userId),
  ]);

  const content = {
    testator: pick(will, ["testator_full_name", "testator_id_number", "city"]),
    declarations: will?.declarations ?? null,
    executor: pick(estate, ["executor_name", "executor_email", "executor_phone"]),
    estate_summary: estate?.summary ?? null,
    notary_info: estate?.notary_info ?? null,
    heirs: (heirs ?? []).map((h) =>
      pick(h, ["full_name", "email", "relationship", "inheritance_share", "notes"])
    ),
    assets: (assets ?? []).map((a) =>
      pick(a, ["name", "asset_type", "approximate_value", "location", "description"])
    ),
    final_wishes: pick(wishes, [
      "disposition",
      "ceremony_notes",
      "religious_wishes",
      "music_readings",
      "obituary",
      "special_requests",
    ]),
    dependents: (dependents ?? []).map((d) =>
      pick(d, ["full_name", "relationship", "caregiver_name", "caregiver_contact", "notes"])
    ),
  };

  const contentHash = createHash("sha256").update(stableStringify(content)).digest("hex");

  return {
    content,
    content_hash: contentHash,
    seal: {
      status: will?.status ?? "draft",
      document_hash: will?.document_hash ?? null,
      document_version: will?.document_version ?? 0,
      sealed_at: will?.sealed_at ?? null,
      // True only when a seal exists AND the live content still matches it.
      valid: !!will?.document_hash && will?.document_hash === contentHash,
    },
    generated_at: new Date().toISOString(),
  };
};

/**
 * Seal the current content: compute its hash, advance the version and stamp
 * the time. This is an integrity seal (tamper-evidence), not legal
 * notarization or an on-chain anchor — those remain external steps.
 */
export const sealWill = async (userId: string) => {
  const doc = await buildWillDocument(userId);
  const nextVersion = (doc.seal.document_version ?? 0) + 1;
  const payload = {
    user_id: userId,
    status: "sealed",
    document_hash: doc.content_hash,
    document_version: nextVersion,
    sealed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("legacy_will")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};
