import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMonthDays,
  calculateStats,
  calculateSleepMinutes,
  filterItems,
  formatDateKey,
  getGreeting,
  getSleepSummary,
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

test("calculateStats separates daily tasks, long-term todos, streak, and coins", () => {
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
    coins: 90,
  });
});

test("filterItems supports all, weekly, priorities, and long-term modes", () => {
  const items = [
    { kind: "daily_task", title: "Study", priority: "high", due_date: "2026-05-19" },
    { kind: "daily_task", title: "Practice", priority: "medium", due_date: "2026-05-24" },
    { kind: "long_term", title: "Build portfolio", priority: "high" },
  ];

  assert.equal(filterItems(items, "all", "2026-05-19").length, 2);
  assert.equal(filterItems(items, "weekly", "2026-05-19").length, 2);
  assert.equal(filterItems(items, "priorities", "2026-05-19").length, 2);
  assert.equal(filterItems(items, "long-term", "2026-05-19").length, 1);
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

test("getGreeting is date-aware", () => {
  assert.equal(getGreeting(new Date("2026-05-19T23:00:00")), "Good evening");
  assert.equal(getGreeting(new Date("2026-05-19T09:00:00")), "Good morning");
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
  ]);

  assert.equal(summary.averageMinutes, 465);
  assert.equal(summary.latestMinutes, 510);
  assert.deepEqual(
    summary.points.map((point) => point.percent),
    [82, 100],
  );
});
