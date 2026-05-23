alter table public.life_flow_sleep_entries
  drop constraint if exists life_flow_sleep_entries_minutes_valid;

alter table public.life_flow_sleep_entries
  add constraint life_flow_sleep_entries_minutes_valid
  check (minutes > 0 and minutes <= 660)
  not valid;
