export const todayKey = () => formatDateKey(new Date());

export const LOCAL_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

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
  if (hour < 12) return "\u2600\ufe0f";
  if (hour < 18) return "\ud83c\udf24\ufe0f";
  return "\ud83c\udf19";
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

export function calculateStats(items, focusSessions, dateKey = todayKey(), sleepEntries = [], rewards = [], sleepGoalMinutes = 510) {
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
  const coins = calculateCoinBreakdown(items, focusSessions, sleepEntries, rewards, sleepGoalMinutes).total;

  return {
    doneToday,
    openTasks,
    streakDays,
    coins,
  };
}

export function filterItems(items, mode, dateKey = todayKey()) {
  const active = items.filter((item) => item.kind === "daily_task" || item.kind === "long_term");

  if (mode === "today") {
    return active.filter((item) => item.kind === "daily_task" && item.due_date === dateKey && !item.completed);
  }

  if (mode === "all") {
    return active;
  }

  const filters = {
    school: "School",
    track: "Track & Field",
    ymca: "YMCA",
    duke: "Duke of Ed",
    "web-dev": "Web Dev",
  };
  if (filters[mode]) {
    return active.filter((item) => item.category === filters[mode]);
  }

  return active.filter(
    (item) => item.kind === "long_term" || (item.kind === "daily_task" && (!item.due_date || item.due_date === dateKey)),
  );
}

export function eventsForDate(items, dateKey) {
  return items.filter((item) => item.kind === "calendar_event" && occursOnDate(item, dateKey));
}

export function occursOnDate(item, dateKey) {
  if (!item?.due_date || dateKey < item.due_date) return false;
  const pattern = item.repeat_pattern || "none";
  if (pattern === "none") return item.due_date === dateKey;

  const start = new Date(`${item.due_date}T00:00:00`);
  const target = new Date(`${dateKey}T00:00:00`);
  const distance = Math.round((target - start) / 86400000);
  if (pattern === "daily") return distance >= 0;
  if (pattern === "weekly") return distance >= 0 && distance % 7 === 0;
  if (pattern === "specific") return (item.repeat_days || []).includes(target.getDay());
  return item.due_date === dateKey;
}

export function summarizeFitnessWeek(entries, dateKey = todayKey()) {
  const target = new Date(`${dateKey}T00:00:00`);
  const monday = new Date(target);
  const offset = target.getDay() === 0 ? -6 : 1 - target.getDay();
  monday.setDate(target.getDate() + offset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const start = formatDateKey(monday);
  const end = formatDateKey(sunday);
  const weekly = entries.filter((entry) => entry.entry_date >= start && entry.entry_date <= end);

  return {
    pushups: weekly.reduce((sum, entry) => sum + Number(entry.pushups || 0), 0),
    trackSessions: weekly.filter((entry) => entry.track_session).length,
  };
}

export function calculateSleepScore(minutes) {
  if (minutes >= 480 && minutes <= 540) return { grade: "A", tone: "green" };
  if (minutes >= 420) return { grade: "B", tone: "yellow" };
  if (minutes >= 360) return { grade: "C", tone: "orange" };
  return { grade: "D", tone: "red" };
}

export function calculateCoinBreakdown(items, focusSessions, sleepEntries = [], rewards = [], sleepGoalMinutes = 510) {
  const tasks = items.filter((item) => item.kind !== "calendar_event" && item.completed).length * 5;
  const focus = focusSessions.filter((session) => session.earns_coins !== false && !session.is_break).length * 10;
  const sleep = sleepEntries.filter((entry) => Number(entry.minutes || 0) >= sleepGoalMinutes).length * 5;
  const calendar = items
    .filter((item) => item.kind === "calendar_event")
    .reduce((sum, item) => {
      const completions = Array.isArray(item.completed_dates) ? item.completed_dates.length : Number(Boolean(item.completed));
      if (item.category === "YMCA") return sum + completions * 15;
      if (item.category === "Track & Field") return sum + completions * 10;
      return sum;
    }, 0);
  const bonus = rewards.filter((entry) => entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0);
  const spent = Math.abs(rewards.filter((entry) => entry.amount < 0).reduce((sum, entry) => sum + entry.amount, 0));

  return {
    tasks,
    focus,
    sleep,
    calendar,
    bonus,
    spent,
    total: tasks + focus + sleep + calendar + bonus - spent,
  };
}

export function parseIcsEvents(icsText) {
  if (!icsText) return [];

  return icsText
    .replace(/\r?\n[ \t]/g, "")
    .split("BEGIN:VEVENT")
    .slice(1)
    .flatMap((block) => {
      const title = readIcsField(block, "SUMMARY") || "Calendar event";
      const start = readIcsField(block, "DTSTART");
      const end = readIcsField(block, "DTEND");
      const rrule = readIcsField(block, "RRULE");
      const startDate = parseIcsDate(start);
      const endDate = parseIcsDate(end);
      const location = unescapeIcs(readIcsField(block, "LOCATION"));
      const description = unescapeIcs(readIcsField(block, "DESCRIPTION"));
      // A DTSTART of the bare form YYYYYMMDD (VALUE=DATE) is an all-day event.
      const allDay = /^\d{8}$/.test(start.trim());

      if (!startDate) return [];

      const durationMinutes = endDate ? Math.max(15, Math.round((endDate - startDate) / 60000)) : 30;
      const exclusions = new Set(
        readIcsFields(block, "EXDATE")
          .flatMap((value) => value.split(","))
          .map((value) => parseIcsDate(value))
          .filter(Boolean)
          .map((date) => formatDateKey(date)),
      );
      const starts = rrule ? expandRecurrence(startDate, rrule).filter((date) => !exclusions.has(formatDateKey(date))) : [startDate];

      return starts.map((instanceStart) =>
        buildIcsItem({ start, title, instanceStart, durationMinutes, allDay, location, description }));
    })
    .filter(Boolean)
    .sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at)));
}

