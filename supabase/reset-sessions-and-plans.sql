-- DSA Coach — DESTRUCTIVE fallback for `sessions` and `plans`
--
-- Only run this if fix-sessions-and-plans.sql did not resolve the failures.
-- That would mean the live tables already have extra columns this script's
-- author cannot see or name from outside — most likely NOT NULL columns
-- with no default, which ADD COLUMN IF NOT EXISTS cannot remove.
--
-- This DROPS and recreates both tables. Safe to do here specifically
-- because live testing (twice, against two different problems) showed every
-- write to both tables failing — there is no working data in either to lose.
-- Do not run this against a database where sessions/plans have ever
-- successfully saved a row without checking first:
--
--   select count(*) from sessions;
--   select count(*) from plans;
--
-- If either returns > 0, stop and look at what's actually in there before
-- dropping anything.

drop table if exists sessions cascade;
drop table if exists plans cascade;

create table sessions (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references profiles(id) on delete cascade,
  problem_id       uuid references problems(id),
  problem_slug     text,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  duration_seconds int,
  active_seconds   int
);
create index sessions_profile_id_idx on sessions(profile_id);

create table plans (
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
