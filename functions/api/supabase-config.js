// Serves the Supabase project URL and publishable key to the frontend at runtime.
//
// Why this exists: the site is plain static files with no build step, so the
// values cannot be substituted into the JS, and committing them would put them
// in the repository and in every copy of the bundle. Reading them from the
// environment keeps them out of the source, and lets them be rotated from the
// Cloudflare dashboard without a code change.
//
// A publishable (anon) key is not a secret in the cryptographic sense — it is
// the key a browser needs to talk to Supabase — so access is still enforced by
// Row Level Security. Never put the service_role key here.
// Set SUPABASE_URL and SUPABASE_ANON_KEY in Cloudflare Pages → Settings →
// Environment variables.
export async function onRequestGet({ env }) {
  const url = env?.SUPABASE_URL || "";
  const key = env?.SUPABASE_ANON_KEY || "";

  return new Response(JSON.stringify({ url, key, configured: Boolean(url && key) }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
