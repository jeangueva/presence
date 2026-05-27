-- Email verification on signup.
alter table users
  add column if not exists email_verified boolean not null default false,
  add column if not exists email_verification_token varchar(128),
  add column if not exists email_verification_sent_at timestamptz;

create index if not exists users_email_verification_token_idx
  on users (email_verification_token)
  where email_verification_token is not null;
