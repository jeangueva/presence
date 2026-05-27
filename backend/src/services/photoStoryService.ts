import { anthropic } from "../config/anthropic.js";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";

const SYSTEM_PROMPT = `Eres un narrador delicado. Vas a recibir una foto de un memorial digital y una pequeña ficha de contexto sobre la persona honrada. Escribe una micro-historia (2-4 oraciones) que evoque el momento de la foto. NO inventes hechos verificables (nombres de lugares específicos, fechas, eventos) — sugiere sin afirmar. Tono cálido, presente atemporal. Español.`;

const isHttpUrl = (s?: string | null): boolean =>
  !!s && /^https?:\/\//i.test(s);

const fetchAsBase64 = async (url: string): Promise<{ data: string; mediaType: string } | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const mediaType = res.headers.get("content-type") || "image/jpeg";
    return { data: buf.toString("base64"), mediaType };
  } catch {
    return null;
  }
};

export const generatePhotoStory = async (photoId: string, memorialId: string) => {
  const { data: photo, error: photoErr } = await supabase
    .from("memorial_photos")
    .select("*")
    .eq("id", photoId)
    .eq("memorial_id", memorialId)
    .maybeSingle();
  if (photoErr) throw photoErr;
  if (!photo) throw new Error("Photo not found");

  const { data: memorial } = await supabase
    .from("memorials")
    .select("deceased_name, deceased_bio, birth_date, death_date")
    .eq("id", memorialId)
    .maybeSingle();

  if (!isHttpUrl(photo.photo_url)) {
    throw new Error("Photo URL is not reachable");
  }

  const image = await fetchAsBase64(photo.photo_url);
  if (!image) throw new Error("Could not fetch photo bytes");

  const lifespan = [memorial?.birth_date, memorial?.death_date].filter(Boolean).join(" – ");
  const contextText = `Persona: ${memorial?.deceased_name ?? "—"}${
    lifespan ? ` (${lifespan})` : ""
  }
Biografía breve: ${memorial?.deceased_bio?.slice(0, 600) ?? "(sin biografía)"}
${photo.caption ? `Caption original: ${photo.caption}` : ""}

Mira la foto y escribe la micro-historia.`;

  const allowedMediaTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
  type AllowedMediaType = (typeof allowedMediaTypes)[number];
  const isAllowedMediaType = (s: string): s is AllowedMediaType =>
    (allowedMediaTypes as readonly string[]).includes(s);
  const mediaType: AllowedMediaType = isAllowedMediaType(image.mediaType)
    ? image.mediaType
    : "image/jpeg";

  const response = await anthropic.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 350,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: image.data },
          },
          { type: "text", text: contextText },
        ],
      },
    ],
  });

  const story = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n")
    .trim();

  return story;
};
