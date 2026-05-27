-- Pilar 3 + 4 lite — five legacy planning modules with dedicated tables.
-- We avoid overloading will_instructions with JSON-in-content for readability.

create table if not exists legacy_dependents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  full_name varchar(255) not null,
  relationship varchar(100),
  date_of_birth date,
  caregiver_name varchar(255),
  caregiver_contact varchar(255),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists legacy_dependents_user_idx on legacy_dependents (user_id);

create table if not exists legacy_pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name varchar(255) not null,
  species varchar(100),
  breed varchar(255),
  age_years int,
  vet_info text,
  food_routine text,
  caregiver_name varchar(255),
  caregiver_contact varchar(255),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists legacy_pets_user_idx on legacy_pets (user_id);

create table if not exists legacy_final_wishes (
  user_id uuid primary key references users(id) on delete cascade,
  disposition varchar(50),  -- 'burial' | 'cremation' | 'donation' | 'other'
  ceremony_notes text,
  religious_wishes text,
  music_readings text,
  obituary text,
  special_requests text,
  updated_at timestamptz not null default now()
);

create table if not exists legacy_estate (
  user_id uuid primary key references users(id) on delete cascade,
  summary text,
  executor_name varchar(255),
  executor_email varchar(255),
  executor_phone varchar(32),
  notary_info text,
  updated_at timestamptz not null default now()
);

create table if not exists legacy_estate_heirs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  full_name varchar(255) not null,
  email varchar(255),
  relationship varchar(100),
  inheritance_share text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists legacy_estate_heirs_user_idx on legacy_estate_heirs (user_id);

create table if not exists legacy_estate_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name varchar(255) not null,
  asset_type varchar(50),
  description text,
  approximate_value text,
  location text,
  created_at timestamptz not null default now()
);
create index if not exists legacy_estate_assets_user_idx on legacy_estate_assets (user_id);

-- Posthumous messages: extend legacy_messages so we can scope by user
-- without requiring a legacy_plans row.
alter table legacy_messages
  add column if not exists user_id uuid references users(id) on delete cascade;
create index if not exists legacy_messages_user_idx on legacy_messages (user_id);
alter table legacy_messages alter column plan_id drop not null;
