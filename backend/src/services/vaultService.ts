import { supabase } from "../config/supabase.js";
import { forbidden, notFound } from "../utils/errors.js";
import { notifyVaultShared } from "./notificationService.js";

export type VaultInput = {
  deceased_name: string;
  deceased_bio?: string;
  deceased_birth_date?: string;
  deceased_death_date?: string;
};

export const createVault = async (userId: string, input: VaultInput) => {
  const { data, error } = await supabase
    .from("memory_vaults")
    .insert({ user_id: userId, ...input })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const listVaultsForUser = async (userId: string, userEmail: string) => {
  // Vaults the user owns.
  const { data: owned, error: ownedErr } = await supabase
    .from("memory_vaults")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (ownedErr) throw ownedErr;

  // Vaults shared with this user via memory_vault_access (matched by email).
  const { data: accessRows, error: accessErr } = await supabase
    .from("memory_vault_access")
    .select("vault_id, role, granted_at, memory_vaults(*)")
    .eq("email", userEmail);
  if (accessErr) throw accessErr;

  const ownedIds = new Set((owned ?? []).map((v) => v.id));
  const shared = (accessRows ?? [])
    .map((r) => {
      // Supabase types embedded joins as arrays even when the FK guarantees one row.
      const embedded = r.memory_vaults as unknown;
      const vault = Array.isArray(embedded) ? embedded[0] : embedded;
      if (!vault) return null;
      if (ownedIds.has(vault.id as string)) return null;
      return { ...(vault as Record<string, unknown>), _access_role: r.role, _shared: true };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const ownedTagged = (owned ?? []).map((v) => ({ ...v, _shared: false }));
  return [...ownedTagged, ...shared];
};

export const getVault = async (vaultId: string, userId: string, userEmail: string) => {
  const { data: vault, error } = await supabase
    .from("memory_vaults")
    .select("*")
    .eq("id", vaultId)
    .maybeSingle();
  if (error) throw error;
  if (!vault) throw notFound("Vault not found");

  if (vault.user_id !== userId) {
    const { data: access } = await supabase
      .from("memory_vault_access")
      .select("id")
      .eq("vault_id", vaultId)
      .eq("email", userEmail)
      .maybeSingle();
    if (!access && !vault.public) throw forbidden("No access to this vault");
  }

  return vault;
};

export const updateVault = async (
  vaultId: string,
  userId: string,
  patch: Partial<VaultInput>
) => {
  const { data: vault } = await supabase
    .from("memory_vaults")
    .select("user_id")
    .eq("id", vaultId)
    .maybeSingle();
  if (!vault) throw notFound("Vault not found");
  if (vault.user_id !== userId) throw forbidden("Only the owner can update this vault");

  const { data, error } = await supabase
    .from("memory_vaults")
    .update(patch)
    .eq("id", vaultId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const deleteVault = async (vaultId: string, userId: string) => {
  const { data: vault } = await supabase
    .from("memory_vaults")
    .select("user_id")
    .eq("id", vaultId)
    .maybeSingle();
  if (!vault) throw notFound("Vault not found");
  if (vault.user_id !== userId) throw forbidden("Only the owner can delete this vault");

  const { error } = await supabase.from("memory_vaults").delete().eq("id", vaultId);
  if (error) throw error;
};

export const listVaultFiles = async (vaultId: string) => {
  const { data, error } = await supabase
    .from("memory_vault_files")
    .select("*")
    .eq("vault_id", vaultId)
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const recordVaultFile = async (params: {
  vaultId: string;
  uploadedBy: string;
  fileType: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  storagePath: string;
}) => {
  const { data, error } = await supabase
    .from("memory_vault_files")
    .insert({
      vault_id: params.vaultId,
      uploaded_by: params.uploadedBy,
      file_type: params.fileType,
      file_url: params.fileUrl,
      file_name: params.fileName,
      file_size: params.fileSize,
      storage_path: params.storagePath,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const getVaultFile = async (fileId: string, vaultId: string) => {
  const { data, error } = await supabase
    .from("memory_vault_files")
    .select("*")
    .eq("id", fileId)
    .eq("vault_id", vaultId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound("File not found");
  return data;
};

export const deleteVaultFileRecord = async (fileId: string) => {
  const { error } = await supabase.from("memory_vault_files").delete().eq("id", fileId);
  if (error) throw error;
};

export const updateVaultFileTranscript = async (fileId: string, transcript: string) => {
  const { error } = await supabase
    .from("memory_vault_files")
    .update({ transcript })
    .eq("id", fileId);
  if (error) throw error;
};

export const grantVaultAccess = async (
  vaultId: string,
  ownerId: string,
  email: string,
  role: string
) => {
  const { data: vault } = await supabase
    .from("memory_vaults")
    .select("user_id")
    .eq("id", vaultId)
    .maybeSingle();
  if (!vault) throw notFound("Vault not found");
  if (vault.user_id !== ownerId) throw forbidden("Only the owner can grant access");

  const { data, error } = await supabase
    .from("memory_vault_access")
    .upsert(
      { vault_id: vaultId, email, role, granted_by: ownerId },
      { onConflict: "vault_id,email" }
    )
    .select("*")
    .single();
  if (error) throw error;

  // Fire-and-forget email notification.
  void (async () => {
    const [ownerUser, vaultFull] = await Promise.all([
      supabase.from("users").select("full_name, email").eq("id", ownerId).maybeSingle(),
      supabase.from("memory_vaults").select("deceased_name").eq("id", vaultId).maybeSingle(),
    ]);
    const inviterName = ownerUser.data?.full_name || ownerUser.data?.email || "Alguien";
    const vaultName = vaultFull.data?.deceased_name ?? "un vault";
    await notifyVaultShared({ toEmail: email, inviterName, vaultName, role });
  })();

  return data;
};

export const listVaultAccess = async (vaultId: string, ownerId: string) => {
  const { data: vault } = await supabase
    .from("memory_vaults")
    .select("user_id")
    .eq("id", vaultId)
    .maybeSingle();
  if (!vault) throw notFound("Vault not found");
  if (vault.user_id !== ownerId) throw forbidden("Only the owner can list access");

  const { data, error } = await supabase
    .from("memory_vault_access")
    .select("*")
    .eq("vault_id", vaultId)
    .order("granted_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const revokeVaultAccess = async (
  vaultId: string,
  accessId: string,
  ownerId: string
) => {
  const { data: vault } = await supabase
    .from("memory_vaults")
    .select("user_id")
    .eq("id", vaultId)
    .maybeSingle();
  if (!vault) throw notFound("Vault not found");
  if (vault.user_id !== ownerId) throw forbidden("Only the owner can revoke access");

  const { error } = await supabase
    .from("memory_vault_access")
    .delete()
    .eq("id", accessId)
    .eq("vault_id", vaultId);
  if (error) throw error;
};
