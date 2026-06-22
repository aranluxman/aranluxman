# Cloud Sync Quick Start Checklist

## Phase 1: Apply Database Migration (5 minutes)

- [ ] Open Supabase Dashboard for your project
- [ ] Go to **SQL Editor** → **New Query**
- [ ] Copy-paste the SQL from: `supabase/migrations/20260622000000_fix_cloud_sync_schema.sql`
- [ ] Click **Execute**
- [ ] Verify: Go to **Tables** and check `life_flow_sleep_entries` has a `source` column
- [ ] Optional: Go to **Settings** → **API** and click "Regenerate Schema Cache"

## Phase 2: Enable Cloud Sync (2 minutes per device)

### On Laptop:
- [ ] Open Life Flow app
- [ ] Click Settings ⚙️
- [ ] Scroll to "Supabase" section
- [ ] Verify **Supabase URL** and **Supabase publishable key** are filled (pre-filled)
- [ ] Enter an **Owner key** (or use: `owner_6cced001-4527-481f-aeec-b37a333545cd`)
- [ ] Click **Save settings**
- [ ] Wait for "Synced with Supabase" message (if it says "Local mode", check the owner key is filled)

### On iPad/Another Device:
- [ ] Open Life Flow app
- [ ] Click Settings ⚙️
- [ ] Paste the **exact same Owner key** from laptop
- [ ] Click **Save settings**
- [ ] Wait for "Synced with Supabase" message

## Phase 3: Verify It Works (3 minutes)

### On Laptop:
- [ ] Add a new test task: "Sync verification task"
- [ ] Set due date to today
- [ ] Press Enter/Save
- [ ] Open Supabase → **Table Editor** → `life_flow_items`
- [ ] Confirm the task appears with your owner_key

### On iPad:
- [ ] Check that "Sync verification task" appears (might take a few seconds)
- [ ] Create a new task on iPad
- [ ] Go back to laptop
- [ ] Confirm iPad task appears

### If it worked:
- [ ] ✅ Cloud sync is active!
- [ ] Delete the test task
- [ ] Continue using the app normally
- [ ] Changes will auto-sync between devices

### If it didn't work:
- [ ] Check owner key is same on both devices (copy-paste to be sure)
- [ ] Click "Sync now" button in settings
- [ ] Check Supabase URL: should be `https://hcvjiveloioftozvnbhe.supabase.co`
- [ ] Check Supabase key starts with: `sb_publishable_DGZFZUhnMLgFpdYzcHWRmw_wqOPu2Aq`
- [ ] In Supabase, go to **Authentication** → **RLS** and verify policies exist
- [ ] Run the migration SQL again

---

## What Just Happened

✅ **Database Schema:** Added missing `source` column to all sync tables  
✅ **Frontend:** Updated sleep/focus entries to include `source` field  
✅ **Sync Logic:** Already in place—just needed schema + owner key  
✅ **Security:** RLS policies ensure each owner key only sees their data  
✅ **Auto-sync:** Every change now syncs to Supabase and other devices  

---

## Key Points to Remember

- **Owner key** = identifier for your data across all devices (like a family key)
- **Same owner key on all devices** = they share the same data
- **Different owner key** = separate data set
- **Empty owner key** = local mode only (no cloud sync)
- **Changes auto-sync** when you save (no manual sync needed after first setup)

---

## Troubleshooting One-Liners

| Issue | Fix |
|-------|-----|
| Shows "Local mode" | Owner key is empty—fill it in settings |
| PGRST204 error | Run the migration SQL from `supabase/migrations/` |
| Data not syncing | Same owner key on both devices? Try "Sync now" |
| Seeing different data | Check owner keys match exactly (copy-paste) |
| Can't see data in Supabase | Click "Sync now" first, then check `life_flow_items` table |

---

## After Setup

Your Life Flow app will now:
- 📱 Sync tasks between laptop, iPad, and phone
- 😴 Keep sleep logs in sync
- ⏱️ Share focus sessions across devices
- 🎯 Backup all data to Supabase
- 🔒 Keep data secure with your owner key

Enjoy seamless cross-device syncing! 🚀
