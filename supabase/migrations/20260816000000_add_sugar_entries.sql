-- Added-sugar tracking for the Sugar tab.
--
-- Unlike life_flow_sleep_entries (one row per day, upserted on
-- owner_key + sleep_date) a day holds many sugar items, so rows are keyed by id
-- and grouped by entry_date at read time.
create table if not exists public.life_flow_sugar_entries (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null,
  entry_date date not null,
  item_name text not null default '',
  grams numeric(6, 1) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.life_flow_sugar_entries
  drop constraint if exists life_flow_sugar_entries_grams_valid;
alter table public.life_flow_sugar_entries
  add constraint life_flow_sugar_entries_grams_valid
  check (grams >= 0 and grams <= 500);

-- Every read filters by owner + day, which is also how the history view scans.
create index if not exists life_flow_sugar_entries_owner_date_idx
  on public.life_flow_sugar_entries (owner_key, entry_date desc);

-- Same owner-key policy the other life_flow tables use: the client sends the
-- key as an x-owner-key header and PostgREST matches it against the row.
alter table public.life_flow_sugar_entries enable row level security;
drop policy if exists life_flow_sugar_entries_owner_all on public.life_flow_sugar_entries;
create policy life_flow_sugar_entries_owner_all on public.life_flow_sugar_entries
  for all
  using (owner_key = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''))
  with check (owner_key = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''));
