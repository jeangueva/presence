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
