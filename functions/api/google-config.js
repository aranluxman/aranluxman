// Serves the public Google OAuth client ID to the frontend at runtime.
//
// Why this exists: the site is deployed as plain static files (no bundler, no
// build step), so there is no point at which a VITE_-style env var could be
// substituted into the JS. Reading it here keeps the value out of the git
// repository and out of the shipped bundle, and lets it be rotated from the
// Cloudflare dashboard without a code change.
//
// An OAuth *client ID* is public by design — it appears in the authorization
// URL the browser navigates to. What must never be here is the client secret;
// this app is a public client using the GIS token flow and does not have one.
// Set GOOGLE_OAUTH_CLIENT_ID in Cloudflare Pages → Settings → Environment
// variables. See docs/GOOGLE_CALENDAR_SETUP.md.
export async function onRequestGet({ env }) {
  const clientId = env?.GOOGLE_OAUTH_CLIENT_ID || "";

  return new Response(JSON.stringify({ clientId, configured: Boolean(clientId) }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Per-user data is not involved, but the value can be rotated, so keep
      // the cache short and let the browser revalidate.
      "Cache-Control": "public, max-age=300",
    },
  });
}
