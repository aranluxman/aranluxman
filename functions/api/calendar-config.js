// Tells the frontend whether an iCal feed is configured server-side.
//
// The URL itself is returned ONLY as a boolean plus a redacted preview — never
// in full. A Google "secret address" grants read access to the whole calendar
// to anyone who has it, so it stays on the server: the app calls
// /api/calendar with no `url` parameter and the Function fills it in.
//
// Set CALENDAR_ICAL_URL in Cloudflare Pages → Settings → Environment variables.
export async function onRequestGet({ env }) {
  const url = env?.CALENDAR_ICAL_URL || "";
  let label = "";
  if (url) {
    try {
      const parsed = new URL(url);
      // e.g. "calendar.google.com/…/basic.ics" — enough to recognise, not to use.
      label = `${parsed.hostname}/…/${parsed.pathname.split("/").pop()}`;
    } catch {
      label = "configured";
    }
  }

  return new Response(JSON.stringify({ configured: Boolean(url), label }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
