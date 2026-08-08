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
  "/api/calendar": async (url, response) => {
    const raw = url.searchParams.get("url");
    if (!raw || !/^https:\/\/.+/i.test(raw)) {
      response.writeHead(400);
      response.end("Missing calendar URL");
      return;
    }
    try {
      const upstream = await fetch(raw);
      if (!upstream.ok) throw new Error("bad upstream");
      response.writeHead(200, { "Content-Type": "text/calendar; charset=utf-8" });
      response.end(await upstream.text());
    } catch {
      response.writeHead(502);
      response.end("Calendar feed unavailable");
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
