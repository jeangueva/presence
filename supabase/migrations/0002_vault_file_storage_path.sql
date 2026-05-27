-- Track the storage object path so deletes can clean up Supabase Storage,
-- not just the DB row.
alter table memory_vault_files
  add column if not exists storage_path text;
