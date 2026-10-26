// Unit tests for the date helpers. Every date in the app is a plain
// 'YYYY-MM-DD' string, so these cover the edges that usually break that:
// month ends, leap years and the turn of the year.
require('./_esm.js');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  s2d, d2s, addDays, dow, fd, fdy, monthKey, prevMonthKey, monthEnd, monthName, timeAgo, DAY, DSH
} = require('../src/lib/date.js');

test('s2d and d2s round-trip without drifting a day', () => {
  for (const s of ['2026-01-01', '2026-02-28', '2026-10-26', '2026-12-31', '2024-02-29']) {
    assert.equal(d2s(s2d(s)), s);
  }
});

test('addDays crosses months, years and leap days', () => {
  assert.equal(addDays('2026-10-26', 1), '2026-10-27');
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');   // leap year
  assert.equal(addDays('2025-02-28', 1), '2025-03-01');   // not a leap year
  assert.equal(addDays('2026-10-26', 0), '2026-10-26');
  assert.equal(addDays('2026-10-26', -30), '2026-09-26');
});

test('dow matches the real weekday', () => {
  assert.equal(DAY[dow('2026-10-26')], 'Monday');
  assert.equal(DAY[dow('2026-10-25')], 'Sunday');
  assert.equal(DSH[dow('2026-01-01')], 'Thu');
});

test('fd and fdy format dates for display', () => {
  assert.equal(fd('2026-10-26'), '26 Oct');
  assert.equal(fd('2026-01-05'), '5 Jan');     // no leading zero
  assert.equal(fdy('2026-10-26'), '26 Oct 2026');
  assert.equal(fdy('2025-12-31'), '31 Dec 2025');
});

test('monthKey and prevMonthKey handle the January rollover', () => {
  assert.equal(monthKey('2026-10-26'), '2026-10');
  assert.equal(prevMonthKey('2026-10'), '2026-09');
  assert.equal(prevMonthKey('2026-01'), '2025-12');   // back across the new year
  assert.equal(prevMonthKey('2026-03'), '2026-02');
});

test('monthEnd knows how long each month is', () => {
  assert.equal(monthEnd('2026-10'), '2026-10-31');
  assert.equal(monthEnd('2026-09'), '2026-09-30');
  assert.equal(monthEnd('2026-02'), '2026-02-28');
  assert.equal(monthEnd('2024-02'), '2024-02-29');   // leap year
  assert.equal(monthEnd('2026-12'), '2026-12-31');
});

test('monthName gives short and full names', () => {
  assert.equal(monthName('2026-10'), 'Oct');
  assert.equal(monthName('2026-10', true), 'October');
  assert.equal(monthName('2026-01', true), 'January');
});

test('timeAgo shows a clock time today, Yesterday, then a date', () => {
  const iso = (y, m, d, h, min) => new Date(y, m - 1, d, h, min).toISOString();
  assert.equal(timeAgo(iso(2026, 10, 26, 14, 5), '2026-10-26'), '2:05 pm');
  assert.equal(timeAgo(iso(2026, 10, 26, 9, 30), '2026-10-26'), '9:30 am');
  assert.equal(timeAgo(iso(2026, 10, 26, 0, 7), '2026-10-26'), '12:07 am');   // midnight is 12, not 0
  assert.equal(timeAgo(iso(2026, 10, 26, 12, 0), '2026-10-26'), '12:00 pm');  // noon is 12 pm
  assert.equal(timeAgo(iso(2026, 10, 25, 18, 0), '2026-10-26'), 'Yesterday');
  assert.equal(timeAgo(iso(2026, 10, 12, 18, 0), '2026-10-26'), '12 Oct');
  assert.equal(timeAgo(iso(2025, 12, 31, 18, 0), '2026-01-01'), 'Yesterday'); // across the new year
});
