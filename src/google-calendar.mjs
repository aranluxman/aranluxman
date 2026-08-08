// Google Calendar integration.
//
// Two ways to get real events in, in order of preference:
//
//   1. OAuth 2.0 (this file's main path). Google Identity Services runs the
//      implicit/token flow in the browser and hands back a short-lived access
//      token which we keep in memory only. The OAuth client ID is NOT baked
//      into this bundle — it is served at runtime by the Cloudflare Pages
//      Function at /api/google-config, which reads it from the
//      GOOGLE_OAUTH_CLIENT_ID environment variable. There is no client secret
//      anywhere in the frontend, because a browser app is a public client and
//      must never hold one.
//
//   2. A secret iCal (ICS) feed URL, handled in planner-utils.mjs. No Google
//      Cloud project needed, but Google only regenerates those feeds every few
//      hours, so it lags. See docs/GOOGLE_CALENDAR_SETUP.md for the tradeoff.
//
// Tokens are deliberately never written to localStorage. An access token there
// is readable by any XSS on the page; keeping it in a module-scoped variable
// means a reload simply re-runs the silent flow against the user's live Google
// session instead of leaving a long-lived credential lying around on disk.

const GIS_SRC = "https://accounts.google.com/gsi/client";
const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const API = "https://www.googleapis.com/calendar/v3";

// In-memory only. Cleared on reload by design (see note above).
let accessToken = "";
let tokenExpiresAt = 0;
let tokenClient = null;
let cachedClientId = null;
let gisPromise = null;

export class GoogleCalendarError extends Error {
  constructor(message, { needsConsent = false } = {}) {
    super(message);
    this.name = "GoogleCalendarError";
    this.needsConsent = needsConsent;
  }
}

/** Ask our own backend for the public OAuth client ID. */
export async function getClientId() {
  if (cachedClientId !== null) return cachedClientId;
  try {
    const response = await fetch("/api/google-config", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    cachedClientId = data.clientId || "";
  } catch {
    cachedClientId = "";
  }
  return cachedClientId;
}

export async function isConfigured() {
  return Boolean(await getClientId());
}

function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisPromise = null;
      reject(new GoogleCalendarError("Could not reach Google sign-in. Check your connection."));
    };
    document.head.appendChild(script);
  });
  return gisPromise;
}

async function ensureTokenClient() {
  const clientId = await getClientId();
  if (!clientId) {
    throw new GoogleCalendarError(
      "Google Calendar isn't set up on this deployment yet. Add GOOGLE_OAUTH_CLIENT_ID in Cloudflare Pages, or paste a secret iCal URL instead.",
    );
  }
  await loadGis();
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: () => {}, // replaced per-request below
    });
  }
  return tokenClient;
}

function hasLiveToken() {
  // 60s of slack so a request can't die mid-flight on an expiring token.
  return Boolean(accessToken) && Date.now() < tokenExpiresAt - 60_000;
}

/**
 * Get a usable access token.
 * @param {"none"|"consent"} prompt  "none" = silent (fails if no Google session
 *   or no prior grant); "consent" = show the account picker.
 */
function requestToken(prompt) {
  return new Promise((resolve, reject) => {
    tokenClient.callback = (response) => {
      if (response.error) {
        const silentFailure = ["interaction_required", "consent_required", "login_required", "access_denied"]
          .includes(response.error);
        reject(new GoogleCalendarError(
          response.error_description || response.error,
          { needsConsent: silentFailure },
        ));
        return;
      }
      accessToken = response.access_token;
      tokenExpiresAt = Date.now() + Number(response.expires_in || 3600) * 1000;
      resolve(accessToken);
    };
    try {
      tokenClient.requestAccessToken({ prompt });
    } catch (error) {
      reject(new GoogleCalendarError(error.message));
    }
  });
}

/** Interactive connect — shows Google's account picker. Call from a click. */
export async function connect() {
  await ensureTokenClient();
  await requestToken("consent");
  return getAccountEmail();
}

/**
 * Silent re-auth for page loads and background refreshes. Throws with
 * needsConsent=true when the user has to click Connect again.
 */
export async function reconnectSilently() {
  if (hasLiveToken()) return accessToken;
  await ensureTokenClient();
  return requestToken("none");
}

export function disconnect() {
  const token = accessToken;
  accessToken = "";
  tokenExpiresAt = 0;
  if (token && window.google?.accounts?.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(token, () => {});
    } catch {
      // Revocation is best-effort; the token expires on its own within the hour.
    }
  }
}

export function isConnected() {
  return hasLiveToken();
}

