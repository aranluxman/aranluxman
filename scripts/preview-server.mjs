import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};

// Minimal stand-ins for the Cloudflare Pages Functions, so `/api/*` behaves the
// same locally as it does in production.
const apiRoutes = {
  "/api/google-config": (_url, response) => {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ clientId, configured: Boolean(clientId) }));
  },
  "/api/calendar-config": (_url, response) => {
    const url = process.env.CALENDAR_ICAL_URL || "";
    let label = "";
    if (url) {
      try {
        const parsed = new URL(url);
        label = `${parsed.hostname}/…/${parsed.pathname.split("/").pop()}`;
      } catch { label = "configured"; }
    }
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ configured: Boolean(url), label }));
  },
  "/api/calendar": async (url, response) => {
    const raw = url.searchParams.get("url") || process.env.CALENDAR_ICAL_URL || "";
    if (!raw) {
      response.writeHead(400);
      response.end("No calendar URL configured");
      return;
    }
    try {
      const upstream = await fetch(raw, { headers: { Accept: "text/calendar, text/plain" } });
      if (!upstream.ok) {
        const detail = upstream.status === 404
          ? "Calendar feed not found (404). If you used the public address, the calendar must be shared publicly — otherwise use the secret address from Google Calendar settings."
          : `Calendar feed unavailable (${upstream.status})`;
        response.writeHead(upstream.status === 404 ? 404 : 502);
        response.end(detail);
        return;
      }
      const body = await upstream.text();
      if (!body.includes("BEGIN:VCALENDAR")) {
        response.writeHead(422);
        response.end("That URL did not return a calendar feed");
        return;
      }
      response.writeHead(200, { "Content-Type": "text/calendar; charset=utf-8" });
      response.end(body);
    } catch {
      response.writeHead(502);
      response.end("Could not reach the calendar feed");
    }
  },
};

createServer((request, response) => {
  const url = new URL(request.url || "/", "http://localhost");
  const route = apiRoutes[url.pathname];
  if (route) {
    void route(url, response);
    return;
  }
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = normalize(join(root, requested));

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, { "Content-Type": types[extname(filePath)] || "application/octet-stream" });
  createReadStream(filePath).pipe(response);
}).listen(port, () => {
  console.log(`Preview server running at http://localhost:${port}`);
});
