import test from 'node:test';
import assert from 'node:assert/strict';
import { bangkokNow, courseTones, findOffering, gradeTone, greeting, planForNow, termCredits } from '../src/utils/studentDashboard.js';

const ev = (courseCode, day, start, end) => ({ id: `${courseCode}-${day}`, courseCode, day, start, end });
const week = [ev('CSC220', 'Monday', 540, 660), ev('CSC220', 'Thursday', 540, 660), ev('ENG103', 'Wednesday', 780, 1020)];

test('Bangkok time is used whatever the computer time zone is', () => {
  // 02:30 UTC on Monday 9 Nov 2026 is 09:30 Monday in Bangkok (UTC+7).
  assert.deepEqual(bangkokNow(new Date('2026-11-09T02:30:00Z')), { day: 'Monday', minutes: 570 });
  // 20:00 UTC Sunday is already 03:00 Monday in Bangkok.
  assert.deepEqual(bangkokNow(new Date('2026-11-08T20:00:00Z')), { day: 'Monday', minutes: 180 });
});

test('greeting follows the time of day', () => {
  assert.equal(greeting(8 * 60), 'Good morning');
  assert.equal(greeting(13 * 60), 'Good afternoon');
  assert.equal(greeting(20 * 60), 'Good evening');
});

test('today, current and next class', () => {
  const during = planForNow(week, { day: 'Monday', minutes: 600 });
  assert.equal(during.current.courseCode, 'CSC220');
  assert.equal(during.next.day, 'Wednesday', 'next class after the current one');
  const before = planForNow(week, { day: 'Monday', minutes: 480 });
  assert.equal(before.next.courseCode, 'CSC220'); assert.equal(before.next.isToday, true);
  const weekend = planForNow(week, { day: 'Saturday', minutes: 600 });
  assert.equal(weekend.today.length, 0); assert.equal(weekend.next.day, 'Monday');
  const afterLastOnThursday = planForNow(week, { day: 'Thursday', minutes: 900 });
  assert.equal(afterLastOnThursday.next.day, 'Monday');
  // Only class is earlier today: the next one is the same weekday next week.
  const once = planForNow([ev('X', 'Tuesday', 540, 600)], { day: 'Tuesday', minutes: 700 });
  assert.equal(once.next.day, 'Tuesday'); assert.equal(once.next.isToday, false);
  assert.deepEqual(planForNow([], { day: 'Monday', minutes: 0 }), { today: [], current: null, next: null });
});

test('courses keep a stable colour', () => {
  assert.deepEqual(courseTones(['ENG103', 'CSC220', 'ENG103']), { CSC220: 0, ENG103: 1 });
  const many = courseTones(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7']);
  assert.equal(many.A7, 0, 'colours repeat after six');
});

test('grade badges and term credits', () => {
  assert.equal(gradeTone('A'), 'pass'); assert.equal(gradeTone('D'), 'pass');
  assert.equal(gradeTone('F'), 'fail'); assert.equal(gradeTone('W'), 'withdrawn'); assert.equal(gradeTone('I'), 'other');
  assert.deepEqual(termCredits([{ credits: 4, grade: 'A' }, { credits: 4, grade: 'F' }, { credits: 4, grade: 'W' }]), { attempted: 12, earned: 4 });
});

test('finds the request option for a course and section', () => {
  const offerings = [{ id: 'o1', courseCode: 'CSC220', section: 1 }, { id: 'o2', courseCode: 'CSC220', section: 2 }];
  assert.equal(findOffering(offerings, 'CSC220', '2').id, 'o2');
  assert.equal(findOffering(offerings, 'ENG103', 1), null);
});
