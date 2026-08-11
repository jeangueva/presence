-- Repricing: three tiers (free / personal / family) become two products and an
-- add-on (memorial / legado / vault).
--
-- "Legado" is a one-time purchase, so it cannot live in subscription_tier
-- alone: that column lapses with the subscription, and a one-time purchase must
-- not. It gets its own permanent stamp, and the tier column keeps tracking the
-- recurring add-on.

alter table users
  add column if not exists legado_purchased_at timestamptz;

comment on column users.legado_purchased_at is
  'Set when the one-time Legado payment clears. Permanent — never cleared by a lapsed subscription.';

-- Carry existing accounts forward. Old paid tiers bought planner access, so
-- they keep it permanently rather than losing it at the next renewal.
update users set legado_purchased_at = coalesce(legado_purchased_at, now())
  where subscription_tier in ('personal', 'family');

update users set subscription_tier = 'memorial' where subscription_tier = 'free';
update users set subscription_tier = 'legado'   where subscription_tier = 'personal';
update users set subscription_tier = 'vault'    where subscription_tier = 'family';

-- Anything unrecognised (or null) lands on the free tier.
update users set subscription_tier = 'memorial'
  where subscription_tier is null
     or subscription_tier not in ('memorial', 'legado', 'vault');

alter table users alter column subscription_tier set default 'memorial';

create index if not exists users_legado_purchased_idx
  on users (legado_purchased_at)
  where legado_purchased_at is not null;
