// Fetches an iCal (ICS) feed on the browser's behalf.
//
// This proxy exists only because Google's iCal endpoints send no CORS headers,
// so the page cannot read them directly.
//
// Two things it deliberately does NOT do:
//   * forward arbitrary URLs — the host allowlist below stops this endpoint
//     from being used as an open proxy to probe other sites (including
//     internal addresses) from Cloudflare's network;
//   * log or store the URL — a "secret address" iCal URL is a credential in
//     disguise, and anyone holding it can read the calendar.
//
// If CALENDAR_ICAL_URL is configured, `?url=` may be omitted entirely and the
// server-side value is used, so the secret never has to reach the client.

const ALLOWED_HOSTS = new Set([
  "calendar.google.com",
  "www.google.com",
  "outlook.office365.com",
  "outlook.live.com",
  "p24-caldav.icloud.com",
]);

function resolveTarget(requestedUrl, env) {
  const configured = env?.CALENDAR_ICAL_URL || "";
  const raw = requestedUrl || configured;
  if (!raw) return { error: "No calendar URL configured", status: 400 };

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return { error: "Calendar URL is not a valid URL", status: 400 };
  }
  if (parsed.protocol !== "https:") return { error: "Calendar URL must use https", status: 400 };
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return { error: `Calendar host "${parsed.hostname}" is not allowed`, status: 400 };
  }
  return { url: parsed.toString() };
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const { url: target, error, status } = resolveTarget(url.searchParams.get("url"), env);
  if (error) return new Response(error, { status });

  let upstream;
  try {
    upstream = await fetch(target, { headers: { Accept: "text/calendar, text/plain" } });
  } catch {
    return new Response("Could not reach the calendar feed", { status: 502 });
  }

  if (!upstream.ok) {
    // Pass the real reason through — a 404 here almost always means the feed is
    // the "public address" form for a calendar that is not actually public, and
    // the user needs the "secret address" instead. Swallowing that made the old
    // failure impossible to diagnose from the UI.
    const detail = upstream.status === 404
      ? "Calendar feed not found (404). If you used the public address, the calendar must be shared publicly — otherwise use the secret address from Google Calendar settings."
      : `Calendar feed unavailable (${upstream.status})`;
    return new Response(detail, { status: upstream.status === 404 ? 404 : 502 });
  }

  const body = await upstream.text();
  if (!body.includes("BEGIN:VCALENDAR")) {
    return new Response("That URL did not return a calendar feed", { status: 422 });
  }

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=1800",
    },
  });
}
