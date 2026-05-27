import { anthropic } from "../config/anthropic.js";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";
import { badRequest, notFound } from "../utils/errors.js";
import { logActivity } from "./vaultExtrasService.js";

const SYSTEM_PROMPT = `Eres un biógrafo cuidadoso, cálido y respetuoso. Vas a redactar una biografía coherente y emotiva de una persona, basándote ÚNICAMENTE en la información proporcionada (biografía base, archivos subidos por la familia y transcripciones de audios). No inventes hechos. Si hay vacíos, omítelos.

Estructura sugerida (4-7 párrafos, prosa corrida en español):
1. Apertura: quién fue, en una frase memorable.
2. Origen, infancia, vínculos familiares.
3. Carácter, forma de hablar, gestos, valores.
4. Momentos significativos y pasiones.
5. Cómo amaba y era amada/o.
6. Legado e impacto en quienes la/lo conocieron.
7. Cierre breve.

Voz: narrativa en tercera persona, presente y pasado mezclados con naturalidad. Honra a la persona. Evita clichés vacíos.`;

export const generateBiography = async (vaultId: string, ownerId: string) => {
  // Owner check + fetch vault content.
  const { data: vault, error } = await supabase
    .from("memory_vaults")
    .select(
      "id, user_id, deceased_name, deceased_bio, deceased_birth_date, deceased_death_date"
    )
    .eq("id", vaultId)
    .maybeSingle();
  if (error) throw error;
  if (!vault) throw notFound("Vault not found");
  if (vault.user_id !== ownerId) throw badRequest("Solo el dueño puede generar la biografía");

  const { data: files } = await supabase
    .from("memory_vault_files")
    .select("file_type, file_name, transcript")
    .eq("vault_id", vaultId)
    .limit(80);

  const fileSummaries = (files ?? [])
    .map((f) => {
      const base = `[${f.file_type}] ${f.file_name ?? "(sin nombre)"}`;
      if (f.transcript) {
        const t = f.transcript.length > 1200 ? `${f.transcript.slice(0, 1200)}…` : f.transcript;
        return `${base}\n  Transcripción: ${t}`;
      }
      return base;
    })
    .join("\n");

  const lifespan = [vault.deceased_birth_date, vault.deceased_death_date]
    .filter(Boolean)
    .join(" – ");

  const userPrompt = `Persona: ${vault.deceased_name}${lifespan ? ` (${lifespan})` : ""}

Biografía base proporcionada por la familia:
${vault.deceased_bio?.trim() || "(sin biografía escrita aún — usa solo los archivos)"}

Materiales subidos (archivos + transcripciones de audios):
${fileSummaries || "(ningún archivo subido)"}

Redacta la biografía siguiendo la estructura. Si no hay suficiente material, escribe una biografía más corta y honesta sobre lo que sí sabes.`;

  const response = await anthropic.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 2500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n")
    .trim();

  const generatedAt = new Date().toISOString();
  const { error: updErr } = await supabase
    .from("memory_vaults")
    .update({ ai_biography: text, ai_biography_generated_at: generatedAt })
    .eq("id", vaultId);
  if (updErr) throw updErr;

  await logActivity({ vaultId, actorUserId: ownerId, action: "biography_generated" });

  return { biography: text, generated_at: generatedAt };
};

export const updateBiography = async (vaultId: string, ownerId: string, text: string) => {
  const { data: vault, error } = await supabase
    .from("memory_vaults")
    .select("user_id")
    .eq("id", vaultId)
    .maybeSingle();
  if (error) throw error;
  if (!vault) throw notFound("Vault not found");
  if (vault.user_id !== ownerId) throw badRequest("Solo el dueño puede editar la biografía");

  const generatedAt = new Date().toISOString();
  const { error: updErr } = await supabase
    .from("memory_vaults")
    .update({ ai_biography: text, ai_biography_generated_at: generatedAt })
    .eq("id", vaultId);
  if (updErr) throw updErr;

  await logActivity({
    vaultId,
    actorUserId: ownerId,
    action: "biography_generated",
    metadata: { manual: true },
  });

  return { biography: text, generated_at: generatedAt };
};

export const getBiography = async (vaultId: string) => {
  const { data, error } = await supabase
    .from("memory_vaults")
    .select("ai_biography, ai_biography_generated_at")
    .eq("id", vaultId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound("Vault not found");
  return { biography: data.ai_biography, generated_at: data.ai_biography_generated_at };
};
