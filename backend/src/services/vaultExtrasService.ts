import JSZip from "jszip";
import { supabase } from "../config/supabase.js";

// ---------- Activity feed ----------
export type ActivityAction =
  | "vault_created"
  | "file_uploaded"
  | "file_deleted"
  | "access_granted"
  | "access_revoked"
  | "chat_message"
  | "biography_generated";

export const logActivity = async (params: {
  vaultId: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: ActivityAction;
  metadata?: Record<string, unknown>;
}) => {
  const { error } = await supabase.from("vault_activity").insert({
    vault_id: params.vaultId,
    actor_user_id: params.actorUserId ?? null,
    actor_email: params.actorEmail ?? null,
    action: params.action,
    metadata: params.metadata ?? null,
  });
  if (error) console.error("[activity] log failed:", error);
};

export const listActivity = async (vaultId: string, limit = 50) => {
  const { data, error } = await supabase
    .from("vault_activity")
    .select("*")
    .eq("vault_id", vaultId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
};

// ---------- Search ----------
export const searchVault = async (vaultId: string, query: string) => {
  const q = query.trim();
  if (!q) return { files: [], messages: [] };

  // Postgres ILIKE on file_name + transcript.
  const { data: files } = await supabase
    .from("memory_vault_files")
    .select("id, file_name, file_type, file_url, transcript")
    .eq("vault_id", vaultId)
    .or(`file_name.ilike.%${q}%,transcript.ilike.%${q}%`)
    .limit(30);

  // Join conversations to filter by vault.
  const { data: convs } = await supabase
    .from("chat_conversations")
    .select("id")
    .eq("vault_id", vaultId);
  const convIds = (convs ?? []).map((c) => c.id);
  let messages: Array<{ id: string; content: string; conversation_id: string; created_at: string }> =
    [];
  if (convIds.length > 0) {
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("id, content, conversation_id, created_at")
      .in("conversation_id", convIds)
      .ilike("content", `%${q}%`)
      .limit(30);
    messages = msgs ?? [];
  }

  return { files: files ?? [], messages };
};

// ---------- Export ZIP ----------
export const buildVaultExport = async (vaultId: string) => {
  const [vault, files, convs, access] = await Promise.all([
    supabase.from("memory_vaults").select("*").eq("id", vaultId).maybeSingle(),
    supabase.from("memory_vault_files").select("*").eq("vault_id", vaultId),
    supabase.from("chat_conversations").select("*").eq("vault_id", vaultId),
    supabase.from("memory_vault_access").select("*").eq("vault_id", vaultId),
  ]);

  if (!vault.data) throw new Error("Vault not found");

  const convIds = (convs.data ?? []).map((c) => c.id);
  const { data: messages } = convIds.length
    ? await supabase.from("chat_messages").select("*").in("conversation_id", convIds)
    : { data: [] };

  const zip = new JSZip();
  zip.file(
    "vault.json",
    JSON.stringify(
      {
        vault: vault.data,
        files: files.data ?? [],
        access: access.data ?? [],
        conversations: convs.data ?? [],
        messages: messages ?? [],
        exported_at: new Date().toISOString(),
      },
      null,
      2
    )
  );

  // README
  const readme = `Export del Memory Vault: ${vault.data.deceased_name}

Este archivo contiene una copia de los metadatos del vault, archivos referenciados,
conversaciones y mensajes con la IA.

Los archivos multimedia (fotos, audios, videos) NO están incluidos como binarios —
solo sus URLs públicas en Supabase Storage. Para una copia completa, descarga
manualmente cada uno desde su URL.

Generado: ${new Date().toISOString()}
`;
  zip.file("README.txt", readme);

  // Transcript-only digest
  const transcripts = (files.data ?? [])
    .filter((f) => f.transcript)
    .map((f) => `=== ${f.file_name ?? f.id} (${f.file_type}) ===\n${f.transcript}\n`)
    .join("\n");
  if (transcripts) {
    zip.file("transcripts.txt", transcripts);
  }

  // Biography
  if (vault.data.ai_biography) {
    zip.file("biography.md", `# ${vault.data.deceased_name}\n\n${vault.data.ai_biography}\n`);
  }

  return zip.generateAsync({ type: "nodebuffer" });
};
