import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMonthDays,
  calculateCoinBreakdown,
  calculateStats,
  calculateSleepMinutes,
  calculateSleepScore,
  countSessionsForDate,
  eventsForDate,
  filterItems,
  formatDateKey,
  formatDisplayDate,
  getGreeting,
  getGreetingEmoji,
  getHomeSubtitle,
  getSleepSummary,
  summarizeFitnessWeek,
  parseIcsEvents,
  sanitizeFocusMinutes,
} from "../src/planner-utils.mjs";

test("buildMonthDays includes leading and trailing days for a stable calendar grid", () => {
  const days = buildMonthDays(2026, 4);

  assert.equal(days.length, 42);
  assert.equal(formatDateKey(days[0].date), "2026-04-26");
  assert.equal(formatDateKey(days[23].date), "2026-05-19");
  assert.equal(days[23].isCurrentMonth, true);
});

test("calculateStats applies the requested task and focus coin rules", () => {
  const today = "2026-05-19";
  const stats = calculateStats(
    [
      { kind: "daily_task", completed: true, due_date: today },
      { kind: "daily_task", completed: false, due_date: today },
      { kind: "long_term", completed: false },
      { kind: "daily_task", completed: true, due_date: "2026-05-18" },
    ],
    [
      { completed_at: "2026-05-19T14:00:00Z", minutes: 25 },
      { completed_at: "2026-05-18T14:00:00Z", minutes: 25 },
    ],
    today,
  );

  assert.deepEqual(stats, {
    doneToday: 1,
    openTasks: 2,
    streakDays: 2,
    coins: 30,
  });
});

test("filterItems supports Today, All, and category modes", () => {
  const items = [
    { kind: "daily_task", title: "Study", priority: "high", due_date: "2026-05-19" },
    { kind: "daily_task", title: "Practice", category: "Track & Field", priority: "medium", due_date: "2026-05-24" },
    { kind: "long_term", title: "Build portfolio", category: "Web Dev", priority: "high" },
  ];

  assert.deepEqual(
    filterItems(items, "today", "2026-05-19").map((item) => item.title),
    ["Study"],
  );
  assert.equal(filterItems(items, "all", "2026-05-19").length, 3);
  assert.deepEqual(filterItems(items, "track", "2026-05-19").map((item) => item.title), ["Practice"]);
  assert.deepEqual(filterItems(items, "web-dev", "2026-05-19").map((item) => item.title), ["Build portfolio"]);
});

test("eventsForDate expands seeded and user-created recurrence rules", () => {
  const events = [
    { id: "track", kind: "calendar_event", due_date: "2026-05-25", repeat_pattern: "specific", repeat_days: [1, 3, 5] },
    { id: "weekly", kind: "calendar_event", due_date: "2026-05-26", repeat_pattern: "weekly" },
  ];

  assert.deepEqual(eventsForDate(events, "2026-05-27").map((event) => event.id), ["track"]);
  assert.deepEqual(eventsForDate(events, "2026-06-02").map((event) => event.id), ["weekly"]);
  assert.deepEqual(eventsForDate(events, "2026-05-24"), []);
});

test("summarizeFitnessWeek counts Monday-through-Sunday track sessions and pushups", () => {
  const totals = summarizeFitnessWeek(
    [
      { entry_date: "2026-05-25", pushups: 20, track_session: true },
      { entry_date: "2026-05-26", pushups: 15, track_session: false },
      { entry_date: "2026-05-31", pushups: 25, track_session: true },
      { entry_date: "2026-06-01", pushups: 99, track_session: true },
    ],
    "2026-05-26",
  );

  assert.deepEqual(totals, { pushups: 60, trackSessions: 2 });
});

test("calculateSleepScore returns athlete-facing letter bands", () => {
  assert.deepEqual(calculateSleepScore(510), { grade: "A", tone: "green" });
  assert.deepEqual(calculateSleepScore(450), { grade: "B", tone: "yellow" });
  assert.deepEqual(calculateSleepScore(390), { grade: "C", tone: "orange" });
  assert.deepEqual(calculateSleepScore(330), { grade: "D", tone: "red" });
});

