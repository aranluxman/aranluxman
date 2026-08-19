# Aran Life Flow

A calm personal planner for daily tasks, long-term to-dos, calendar-style events, focus sessions, sleep tracking, moods, and motivational quotes.

## Features

- Six sections: Home, Calendar, Sleep, Speak, Me, Arcade
- **Google Calendar sync** over OAuth 2.0 (read-only), with a secret iCal feed as
  a zero-setup fallback — see [docs/GOOGLE_CALENDAR_SETUP.md](docs/GOOGLE_CALENDAR_SETUP.md)
- Month and week calendar views with an agenda, plus manually added events
- Sleep tracker with calculated duration, a scrubable graph, and sleep scores
- Speaking practice: rotating topics, frameworks, and R/S/TH/SH articulation drills
- Goals and an About Me profile, saved automatically
- Arcade: coins earned from real work, plus nine mini-games
- Masked Supabase settings, dark mode, and iOS-friendly PWA metadata
- Supabase sync for items, moods, focus sessions, sugar entries, and sleep logs

## Running locally

```bash
npm run dev     # static preview + /api stubs on http://localhost:4173
npm test        # unit tests
```

## Architecture notes

No build step and no framework: `index.html` + `styles.css` + ES modules in
`src/`, deployed as static files to Cloudflare Pages. Because there is no
bundler, anything that would normally be a build-time environment variable is
served at runtime by a Pages Function in `functions/api/`.

Icons are a vendored ~12KB subset of Lucide (`src/icons.mjs`) rather than a
358KB CDN bundle, so the installed PWA still renders offline and an upstream
release cannot change the UI.

## Supabase

The app uses these public tables:

- `life_flow_items`
- `life_flow_moods`
- `life_flow_focus_sessions`
- `life_flow_sleep_entries`

Open **Settings** in the app and add:

- Supabase project URL
- Supabase publishable key
- Private sync key, any private phrase you choose
- Optional Google Calendar secret iCal URL

The private sync key is stored in the browser and sent as `x-owner-key` so row-level security can keep each owner key separate without requiring Google sign-in. To pair devices, open Settings on the device with your existing data, choose **Copy pairing link**, and open that link on your other devices. Once paired, cloud changes pull when the app is reopened, brought back into view, or while it remains visible.

## Cloudflare

Pages Functions in `functions/api/`:

- `calendar.js` — CORS proxy for iCal feeds (`/api/calendar?url=…`). Forwards
  only to an allowlist of calendar hosts, and falls back to `CALENDAR_ICAL_URL`
  when no `url` is given, so the secret feed address can stay server-side.
- `calendar-config.js` — reports whether a server-side feed is configured
  (boolean + redacted label; never the URL itself)
- `google-config.js` — serves the public Google OAuth client ID from the
  `GOOGLE_OAUTH_CLIENT_ID` environment variable

### Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `GOOGLE_OAUTH_CLIENT_ID` | Pages → Settings → Environment variables | Google Calendar sign-in. Optional; without it the Connect button explains what to set and the iCal fallback still works. |
| `CALENDAR_ICAL_URL` | Pages → Settings → Environment variables | Secret iCal feed address. Optional. When set, the feed is fetched server-side and the URL never reaches the browser. |

No client secret is used or needed — the frontend is a public OAuth client, and
access tokens live in memory only, never in web storage.
