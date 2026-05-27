-- Pillar 2 — Interactive Memorial
-- Link a memorial to its source vault (so create-from-vault can inherit
-- name, bio, dates). on delete set null: deleting the source vault does
-- NOT delete the memorial — they're independent after creation.
alter table memorials
  add column if not exists vault_id uuid references memory_vaults(id) on delete set null;

create index if not exists memorials_vault_id_idx on memorials (vault_id);

-- Track storage path for memorial photos so deletes can clean up Supabase Storage.
alter table memorial_photos
  add column if not exists storage_path text;
