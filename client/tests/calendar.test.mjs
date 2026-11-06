import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIcs, WEEKS } from '../src/utils/calendar.js';
import { upcomingDeadlines, urgentDeadline } from '../src/utils/studentDashboard.js';

const regs = [
  { courseCode: 'CSC220', courseName: 'Web Development II', section: 1, instructor: 'Ajarn A', meetings: [{ day: 'Monday', time: '09:00 - 11:00', room: 'Room 301' }, { day: 'Thursday', time: '09:00 - 11:00', room: 'Room 301' }] },
  { courseCode: 'ENG103', courseName: 'English, Speaking; Writing', section: 2, meetings: [{ day: 'Friday', time: 'bad time', room: 'X' }] },
];

test('calendar file has one weekly event per valid meeting, in Bangkok time', () => {
  // Friday 6 Nov 2026, 22:00 in Bangkok.
  const { text, count } = buildIcs(regs, new Date('2026-11-06T15:00:00Z'));
  assert.equal(count, 2, 'the meeting with a bad time is skipped');
  assert.match(text, /^BEGIN:VCALENDAR\r\n/);
  assert.match(text, /END:VCALENDAR\r\n$/);
  assert.equal(text.split('\r\n').every(line => !line.includes('\n')), true);
  assert.match(text, /TZID:Asia\/Bangkok/);
  // Next Monday after Fri 6 Nov is 9 Nov; next Thursday is 12 Nov.
  assert.match(text, /DTSTART;TZID=Asia\/Bangkok:20261109T090000\r\nDTEND;TZID=Asia\/Bangkok:20261109T110000/);
  assert.match(text, /DTSTART;TZID=Asia\/Bangkok:20261112T090000/);
  assert.match(text, new RegExp(`RRULE:FREQ=WEEKLY;COUNT=${WEEKS};BYDAY=MO`));
  assert.match(text, /SUMMARY:CSC220 Web Development II/);
  assert.match(text, /LOCATION:Room 301/);
});

test('a class later today starts today; special characters are escaped', () => {
  const friday = [{ courseCode: 'X1', courseName: 'Art, Design; Media', section: 1, meetings: [{ day: 'Friday', time: '13:00 - 15:00', room: 'Lab, 2' }] }];
  const { text } = buildIcs(friday, new Date('2026-11-06T01:00:00Z'));
  assert.match(text, /DTSTART;TZID=Asia\/Bangkok:20261106T130000/);
  assert.match(text, /SUMMARY:X1 Art\\, Design\\; Media/);
  assert.match(text, /LOCATION:Lab\\, 2/);
});

test('deadlines: only open, future ones, soonest first; banner picks one within 3 days', () => {
  const now = Date.parse('2026-11-06T00:00:00Z');
  const list = upcomingDeadlines([
    { courseCode: 'A', addDropOpen: true, addDropClosesAt: '2026-11-12T00:00:00Z' },
    { courseCode: 'B', addDropOpen: true, addDropClosesAt: '2026-11-08T00:00:00Z' },
    { courseCode: 'C', addDropOpen: false, addDropClosesAt: '2026-11-07T00:00:00Z' },
    { courseCode: 'D', addDropOpen: true, addDropClosesAt: '2026-11-01T00:00:00Z' },
    { courseCode: 'E', addDropOpen: true, addDropClosesAt: null },
  ], now);
  assert.deepEqual(list.map(d => d.courseCode), ['B', 'A']);
  assert.equal(list[0].daysLeft, 2);
  assert.equal(urgentDeadline(list).courseCode, 'B');
  assert.equal(urgentDeadline(list.slice(1)), null, '6 days away is not urgent');
});
