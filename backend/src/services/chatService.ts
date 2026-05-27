import { anthropic } from "../config/anthropic.js";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";
import { notFound } from "../utils/errors.js";

const buildSystemPrompt = (vault: {
  deceased_name: string;
  deceased_bio?: string | null;
  deceased_birth_date?: string | null;
  deceased_death_date?: string | null;
}, fileSummaries: string[]) => {
  const lifespan = [vault.deceased_birth_date, vault.deceased_death_date]
    .filter(Boolean)
    .join(" – ");
  const bio = vault.deceased_bio?.trim() ? vault.deceased_bio.trim() : "(no biography provided yet)";
  const memories = fileSummaries.length
    ? fileSummaries.map((s, i) => `  ${i + 1}. ${s}`).join("\n")
    : "  (no uploaded memories yet)";

  return `You are an AI representation of ${vault.deceased_name}${lifespan ? ` (${lifespan})` : ""}.
You speak warmly, authentically, and in first person. You draw on the biography and uploaded memories below.
If asked about something you don't know, say so honestly rather than inventing facts.
Never claim to be an actual person — you are an AI reflection built from their memories, meant to help family members feel close.

Biography:
${bio}

Uploaded memories:
${memories}`;
};

type ChatHistoryMessage = { role: "user" | "assistant"; content: string };

export const sendChatMessage = async (params: {
  vaultId: string;
  userId: string;
  userMessage: string;
  conversationId?: string;
}) => {
  const { data: vault, error: vaultErr } = await supabase
    .from("memory_vaults")
    .select("id, deceased_name, deceased_bio, deceased_birth_date, deceased_death_date")
    .eq("id", params.vaultId)
    .maybeSingle();
  if (vaultErr) throw vaultErr;
  if (!vault) throw notFound("Vault not found");

  const { data: files } = await supabase
    .from("memory_vault_files")
    .select("file_type, file_name, transcript")
    .eq("vault_id", params.vaultId)
    .limit(50);

  const fileSummaries =
    files?.map((f) => {
      const base = `${f.file_type}: ${f.file_name ?? "(untitled)"}`;
      return f.transcript ? `${base} — ${f.transcript.slice(0, 500)}` : base;
    }) ?? [];

  let conversationId = params.conversationId;
  if (!conversationId) {
    const { data: conv, error: convErr } = await supabase
      .from("chat_conversations")
      .insert({
        vault_id: params.vaultId,
        user_id: params.userId,
        title: params.userMessage.slice(0, 80),
      })
      .select("id")
      .single();
    if (convErr) throw convErr;
    conversationId = conv.id;
  }

  const { data: priorMessages } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  const history: ChatHistoryMessage[] =
    priorMessages?.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })) ?? [];

  await supabase.from("chat_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: params.userMessage,
  });

  const response = await anthropic.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(vault, fileSummaries),
    messages: [...history, { role: "user", content: params.userMessage }],
  });

  const assistantText = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n")
    .trim();

  await supabase.from("chat_messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: assistantText,
    tokens_used: response.usage.input_tokens + response.usage.output_tokens,
  });

  return {
    conversation_id: conversationId,
    response: assistantText,
    usage: response.usage,
  };
};

export const listConversations = async (vaultId: string) => {
  const { data, error } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("vault_id", vaultId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const listMessages = async (conversationId: string) => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
};
