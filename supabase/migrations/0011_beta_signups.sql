-- Beta waitlist (fake-door desirability test).
-- Captures early adopters from the landing page before the product opens.
create table if not exists beta_signups (
  id uuid primary key default gen_random_uuid(),
  full_name varchar(255) not null,
  email varchar(255) not null,
  source varchar(64) not null default 'landing',
  utm varchar(255),
  ip varchar(64),
  user_agent text,
  created_at timestamptz not null default now()
);

-- One row per email; lets us upsert idempotently and count unique demand.
create unique index if not exists beta_signups_email_idx
  on beta_signups (lower(email));

create index if not exists beta_signups_created_at_idx
  on beta_signups (created_at desc);
