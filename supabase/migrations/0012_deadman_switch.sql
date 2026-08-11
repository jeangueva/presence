-- Dead-man's switch: the trigger for posthumous message delivery.
--
-- Replaces the manual "our team verifies the death" process, which required a
-- human on our side and therefore could not scale or be promised honestly.
-- The mechanism here needs no third party, no registry integration and no
-- accreditation: the user proves they are alive on a schedule they choose,
-- and silence plus confirmation from their own trusted contacts is the signal.
--
-- State machine on deadman_config.state:
--   active     → user is checking in normally
--   overdue    → a check-in was missed; reminders are going out
--   grace      → check-in deadline blown; trusted contacts have been notified
--   triggered  → contacts confirmed; posthumous messages dispatched
--   paused     → user disabled the switch

create table if not exists deadman_config (
  user_id uuid primary key references users(id) on delete cascade,
  enabled boolean not null default false,
  -- How often we ask "are you there?", and how long we wait after a missed
  -- check-in before involving anyone else. Both are the user's call.
  interval_days integer not null default 90,
  grace_days integer not null default 30,
  -- How many trusted contacts must confirm before messages go out. Kept >= 1
  -- so a single silent inbox can never trigger delivery on its own.
  required_confirmations integer not null default 2,
  state varchar(16) not null default 'active',
  last_checkin_at timestamptz,
  next_checkin_due_at timestamptz,
  grace_started_at timestamptz,
  triggered_at timestamptz,
  -- Single-use token for the "estoy bien" link in the check-in email.
  checkin_token varchar(128),
  checkin_token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The cron sweep scans by due date and state, so index that pair.
create index if not exists deadman_config_due_idx
  on deadman_config (state, next_checkin_due_at)
  where enabled = true;

create unique index if not exists deadman_config_checkin_token_idx
  on deadman_config (checkin_token)
  where checkin_token is not null;

-- People the user nominates to confirm their death. Deliberately separate from
-- heirs: an heir has a financial interest in the trigger firing, so they are a
-- poor choice of confirmer. The UI should say so.
create table if not exists deadman_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  full_name varchar(255) not null,
  email varchar(255) not null,
  relationship varchar(100),
  -- Confirmation state for the current grace period.
  notified_at timestamptz,
  confirmed_at timestamptz,
  declined_at timestamptz,
  confirm_token varchar(128),
  created_at timestamptz not null default now()
);

create index if not exists deadman_contacts_user_idx
  on deadman_contacts (user_id);

create unique index if not exists deadman_contacts_user_email_idx
  on deadman_contacts (user_id, lower(email));

create unique index if not exists deadman_contacts_confirm_token_idx
  on deadman_contacts (confirm_token)
  where confirm_token is not null;

-- Append-only audit of every state transition. This is the record we would
-- have to produce if a delivery is ever disputed, so it is never updated in
-- place and never deleted independently of the user.
create table if not exists deadman_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  event varchar(48) not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists deadman_events_user_idx
  on deadman_events (user_id, created_at desc);
