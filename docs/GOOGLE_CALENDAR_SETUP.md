# Google Calendar sync

Life Flow can pull your real Google Calendar in two ways. **Option A (OAuth)** is
the one to use — it is live and exact. **Option B (iCal)** needs no setup at all
but lags by hours.

You only need to do this once.

---

## Option A — Connect your Google account (recommended)

Live, exact, and covers every calendar you can read. Roughly 10 minutes of setup.

### 1. Create a Google Cloud project

1. Go to <https://console.cloud.google.com/projectcreate>.
2. Name it something like `life-flow` and click **Create**.

### 2. Turn on the Calendar API

1. Go to **APIs & Services → Library**.
2. Search for **Google Calendar API** and click **Enable**.

### 3. Configure the consent screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose **External**, then **Create**.
3. Fill in the app name (`Life Flow`), your email as both support and developer
   contact, and save.
4. On the **Scopes** step, click **Add or remove scopes** and add:

   ```
   https://www.googleapis.com/auth/calendar.readonly
   ```

   That is read-only. The app can never edit or delete anything in your calendar.
5. On the **Test users** step, add your own Google address.

   While the app is in "Testing" mode only listed test users can connect, and
   Google expires the grant every 7 days. That is fine for personal use — you
   just click **Connect Google** again. Publishing the app removes the 7-day
   expiry but triggers Google's verification review, which is not worth it for
   a single-user app.

### 4. Create the OAuth client ID

1. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Under **Authorised JavaScript origins**, add every origin you open the app from:

   ```
   https://aranluxman.pages.dev
   http://localhost:4173
   ```

   Add your custom domain too if you have one. This list is what stops anyone
   else's site from using your client ID.
4. Leave **Authorised redirect URIs** empty — the app uses the Google Identity
   Services token flow, which does not redirect.
5. Click **Create** and copy the **Client ID** (it ends in
   `.apps.googleusercontent.com`).

   There is also a client *secret* on that screen. **Ignore it.** This app is a
   public browser client and must never hold a secret.

### 5. Add the client ID to Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages** → your `aranluxman` Pages project.
2. **Settings → Environment variables → Add variable**.
3. Name: `GOOGLE_OAUTH_CLIENT_ID`
   Value: the client ID you copied.
4. Add it to **both** Production and Preview, then **Save**.
5. Redeploy (or push a commit) so the Function picks it up.

### 6. Connect

Open the app → **Calendar** tab → **Connect Google**. Pick your account, approve
read-only access, and your events appear.

### Running it locally

```bash
GOOGLE_OAUTH_CLIENT_ID="...apps.googleusercontent.com" npm run dev
# or, for the feed path:
CALENDAR_ICAL_URL="https://calendar.google.com/calendar/ical/.../private-.../basic.ics" npm run dev
```

Then open <http://localhost:4173>. `scripts/preview-server.mjs` serves the same
`/api/google-config` response the Cloudflare Function does.

---

## Option B — iCal feed URL (no setup)

Zero configuration, but **Google only regenerates these feeds every few hours**,
so a change you make now may not appear here until much later. Use it if you do
not want to create a Google Cloud project.

### Getting the right URL

This is the step people get wrong, so read it carefully. Google offers **two**
iCal addresses and they are not interchangeable:

| Address | Looks like | Works when |
| --- | --- | --- |
| **Secret address** ✅ | `.../ical/you%40gmail.com/`**`private-a1b2c3…`**`/basic.ics` | Always. Use this one. |
| Public address ❌ | `.../ical/you%40gmail.com/`**`public`**`/basic.ics` | Only if the calendar is shared with the entire internet. Otherwise Google returns **404**. |

If you paste a `/public/` URL for a calendar that is not publicly shared, the
app will tell you so rather than failing silently — but the fix is to use the
secret address, **not** to make your calendar public.

To find it:

1. In Google Calendar on the web, hover the calendar in the left sidebar →
   **⋮ → Settings and sharing**.
2. Scroll to **Integrate calendar**.
3. Copy **Secret address in iCal format**. (Click the eye icon to reveal it.)

### Where to put it

**Either** paste it into the app — Calendar tab → *Use a calendar feed link
instead* → **Save & sync**. It is stored in your browser only.

