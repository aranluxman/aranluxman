import assert from "node:assert/strict";
import test from "node:test";

import { isLawsPath, LAW_AREAS, lawForDate, lawIndexForDate, LAWS } from "../src/laws-library.mjs";

test("LAWS has all 48 laws, numbered in order, with complete fields", () => {
  assert.equal(LAWS.length, 48);
  LAWS.forEach((law, index) => {
    assert.equal(law.n, index + 1);
    for (const field of ["title", "idea", "tip", "example"]) assert.ok(law[field]?.trim(), `law ${law.n} missing ${field}`);
    assert.ok(["use", "defend"].includes(law.mode), `law ${law.n} bad mode`);
    assert.ok(law.area in LAW_AREAS, `law ${law.n} bad area`);
  });
});

test("law of the day starts at Law 1 and advances one per day, looping after 48", () => {
  assert.equal(lawForDate("2026-09-27").n, 1);
  assert.equal(lawForDate("2026-09-28").n, 2);
  assert.equal(lawForDate("2026-11-13").n, 48);
  assert.equal(lawForDate("2026-11-14").n, 1);
  assert.equal(lawForDate("2026-09-26").n, 48);
  // Crossing a DST change must not skip or repeat a day.
  assert.equal(lawIndexForDate("2026-11-02") - lawIndexForDate("2026-10-31"), 2);
});

test("isLawsPath matches only the laws page", () => {
  assert.equal(isLawsPath("/laws"), true);
  assert.equal(isLawsPath("/laws/"), true);
  assert.equal(isLawsPath("/"), false);
  assert.equal(isLawsPath("/lawsuit"), false);
  assert.equal(isLawsPath("/laws/1"), false);
});
