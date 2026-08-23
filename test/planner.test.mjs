import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMonthDays,
  calculateCoinBreakdown,
  calculateStats,
  calculateSleepMinutes,
  calculateSugarStreak,
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
  getSugarProgress,
  localDateTimeToIso,
  SUGAR_DAILY_LIMIT_GRAMS,
  sleepTimestampsForWakeDate,
  sugarStreakMessage,
  sugarEntriesForDate,
  sugarTotalsByDate,
  summarizeFitnessWeek,
  summarizeSugar,
  sumSugarForDate,
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

test("sleep form values become exact UTC instants while preserving the wake date", () => {
  const timestamps = sleepTimestampsForWakeDate("2026-08-23", "22:30", "07:00", "America/Toronto");
  assert.equal(timestamps.sleepDate, "2026-08-23");
  assert.equal(timestamps.sleptAt, "2026-08-23T02:30:00.000Z");
  assert.equal(timestamps.wokeAt, "2026-08-23T11:00:00.000Z");
  assert.equal(calculateSleepMinutes(timestamps.sleptAt, timestamps.wokeAt), 510);
});

test("timezone conversion follows daylight saving offsets", () => {
  assert.equal(localDateTimeToIso("2026-07-01", "22:30", "America/Toronto"), "2026-07-02T02:30:00.000Z");
  assert.equal(localDateTimeToIso("2026-01-15", "22:30", "America/Toronto"), "2026-01-16T03:30:00.000Z");
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

// ---------- Added sugar ----------

const sugarEntry = (date, name, grams, time = "12:00:00") => ({
  id: `${date}-${name}`, entry_date: date, item_name: name, grams, created_at: `${date}T${time}Z`,
});

test("sumSugarForDate totals only the requested day and avoids float drift", () => {
  const entries = [
    sugarEntry("2026-08-16", "Yogurt", 0.1),
    sugarEntry("2026-08-16", "Granola", 0.2),
    sugarEntry("2026-08-15", "Cookie", 12),
  ];
  assert.equal(sumSugarForDate(entries, "2026-08-16"), 0.3);
  assert.equal(sumSugarForDate(entries, "2026-08-15"), 12);
  assert.equal(sumSugarForDate(entries, "2026-08-14"), 0);
});

test("getSugarProgress reports true percent while clamping only the visual fill", () => {
  const under = getSugarProgress(20);
  assert.equal(under.percent, 67);
  assert.equal(under.fillPercent, 67);
  assert.equal(under.over, false);
  assert.equal(under.remaining, 10);

  // 40g against the configurable 30g limit: 133% on the readout, bar pinned at 100%.
  const over = getSugarProgress(40);
  assert.equal(over.percent, 133);
  assert.equal(over.fillPercent, 100);
  assert.equal(over.over, true);
  assert.equal(over.overBy, 10);
  assert.equal(over.remaining, 0);
});

test("getSugarProgress treats exactly the limit as not over", () => {
  const exact = getSugarProgress(SUGAR_DAILY_LIMIT_GRAMS);
  assert.equal(exact.percent, 100);
  assert.equal(exact.over, false);
  assert.equal(exact.overBy, 0);
});

test("sugar entries reset at the local midnight boundary without touching past days", () => {
  const entries = [
    sugarEntry("2026-08-16", "Juice", 22, "23:58:00"),
    sugarEntry("2026-08-16", "Candy", 6, "23:59:00"),
    sugarEntry("2026-08-17", "Cereal", 9, "07:30:00"),
  ];

  // The minute before midnight: yesterday reads 28g and remains under the 30g goal.
  const before = getSugarProgress(sumSugarForDate(entries, "2026-08-16"));
  assert.equal(before.grams, 28);
  assert.equal(before.over, false);
  assert.equal(before.overBy, 0);
  assert.equal(sugarEntriesForDate(entries, "2026-08-16").length, 2);

  // Crossing midnight with nothing yet logged: the new day starts empty at 0%.
  const rolledOver = getSugarProgress(sumSugarForDate([entries[0], entries[1]], "2026-08-17"));
  assert.equal(rolledOver.grams, 0);
  assert.equal(rolledOver.percent, 0);
  assert.equal(rolledOver.fillPercent, 0);
  assert.equal(rolledOver.over, false);
  assert.deepEqual(sugarEntriesForDate([entries[0], entries[1]], "2026-08-17"), []);

  // Later that morning the new day tracks on its own, and the old day is intact.
  assert.equal(sumSugarForDate(entries, "2026-08-17"), 9);
  assert.equal(sumSugarForDate(entries, "2026-08-16"), 28);
  assert.deepEqual(
    sugarTotalsByDate(entries).map((day) => [day.date, day.grams]),
    [["2026-08-16", 28], ["2026-08-17", 9]],
  );
});

test("sugar streaks require consecutive under-limit days and keep a longest record", () => {
  const entries = [
    sugarEntry("2026-08-18", "Snack", 20),
    sugarEntry("2026-08-19", "Snack", 29),
    sugarEntry("2026-08-20", "Snack", 31),
    sugarEntry("2026-08-22", "Snack", 10),
    sugarEntry("2026-08-23", "Snack", 12),
  ];
  const streak = calculateSugarStreak(entries, SUGAR_DAILY_LIMIT_GRAMS, "2026-08-23");
  assert.equal(streak.currentStreak, 2);
  assert.equal(streak.longestStreak, 2);
  assert.equal(streak.lastUpdatedDate, "2026-08-23");
  assert.equal(sugarStreakMessage(2), "Great start!");
  assert.equal(sugarStreakMessage(7), "You're on fire!");
  assert.equal(sugarStreakMessage(30), "Unstoppable!");
});

test("summarizeSugar aggregates per day, counts days over the limit, and windows by range", () => {
  const entries = [
    sugarEntry("2026-08-14", "Soda", 40),
    sugarEntry("2026-08-15", "Apple", 10),
    sugarEntry("2026-08-15", "Bar", 8),
    sugarEntry("2026-08-16", "Cereal", 25),
  ];
  const summary = summarizeSugar(entries, "all");
  assert.deepEqual(summary.points.map((point) => point.grams), [40, 18, 25]);
  assert.deepEqual(summary.points.map((point) => point.over), [true, false, false]);
  assert.equal(summary.daysOverLimit, 1);
  assert.equal(summary.daysTracked, 3);
  assert.equal(summary.averageGrams, 27.7);
  // Bar heights are relative to the tallest day, and the limit line to the same.
  assert.equal(summary.maxGrams, 40);
  assert.deepEqual(summary.points.map((point) => point.height), [100, 45, 63]);
  assert.equal(summary.limitHeight, 75);
});

test("summarizeSugar drops days whose items were all deleted", () => {
  const summary = summarizeSugar([sugarEntry("2026-08-16", "Nothing", 0)], "all");
  assert.deepEqual(summary.points, []);
  assert.equal(summary.daysTracked, 0);
  assert.equal(summary.averageGrams, 0);
});
