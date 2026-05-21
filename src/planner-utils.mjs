export const todayKey = () => formatDateKey(new Date());

export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function getGreetingEmoji(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "☀️";
  if (hour < 18) return "🌤️";
  return "🌙";
}

export function formatDisplayDate(date = new Date()) {
  return date.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" });
}

export function getHomeSubtitle(date = new Date()) {
  const lines = [
    "Start clean. Pick one thing and move.",
    "Make today lighter with one honest finish.",
    "Small wins count when you collect them.",
    "Focus first, then enjoy the calm.",
    "Build the day one clear choice at a time.",
  ];
  return lines[date.getDate() % lines.length];
}

export function sanitizeFocusMinutes(value, fallback = 25) {
  const minutes = Number.parseInt(value, 10);
  if (!Number.isFinite(minutes)) return fallback;
  return Math.min(240, Math.max(1, minutes));
}

export function buildMonthDays(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      key: formatDateKey(date),
      isCurrentMonth: date.getMonth() === monthIndex,
      dayNumber: date.getDate(),
    };
  });
}

export function calculateStats(items, focusSessions, dateKey = todayKey()) {
  const doneToday = items.filter(
    (item) => item.kind === "daily_task" && item.completed && item.due_date === dateKey,
  ).length;

  const openTasks = items.filter(
    (item) =>
      !item.completed &&
      (item.kind === "daily_task" || item.kind === "long_term") &&
      (!item.due_date || item.due_date <= addDays(dateKey, 7)),
  ).length;

  const streakDays = calculateFocusStreak(focusSessions, dateKey);
  const completedTasks = items.filter((item) => item.completed).length;
  const focusMinutes = focusSessions.reduce((sum, session) => sum + Number(session.minutes || 0), 0);

  return {
    doneToday,
    openTasks,
    streakDays,
    coins: completedTasks * 20 + Math.floor(focusMinutes / 5) * 5,
  };
}

export function filterItems(items, mode, dateKey = todayKey()) {
  const weekEnd = addDays(dateKey, 6);
  const active = items.filter((item) => item.kind === "daily_task" || item.kind === "long_term");

  if (mode === "today") {
    return active.filter((item) => item.kind === "daily_task" && item.due_date === dateKey && !item.completed);
  }

  if (mode === "all") {
    return active;
  }

  if (mode === "weekly") {
    return active.filter((item) => item.kind === "daily_task" && item.due_date >= dateKey && item.due_date <= weekEnd);
  }

  if (mode === "priorities") {
    return active.filter((item) => item.priority === "high" && !item.completed);
  }

  if (mode === "long-term") {
    return active.filter((item) => item.kind === "long_term");
  }

  return active.filter(
    (item) => item.kind === "long_term" || (item.kind === "daily_task" && (!item.due_date || item.due_date === dateKey)),
  );
}

export function parseIcsEvents(icsText) {
  if (!icsText) return [];

  return icsText
    .split("BEGIN:VEVENT")
    .slice(1)
    .map((block) => {
      const title = readIcsField(block, "SUMMARY") || "Calendar event";
      const start = readIcsField(block, "DTSTART");
      const end = readIcsField(block, "DTEND");
      const startDate = parseIcsDate(start);
      const endDate = parseIcsDate(end);

      if (!startDate) return null;

      return {
        id: `ics-${start}-${title}`.replace(/[^a-z0-9-]/gi, "-").toLowerCase(),
        kind: "calendar_event",
        title: unescapeIcs(title),
        notes: "",
        category: "Calendar",
        priority: "medium",
        due_date: formatDateKey(startDate),
        scheduled_at: startDate.toISOString(),
        duration_minutes: endDate ? Math.max(15, Math.round((endDate - startDate) / 60000)) : 30,
        completed: false,
        color: "#b99be1",
        source: "ics",
      };
    })
    .filter(Boolean);
}

export function calculateSleepMinutes(sleptAt, wokeAt) {
  const slept = new Date(sleptAt);
  const woke = new Date(wokeAt);
  if (Number.isNaN(slept.getTime()) || Number.isNaN(woke.getTime())) return 0;
  return Math.max(0, Math.round((woke - slept) / 60000));
}

export function getSleepSummary(entries, goalMinutes = 480) {
  return summarizeSleep(entries, goalMinutes);
}

export function summarizeSleep(entries, goalMinutes = 480) {
  const sorted = [...entries]
    .map((entry) => ({
      ...entry,
      minutes: Number(entry.minutes) || calculateSleepMinutes(entry.slept_at, entry.woke_at),
    }))
    .filter((entry) => entry.minutes > 0)
    .sort((a, b) => String(a.sleep_date).localeCompare(String(b.sleep_date)))
    .slice(-7);

  const maxMinutes = Math.max(1, goalMinutes, ...sorted.map((entry) => entry.minutes));
  const total = sorted.reduce((sum, entry) => sum + entry.minutes, 0);
  const averageMinutes = sorted.length ? Math.round(total / sorted.length) : 0;

  return {
    averageMinutes,
    latestMinutes: sorted.at(-1)?.minutes || 0,
    goalMinutes,
    averagePercent: goalMinutes ? Math.round((averageMinutes / goalMinutes) * 100) : 0,
    latestPercent: goalMinutes ? Math.round(((sorted.at(-1)?.minutes || 0) / goalMinutes) * 100) : 0,
    points: sorted.map((entry) => ({
      date: entry.sleep_date,
      minutes: entry.minutes,
      label: formatSleepDuration(entry.minutes),
      percent: Math.round((entry.minutes / maxMinutes) * 100),
    })),
  };
}

export function countSessionsForDate(focusSessions, dateKey = todayKey()) {
  return focusSessions.filter((session) => String(session.completed_at || "").slice(0, 10) === dateKey).length;
}

export function formatSleepDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!minutes) return "—";
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

function calculateFocusStreak(focusSessions, dateKey) {
  const sessionDays = new Set(
    focusSessions.map((session) => String(session.completed_at || "").slice(0, 10)).filter(Boolean),
  );

  let streak = 0;
  let cursor = dateKey;
  while (sessionDays.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

function readIcsField(block, name) {
  const line = block
    .split(/\r?\n/)
    .find((candidate) => candidate.startsWith(`${name}:`) || candidate.startsWith(`${name};`));
  if (!line) return "";
  return line.slice(line.indexOf(":") + 1).trim();
}

function parseIcsDate(value) {
  if (!value) return null;
  if (/^\d{8}$/.test(value)) {
    return new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00`);
  }
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}${value.endsWith("Z") ? "Z" : ""}`;
  return new Date(iso);
}

function unescapeIcs(value) {
  return value.replace(/\\n/g, " ").replace(/\\,/g, ",").replace(/\\\\/g, "\\");
}
