-- Presence — initial schema
-- Covers all 4 pillars so later slices don't need to re-migrate.

create extension if not exists "pgcrypto";

-- ============ USERS ============
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) unique not null,
  password_hash varchar(255) not null,
  full_name varchar(255),
  phone_number varchar(32),
  avatar_url text,
  subscription_tier varchar(20) not null default 'free',
  subscription_expires_at timestamptz,
  two_fa_enabled boolean not null default false,
  two_fa_secret varchar(255),
  gdpr_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on users (email);

-- ============ PILLAR 1: MEMORY VAULTS ============
create table if not exists memory_vaults (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  deceased_name varchar(255) not null,
  deceased_bio text,
  deceased_birth_date date,
  deceased_death_date date,
  profile_photo_url text,
  model_id varchar(255),
  model_trained boolean not null default false,
  training_progress int not null default 0,
  public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memory_vaults_user_id_idx on memory_vaults (user_id);

create table if not exists memory_vault_files (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references memory_vaults(id) on delete cascade,
  file_type varchar(50) not null,
  file_url text not null,
  file_name varchar(255),
  file_size int,
  duration_seconds int,
  transcript text,
  uploaded_by uuid references users(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

create index if not exists memory_vault_files_vault_id_idx on memory_vault_files (vault_id);

create table if not exists memory_vault_access (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references memory_vaults(id) on delete cascade,
  email varchar(255) not null,
  role varchar(50) not null default 'viewer',
  granted_by uuid references users(id) on delete set null,
  granted_at timestamptz not null default now(),
  unique (vault_id, email)
);

create table if not exists chat_conversations (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references memory_vaults(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  title varchar(255),
  created_at timestamptz not null default now()
);

create index if not exists chat_conversations_vault_id_idx on chat_conversations (vault_id);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references chat_conversations(id) on delete cascade,
  role varchar(20) not null,
  content text not null,
  tokens_used int,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_conversation_id_idx on chat_messages (conversation_id);

-- ============ PILLAR 2: MEMORIALS ============
create table if not exists memorials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  deceased_name varchar(255) not null,
  deceased_bio text,
  birth_date date,
  death_date date,
  profile_photo_url text,
  cover_photo_url text,
  public boolean not null default false,
  public_slug varchar(64) unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memorials_user_id_idx on memorials (user_id);

create table if not exists memorial_timeline_events (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references memorials(id) on delete cascade,
  event_name varchar(255),
  event_date date,
  description text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists memorial_guestbook (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references memorials(id) on delete cascade,
  visitor_name varchar(255),
  visitor_email varchar(255),
  message text not null,
  approved boolean not null default false,
  approved_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists memorial_photos (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references memorials(id) on delete cascade,
  photo_url text not null,
  caption text,
  date_taken date,
  uploaded_by uuid references users(id) on delete set null,
  ai_story text,
  ai_story_generated_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists memorial_visitors (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references memorials(id) on delete cascade,
  visitor_email varchar(255),
  visit_count int not null default 1,
  last_visited timestamptz not null default now()
);

-- ============ PILLAR 3: LEGACY PLANNER ============
create table if not exists legacy_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  executor_email varchar(255),
  executor_phone varchar(32),
  death_reported boolean not null default false,
  death_reported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists legacy_messages (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references legacy_plans(id) on delete cascade,
  message_type varchar(50) not null,
  trigger_type varchar(50) not null,
  trigger_value varchar(255),
  recipient_email varchar(255),
  audio_url text,
  text_content text,
  opened boolean not null default false,
  opened_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists legacy_rules (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references legacy_plans(id) on delete cascade,
  trigger_condition varchar(255) not null,
  response_template text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists legacy_documents (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references legacy_plans(id) on delete cascade,
  doc_type varchar(50) not null,
  file_url text not null,
  file_name varchar(255),
  created_at timestamptz not null default now()
);

-- ============ PILLAR 4: DIGITAL WILLS ============
create table if not exists digital_wills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  status varchar(50) not null default 'draft',
  generated_pdf_url text,
  notarized boolean not null default false,
  notary_date timestamptz,
  notary_id varchar(255),
  blockchain_hash varchar(255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists will_heirs (
  id uuid primary key default gen_random_uuid(),
  will_id uuid not null references digital_wills(id) on delete cascade,
  heir_name varchar(255) not null,
  heir_email varchar(255),
  relationship varchar(100),
  inheritance_percentage decimal(5,2),
  inheritance_amount decimal(14,2),
  created_at timestamptz not null default now()
);

create table if not exists will_assets (
  id uuid primary key default gen_random_uuid(),
  will_id uuid not null references digital_wills(id) on delete cascade,
  asset_type varchar(50) not null,
  description varchar(255),
  estimated_value decimal(14,2),
  location varchar(255),
  account_info text,
  created_at timestamptz not null default now()
);

create table if not exists will_instructions (
  id uuid primary key default gen_random_uuid(),
  will_id uuid not null references digital_wills(id) on delete cascade,
  instruction_type varchar(50) not null,
  content text not null,
  priority int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists will_checklist (
  id uuid primary key default gen_random_uuid(),
  will_id uuid not null references digital_wills(id) on delete cascade,
  account_type varchar(100) not null,
  account_name varchar(255),
  username varchar(255),
  action_needed varchar(255),
  status varchar(50) not null default 'pending',
  created_at timestamptz not null default now()
);

-- ============ PAYMENTS ============
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount decimal(12,2) not null,
  currency varchar(10) not null default 'USD',
  payment_type varchar(50) not null,
  payment_method varchar(50) not null,
  external_id varchar(255),
  status varchar(50) not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists payments_user_id_idx on payments (user_id);

-- ============ AUDIT LOGS ============
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  resource_type varchar(100) not null,
  resource_id uuid,
  action varchar(50) not null,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_user_id_idx on audit_logs (user_id);
create index if not exists audit_logs_resource_idx on audit_logs (resource_type, resource_id);

-- ============ updated_at triggers ============
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'users','memory_vaults','memorials','legacy_plans','digital_wills'
    ])
  loop
    execute format(
      'drop trigger if exists trg_%I_updated on %I;
       create trigger trg_%I_updated before update on %I
       for each row execute function set_updated_at();',
      t, t, t, t
    );
  end loop;
end $$;
