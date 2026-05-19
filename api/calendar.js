export default async function handler(request, response) {
  const rawUrl = request.query?.url;

  if (!rawUrl || !/^https:\/\/.+/i.test(rawUrl)) {
    response.status(400).send("Missing calendar URL");
    return;
  }

  try {
    const upstream = await fetch(rawUrl);
    if (!upstream.ok) {
      response.status(502).send("Calendar feed unavailable");
      return;
    }

    response.setHeader("Content-Type", "text/calendar; charset=utf-8");
    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=1800");
    response.send(await upstream.text());
  } catch {
    response.status(502).send("Calendar feed unavailable");
  }
}
