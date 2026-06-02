-- Digital will v2 — free-form authored document.
-- The will is now a rich HTML document the user authors (from a template, a
-- blank canvas, or a generated form). The integrity seal hashes body_html.
-- template_id records which authoring starting point was used.

alter table legacy_will
  add column if not exists body_html text,
  add column if not exists template_id varchar(50);