**Or**, better, set it as a deployment secret so it never touches the browser:

- Cloudflare Pages → **Settings → Environment variables**
- Name: `CALENDAR_ICAL_URL`, value: your secret address
- Add to Production and Preview, save, and redeploy

With `CALENDAR_ICAL_URL` set, the app calls `/api/calendar` with **no URL at
all** and the Pages Function supplies it server-side. The secret address never
reaches the client, never appears in browser storage, and is not in the repo.

> That URL is a password in disguise — anyone holding it can read your whole
> calendar. Never commit it, and never paste it into a public issue or chat.

### About the proxy

`/api/calendar` exists purely because Google's iCal endpoints send no CORS
headers, so the page cannot fetch them directly. It only forwards requests to a
short allowlist of calendar hosts (Google, Outlook, iCloud), so it cannot be
used as an open proxy to reach arbitrary addresses.

### Which one should I use?

| | OAuth (Option A) | iCal (Option B) |
| --- | --- | --- |
| Setup | ~10 min, Google Cloud project | Paste one URL |
| Freshness | Immediate on refresh / tab focus | Hours behind |
| Calendars | All you can read | One per URL |
| Event detail | Title, time, location, description | Title, time, location, description |
| Credential | Short-lived token, memory only | A secret URL — server-side if you set `CALENDAR_ICAL_URL`, otherwise in the browser |
| Re-auth | Every 7 days while app is in Testing | Never |

---

## How the tokens are handled

- The **client ID is not in the repository or the JS bundle.** It is read from
  the `GOOGLE_OAUTH_CLIENT_ID` environment variable by
  `functions/api/google-config.js` and fetched at runtime. A client ID is not
  secret (it appears in the authorization URL), but keeping it in an env var
  means it can be rotated without a code change.
- There is **no client secret** anywhere. Browser apps are public clients; the
  Google Identity Services token flow is designed for exactly this.
- The **access token is held in a module variable and never written to
  `localStorage` or `sessionStorage`.** Anything in web storage is readable by
  any XSS on the page. Reloading simply re-runs the silent flow against your
  live Google session.
- The scope is **read-only** (`calendar.readonly`). The app cannot modify your
  Google Calendar. Deleting a Google-sourced event inside Life Flow is blocked
  for that reason — delete it in Google and hit **Refresh**.
- **Disconnect** revokes the token with Google and removes every synced event
  from this device.

## How syncing works

- On connect, and on refresh, the app fetches every readable calendar over a
  window of 3 months back to 12 months ahead, with `singleEvents=true` so Google
  expands recurring series into individual dated instances.
- Each sync **replaces** the whole `source: "google"` set rather than merging
  into it. That is what makes edits and deletions propagate: an event that no
  longer comes back simply stops existing locally.
- It re-syncs automatically when you return to the tab (throttled to once a
  minute) and every 5 minutes while the tab is visible.
- Events you create inside Life Flow, and the pre-loaded schedule, are untouched
  by Google syncs. To clear the pre-loaded schedule once Google is connected,
  use **Settings → Remove pre-loaded schedule**.


---

## Troubleshooting

**"Calendar feed not found (404)"**
You used the public address for a calendar that is not publicly shared. Use the
**secret address** (contains `private-`) instead.

**"That link doesn't end in .ics"**
You copied the calendar's web page URL rather than the iCal address. Go back to
*Integrate calendar* and copy the field labelled *Secret address in iCal format*.

**"Calendar host … is not allowed"**
The proxy only forwards to known calendar providers. If you need another one,
add its hostname to `ALLOWED_HOSTS` in `functions/api/calendar.js`.

**"Saving paused: Could not find the 'source' column"**
A Supabase schema drift — the deployed database was missing a column the app
writes. Fixed by `supabase/migrations/20260810000000_add_source_to_sleep_entries.sql`.
The client now also drops unknown columns and retries instead of aborting the
whole sync, so a future drift degrades rather than stopping cloud saves.

**Events appear at the wrong time**
Times are rendered in the browser's local timezone, which is what Google shows
you. If a device's clock or timezone is wrong, the calendar will look wrong too.
