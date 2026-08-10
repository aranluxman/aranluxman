-- The client has always written a `source` field on sleep entries ("manual" for
-- ones added in the dialog, "import" for the transcribed sleep log) and on focus
-- sessions, but the columns were never added to those tables on the deployed
-- project. Every sleep upsert therefore failed with:
--   PGRST204: Could not find the 'source' column of 'life_flow_sleep_entries'
--
-- 20260622000000_fix_cloud_sync_schema.sql declared these; this migration
-- applies the parts that never landed. Both statements are idempotent.
ALTER TABLE IF EXISTS public.life_flow_sleep_entries
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

ALTER TABLE IF EXISTS public.life_flow_focus_sessions
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Sleep entries are upserted with on_conflict=owner_key,sleep_date. Without a
-- matching unique constraint PostgREST cannot resolve the conflict target and
-- the upsert degrades to a plain insert, duplicating a day on every sync.
CREATE UNIQUE INDEX IF NOT EXISTS life_flow_sleep_entries_owner_date_idx
ON public.life_flow_sleep_entries (owner_key, sleep_date);
