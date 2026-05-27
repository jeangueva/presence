import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { env } from "../config/env.js";

// Groq exposes an OpenAI-compatible API, so the same SDK works for both —
// we just swap baseURL and apiKey.
const provider: { client: OpenAI; model: string; name: string } | null = (() => {
  if (env.GROQ_API_KEY) {
    return {
      client: new OpenAI({
        apiKey: env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      }),
      model: env.WHISPER_MODEL || "whisper-large-v3-turbo",
      name: "groq",
    };
  }
  if (env.OPENAI_API_KEY) {
    return {
      client: new OpenAI({ apiKey: env.OPENAI_API_KEY }),
      model: env.WHISPER_MODEL || "whisper-1",
      name: "openai",
    };
  }
  return null;
})();

export const isTranscriptionEnabled = () => provider !== null;

const MAX_BYTES = 25 * 1024 * 1024; // Whisper API limit (both Groq and OpenAI)

/**
 * Transcribe an audio (or audio track from video) buffer.
 * Returns null if transcription is disabled or fails — we never want to
 * block uploads on transcription errors.
 */
export const transcribeAudio = async (
  buffer: Buffer,
  originalName: string,
  mimetype: string
): Promise<string | null> => {
  if (!provider) {
    console.warn(
      "[transcription] skipped — neither GROQ_API_KEY nor OPENAI_API_KEY configured"
    );
    return null;
  }
  if (buffer.length > MAX_BYTES) {
    console.warn(
      `[transcription] file too large (${buffer.length} > ${MAX_BYTES} bytes), skipping`
    );
    return null;
  }

  try {
    const file = await toFile(buffer, originalName, { type: mimetype });
    const response = await provider.client.audio.transcriptions.create({
      file,
      model: provider.model,
      response_format: "text",
    });
    console.log(
      `[transcription:${provider.name}] transcribed "${originalName}" (${buffer.length} bytes) using ${provider.model}`
    );
    return typeof response === "string" ? response.trim() : String(response).trim();
  } catch (err) {
    console.error(`[transcription:${provider.name}] failed:`, err);
    return null;
  }
};
