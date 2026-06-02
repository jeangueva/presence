-- Testamento Digital — a capstone document that compiles the user's estate
-- plan (heirs, assets, executor, final wishes, dependents) plus testator
-- identity + declarations, and seals it with a SHA-256 content hash for
-- tamper-evidence (integrity, not legal force).
--
-- Note: legal notarization and on-chain anchoring are EXTERNAL steps. This
-- table stores the integrity seal only — it does not perform notarization or
-- write to any blockchain.

create table if not exists legacy_will (
  user_id uuid primary key references users(id) on delete cascade,
  testator_full_name varchar(255),
  testator_id_number varchar(100),
  city varchar(255),
  declarations text,
  status varchar(20) not null default 'draft',  -- 'draft' | 'sealed'
  document_hash varchar(64),                      -- sha256 hex of sealed content
  document_version int not null default 0,
  sealed_at timestamptz,
  updated_at timestamptz not null default now()
);
