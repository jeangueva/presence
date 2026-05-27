-- Billing / freemium foundation. Provider-agnostic column names so we can
-- swap between providers (Stripe / MercadoPago / etc.) without re-migrating.

alter table users
  add column if not exists external_customer_id varchar(255),
  add column if not exists external_subscription_id varchar(255),
  add column if not exists subscription_status varchar(32) not null default 'active',
  add column if not exists subscription_period_end timestamptz;

create unique index if not exists users_external_customer_unique
  on users (external_customer_id) where external_customer_id is not null;

create index if not exists users_external_subscription_idx
  on users (external_subscription_id);

alter table payments
  add column if not exists external_event_id varchar(255) unique,
  add column if not exists plan varchar(32),
  add column if not exists period_end timestamptz;
