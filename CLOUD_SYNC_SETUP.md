# Life Flow Cloud Sync Setup Guide

## Summary of Changes Made

I've fixed the cloud sync infrastructure in your Life Flow app. Here's what was done:

### 1. Database Schema Fixes ✅
**File:** `supabase/migrations/20260622000000_fix_cloud_sync_schema.sql`

- **Added missing `source` column** to `life_flow_sleep_entries` table (was causing PGRST204 error)
- **Added `owner_key` column** to `life_flow_sleep_entries`, `life_flow_items`, and `life_flow_focus_sessions` for per-user data filtering
- **Added `source` column** to all tables for tracking data origin (manual, import, etc.)
- **Created `life_flow_user_profile` table** for syncing user settings across devices
- **Enabled Row Level Security (RLS)** on all tables with policies using the `x-owner-key` header
- **Created RLS policies** that filter data based on the owner key provided in the request header

### 2. Frontend Code Fixes ✅
**File:** `src/app.mjs`

- **Updated sleep entry creation** (line 1918) to include `source: "manual"` field
- **Updated focus session sync** to ensure `source` field is present when syncing
- **Verified `supabaseFetch` function** correctly passes `x-owner-key` header (line 2255)
- **Verified `canSync()` function** checks for all required settings (line 2264)

### 3. UI/Styling Fixes ✅
**File:** `styles.css`

- **Fixed dark mode toggle** styling with proper `accent-color: var(--teal)` to match app theme
- **Improved checkbox sizing** and cursor styling

---

## What You Need to Do Next

### Step 1: Apply the Database Migration

The migration file is created, but you need to apply it to your Supabase database:

1. Go to **Supabase Dashboard** → Select your project
2. Navigate to **SQL Editor**
3. Create a new query and copy the entire contents of:
   ```
   supabase/migrations/20260622000000_fix_cloud_sync_schema.sql
   ```
4. Click **Execute** to apply the migration
5. (Optional) In Supabase Settings → API, click "Regenerate Schema Cache" to refresh the schema

**Verify the schema was updated:**
- Go to **Database** → **Tables** in Supabase
- Check that `life_flow_sleep_entries` now has a `source` column
- Verify all tables have `owner_key` column

### Step 2: Enable Cloud Sync on Your Device

1. Open Life Flow app on your laptop
2. Click **Settings** (⚙️ icon bottom-left)
3. Scroll down to the Supabase section
4. You should see:
   - **Supabase URL:** `https://hcvjiveloioftozvnbhe.supabase.co` (already filled)
   - **Supabase publishable key:** `sb_publishable_DGZFZUhnMLgFpdYzcHWRmw_wqOPu2Aq` (already filled)
   - **Owner key:** (empty)

5. **For laptop:** Generate an owner key or paste the one you want to use
   - This is a unique identifier for all your devices
   - Example: `owner_6cced001-4527-481f-aeec-b37a333545cd`
   - You can use any UUID or custom string - it's just an identifier
6. Click **Save settings**
7. You should see "Synced with Supabase" at the bottom
8. Check Supabase Dashboard → **Table Editor** → `life_flow_tasks` to confirm your data is syncing

### Step 3: Sync Data to Additional Devices

To use the same Life Flow data on your iPad, phone, or another laptop:

1. Open Life Flow on the other device
2. Go to **Settings** 
3. Copy the **exact same Owner key** from Step 2
4. Paste it into the **Owner key** field
5. Click **Save settings**
6. Wait for "Synced with Supabase" message
7. Your tasks, sleep logs, focus sessions, and other data should now appear on this device

**How sync works:**
- When you save settings with an owner key:
  1. App pulls all data for that owner key from Supabase
  2. Merges with local data (Supabase data takes priority if there are conflicts)
  3. Syncs any local-only data up to Supabase
  4. From then on, all changes auto-sync to Supabase
- Changes made on one device appear on other devices within seconds

---

## How to Know It's Working

### Signs of successful sync:

✅ **Settings show owner key** (not empty)
✅ **Status shows "Synced with Supabase"** instead of "Local mode"  
✅ **New task appears on another device** within seconds  
✅ **Supabase Dashboard shows your data** in the tables
✅ **No red error messages** in the Settings dialog

### If something goes wrong:

**Error: "Loading paused: ..."** → Check owner key matches across devices
**Error: "PGRST204"** → Migration wasn't applied, re-run the SQL
**Data not syncing** → Check Supabase URL and key are correct
**Only showing local data** → Owner key is empty, fill it in settings

---

## Technical Details

### How Cloud Sync Works Now

1. **Authentication:** The app uses the `owner_key` as a security context
   - Passed in `x-owner-key` header with every Supabase request
   - RLS policies filter data to only show records matching this key

2. **Sync Frequency:**
   - **On app load:** `initializeCloud()` runs auto-sync
   - **When settings change:** `syncAll()` pulls, imports calendar, then pushes
   - **When data changes:** Each operation calls `upsertSupabase()` immediately
   - **Manual sync:** "Sync now" button in settings

3. **Conflict Resolution:**
   - Remote data (Supabase) takes priority when pulling
   - Local changes are pushed up after pulling (so nothing is lost)
   - Deletion tombstones prevent re-downloading deleted items

4. **Tables Synced:**
   - `life_flow_items` (tasks, calendar events)
   - `life_flow_sleep_entries` (sleep logs)
   - `life_flow_focus_sessions` (focus sessions)
   - `life_flow_app_state` (fitness, rewards, notes, etc.)
   - `life_flow_user_profile` (settings - future enhancement)

### Data Structure

All synced records now include:
```javascript
{
  owner_key: "your-owner-key",  // ← Required, filters who can see this
  source: "manual",              // ← Origin: manual, import, ics, etc.
  created_at: "2026-06-22T...",  // ← Timestamp
  updated_at: "2026-06-22T...",  // ← Last modified
  // ... other fields specific to the table
}
```

---

## Troubleshooting

### "Local mode" is showing instead of "Synced"

**Cause:** Owner key is missing or Supabase settings are incorrect
**Fix:** 
- Open Settings
- Ensure **Owner key** field is filled with the same value on all devices
- Ensure Supabase URL and key are present (they should be pre-filled)
- Click Save

### Data isn't appearing on the other device

**Cause:** Different owner keys on each device, or sync hasn't completed
**Fix:**
- Verify both devices have the **exact same Owner key**
- Click "Sync now" in settings
- Wait 2-3 seconds for the message to change
- Refresh the page if needed

### Getting "PGRST204" error

**Cause:** Migration hasn't been applied to Supabase
**Fix:**
- Go to Supabase Dashboard → SQL Editor
- Run the migration SQL from `supabase/migrations/20260622000000_fix_cloud_sync_schema.sql`
- Then try again

### Want to switch to a different owner key

**Fix:**
- Open Settings
- Change the Owner key to a different value
- Click Save
- The app will pull that owner's data from Supabase

---

## Next Steps

Once cloud sync is working:

1. ✅ Verify sync on laptop and iPad
2. ✅ Add a test task on one device, confirm it appears on the other
3. ✅ (Optional) Set up on your phone as well
4. ✅ Consider enabling dark mode on all devices for consistency
5. ✅ Share the Owner key securely with anyone else who should see this data

---

## Questions?

If you run into issues:
1. Check the **Sync status** at the bottom of Settings
2. Look at **Supabase Logs** in your Supabase project dashboard
3. Verify RLS policies are in place (Supabase → Authentication → RLS)
4. Try clicking "Sync now" to manually trigger sync
