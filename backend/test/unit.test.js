// Unit tests for the backend's pure helpers. No database needed.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { today, s2d, d2s, addDays, dow, isDate } = require('../src/lib/dates');
const { rateOn, pay } = require('../src/lib/wages');
const { hashPin, verifyPin, validatePin, pinLength } = require('../src/lib/pin');
const { isId, fd, inr } = require('../src/routes/_util');

test('isDate accepts only real calendar dates', () => {
  assert.equal(isDate('2026-10-26'), true);
  assert.equal(isDate('2024-02-29'), true);     // leap day
  assert.equal(isDate('2025-02-29'), false);    // not a leap year
  assert.equal(isDate('2026-13-01'), false);    // month 13
  assert.equal(isDate('2026-10-32'), false);    // day 32
  assert.equal(isDate('2026-04-31'), false);    // April has 30
  assert.equal(isDate('2026-1-1'), false);      // must be zero-padded
  assert.equal(isDate('26-10-2026'), false);
  assert.equal(isDate(''), false);
  assert.equal(isDate(null), false);
  assert.equal(isDate(20261026), false);
  assert.equal(isDate({ toString: () => '2026-10-26' }), false);
});

test('today returns a plain padded date string', () => {
  assert.match(today(), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(isDate(today()), true);
});

test('date arithmetic survives month, year and leap boundaries', () => {
  assert.equal(d2s(s2d('2026-10-26')), '2026-10-26');
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2027-01-01', -1), '2026-12-31');
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(dow('2026-10-26'), 1);           // Monday
});

test('rateOn picks the wage in force, even if history arrives out of order', () => {
  const w = { wh: [{ from: '2026-10-01', rate: 900 }, { from: '2024-01-15', rate: 850 }] };
  assert.equal(rateOn(w, '2024-06-01'), 850);
  assert.equal(rateOn(w, '2026-09-30'), 850);
  assert.equal(rateOn(w, '2026-10-01'), 900);   // the raise applies from that day
  assert.equal(rateOn(w, '2020-01-01'), 850);   // before any history, use the earliest
  assert.equal(rateOn({ wh: [] }, '2026-10-26'), 0);
  assert.equal(rateOn({}, '2026-10-26'), 0);
});

test('pay follows the attendance rules', () => {
  assert.equal(pay('P', 900), 900);
  assert.equal(pay('H', 900), 450);
  assert.equal(pay('A', 900), 0);
  assert.equal(pay('O', 900), 0);
  assert.equal(pay('X', 900), 0);               // unknown status earns nothing
});

test('validatePin enforces length and rejects guessable PINs', () => {
  assert.equal(pinLength(), 6);
  assert.match(validatePin('12345'), /exactly 6 digits/);
  assert.match(validatePin('1234567'), /exactly 6 digits/);
  assert.match(validatePin('12a456'), /exactly 6 digits/);
  assert.match(validatePin(''), /exactly 6 digits/);
  assert.match(validatePin(123456), /exactly 6 digits/);      // must be a string
  assert.match(validatePin('111111'), /same digits/);
  assert.match(validatePin('123456'), /counting order/);
  assert.match(validatePin('456789'), /counting order/);
  assert.match(validatePin('987654'), /counting order/);      // descending too
  assert.match(validatePin('123123'), /repeating/);
  assert.equal(validatePin('314159'), null);                  // a fine PIN
  assert.equal(validatePin('482015'), null);
});

test('a PIN is stored as a salted hash and never in the clear', async () => {
  const pin = '314159';
  const a = await hashPin(pin);
  const b = await hashPin(pin);
  assert.ok(!a.includes(pin), 'the PIN itself must not appear in the stored value');
  assert.notEqual(a, b, 'the same PIN must hash differently each time (salt)');
  assert.match(a, /^scrypt\$16384\$8\$1\$/);
});

test('verifyPin accepts the right PIN and nothing else', async () => {
  const stored = await hashPin('314159');
  assert.equal(await verifyPin('314159', stored), true);
  assert.equal(await verifyPin('314158', stored), false);
  assert.equal(await verifyPin('', stored), false);
  assert.equal(await verifyPin('314159', 'not-a-hash'), false);
  assert.equal(await verifyPin('314159', 'bcrypt$x$y$z$w'), false);   // wrong scheme
  assert.equal(await verifyPin('314159', ''), false);
  assert.equal(await verifyPin('314159', null), false);
  assert.equal(await verifyPin(null, stored), false);
});

test('isId only accepts Mongo object ids', () => {
  assert.equal(isId('507f1f77bcf86cd799439011'), true);
  assert.equal(isId('not-an-id'), false);
  assert.equal(isId(''), false);
  assert.equal(isId(null), false);
  assert.equal(isId(123), false);
});

test('fd and inr format dates and money for activity messages', () => {
  assert.equal(fd('2026-10-26'), '26 Oct');
  assert.equal(fd('2026-01-05'), '5 Jan');
  assert.equal(inr(1500), '₹1,500');
  assert.equal(inr(1234567), '₹12,34,567');     // lakh grouping
  assert.equal(inr(-500), '−₹500');
  assert.equal(inr(0), '₹0');
});
