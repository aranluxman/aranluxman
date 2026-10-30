# Aran Life Flow

A calm personal dashboard for goals, speaking practice, finance guides, and daily motivation.

## Features

- Four sections: Home, Speak, Finance, Me. Swipe left/right (or tap the nav) to move between them
- Speaking practice: rotating topics, frameworks, and R/S/TH/SH articulation drills
- Goals with an overall completion percentage and a per-category breakdown, saved automatically
- Dark and light themes (toggle on the page, or in Settings)
- Law of the Day on Home (one of the 48 Laws of Power, in order, one per day) that
  opens the full list at `/laws`, with how-to-use or how-to-defend tips
- Finance: guides with their own URLs (`/finance`, `/finance/4s-spending-framework`)
  and auto-saved self-check notes. Deep links rely on Cloudflare Pages' SPA
  fallback, so keep the site free of a top-level `404.html`.
- Supabase URL and key served from the server, never stored in the source or shown in Settings; iOS-friendly PWA metadata
- Supabase sync for goals, notes, speaking practice, and settings

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

The Supabase project URL and publishable key are **not** in the source or the
Settings screen. `functions/api/supabase-config.js` serves them at runtime from
environment variables (see below). In the app, open **Settings** and add a
private sync key, any private phrase you choose.

The private sync key is stored in the browser and sent as `x-owner-key` so row-level security can keep each owner key separate without requiring Google sign-in. To pair devices, open Settings on the device with your existing data, choose **Copy pairing link**, and open that link on your other devices. Once paired, cloud changes pull when the app is reopened, brought back into view, or while it remains visible.

## Cloudflare

Pages Functions in `functions/api/`:

- `supabase-config.js` — serves the Supabase URL and publishable key from the
  `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables

### Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Pages → Settings → Environment variables | Supabase project URL. Required for cloud sync. |
| `SUPABASE_ANON_KEY` | Pages → Settings → Environment variables | Supabase **publishable** key (never the `service_role` key). Required for cloud sync. |

For `npm run dev`, export the same two variables before starting the server.
Without them the app still works in local mode (data stays in the browser).
