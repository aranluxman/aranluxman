# Aran Life Flow

A calm personal planner for daily tasks, long-term to-dos, calendar-style events, focus sessions, sleep tracking, moods, and motivational quotes.

## Features

- Starter task list with Aran's current school tasks
- Daily tasks and long-term to-dos
- Calendar view with manual events and optional iCal import
- Pomodoro-style focus mode
- Sleep tracker with calculated duration and a weekly graph
- Mood check-in, streak, coins, and quotes
- Supabase sync for tasks, calendar items, moods, focus sessions, and sleep logs

## Supabase

The app uses these public tables:

- `life_flow_items`
- `life_flow_moods`
- `life_flow_focus_sessions`
- `life_flow_sleep_entries`

Open **Settings** in the app and add:

- Supabase project URL
- Supabase publishable key
- Owner key, any private phrase you choose
- Optional Google Calendar secret iCal URL

The owner key is stored in the browser and sent as `x-owner-key` so row-level security can keep each owner key separate without requiring Google sign-in.
