// Works out the little grid of punched holes on a course card.
// Columns are days, rows are hours, and a hole is punched wherever the class meets.
// Plain functions with no React, so they are easy to test in tests/punch.test.mjs.
import { parseTimeRange } from "./timetable.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// "08:30" -> 510 (minutes after midnight), or null if it is not a time.
function toMinutes(text) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text || "");
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

// The API sends meetings in two shapes. Both become { day, start, end } in minutes:
//   student pages:  { day: "Monday", time: "08:30 - 10:30" }
//   advisor pages:  { day: "Monday", startTime: "08:30", endTime: "10:30" }
export function meetingMinutes(meeting) {
  if (!meeting || !DAYS.includes(meeting.day)) return null;
  if (meeting.time) {
    const range = parseTimeRange(meeting.time);
    return range ? { day: meeting.day, start: range.start, end: range.end } : null;
  }
  const start = toMinutes(meeting.startTime), end = toMinutes(meeting.endTime);
  return start !== null && end !== null && end > start ? { day: meeting.day, start, end } : null;
}

// Returns { days: ["M","T","W","T","F"], rows: [[false, true, ...], ...] } or null
// when there are no usable meeting times.
export function punchGrid(meetings = []) {
  const slots = meetings.map(meetingMinutes).filter(Boolean);
  if (slots.length === 0) return null;
  // Monday to Friday always show; Saturday and Sunday only when a class uses them.
  const lastDay = Math.max(4, ...slots.map(s => DAYS.indexOf(s.day)));
  const days = DAYS.slice(0, lastDay + 1);
  // Rows are one hour each. They line up with the class start (e.g. 08:30, 09:30, ...).
  const offset = slots[0].start % 60;
  const first = Math.min(8 * 60 + offset, ...slots.map(s => s.start));
  const last = Math.max(17 * 60 + offset, ...slots.map(s => s.end));
  const rows = [];
  for (let from = first; from < last; from += 60) {
    rows.push(days.map(day => slots.some(s => s.day === day && s.start < from + 60 && s.end > from)));
  }
  return { days: days.map(day => day.charAt(0)), rows };
}

// "Mon 08:30–10:30, Thu 08:30–10:30" for either meeting shape.
export function meetingSummary(meetings = []) {
  const parts = meetings.map(meeting => {
    const slot = meetingMinutes(meeting);
    if (!slot) return null;
    const label = minutes => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    return { order: DAYS.indexOf(slot.day) * 1440 + slot.start, text: `${slot.day.slice(0, 3)} ${label(slot.start)}–${label(slot.end)}` };
  }).filter(Boolean).sort((a, b) => a.order - b.order);
  return parts.map(part => part.text).join(", ");
}
