import test from "node:test";
import assert from "node:assert/strict";
import { meetingMinutes, meetingSummary, punchGrid } from "../src/utils/punch.js";

test("meetingMinutes reads both meeting shapes", () => {
  assert.deepEqual(meetingMinutes({ day: "Monday", time: "08:30 - 10:30" }), { day: "Monday", start: 510, end: 630 });
  assert.deepEqual(meetingMinutes({ day: "Friday", startTime: "12:30", endTime: "16:30" }), { day: "Friday", start: 750, end: 990 });
  assert.equal(meetingMinutes({ day: "Someday", time: "08:30 - 10:30" }), null);
  assert.equal(meetingMinutes({ day: "Monday", startTime: "10:00", endTime: "09:00" }), null);
});

test("punchGrid punches one hole per class hour", () => {
  const grid = punchGrid([{ day: "Monday", time: "08:30 - 10:30" }, { day: "Thursday", time: "08:30 - 10:30" }]);
  assert.deepEqual(grid.days, ["M", "T", "W", "T", "F"]);
  const punched = grid.rows.flat().filter(Boolean).length;
  assert.equal(punched, 4);                       // two 2-hour meetings
  assert.deepEqual(grid.rows[0], [true, false, false, true, false]);
  assert.deepEqual(grid.rows[2], [false, false, false, false, false]);
});

test("punchGrid adds weekend columns only when needed, and handles no meetings", () => {
  assert.equal(punchGrid([{ day: "Saturday", startTime: "09:00", endTime: "12:00" }]).days.length, 6);
  assert.equal(punchGrid([]), null);
  assert.equal(punchGrid([{ day: "Monday", time: "to be confirmed" }]), null);
});

test("meetingSummary lists days in week order", () => {
  assert.equal(meetingSummary([{ day: "Thursday", startTime: "08:30", endTime: "10:30" }, { day: "Monday", startTime: "08:30", endTime: "10:30" }]),
    "Mon 08:30–10:30, Thu 08:30–10:30");
  assert.equal(meetingSummary([]), "");
});
