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

// Minimal stand-in for the Cloudflare Pages Function, so `/api/*` behaves the
// same locally as it does in production.
const apiRoutes = {
  "/api/supabase-config": (_url, response) => {
    const url = process.env.SUPABASE_URL || "";
    const key = process.env.SUPABASE_ANON_KEY || "";
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify({ url, key, configured: Boolean(url && key) }));
  },
};

createServer((request, response) => {
  const url = new URL(request.url || "/", "http://localhost");
  const route = apiRoutes[url.pathname];
  if (route) {
    void route(url, response);
    return;
  }
  // Cloudflare Pages serves index.html for unknown extensionless paths when the
  // site has no 404.html (SPA mode); mirror that so /finance/... deep links work.
  const isAppRoute = url.pathname === "/" || (!extname(url.pathname) && !existsSync(join(root, url.pathname)));
  const requested = isAppRoute ? "/index.html" : url.pathname;
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
