-- Fix missing columns in life_flow_sleep_entries table
ALTER TABLE IF EXISTS public.life_flow_sleep_entries
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Ensure life_flow_sleep_entries has owner_key for filtering
ALTER TABLE IF EXISTS public.life_flow_sleep_entries
ADD COLUMN IF NOT EXISTS owner_key TEXT;

-- Add missing columns to life_flow_items table
ALTER TABLE IF EXISTS public.life_flow_items
ADD COLUMN IF NOT EXISTS owner_key TEXT;
ALTER TABLE IF EXISTS public.life_flow_items
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Ensure timestamps exist on life_flow_items
ALTER TABLE IF EXISTS public.life_flow_items
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.life_flow_items
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to life_flow_focus_sessions table
ALTER TABLE IF EXISTS public.life_flow_focus_sessions
ADD COLUMN IF NOT EXISTS owner_key TEXT;
ALTER TABLE IF EXISTS public.life_flow_focus_sessions
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Create or update life_flow_user_profile table for syncing user settings
CREATE TABLE IF NOT EXISTS public.life_flow_user_profile (
  owner_key TEXT PRIMARY KEY,
  display_name TEXT DEFAULT '',
  planner_subtitle TEXT DEFAULT '',
  sleep_goal_hours DECIMAL DEFAULT 8.5,
  focus_goal INTEGER DEFAULT 4,
  pushup_goal INTEGER DEFAULT 60,
  track_goal INTEGER DEFAULT 3,
  dark_mode BOOLEAN DEFAULT true,
  avatar_url TEXT DEFAULT '',
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE IF EXISTS public.life_flow_sleep_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.life_flow_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.life_flow_focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.life_flow_user_profile ENABLE ROW LEVEL SECURITY;

-- Create policies for life_flow_sleep_entries (allow access via owner_key header)
DROP POLICY IF EXISTS "Allow sleep entries access by owner_key" ON public.life_flow_sleep_entries;
CREATE POLICY "Allow sleep entries access by owner_key" ON public.life_flow_sleep_entries
  FOR ALL
  USING (owner_key = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''))
  WITH CHECK (owner_key = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''));

-- Create policies for life_flow_items
DROP POLICY IF EXISTS "Allow items access by owner_key" ON public.life_flow_items;
CREATE POLICY "Allow items access by owner_key" ON public.life_flow_items
  FOR ALL
  USING (owner_key = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''))
  WITH CHECK (owner_key = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''));

-- Create policies for life_flow_focus_sessions
DROP POLICY IF EXISTS "Allow focus sessions access by owner_key" ON public.life_flow_focus_sessions;
CREATE POLICY "Allow focus sessions access by owner_key" ON public.life_flow_focus_sessions
  FOR ALL
  USING (owner_key = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''))
  WITH CHECK (owner_key = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''));

-- Create policies for life_flow_user_profile
DROP POLICY IF EXISTS "Allow profile access by owner_key" ON public.life_flow_user_profile;
CREATE POLICY "Allow profile access by owner_key" ON public.life_flow_user_profile
  FOR ALL
  USING (owner_key = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''))
  WITH CHECK (owner_key = nullif((current_setting('request.headers', true)::json ->> 'x-owner-key'), ''));
