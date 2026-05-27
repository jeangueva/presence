-- Pillar 1 enrichment + new features bundle.

-- AI-generated biography cache on each vault.
alter table memory_vaults
  add column if not exists ai_biography text,
  add column if not exists ai_biography_generated_at timestamptz,
  add column if not exists profile_photo_path text;

-- Profile photo storage path for memorials (URL already exists in 0001).
alter table memorials
  add column if not exists profile_photo_path text;

-- Cover photo storage path for memorials.
alter table memorials
  add column if not exists cover_photo_path text;

-- Time capsule (Pilar 3 lite) — leverages legacy_plans and legacy_messages.
-- 0001 already defines both. We add columns the MVP needs.
alter table legacy_messages
  add column if not exists subject varchar(255),
  add column if not exists scheduled_for timestamptz,
  add column if not exists sent boolean not null default false,
  add column if not exists sent_at timestamptz;

create index if not exists legacy_messages_scheduled_for_idx
  on legacy_messages (scheduled_for) where sent = false;

-- Activity log scoped to a vault — lightweight audit trail visible to owner.
create table if not exists vault_activity (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references memory_vaults(id) on delete cascade,
  actor_user_id uuid references users(id) on delete set null,
  actor_email varchar(255),
  action varchar(50) not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vault_activity_vault_idx
  on vault_activity (vault_id, created_at desc);

-- RAG scaffold: enable pgvector extension. Embedding columns added but not yet
-- populated by the backend. A future migration will add an embeddings table
-- with HNSW/IVFFlat index once the embedding pipeline is wired.
create extension if not exists vector;
