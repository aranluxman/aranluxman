// Vercel-style twin of functions/api/calendar.js. See that file for why the
// host allowlist and the CALENDAR_ICAL_URL fallback exist.
const ALLOWED_HOSTS = new Set([
  "calendar.google.com",
  "www.google.com",
  "outlook.office365.com",
  "outlook.live.com",
  "p24-caldav.icloud.com",
]);

export default async function handler(request, response) {
  const raw = request.query?.url || process.env.CALENDAR_ICAL_URL || "";
  if (!raw) {
    response.status(400).send("No calendar URL configured");
    return;
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    response.status(400).send("Calendar URL is not a valid URL");
    return;
  }
  if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
    response.status(400).send(`Calendar host "${parsed.hostname}" is not allowed`);
    return;
  }

  try {
    const upstream = await fetch(parsed.toString(), { headers: { Accept: "text/calendar, text/plain" } });
    if (!upstream.ok) {
      const detail = upstream.status === 404
        ? "Calendar feed not found (404). If you used the public address, the calendar must be shared publicly — otherwise use the secret address from Google Calendar settings."
        : `Calendar feed unavailable (${upstream.status})`;
      response.status(upstream.status === 404 ? 404 : 502).send(detail);
      return;
    }
    const body = await upstream.text();
    if (!body.includes("BEGIN:VCALENDAR")) {
      response.status(422).send("That URL did not return a calendar feed");
      return;
    }
    response.setHeader("Content-Type", "text/calendar; charset=utf-8");
    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=1800");
    response.send(body);
  } catch {
    response.status(502).send("Could not reach the calendar feed");
  }
}
