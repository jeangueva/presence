import { createHash } from "node:crypto";
import { supabase } from "../config/supabase.js";
import { badRequest, notFound } from "../utils/errors.js";
import { escapeHtml } from "../utils/html.js";

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

const DISPOSITION_LABELS: Record<string, string> = {
  burial: "Entierro",
  cremation: "Cremación",
  donation: "Donación al cuerpo médico",
  other: "Otra",
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  property: "Propiedad",
  account: "Cuenta",
  investment: "Inversión",
  digital: "Activo digital",
  other: "Otro",
};

/** `<section>` with a heading, emitted only when it has rows to show. */
const section = (heading: string, rows: string[]): string =>
  rows.length === 0 ? "" : `<h2>${escapeHtml(heading)}</h2>\n${rows.join("\n")}`;

/** Definition row. Returns "" for blank values so the doc has no empty lines. */
const row = (label: string, value: unknown): string => {
  const v = value == null ? "" : String(value).trim();
  if (!v) return "";
  return `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(v).replace(/\n/g, "<br/>")}</p>`;
};

const compact = (rows: string[]): string[] => rows.filter(Boolean);

/**
 * Compose the will document from the structured data the user already
 * entered — final wishes, estate, heirs, assets — instead of asking them to
 * author it a second time in a rich-text editor.
 *
 * The seal hashes this composed output, so editing *any* underlying record
 * (adding an heir, changing the executor) invalidates a prior seal. That is
 * stronger tamper-evidence than hashing a hand-written blob, which could drift
 * out of sync with the data it was supposed to describe.
 *
 * `seal.valid` is recomputed live against the current composition, so a stale
 * seal never looks valid.
 */
export const buildWillDocument = async (userId: string) => {
  const [will, wishes, estate, heirs, assets, user] = await Promise.all([
    getWill(userId),
    getFinalWishes(userId),
    getEstate(userId),
    listHeirs(userId),
    listAssets(userId),
    supabase.from("users").select("full_name, email").eq("id", userId).maybeSingle(),
  ]);

  const testator =
    will?.testator_full_name || user.data?.full_name || user.data?.email || "—";
  const today = new Date().toLocaleDateString("es", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const parts: string[] = [];

  parts.push(`<h1>Disposiciones de ${escapeHtml(testator)}</h1>`);
  parts.push(
    section(
      "Otorgante",
      compact([
        row("Nombre completo", testator),
        row("Documento de identidad", will?.testator_id_number),
        row("Ciudad", will?.city),
        row("Fecha del documento", today),
      ])
    )
  );

  if (will?.declarations) {
    parts.push(section("Declaraciones", compact([row("", will.declarations)])));
  }

  parts.push(
    section(
      "Patrimonio",
      compact([
        row("Resumen", estate?.summary),
        row("Albacea", estate?.executor_name),
        row("Contacto del albacea", estate?.executor_email || estate?.executor_phone),
        row("Información notarial", estate?.notary_info),
      ])
    )
  );

  parts.push(
    section(
      "Bienes y activos",
      (assets ?? []).map((a) =>
        [
          `<p><strong>${escapeHtml(a.name)}</strong>`,
          a.asset_type ? ` — ${escapeHtml(ASSET_TYPE_LABELS[a.asset_type] ?? a.asset_type)}` : "",
          a.approximate_value ? ` · ${escapeHtml(a.approximate_value)}` : "",
          a.location ? `<br/>Ubicación: ${escapeHtml(a.location)}` : "",
          a.description ? `<br/>${escapeHtml(a.description)}` : "",
          "</p>",
        ].join("")
      )
    )
  );

  parts.push(
    section(
      "Herederos",
      (heirs ?? []).map((h) =>
        [
          `<p><strong>${escapeHtml(h.full_name)}</strong>`,
          h.relationship ? ` — ${escapeHtml(h.relationship)}` : "",
          h.inheritance_share ? `<br/>Le corresponde: ${escapeHtml(h.inheritance_share)}` : "",
          h.email ? `<br/>${escapeHtml(h.email)}` : "",
          h.notes ? `<br/>${escapeHtml(h.notes)}` : "",
          "</p>",
        ].join("")
      )
    )
  );

  parts.push(
    section(
      "Últimos deseos",
      compact([
        row(
          "Disposición del cuerpo",
          wishes?.disposition ? DISPOSITION_LABELS[wishes.disposition] ?? wishes.disposition : ""
        ),
        row("Ceremonia", wishes?.ceremony_notes),
        row("Ritos", wishes?.religious_wishes),
        row("Música y lecturas", wishes?.music_readings),
        row("Obituario", wishes?.obituary),
        row("Solicitudes especiales", wishes?.special_requests),
      ])
    )
  );

  parts.push(
    `<p class="disclaimer">Este documento recoge la voluntad declarada por el otorgante y lleva un sello de integridad criptográfica: cualquier modificación posterior altera la huella y anula el sello. No sustituye a un testamento otorgado ante notario — para efectos legales, llévalo ante uno.</p>`
  );

  const body = parts.filter(Boolean).join("\n");
  const contentHash = createHash("sha256").update(body).digest("hex");

  // A document with only the heading and the disclaimer carries no actual
  // will — treat it as empty so it cannot be sealed.
  const hasContent = parts.filter(Boolean).length > 2;

  return {
    body_html: body,
    content_hash: contentHash,
    has_content: hasContent,
    seal: {
      status: will?.status ?? "draft",
      document_hash: will?.document_hash ?? null,
      document_version: will?.document_version ?? 0,
      sealed_at: will?.sealed_at ?? null,
      valid: hasContent && !!will?.document_hash && will.document_hash === contentHash,
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
  if (!doc.has_content) {
    throw badRequest(
      "Aún no hay nada que sellar. Completa al menos tus últimos deseos o tu patrimonio."
    );
  }
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
