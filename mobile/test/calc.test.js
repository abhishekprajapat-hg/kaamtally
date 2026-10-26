// Unit tests for the wage maths. These numbers are what a contractor pays out,
// so the cases below lean on rounding, rate changes mid-month and date edges.
require('./_esm.js');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { inr, ini, mobFmt, rateOn, pay, stats, txSum, balance, D } = require('../src/lib/calc.js');

const W = (...rates) => ({ wh: rates.map(([from, rate]) => ({ from, rate })) });

test('inr formats money the Indian way', () => {
  assert.equal(inr(0), '₹0');
  assert.equal(inr(600), '₹600');
  assert.equal(inr(87990), '₹87,990');
  assert.equal(inr(1234567), '₹12,34,567');        // lakh grouping, not 1,234,567
  assert.equal(inr(-1500), '−₹1,500');             // minus sign in front of the symbol
  assert.equal(inr(450.5), '₹451');                // half days round to whole rupees
  assert.equal(inr(-0.4), '−₹0');
});

test('ini builds avatar initials', () => {
  assert.equal(ini('Ramesh Kumar Yadav'), 'RK');    // first two words only
  assert.equal(ini('Suresh'), 'S');
  assert.equal(ini('  anil   gaikwad  '), 'AG');    // stray spaces
});

test('mobFmt splits a 10-digit number and leaves anything else alone', () => {
  assert.equal(mobFmt('9000012345'), '90000 12345');
  assert.equal(mobFmt('12345'), '12345');
  assert.equal(mobFmt(''), '');
  assert.equal(mobFmt(undefined), '');
});

test('rateOn returns the wage in force on a date', () => {
  const w = W(['2024-01-15', 850], ['2026-10-01', 900]);
  assert.equal(rateOn(w, '2024-01-15'), 850);       // on the start date itself
  assert.equal(rateOn(w, '2026-09-30'), 850);       // day before the raise
  assert.equal(rateOn(w, '2026-10-01'), 900);       // the raise applies that day
  assert.equal(rateOn(w, '2026-10-26'), 900);
  assert.equal(rateOn(w, '2020-01-01'), 850);       // before any history: earliest rate
  assert.equal(rateOn({ wh: [] }, '2026-10-26'), 0);
});

test('pay pays full for Present, half for Half Day, nothing otherwise', () => {
  assert.equal(pay('P', 900), 900);
  assert.equal(pay('H', 900), 450);
  assert.equal(pay('A', 900), 0);
  assert.equal(pay('O', 900), 0);
  assert.equal(pay('H', 675), 337.5);               // odd rates keep their half rupee
});

test('stats counts a month and totals what was earned', () => {
  D.TODAY = '2026-10-26';
  const att = {
    '2026-10-01': { w1: { s: 'P', rate: 900 } },
    '2026-10-02': { w1: { s: 'H', rate: 900 }, w2: { s: 'P', rate: 600 } },
    '2026-10-03': { w1: { s: 'A', rate: 900 } },
    '2026-10-04': { w1: { s: 'O', rate: 900 } },
    '2026-10-05': { w1: { s: 'P', rate: 1000 } }    // after a raise
  };
  const s = stats(att, 'w1', '2026-10-01', '2026-10-31');
  assert.equal(s.full, 2);
  assert.equal(s.half, 1);
  assert.equal(s.abs, 1);
  assert.equal(s.off, 1);
  assert.equal(s.earned, 900 + 450 + 1000);
  // earnings are grouped by the rate that applied, so the payslip can show the split
  assert.deepEqual(s.groups, { 900: { f: 1, h: 1 }, 1000: { f: 1, h: 0 } });
});

test('stats respects the range and never counts the future', () => {
  D.TODAY = '2026-10-03';
  const att = {
    '2026-10-01': { w1: { s: 'P', rate: 900 } },
    '2026-10-02': { w1: { s: 'P', rate: 900 } },
    '2026-10-05': { w1: { s: 'P', rate: 900 } }     // after "today"
  };
  assert.equal(stats(att, 'w1', '2026-10-02', '2026-10-02').full, 1);       // single day window
  assert.equal(stats(att, 'w1', '2026-10-01', '2026-10-31').full, 2);       // clamped at today
  assert.equal(stats(att, 'w1', '2026-11-01', '2026-11-30').full, 0);       // nothing in range
  assert.equal(stats(att, 'unknown-worker', '2026-10-01', '2026-10-31').earned, 0);
});

test('txSum adds only the matching worker, type and dates', () => {
  const tx = [
    { wid: 'w1', type: 'payment', amount: 5000, date: '2026-10-05' },
    { wid: 'w1', type: 'payment', amount: 2000, date: '2026-10-20' },
    { wid: 'w1', type: 'advance', amount: 1000, date: '2026-10-10' },
    { wid: 'w2', type: 'payment', amount: 9999, date: '2026-10-10' }
  ];
  assert.equal(txSum(tx, 'w1', 'payment', '2026-10-01', '2026-10-31'), 7000);
  assert.equal(txSum(tx, 'w1', 'payment', '2026-10-06', '2026-10-31'), 2000);  // range excludes the 5th
  assert.equal(txSum(tx, 'w1', 'advance', '2026-10-01', '2026-10-31'), 1000);
  assert.equal(txSum(tx, 'w1', 'extra', '2026-10-01', '2026-10-31'), 0);
  assert.equal(txSum([], 'w1', 'payment', '2026-10-01', '2026-10-31'), 0);
});

test('balance is earned plus extras, minus payments and advances', () => {
  D.TODAY = '2026-10-26';
  const att = {
    '2026-10-01': { w1: { s: 'P', rate: 900 } },
    '2026-10-02': { w1: { s: 'P', rate: 900 } },
    '2026-10-03': { w1: { s: 'H', rate: 900 } }
  };
  const tx = [
    { wid: 'w1', type: 'extra', amount: 300, date: '2026-10-02' },
    { wid: 'w1', type: 'payment', amount: 1000, date: '2026-10-04' },
    { wid: 'w1', type: 'advance', amount: 500, date: '2026-10-05' }
  ];
  // 900 + 900 + 450 earned, +300 extra, −1000 paid, −500 advanced
  assert.equal(balance(att, tx, 'w1'), 1050);
  // a worker who has been overpaid shows a negative balance (money owed back)
  assert.equal(balance({}, [{ wid: 'w1', type: 'payment', amount: 800, date: '2026-10-01' }], 'w1'), -800);
  assert.equal(balance({}, [], 'w1'), 0);
});

test('balance can be taken as of an earlier date', () => {
  D.TODAY = '2026-10-26';
  const att = {
    '2026-10-01': { w1: { s: 'P', rate: 900 } },
    '2026-10-10': { w1: { s: 'P', rate: 900 } }
  };
  const tx = [{ wid: 'w1', type: 'payment', amount: 900, date: '2026-10-02' }];
  assert.equal(balance(att, tx, 'w1', '2026-10-05'), 0);      // one day worked, one day paid
  assert.equal(balance(att, tx, 'w1', '2026-10-26'), 900);    // second day still owed
});
