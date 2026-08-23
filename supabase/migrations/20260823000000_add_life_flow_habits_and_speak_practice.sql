-- Persistent streaks, daily habits, and Speak practice recordings.
-- Life Flow currently pairs devices with an owner key rather than Supabase Auth,
-- so user_id stores that opaque owner key and RLS reads the x-owner-key header.

create table if not exists public.sugar_streaks (
  user_id text primary key,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= current_streak),
  last_updated_date date,
  limit_grams numeric(6, 1) not null default 30 check (limit_grams > 0 and limit_grams <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_checklist (
  user_id text not null,
  item_id text not null,
  date date not null,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id, date)
);

create table if not exists public.speak_practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  lesson text not null default 'Tamil Practice',
  audio_path text,
  duration_seconds integer not null default 0 check (duration_seconds >= 0 and duration_seconds <= 3600),
  rating smallint check (rating is null or (rating >= 1 and rating <= 5)),
  created_at timestamptz not null default now()
);

create index if not exists speak_practice_sessions_user_created_idx
  on public.speak_practice_sessions (user_id, created_at desc);

alter table public.sugar_streaks enable row level security;
alter table public.daily_checklist enable row level security;
alter table public.speak_practice_sessions enable row level security;

drop policy if exists sugar_streaks_owner_all on public.sugar_streaks;
create policy sugar_streaks_owner_all on public.sugar_streaks
  for all to anon, authenticated
  using (user_id = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''))
  with check (user_id = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''));

drop policy if exists daily_checklist_owner_all on public.daily_checklist;
create policy daily_checklist_owner_all on public.daily_checklist
  for all to anon, authenticated
  using (user_id = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''))
  with check (user_id = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''));

drop policy if exists speak_practice_sessions_owner_all on public.speak_practice_sessions;
create policy speak_practice_sessions_owner_all on public.speak_practice_sessions
  for all to anon, authenticated
  using (user_id = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''))
  with check (user_id = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''));

grant select, insert, update, delete on table public.sugar_streaks to anon, authenticated;
grant select, insert, update, delete on table public.daily_checklist to anon, authenticated;
grant select, insert, update, delete on table public.speak_practice_sessions to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('speak-practice', 'speak-practice', false, 10485760, array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists speak_practice_objects_owner_all on storage.objects;
create policy speak_practice_objects_owner_all on storage.objects
  for all to anon, authenticated
  using (
    bucket_id = 'speak-practice'
    and (storage.foldername(name))[1] = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), '')
  )
  with check (
    bucket_id = 'speak-practice'
    and (storage.foldername(name))[1] = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), '')
  );
