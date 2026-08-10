import assert from "node:assert/strict";
import test from "node:test";

import { mapGoogleEvent } from "../src/google-calendar.mjs";
import { parseIcsEvents, eventsForDate } from "../src/planner-utils.mjs";

const CAL = { id: "primary", name: "Aran", color: "#00e5c3" };

test("maps a timed Google event onto the right date with exact times", () => {
  const [event] = mapGoogleEvent({
    id: "abc123",
    status: "confirmed",
    summary: "Track and Field",
    location: "Bill Crothers Secondary School",
    description: "Bring spikes",
    start: { dateTime: "2026-08-14T18:00:00-04:00" },
    end: { dateTime: "2026-08-14T19:30:00-04:00" },
  }, CAL);

  assert.equal(event.title, "Track and Field");
  assert.equal(event.kind, "calendar_event");
  assert.equal(event.source, "google");
  assert.equal(event.all_day, false);
  assert.equal(event.duration_minutes, 90);
  assert.equal(event.location, "Bill Crothers Secondary School");
  // Location leads the notes so the agenda shows it the way Google does.
  assert.equal(event.notes, "Bill Crothers Secondary School\nBring spikes");
  // Times are rendered in the viewer's local zone, so assert the shape only.
  assert.match(event.start_time, /^\d{2}:\d{2}$/);
  assert.match(event.end_time, /^\d{2}:\d{2}$/);
  assert.match(event.due_date, /^\d{4}-\d{2}-\d{2}$/);
});

test("expands a multi-day all-day event into one item per day, end-exclusive", () => {
  const days = mapGoogleEvent({
    id: "camp",
    summary: "Camping",
    // Google all-day end dates are exclusive: this is Jul 31 - Aug 2.
    start: { date: "2026-07-31" },
    end: { date: "2026-08-03" },
  }, CAL);

  assert.equal(days.length, 3);
  assert.deepEqual(days.map((d) => d.due_date), ["2026-07-31", "2026-08-01", "2026-08-02"]);
  assert.ok(days.every((d) => d.all_day === true));
  assert.ok(days.every((d) => d.start_time === ""));
  // Distinct ids, so replacing the Google set never collapses days together.
  assert.equal(new Set(days.map((d) => d.id)).size, 3);
});

test("a single all-day event yields exactly one day", () => {
  const days = mapGoogleEvent({
    id: "bday", summary: "Camerons Birthday",
    start: { date: "2026-08-26" }, end: { date: "2026-08-27" },
  }, CAL);
  assert.equal(days.length, 1);
  assert.equal(days[0].due_date, "2026-08-26");
});

test("cancelled events are dropped", () => {
  assert.equal(mapGoogleEvent({ id: "x", status: "cancelled", start: { date: "2026-08-01" } }, CAL), null);
});

test("an event with no title still maps, rather than being lost", () => {
  const [event] = mapGoogleEvent({
    id: "untitled", start: { dateTime: "2026-08-10T09:00:00Z" }, end: { dateTime: "2026-08-10T10:00:00Z" },
  }, CAL);
  assert.equal(event.title, "(no title)");
});

test("Google events land on their date in the month/week grid lookup", () => {
  const events = mapGoogleEvent({
    id: "meet", summary: "Meet", start: { date: "2026-07-24" }, end: { date: "2026-07-27" },
  }, CAL);
  assert.equal(eventsForDate(events, "2026-07-25").length, 1);
  assert.equal(eventsForDate(events, "2026-07-27").length, 0, "end date is exclusive");
});

test("ICS import keeps start/end times and location instead of dropping them", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "SUMMARY:Workout",
    "LOCATION:YMCA",
    "DESCRIPTION:Upper body",
    "DTSTART:20260806T190000",
    "DTEND:20260806T200000",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const [event] = parseIcsEvents(ics);
  assert.equal(event.title, "Workout");
  assert.equal(event.due_date, "2026-08-06");
  assert.equal(event.start_time, "19:00");
  assert.equal(event.end_time, "20:00");
  assert.equal(event.location, "YMCA");
  assert.equal(event.notes, "YMCA\nUpper body");
  assert.equal(event.all_day, false);
  assert.equal(event.duration_minutes, 60);
});

test("ICS all-day events are marked all-day and carry no clock time", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "SUMMARY:Camping",
    "DTSTART;VALUE=DATE:20260731",
    "DTEND;VALUE=DATE:20260801",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const [event] = parseIcsEvents(ics);
  assert.equal(event.all_day, true);
  assert.equal(event.start_time, "");
  assert.equal(event.end_time, "");
  assert.equal(event.due_date, "2026-07-31");
});

test("ICS recurring events expand to multiple dated instances", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "SUMMARY:Track",
    "DTSTART:20260803T180000",
    "DTEND:20260803T193000",
    "RRULE:FREQ=WEEKLY;COUNT=3",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const events = parseIcsEvents(ics);
  assert.equal(events.length, 3);
  assert.ok(events.every((event) => event.start_time === "18:00"));
  assert.equal(new Set(events.map((event) => event.due_date)).size, 3);
});

// ---- iCal proxy: host allowlist ----
// The proxy used to forward any https:// URL, which made it usable as an open
// proxy for probing arbitrary hosts from Cloudflare's network.
const { onRequestGet } = await import("../functions/api/calendar.js");

const call = (url, env = {}) =>
  onRequestGet({ request: new Request(`https://app.test/api/calendar?url=${encodeURIComponent(url)}`), env });

test("proxy rejects hosts outside the allowlist", async () => {
  for (const url of [
    "https://evil.example.com/basic.ics",
    "https://169.254.169.254/latest/meta-data/",
    "https://localhost/admin",
  ]) {
    const response = await call(url);
    assert.equal(response.status, 400, `expected ${url} to be rejected`);
    assert.match(await response.text(), /not allowed/i);
  }
});

test("proxy rejects non-https schemes", async () => {
  const response = await call("http://calendar.google.com/calendar/ical/x/private-y/basic.ics");
  assert.equal(response.status, 400);
  assert.match(await response.text(), /https/i);
});

test("proxy requires a URL when none is configured server-side", async () => {
  const response = await onRequestGet({ request: new Request("https://app.test/api/calendar"), env: {} });
  assert.equal(response.status, 400);
  assert.match(await response.text(), /No calendar URL configured/i);
});

test("proxy accepts an allowlisted Google host", async () => {
  // Reaching the network is out of scope here; a 502 proves it got past
  // validation and attempted the fetch rather than rejecting the host.
  const response = await call("https://calendar.google.com/calendar/ical/x/private-y/basic.ics");
  assert.notEqual(response.status, 400);
});
