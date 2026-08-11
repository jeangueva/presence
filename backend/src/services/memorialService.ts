import { supabase } from "../config/supabase.js";
import { conflict, forbidden, notFound } from "../utils/errors.js";
import { notifyGuestbookPending } from "./notificationService.js";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

const yearOf = (date?: string | null) => {
  if (!date) return null;
  const m = /^(\d{4})/.exec(date);
  return m ? Number(m[1]) : null;
};

export const generateUniqueSlug = async (
  name: string,
  birthDate?: string | null,
  deathDate?: string | null
): Promise<string> => {
  const base = slugify(name) || "memorial";
  const years = [yearOf(birthDate), yearOf(deathDate)].filter(Boolean).join("-");
  const candidate = years ? `${base}-${years}` : base;

  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? candidate : `${candidate}-${i + 1}`;
    const { data } = await supabase
      .from("memorials")
      .select("id")
      .eq("public_slug", slug)
      .maybeSingle();
    if (!data) return slug;
  }
  throw conflict("Could not generate unique slug");
};

// ---------- Memorial CRUD ----------

export const createFromVault = async (userId: string, vaultId: string) => {
  const { data: vault, error } = await supabase
    .from("memory_vaults")
    .select("*")
    .eq("id", vaultId)
    .maybeSingle();
  if (error) throw error;
  if (!vault) throw notFound("Vault not found");
  if (vault.user_id !== userId) throw forbidden("Not the vault owner");

  const { data: existing } = await supabase
    .from("memorials")
    .select("id")
    .eq("vault_id", vaultId)
    .maybeSingle();
  if (existing) throw conflict("A memorial already exists for this vault");

  const { data, error: insErr } = await supabase
    .from("memorials")
    .insert({
      user_id: userId,
      vault_id: vaultId,
      deceased_name: vault.deceased_name,
      deceased_bio: vault.deceased_bio,
      birth_date: vault.deceased_birth_date,
      death_date: vault.deceased_death_date,
      profile_photo_url: vault.profile_photo_url,
      public: false,
    })
    .select("*")
    .single();
  if (insErr) throw insErr;
  return data;
};

export const listMyMemorials = async (userId: string) => {
  const { data, error } = await supabase
    .from("memorials")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const getOwnedMemorial = async (memorialId: string, userId: string) => {
  const { data, error } = await supabase
    .from("memorials")
    .select("*")
    .eq("id", memorialId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound("Memorial not found");
  if (data.user_id !== userId) throw forbidden("Not the owner");
  return data;
};

export const updateMemorial = async (
  memorialId: string,
  userId: string,
  patch: Record<string, unknown>
) => {
  await getOwnedMemorial(memorialId, userId);
  const { data, error } = await supabase
    .from("memorials")
    .update(patch)
    .eq("id", memorialId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const togglePublic = async (
  memorialId: string,
  userId: string,
  isPublic: boolean
) => {
  const memorial = await getOwnedMemorial(memorialId, userId);
  let slug = memorial.public_slug as string | null;
  if (isPublic && !slug) {
    slug = await generateUniqueSlug(
      memorial.deceased_name,
      memorial.birth_date,
      memorial.death_date
    );
  }
  const { data, error } = await supabase
    .from("memorials")
    .update({ public: isPublic, public_slug: slug })
    .eq("id", memorialId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const deleteMemorial = async (memorialId: string, userId: string) => {
  await getOwnedMemorial(memorialId, userId);
  const { error } = await supabase.from("memorials").delete().eq("id", memorialId);
  if (error) throw error;
};

// ---------- Photos ----------

export const listMemorialPhotos = async (memorialId: string) => {
  const { data, error } = await supabase
    .from("memorial_photos")
    .select("*")
    .eq("memorial_id", memorialId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const recordMemorialPhoto = async (params: {
  memorialId: string;
  uploadedBy: string;
  photoUrl: string;
  storagePath: string;
  caption?: string | null;
}) => {
  const { data, error } = await supabase
    .from("memorial_photos")
    .insert({
      memorial_id: params.memorialId,
      uploaded_by: params.uploadedBy,
      photo_url: params.photoUrl,
      storage_path: params.storagePath,
      caption: params.caption ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const getMemorialPhoto = async (photoId: string, memorialId: string) => {
  const { data, error } = await supabase
    .from("memorial_photos")
    .select("*")
    .eq("id", photoId)
    .eq("memorial_id", memorialId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound("Photo not found");
  return data;
};

export const deleteMemorialPhotoRecord = async (photoId: string) => {
  const { error } = await supabase.from("memorial_photos").delete().eq("id", photoId);
  if (error) throw error;
};

export const submitGuestbookEntry = async (params: {
  memorialId: string;
  visitorName: string;
  visitorEmail?: string;
  message: string;
}) => {
  const { data, error } = await supabase
    .from("memorial_guestbook")
    .insert({
      memorial_id: params.memorialId,
      visitor_name: params.visitorName,
      visitor_email: params.visitorEmail ?? null,
      message: params.message,
      approved: false,
    })
    .select("id, created_at")
    .single();
  if (error) throw error;

  void (async () => {
    const { data: memorial } = await supabase
      .from("memorials")
      .select("user_id, deceased_name, users!memorials_user_id_fkey(email)")
      .eq("id", params.memorialId)
      .maybeSingle();
    const embedded = (memorial as unknown as { users?: { email?: string } | { email?: string }[] })?.users;
    const ownerRecord = Array.isArray(embedded) ? embedded[0] : embedded;
    const ownerEmail = ownerRecord?.email;
    if (ownerEmail) {
      await notifyGuestbookPending({
        toEmail: ownerEmail,
        memorialName: memorial?.deceased_name ?? "un memorial",
        visitorName: params.visitorName,
        message: params.message,
        memorialId: params.memorialId,
      });
    }
  })();

  return data;
};

export const listGuestbookForOwner = async (memorialId: string) => {
  const { data, error } = await supabase
    .from("memorial_guestbook")
    .select("*")
    .eq("memorial_id", memorialId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const listApprovedGuestbook = async (memorialId: string) => {
  const { data, error } = await supabase
    .from("memorial_guestbook")
    .select("id, visitor_name, message, created_at")
    .eq("memorial_id", memorialId)
    .eq("approved", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const approveGuestbookEntry = async (
  entryId: string,
  memorialId: string,
  approverId: string
) => {
  const { data, error } = await supabase
    .from("memorial_guestbook")
    .update({ approved: true, approved_by: approverId })
    .eq("id", entryId)
    .eq("memorial_id", memorialId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound("Guestbook entry not found");
  return data;
};

export const deleteGuestbookEntry = async (entryId: string, memorialId: string) => {
  const { error } = await supabase
    .from("memorial_guestbook")
    .delete()
    .eq("id", entryId)
    .eq("memorial_id", memorialId);
  if (error) throw error;
};

// ---------- Public lookup ----------

export const getPublicMemorialBySlug = async (slug: string) => {
  const { data, error } = await supabase
    .from("memorials")
    .select(
      "id, deceased_name, deceased_bio, birth_date, death_date, profile_photo_url, cover_photo_url, public_slug, created_at"
    )
    .eq("public_slug", slug)
    .eq("public", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound("Memorial not found");
  return data;
};
