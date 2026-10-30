// Vercel-style twin of functions/api/supabase-config.js, for deployments other
// than Cloudflare Pages. See that file for why the values are served, not inlined.
export default async function handler(_request, response) {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";

  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.status(200).send(JSON.stringify({ url, key, configured: Boolean(url && key) }));
}
