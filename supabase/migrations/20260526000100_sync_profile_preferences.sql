alter table public.life_flow_app_state
  add column if not exists preferences jsonb not null default '{}'::jsonb;
