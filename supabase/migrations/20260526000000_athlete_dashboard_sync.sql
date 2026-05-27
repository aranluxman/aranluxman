alter table public.life_flow_items
  add column if not exists subtasks jsonb not null default '[]'::jsonb,
  add column if not exists start_time text not null default '',
  add column if not exists end_time text not null default '',
  add column if not exists repeat_pattern text not null default 'none',
  add column if not exists repeat_days integer[] not null default '{}',
  add column if not exists completed_dates text[] not null default '{}';

alter table public.life_flow_items
  drop constraint if exists life_flow_items_repeat_pattern_valid;
alter table public.life_flow_items
  add constraint life_flow_items_repeat_pattern_valid
  check (repeat_pattern in ('none', 'daily', 'weekly', 'specific'));

alter table public.life_flow_focus_sessions
  add column if not exists label text not null default 'Focus session',
  add column if not exists is_break boolean not null default false,
  add column if not exists earns_coins boolean not null default true;

alter table public.life_flow_sleep_entries
  add column if not exists mood_tag text not null default '',
  add column if not exists mood_emoji text not null default '';

create table if not exists public.life_flow_app_state (
  owner_key text primary key,
  fitness_log jsonb not null default '[]'::jsonb,
  duke_progress jsonb not null default '{"physical":0,"volunteering":0,"skill":0}'::jsonb,
  rewards jsonb not null default '[]'::jsonb,
  memory_notes jsonb not null default '{}'::jsonb,
  reaction_attempts jsonb not null default '[]'::jsonb,
  goal_reminder text not null default 'Train hard. Give back. Build something.',
  updated_at timestamptz not null default now()
);

alter table public.life_flow_app_state enable row level security;
drop policy if exists life_flow_app_state_owner_all on public.life_flow_app_state;
create policy life_flow_app_state_owner_all on public.life_flow_app_state
  for all
  using (owner_key = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''))
  with check (owner_key = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''));