async function googleFetch(path, params = {}) {
  const url = new URL(`${API}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (response.status === 401 || response.status === 403) {
    accessToken = "";
    tokenExpiresAt = 0;
    throw new GoogleCalendarError("Google access expired. Reconnect to keep syncing.", { needsConsent: true });
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new GoogleCalendarError(`Google Calendar API error ${response.status}${body ? `: ${body.slice(0, 160)}` : ""}`);
  }
  return response.json();
}

async function getAccountEmail() {
  try {
    const calendar = await googleFetch("/calendars/primary");
    return calendar.id || "";
  } catch {
    return "";
  }
}

/** All calendars the account can read, primary first. */
export async function listCalendars() {
  const data = await googleFetch("/users/me/calendarList", { minAccessRole: "reader", maxResults: 250 });
  return (data.items || [])
    .filter((entry) => entry.selected !== false && !entry.deleted)
    .map((entry) => ({
      id: entry.id,
      name: entry.summaryOverride || entry.summary || entry.id,
      primary: Boolean(entry.primary),
      color: entry.backgroundColor || "",
    }))
    .sort((a, b) => Number(b.primary) - Number(a.primary));
}

/**
 * Pull events across a date window for every readable calendar.
 * singleEvents=true makes Google expand recurring series for us, so each
 * occurrence arrives as its own dated instance — no RRULE maths on our side,
 * and cancelled/moved instances are already accounted for.
 */
export async function fetchEvents({ monthsBack = 3, monthsAhead = 12 } = {}) {
  if (!hasLiveToken()) await reconnectSilently();

  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1).toISOString();
  const timeMax = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1).toISOString();
  const calendars = await listCalendars();
  const collected = [];

  for (const calendar of calendars) {
    let pageToken = "";
    // Bounded loop: Google caps at 2500/page, and the window above is finite.
    for (let page = 0; page < 10; page += 1) {
      const data = await googleFetch(`/calendars/${encodeURIComponent(calendar.id)}/events`, {
        timeMin, timeMax, singleEvents: true, orderBy: "startTime", maxResults: 2500, pageToken,
      });
      for (const event of data.items || []) {
        const mapped = mapGoogleEvent(event, calendar);
        if (mapped) collected.push(...mapped);
      }
      pageToken = data.nextPageToken || "";
      if (!pageToken) break;
    }
  }
  return collected;
}

const pad = (n) => String(n).padStart(2, "0");
const dateKeyOf = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const timeOf = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

/**
 * Convert one Google event into this app's item shape.
 *
 * Returns an array because an all-day event spanning several days becomes one
 * item per day, which is how the month/week grids expect to find it.
 * Timed events that cross midnight stay as a single item on the start day so
 * the agenda shows the true start and end.
 */
export function mapGoogleEvent(event, calendar = {}) {
  if (!event || event.status === "cancelled") return null;

  const allDay = Boolean(event.start?.date);
  const startRaw = event.start?.dateTime || event.start?.date;
  const endRaw = event.end?.dateTime || event.end?.date;
  if (!startRaw) return null;

  // Location and description both live in notes — that's the only free-text
  // field the agenda renders. Keep Google's exact strings, just joined.
  const notes = [event.location, event.description]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("\n");

  const base = {
    kind: "calendar_event",
    title: event.summary || "(no title)",
    notes,
    location: event.location || "",
    category: "Calendar",
    priority: "medium",
    completed: false,
    completed_dates: [],
    subtasks: [],
    repeat_pattern: "none",
    repeat_days: [],
    source: "google",
    google_calendar_id: calendar.id || "primary",
    google_calendar_name: calendar.name || "",
    google_event_id: event.id,
    html_link: event.htmlLink || "",
    color: calendar.color || "",
    updated_at: event.updated || new Date().toISOString(),
    created_at: event.created || new Date().toISOString(),
  };

  if (allDay) {
    // Google's all-day end date is exclusive, so a one-day event ends the next day.
    const start = new Date(`${startRaw}T00:00:00`);
    const endExclusive = endRaw ? new Date(`${endRaw}T00:00:00`) : new Date(start.getTime() + 86400000);
    const days = [];
    for (let cursor = new Date(start); cursor < endExclusive && days.length < 60; cursor.setDate(cursor.getDate() + 1)) {
      const key = dateKeyOf(cursor);
      days.push({
        ...base,
        id: `google:${base.google_calendar_id}:${event.id}:${key}`,
        due_date: key,
        start_time: "",
        end_time: "",
        all_day: true,
        scheduled_at: null,
        duration_minutes: 1440,
      });
    }
    return days;
  }

  const start = new Date(startRaw);
  const end = endRaw ? new Date(endRaw) : new Date(start.getTime() + 30 * 60000);
  if (Number.isNaN(start.getTime())) return null;
  const key = dateKeyOf(start);
  const sameDay = dateKeyOf(end) === key;

  return [{
    ...base,
    id: `google:${base.google_calendar_id}:${event.id}:${key}`,
    due_date: key,
    // Rendered in the user's local timezone, which is what Google shows them.
    start_time: timeOf(start),
    end_time: sameDay ? timeOf(end) : "23:59",
    all_day: false,
    scheduled_at: start.toISOString(),
    duration_minutes: Math.max(5, Math.round((end - start) / 60000)),
  }];
}