export function calculateSleepMinutes(sleptAt, wokeAt) {
  const slept = new Date(sleptAt);
  const woke = new Date(wokeAt);
  if (Number.isNaN(slept.getTime()) || Number.isNaN(woke.getTime())) return 0;
  return Math.max(0, Math.round((woke - slept) / 60000));
}

function zonedParts(instant, timeZone) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant).filter(({ type }) => type !== "literal").map(({ type, value }) => [type, Number(value)]));
}

// Convert a wall-clock value from the user's IANA time zone to an unambiguous
// UTC instant. This avoids sending `2026-08-23T22:30` to a timestamptz column,
// where Postgres may interpret the missing offset as UTC.
export function localDateTimeToIso(dateKey, time, timeZone = LOCAL_TIME_ZONE) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  const [hour, minute] = String(time).split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return "";

  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let instant = wallClockAsUtc;
  // Two passes handle the normal DST offset and the rare case where the first
  // guess crosses a daylight-saving transition.
  for (let pass = 0; pass < 2; pass += 1) {
    const parts = zonedParts(new Date(instant), timeZone);
    const representedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, 0);
    instant += wallClockAsUtc - representedAsUtc;
  }
  return new Date(instant).toISOString();
}

export function sleepTimestampsForWakeDate(wakeDate, sleptTime, wokeTime, timeZone = LOCAL_TIME_ZONE) {
  const sleptDate = sleptTime >= wokeTime ? addDays(wakeDate, -1) : wakeDate;
  return {
    sleptAt: localDateTimeToIso(sleptDate, sleptTime, timeZone),
    wokeAt: localDateTimeToIso(wakeDate, wokeTime, timeZone),
    sleepDate: wakeDate,
  };
}

export function getSleepSummary(entries, goalMinutes = 480, rangeType = "days") {
  return summarizeSleep(entries, goalMinutes, rangeType);
}

