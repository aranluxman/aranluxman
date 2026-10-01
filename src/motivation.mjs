// Motivation videos on Home. The list lives in app state (so it syncs and the
// "+ Add video" box can change it); these are the starting videos.
export const DEFAULT_MOTIVATION_VIDEOS = [
  { id: "IIDrG9J4I_8", kind: "video", title: "Before You Give Up, Watch This" },
  { id: "7fLqPBK_Z9o", kind: "video", title: "What Is Some Good Advice?" },
  { id: "wy0CyyPjnTs", kind: "video", title: "Goggins Is Not Motivated - And Neither Should You" },
  { id: "ozSiT7VXjok", kind: "video", title: "School Feels Like a Scam - Because the World Moved On" },
  { id: "pYwQyUkq6Kc", kind: "video", title: "The More You Listen to This, the Better Your Life Gets" },
  { id: "O-tGIpa-YNc", kind: "video", title: "Successful and Normal People on Failure" },
  { id: "qSZWnmCwlyo", kind: "short", title: "The Difference Is Rarely Talent" },
  { id: "CnTnVrfO348", kind: "short", title: "Harvard Mindset to Never Waste Another Second" },
];

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "www.youtube-nocookie.com"]);

// Accepts any common YouTube link (watch, shorts, youtu.be, embed, live) or a
// bare video ID. Returns { id, kind } or null when it isn't a YouTube video.
export function parseYouTubeLink(input = "") {
  const text = String(input).trim();
  if (VIDEO_ID.test(text)) return { id: text, kind: "video" };
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  let id = null;
  let kind = "video";
  if (url.hostname.toLowerCase() === "youtu.be") id = parts[0];
  else if (parts[0] === "watch") id = url.searchParams.get("v");
  else if (["shorts", "embed", "live", "v"].includes(parts[0])) {
    id = parts[1];
    if (parts[0] === "shorts") kind = "short";
  }
  return id && VIDEO_ID.test(id) ? { id, kind } : null;
}
