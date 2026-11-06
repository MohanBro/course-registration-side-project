// Helpers for the student dashboard. They are plain functions with no React,
// so they are easy to test in tests/studentDashboard.test.mjs.

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PASSING = ["A", "B+", "B", "C+", "C", "D+", "D"];
export const COURSE_TONES = 6; // number of course colours defined in the CSS

// The current weekday and minutes after midnight in Bangkok,
// no matter which time zone the student's computer uses.
export function bangkokNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok", weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const get = type => parts.find(p => p.type === type)?.value;
  return { day: get("weekday"), minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

// "Good morning" / "Good afternoon" / "Good evening" using Bangkok time.
export function greeting(minutes) {
  if (minutes < 12 * 60) return "Good morning";
  if (minutes < 18 * 60) return "Good afternoon";
  return "Good evening";
}

// Gives each course code a colour number (0–5). Sorting first means a course
// keeps the same colour every time the page loads.
export function courseTones(courseCodes) {
  const unique = [...new Set(courseCodes)].sort();
  return Object.fromEntries(unique.map((code, index) => [code, index % COURSE_TONES]));
}

// Today's classes (sorted), plus the next class from now within the coming week.
// "events" come from buildTimetable(); "now" comes from bangkokNow().
export function planForNow(events, now) {
  const today = events.filter(e => e.day === now.day).sort((a, b) => a.start - b.start);
  const current = today.find(e => e.start <= now.minutes && now.minutes < e.end) || null;
  const todayIndex = DAY_ORDER.indexOf(now.day);
  let next = null;
  // Look at today (later classes only), then each following day, up to a week ahead.
  for (let offset = 0; offset < 7 && !next; offset++) {
    const day = DAY_ORDER[(todayIndex + offset) % 7];
    const candidates = events
      .filter(e => e.day === day && (offset > 0 || e.start > now.minutes))
      .sort((a, b) => a.start - b.start);
    if (candidates.length) next = { ...candidates[0], isToday: offset === 0 };
  }
  // If nothing later this week, the next class is the earliest one next week
  // (which can be later today's weekday, one week from now).
  if (!next && events.length) {
    const first = [...events].sort((a, b) => a.start - b.start).find(e => e.day === now.day);
    if (first) next = { ...first, isToday: false };
  }
  return { today, current, next };
}

// Colour group for a grade badge: "pass", "fail", "withdrawn" or "other".
export function gradeTone(grade) {
  if (PASSING.includes(grade)) return "pass";
  if (grade === "F") return "fail";
  if (grade === "W") return "withdrawn";
  return "other";
}

// Credits attempted and earned (passed) in one term of academic history.
export function termCredits(courses) {
  let attempted = 0, earned = 0;
  for (const course of courses) {
    attempted += course.credits || 0;
    if (gradeTone(course.grade) === "pass") earned += course.credits || 0;
  }
  return { attempted, earned };
}

// Finds the request-form option for a course a student clicked "Request a change" on.
export function findOffering(offerings, courseCode, section) {
  return offerings.find(o => o.courseCode === courseCode && String(o.section) === String(section)) || null;
}

// Add/drop deadlines that are still ahead, soonest first.
// Each item: { courseCode, courseName, section, closesAt (Date), daysLeft }
export function upcomingDeadlines(registrations, nowMs = Date.now()) {
  return registrations
    .filter(r => r.addDropOpen && r.addDropClosesAt && new Date(r.addDropClosesAt).getTime() > nowMs)
    .map(r => {
      const closesAt = new Date(r.addDropClosesAt);
      return { courseCode: r.courseCode, courseName: r.courseName, section: r.section, closesAt,
        daysLeft: Math.ceil((closesAt.getTime() - nowMs) / 86400000) };
    })
    .sort((a, b) => a.closesAt - b.closesAt);
}

// The single most urgent deadline for the page banner: one closing within
// `withinDays` days, or null. (Design guidance: show at most one banner at a time.)
export function urgentDeadline(deadlines, withinDays = 3) {
  return deadlines.find(d => d.daysLeft <= withinDays) || null;
}
