export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const rawUrl = url.searchParams.get("url");

  if (!rawUrl || !/^https:\/\/.+/i.test(rawUrl)) {
    return new Response("Missing calendar URL", { status: 400 });
  }

  try {
    const upstream = await fetch(rawUrl);
    if (!upstream.ok) {
      return new Response("Calendar feed unavailable", { status: 502 });
    }

    return new Response(await upstream.text(), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "s-maxage=300, stale-while-revalidate=1800",
      },
    });
  } catch {
    return new Response("Calendar feed unavailable", { status: 502 });
  }
}
