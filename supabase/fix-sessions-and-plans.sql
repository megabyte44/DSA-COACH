-- DSA Coach — fix `sessions` and `plans`
--
-- Confirmed by live testing against the deployed n8n workflow: `profiles`,
-- `patterns` (43 rows seeded), `problems`, `skills` and `attempts` all work
-- correctly already. Only `sessions` (INSERT fails on every problem_started)
-- and `plans` (INSERT fails on every save) are broken.
--
-- This script does NOT touch derive_patterns() or re-seed `patterns` —
-- both already exist and work; redefining them here would risk clobbering
-- real, working logic this script's author has never seen.
--
-- Safe to run as-is: CREATE TABLE IF NOT EXISTS and ADD COLUMN IF NOT EXISTS
-- only ever add structure, never drop or overwrite existing data.

-- ── sessions ─────────────────────────────────────────────────────────────
create table if not exists sessions (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references profiles(id) on delete cascade,
  problem_id       uuid references problems(id),
  problem_slug     text,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  duration_seconds int,
  active_seconds   int
);

alter table sessions add column if not exists profile_id       uuid;
alter table sessions add column if not exists problem_id       uuid;
alter table sessions add column if not exists problem_slug     text;
alter table sessions add column if not exists started_at       timestamptz default now();
alter table sessions add column if not exists ended_at         timestamptz;
alter table sessions add column if not exists duration_seconds int;
alter table sessions add column if not exists active_seconds   int;

create index if not exists sessions_profile_id_idx on sessions(profile_id);

-- ── plans ────────────────────────────────────────────────────────────────
-- The UNIQUE constraint on (profile_id, plan_date) is not optional: Save Plan
-- uses ON CONFLICT (profile_id, plan_date), which requires exactly this
-- constraint to exist or the INSERT fails outright before touching any row.
create table if not exists plans (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id) on delete cascade,
  plan_date     date not null,
  mode          text,
  restart_step  int default 0,
  total_minutes int,
  message       text,
  items         jsonb default '[]'::jsonb,
  priorities    jsonb default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  unique (profile_id, plan_date)
);

alter table plans add column if not exists mode          text;
alter table plans add column if not exists restart_step  int default 0;
alter table plans add column if not exists total_minutes int;
alter table plans add column if not exists message       text;
alter table plans add column if not exists items         jsonb default '[]'::jsonb;
alter table plans add column if not exists priorities    jsonb default '[]'::jsonb;
alter table plans add column if not exists created_at    timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'plans_profile_id_plan_date_key'
  ) then
    begin
      alter table plans add constraint plans_profile_id_plan_date_key unique (profile_id, plan_date);
    exception when duplicate_table then null;
    end;
  end if;
end $$;

-- ── verify ───────────────────────────────────────────────────────────────
-- Run this after the block above. Both tables should list exactly the
-- columns this script created, with no unexpected extra NOT NULL columns.
select table_name, column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in ('sessions', 'plans')
order by table_name, ordinal_position;
