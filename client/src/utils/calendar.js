// Builds an iCalendar (.ics) file of the weekly timetable, so students can add
// their classes to Google Calendar, Apple Calendar or Outlook.
// Format: RFC 5545. Each class meeting becomes one weekly repeating event.

import { parseTimeRange } from "./timetable.js";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ICS_DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
export const WEEKS = 16; // the app has no term end date, so we repeat for a typical 16-week term

const pad = n => String(n).padStart(2, "0");

// Today's date in Bangkok as { year, month, day, weekday } (weekday: 0 = Sunday).
function bangkokToday(date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit", weekday: "long" }).formatToParts(date);
  const get = type => parts.find(p => p.type === type).value;
  return { year: Number(get("year")), month: Number(get("month")), day: Number(get("day")), weekday: DAYS.indexOf(get("weekday")) };
}

// Text values must escape backslashes, semicolons, commas and new lines.
const escapeText = value => String(value ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

// "YYYYMMDDTHHMMSS" for a calendar date plus minutes after midnight.
function localStamp(dateParts, minutes) {
  return `${dateParts.year}${pad(dateParts.month)}${pad(dateParts.day)}T${pad(Math.floor(minutes / 60))}${pad(minutes % 60)}00`;
}

export function buildIcs(registrations, now = new Date()) {
  const today = bangkokToday(now);
  const utcStamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Course Portal//Timetable//EN", "CALSCALE:GREGORIAN",
    // Bangkok has no daylight saving: always UTC+7.
    "BEGIN:VTIMEZONE", "TZID:Asia/Bangkok", "BEGIN:STANDARD", "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0700", "TZOFFSETTO:+0700", "TZNAME:ICT", "END:STANDARD", "END:VTIMEZONE",
  ];
  let count = 0;
  for (const r of registrations) {
    for (const meeting of r.meetings || []) {
      const range = parseTimeRange(meeting.time);
      const weekday = DAYS.indexOf(meeting.day);
      if (!range || weekday < 0) continue; // skip meetings with unknown times
      // First class: the next date (from today) that falls on this weekday.
      const first = new Date(Date.UTC(today.year, today.month - 1, today.day + ((weekday - today.weekday + 7) % 7)));
      const date = { year: first.getUTCFullYear(), month: first.getUTCMonth() + 1, day: first.getUTCDate() };
      lines.push(
        "BEGIN:VEVENT",
        `UID:${r.courseCode}-${r.section}-${ICS_DAYS[weekday]}-${range.start}@course-portal`,
        `DTSTAMP:${utcStamp}`,
        `DTSTART;TZID=Asia/Bangkok:${localStamp(date, range.start)}`,
        `DTEND;TZID=Asia/Bangkok:${localStamp(date, range.end)}`,
        `RRULE:FREQ=WEEKLY;COUNT=${WEEKS};BYDAY=${ICS_DAYS[weekday]}`,
        `SUMMARY:${escapeText(`${r.courseCode} ${r.courseName}`)}`,
        `LOCATION:${escapeText(meeting.room || "Room to be confirmed")}`,
        `DESCRIPTION:${escapeText(`Section ${r.section}${r.instructor ? ` · ${r.instructor}` : ""}`)}`,
        "END:VEVENT",
      );
      count++;
    }
  }
  lines.push("END:VCALENDAR");
  // The standard requires CRLF line endings.
  return { text: lines.join("\r\n") + "\r\n", count };
}

// Starts a download of the .ics file in the browser.
export function downloadIcs(registrations) {
  const { text } = buildIcs(registrations);
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "course-portal-timetable.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
