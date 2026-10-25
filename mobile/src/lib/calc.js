// Wage maths — ported 1:1 from the design's logic.
import { addDays, fd } from './date';

export const D = { TODAY: '2026-10-22', START: '2026-09-01' }; // set from the server on load
export const inr = (n) => (n < 0 ? '−' : '') + '₹' + Math.round(Math.abs(n)).toLocaleString('en-IN');
export const ini = (n) => n.trim().split(/\s+/).slice(0, 2).map((x) => x[0] || '').join('').toUpperCase();
export const mobFmt = (m) => (m && m.length === 10 ? m.slice(0, 5) + ' ' + m.slice(5) : m || '');
export const CAT = { karigar: 'Mason', majdoor: 'Labourer' };

export function rateOn(w, d) { let r = w.wh[0] ? w.wh[0].rate : 0; w.wh.forEach((x) => { if (x.from <= d) r = x.rate; }); return r; }
export const pay = (s, rate) => (s === 'P' ? rate : s === 'H' ? rate * 0.5 : 0);

// Per-worker index of attendance so balances stay fast on a phone.
const IDX = new WeakMap();
function byWorker(att) {
  let m = IDX.get(att);
  if (!m) {
    m = {};
    Object.keys(att).sort().forEach((d) => { const day = att[d]; for (const wid in day) (m[wid] || (m[wid] = [])).push([d, day[wid]]); });
    IDX.set(att, m);
  }
  return m;
}
export function stats(att, wid, from, to) {
  const o = { full: 0, half: 0, abs: 0, off: 0, earned: 0, groups: {} };
  if (to > D.TODAY) to = D.TODAY;
  const list = byWorker(att)[wid] || [];
  for (const [d, r] of list) {
    if (d < from || d > to) continue;
    if (r.s === 'P') o.full++; else if (r.s === 'H') o.half++; else if (r.s === 'A') o.abs++; else o.off++;
    o.earned += pay(r.s, r.rate);
    if (r.s === 'P' || r.s === 'H') { const g = o.groups[r.rate] || (o.groups[r.rate] = { f: 0, h: 0 }); if (r.s === 'P') g.f++; else g.h++; }
  }
  return o;
}
export const txSum = (tx, wid, type, from, to) => tx.filter((t) => t.wid === wid && t.type === type && t.date >= from && t.date <= to).reduce((a, t) => a + t.amount, 0);
export function balance(att, tx, wid, upto) {
  upto = upto || D.TODAY;
  return stats(att, wid, '0000-01-01', upto).earned + txSum(tx, wid, 'extra', '0000-01-01', upto) - txSum(tx, wid, 'payment', '0000-01-01', upto) - txSum(tx, wid, 'advance', '0000-01-01', upto);
}
export { addDays, fd };
