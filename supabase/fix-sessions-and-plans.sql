-- DSA Coach — fix `sessions` and `plans`
--
-- Root cause, confirmed from a live information_schema dump of both tables
-- (not guessed):
--
-- 1. plans.activity_type is NOT NULL with no default. It's a leftover from
--    an earlier one-row-per-item design; the current workflow saves a whole
--    day's plan as one row with items/priorities as jsonb, and never
--    populates activity_type. Every Save Plan INSERT has been failing here.
--
-- 2. sessions has no ended_at column at all, but Close Session's UPDATE sets
--    ended_at = now(). Every session close has been failing with
--    "column ended_at does not exist".
--
-- (A third bug — Create Session inserting into a problem_id column that
-- doesn't exist on `sessions` either — was fixed in the workflow itself,
-- not here: the INSERT no longer references it. problem_slug already
-- identifies the problem, so nothing is lost.)
--
-- Both statements below are additive/permissive only: one drops a
-- constraint, the other adds a column. Neither touches or removes data.

alter table plans alter column activity_type drop not null;

alter table sessions add column if not exists ended_at timestamptz;

-- ── verify ───────────────────────────────────────────────────────────────
select table_name, column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in ('sessions', 'plans')
order by table_name, ordinal_position;
