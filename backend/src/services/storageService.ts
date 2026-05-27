import sharp from "sharp";
import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";

export type UploadResult = {
  url: string;
  path: string;
};

const sanitizeName = (name: string) => name.replace(/[^\w.\-]+/g, "_");

const ensureSupabase = () => {
  if (env.STORAGE_PROVIDER !== "supabase") {
    throw new Error(`Storage provider "${env.STORAGE_PROVIDER}" not implemented yet`);
  }
};

const MAX_IMAGE_DIMENSION = 2400;
const JPEG_QUALITY = 82;

/**
 * Resize large images to max 2400px (longest side) and re-encode as JPEG with
 * quality 82. Bandwidth + storage savings of ~70% on typical phone photos with
 * imperceptible quality loss. Non-image mimetypes pass through unchanged.
 */
const optimizeIfImage = async (
  buffer: Buffer,
  mimetype: string,
  originalName: string
): Promise<{ buffer: Buffer; mimetype: string; name: string }> => {
  if (!mimetype.startsWith("image/")) return { buffer, mimetype, name: originalName };
  // Skip animated GIFs (sharp would flatten them); they're rare anyway.
  if (mimetype === "image/gif") return { buffer, mimetype, name: originalName };
  try {
    const img = sharp(buffer, { failOn: "none" });
    const meta = await img.metadata();
    const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
    const needsResize = longest > MAX_IMAGE_DIMENSION;
    const out = await (needsResize
      ? img.resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: "inside", withoutEnlargement: true })
      : img
    )
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
    const baseName = originalName.replace(/\.[^.]+$/, "");
    return { buffer: out, mimetype: "image/jpeg", name: `${baseName}.jpg` };
  } catch (err) {
    console.warn("[storage] image optimization failed, falling back to original:", err);
    return { buffer, mimetype, name: originalName };
  }
};

export const uploadObject = async (params: {
  buffer: Buffer;
  mimetype: string;
  originalName: string;
  pathPrefix: string;
}): Promise<UploadResult> => {
  ensureSupabase();
  const bucket = env.SUPABASE_STORAGE_BUCKET;
  const optimized = await optimizeIfImage(
    params.buffer,
    params.mimetype,
    params.originalName
  );
  const path = `${params.pathPrefix}/${Date.now()}-${sanitizeName(optimized.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, optimized.buffer, {
    contentType: optimized.mimetype,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
};

export const uploadVaultFile = async (input: {
  buffer: Buffer;
  mimetype: string;
  originalName: string;
  vaultId: string;
}): Promise<UploadResult> =>
  uploadObject({
    buffer: input.buffer,
    mimetype: input.mimetype,
    originalName: input.originalName,
    pathPrefix: `vaults/${input.vaultId}`,
  });

export const uploadMemorialPhoto = async (input: {
  buffer: Buffer;
  mimetype: string;
  originalName: string;
  memorialId: string;
}): Promise<UploadResult> =>
  uploadObject({
    buffer: input.buffer,
    mimetype: input.mimetype,
    originalName: input.originalName,
    pathPrefix: `memorials/${input.memorialId}`,
  });

export const classifyFileType = (mimetype: string): string => {
  if (mimetype.startsWith("image/")) return "photo";
  if (mimetype.startsWith("audio/")) return "audio";
  if (mimetype.startsWith("video/")) return "video";
  return "document";
};

export const deleteVaultFile = async (storagePath: string): Promise<void> => {
  ensureSupabase();
  if (!storagePath) return;
  const { error } = await supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .remove([storagePath]);
  if (error) throw error;
};

export const deleteStorageObject = deleteVaultFile;