export function summarizeSleep(entries, goalMinutes = 480, rangeType = "days") {
  const sorted = [...entries]
    .map((entry) => ({
      ...entry,
      minutes: Number(entry.minutes) || calculateSleepMinutes(entry.slept_at, entry.woke_at),
    }))
    .filter((entry) => entry.minutes > 0)
    .sort((a, b) => String(a.sleep_date).localeCompare(String(b.sleep_date)));

  const today = new Date();
  let filtered = sorted;

  if (rangeType === "days") {
    filtered = sorted.slice(-7);
  } else if (rangeType === "weeks") {
    filtered = sorted.slice(-28);
  } else if (rangeType === "months") {
    filtered = sorted.slice(-90);
  }
  // for "all", use all filtered data

  const maxMinutes = Math.max(1, goalMinutes, ...filtered.map((entry) => entry.minutes));
  const total = filtered.reduce((sum, entry) => sum + entry.minutes, 0);
  const averageMinutes = filtered.length ? Math.round(total / filtered.length) : 0;

  return {
    averageMinutes,
    latestMinutes: sorted.at(-1)?.minutes || 0,
    goalMinutes,
    averagePercent: goalMinutes ? Math.round((averageMinutes / goalMinutes) * 100) : 0,
    latestPercent: goalMinutes ? Math.round(((sorted.at(-1)?.minutes || 0) / goalMinutes) * 100) : 0,
    points: filtered.map((entry) => ({
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
  if (!minutes) return "\u2014";
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

function buildIcsItem({ start, title, instanceStart, durationMinutes, allDay = false, location = "", description = "" }) {
  const key = `${start}-${title}-${instanceStart.toISOString()}`.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const end = new Date(instanceStart.getTime() + durationMinutes * 60000);
  const hhmm = (date) => `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  return {
    id: `ics-${key}`,
    kind: "calendar_event",
    title: unescapeIcs(title),
    // Location first so it is the line the agenda leads with, matching Google.
    notes: [location, description].filter(Boolean).join("\n"),
    location,
    category: "Calendar",
    priority: "medium",
    due_date: formatDateKey(instanceStart),
    // Without these the event renders as a timeless "Reminder" and sorts to the
    // bottom of the day, which is what made the old ICS import look broken.
    start_time: allDay ? "" : hhmm(instanceStart),
    end_time: allDay ? "" : hhmm(end),
    all_day: allDay,
    repeat_pattern: "none",
    repeat_days: [],
    completed_dates: [],
    subtasks: [],
    scheduled_at: allDay ? null : instanceStart.toISOString(),
    duration_minutes: allDay ? 1440 : durationMinutes,
    completed: false,
    color: "",
    source: "ics",
  };
}

function expandRecurrence(startDate, rrule) {
  const rule = parseRRule(rrule);
  const interval = Number.parseInt(rule.INTERVAL || "1", 10) || 1;
  const count = Math.min(Number.parseInt(rule.COUNT || "200", 10) || 200, 200);
  const until = rule.UNTIL ? parseIcsDate(rule.UNTIL) : addMonthsDate(startDate, 12);
  const dates = [];
  const pushDate = (date) => {
    if (date >= startDate && date <= until && dates.length < count) dates.push(new Date(date));
  };

  if (rule.FREQ === "DAILY") {
    for (const date = new Date(startDate); dates.length < count && date <= until; date.setDate(date.getDate() + interval)) {
      pushDate(date);
    }
    return dates;
  }

  if (rule.FREQ === "MONTHLY") {
    for (const date = new Date(startDate); dates.length < count && date <= until; date.setMonth(date.getMonth() + interval)) {
      pushDate(date);
    }
    return dates;
  }

  if (rule.FREQ === "WEEKLY") {
    const byDays = (rule.BYDAY || weekdayCode(startDate)).split(",").map((day) => day.trim()).filter(Boolean);
    for (const weekStart = startOfWeek(startDate); dates.length < count && weekStart <= until; weekStart.setDate(weekStart.getDate() + interval * 7)) {
      byDays.forEach((dayCode) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + weekdayIndex(dayCode));
        date.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
        pushDate(date);
      });
    }
    return dates.sort((a, b) => a - b).slice(0, count);
  }

  return [startDate];
}

function parseRRule(rrule) {
  return Object.fromEntries(
    rrule
      .split(";")
      .map((part) => part.split("="))
      .filter(([key, value]) => key && value),
  );
}

function startOfWeek(date) {
  const result = new Date(date);
  result.setDate(result.getDate() - result.getDay());
  result.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  return result;
}

function addMonthsDate(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function weekdayCode(date) {
  return ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][date.getDay()];
}

function weekdayIndex(dayCode) {
  return { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }[dayCode.slice(-2)] ?? 0;
}

function readIcsField(block, name) {
  const line = block
    .split(/\r?\n/)
    .find((candidate) => candidate.startsWith(`${name}:`) || candidate.startsWith(`${name};`));
  if (!line) return "";
  return line.slice(line.indexOf(":") + 1).trim();
}

function readIcsFields(block, name) {
  return block
    .split(/\r?\n/)
    .filter((candidate) => candidate.startsWith(`${name}:`) || candidate.startsWith(`${name};`))
    .map((line) => line.slice(line.indexOf(":") + 1).trim());
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

// ---------- Added sugar ----------
// The tracker uses the requested under-30g goal. Keep this as one exported
// config value so a future settings control can change it without rewriting
// the streak or chart logic.
export const SUGAR_DAILY_LIMIT_GRAMS = 30;

// Grams are entered by hand and can be fractional, so every total goes through
// here: 0.1 + 0.2 must read as 0.3 on screen, not 0.30000000000000004.
const roundGrams = (value) => Math.round((Number(value) || 0) * 10) / 10;

const entryDateOf = (entry) => String(entry?.entry_date || "").slice(0, 10);

export function sugarEntriesForDate(entries = [], dateKey = todayKey()) {
  return entries
    .filter((entry) => entryDateOf(entry) === dateKey)
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
}

export function sumSugarForDate(entries = [], dateKey = todayKey()) {
  return roundGrams(sugarEntriesForDate(entries, dateKey).reduce((sum, entry) => sum + (Number(entry.grams) || 0), 0));
}

// Percent is deliberately uncapped so going over reads as "128%" rather than a
// silent 100%. Only fillPercent — what the bar actually paints — is clamped.
export function getSugarProgress(totalGrams, limit = SUGAR_DAILY_LIMIT_GRAMS) {
  const grams = roundGrams(Math.max(0, Number(totalGrams) || 0));
  const percent = limit > 0 ? Math.round((grams / limit) * 100) : 0;
  return {
    grams,
    limit,
    percent,
    fillPercent: Math.max(0, Math.min(100, percent)),
    over: grams > limit,
    overBy: roundGrams(Math.max(0, grams - limit)),
    remaining: roundGrams(Math.max(0, limit - grams)),
  };
}

// Daily totals oldest-first, so a day whose items were all deleted disappears
// from history rather than lingering as a zero.
export function sugarTotalsByDate(entries = []) {
  const totals = new Map();
  for (const entry of entries) {
    const date = entryDateOf(entry);
    const grams = Number(entry.grams);
    if (!date || !Number.isFinite(grams)) continue;
    totals.set(date, (totals.get(date) || 0) + grams);
  }
  return [...totals.entries()]
    .map(([date, grams]) => ({ date, grams: roundGrams(grams) }))
    .filter((day) => day.grams > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function dateDifferenceInDays(later, earlier) {
  const laterDate = new Date(`${later}T00:00:00`);
  const earlierDate = new Date(`${earlier}T00:00:00`);
  return Math.round((laterDate - earlierDate) / 86400000);
}

export const SUGAR_STREAK_MESSAGES = [
  { minimum: 30, text: "Unstoppable!" },
  { minimum: 7, text: "You're on fire!" },
  { minimum: 1, text: "Great start!" },
  { minimum: 0, text: "Log a day under the limit to start your streak." },
];

export function sugarStreakMessage(streak) {
  return SUGAR_STREAK_MESSAGES.find(({ minimum }) => Number(streak) >= minimum)?.text || SUGAR_STREAK_MESSAGES.at(-1).text;
}

// A day is counted only when its total is strictly under the configured goal.
// If today has no entries yet, the latest completed day is yesterday; this keeps
// an in-progress day from falsely extending the record before midnight.
export function calculateSugarStreak(entries = [], limit = SUGAR_DAILY_LIMIT_GRAMS, dateKey = todayKey()) {
  const totals = sugarTotalsByDate(entries);
  const byDate = new Map(totals.map((day) => [day.date, day.grams]));
  const hasTodayEntries = byDate.has(dateKey);
  let cursor = hasTodayEntries ? dateKey : addDays(dateKey, -1);
  let current = 0;
  let latestCountedDate = "";
  while (byDate.has(cursor) && byDate.get(cursor) < limit) {
    current += 1;
    latestCountedDate ||= cursor;
    cursor = addDays(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let previous = "";
  for (const day of totals) {
    if (day.grams < limit && (!previous || dateDifferenceInDays(day.date, previous) === 1)) run += 1;
    else run = day.grams < limit ? 1 : 0;
    longest = Math.max(longest, run);
    previous = day.date;
  }

  return {
    currentStreak: current,
    longestStreak: Math.max(longest, current),
    lastUpdatedDate: latestCountedDate || (hasTodayEntries ? dateKey : ""),
    message: sugarStreakMessage(current),
  };
}

// Same range windows as summarizeSleep so the two history views behave alike.
export function summarizeSugar(entries = [], rangeType = "days", limit = SUGAR_DAILY_LIMIT_GRAMS) {
  const days = sugarTotalsByDate(entries);
  const windows = { days: 7, weeks: 28, months: 90 };
  const filtered = windows[rangeType] ? days.slice(-windows[rangeType]) : days;

  const total = filtered.reduce((sum, day) => sum + day.grams, 0);
  const averageGrams = filtered.length ? roundGrams(total / filtered.length) : 0;
  const maxGrams = Math.max(limit, ...filtered.map((day) => day.grams), 1);

  return {
    limit,
    maxGrams,
    // Where the limit line sits, as a percentage of the tallest bar in view.
    limitHeight: Math.round((limit / maxGrams) * 100),
    averageGrams,
    totalGrams: roundGrams(total),
    daysTracked: filtered.length,
    daysOverLimit: filtered.filter((day) => day.grams > limit).length,
    points: filtered.map((day) => ({
      date: day.date,
      grams: day.grams,
      label: `${day.grams}g`,
      over: day.grams > limit,
      percent: Math.round((day.grams / limit) * 100),
      // Height relative to the tallest bar in view, so the chart always fills.
      height: Math.round((day.grams / maxGrams) * 100),
    })),
  };
}