test("calculateCoinBreakdown applies task, focus, sleep, completed event, and arcade rewards", () => {
  const breakdown = calculateCoinBreakdown(
    [
      { kind: "daily_task", completed: true },
      { kind: "calendar_event", category: "Track & Field", completed_dates: ["2026-05-25"] },
      { kind: "calendar_event", category: "YMCA", completed_dates: ["2026-05-30"] },
    ],
    [{ minutes: 25 }, { minutes: 50 }, { minutes: 15, earns_coins: false, is_break: true }],
    [{ minutes: 515 }],
    [{ amount: 20, reason: "daily_boost" }, { amount: -5, reason: "memory_entry" }, { amount: 5, reason: "memory_win" }],
    510,
  );

  assert.deepEqual(breakdown, {
    tasks: 5,
    focus: 20,
    sleep: 5,
    calendar: 25,
    bonus: 25,
    spent: 5,
    total: 75,
  });
});

test("parseIcsEvents extracts dated events safely", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "SUMMARY:Track practice",
    "DTSTART:20260519T210000Z",
    "DTEND:20260519T220000Z",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");

  const events = parseIcsEvents(ics);

  assert.equal(events.length, 1);
  assert.equal(events[0].title, "Track practice");
  assert.equal(events[0].due_date, "2026-05-19");
  assert.equal(events[0].kind, "calendar_event");
});

test("parseIcsEvents expands weekly recurring calendar events", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "SUMMARY:Track practice",
    "DTSTART:20260518T220000Z",
    "DTEND:20260518T233000Z",
    "RRULE:FREQ=WEEKLY;COUNT=3;BYDAY=MO,FR",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");

  const events = parseIcsEvents(ics);

  assert.deepEqual(
    events.map((event) => event.due_date),
    ["2026-05-18", "2026-05-22", "2026-05-25"],
  );
});

test("getGreeting is date-aware", () => {
  assert.equal(getGreeting(new Date("2026-05-19T23:00:00")), "Good evening");
  assert.equal(getGreeting(new Date("2026-05-19T09:00:00")), "Good morning");
  assert.equal(getGreetingEmoji(new Date("2026-05-19T09:00:00")), "\u2600\ufe0f");
  assert.equal(getGreetingEmoji(new Date("2026-05-19T14:00:00")), "\ud83c\udf24\ufe0f");
  assert.equal(getGreetingEmoji(new Date("2026-05-19T23:00:00")), "\ud83c\udf19");
  assert.equal(formatDisplayDate(new Date("2026-05-21T09:00:00")), "Thursday, May 21");
  assert.notEqual(getHomeSubtitle(new Date("2026-05-19T09:00:00")), getHomeSubtitle(new Date("2026-05-20T09:00:00")));
});

test("sanitizeFocusMinutes keeps custom focus lengths practical", () => {
  assert.equal(sanitizeFocusMinutes("45"), 45);
  assert.equal(sanitizeFocusMinutes("0"), 1);
  assert.equal(sanitizeFocusMinutes("999"), 240);
  assert.equal(sanitizeFocusMinutes("not a number"), 25);
});

test("calculateSleepMinutes handles overnight sleep", () => {
  assert.equal(calculateSleepMinutes("2026-05-19T22:45", "2026-05-20T06:30"), 465);
});

test("getSleepSummary calculates average and graph percentages", () => {
  const summary = getSleepSummary([
    { sleep_date: "2026-05-18", slept_at: "2026-05-18T23:00", woke_at: "2026-05-19T06:00" },
    { sleep_date: "2026-05-19", slept_at: "2026-05-19T22:30", woke_at: "2026-05-20T07:00" },
  ], 480);

  assert.equal(summary.averageMinutes, 465);
  assert.equal(summary.latestMinutes, 510);
  assert.equal(summary.goalMinutes, 480);
  assert.equal(summary.averagePercent, 97);
  assert.deepEqual(
    summary.points.map((point) => point.percent),
    [82, 100],
  );
});

test("countSessionsForDate counts only completed focus sessions for that day", () => {
  assert.equal(
    countSessionsForDate(
      [
        { completed_at: "2026-05-21T10:00:00Z" },
        { completed_at: "2026-05-21T15:00:00Z" },
        { completed_at: "2026-05-20T15:00:00Z" },
      ],
      "2026-05-21",
    ),
    2,
  );
});
