// Vercel-style twin of functions/api/google-config.js, kept for parity with
// api/calendar.js so the app works if deployed somewhere other than Cloudflare
// Pages. See that file for why the client ID is served rather than inlined.
export default async function handler(_request, response) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || "";

  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "public, max-age=300");
  response.status(200).send(JSON.stringify({ clientId, configured: Boolean(clientId) }));
}
